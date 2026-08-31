-- Migration: close the paths that let a booking reach "confirmed" (or mutate
-- its payment fields) without going through the payment flow.
-- Run after add_admin_platform_policies.sql (uses public.is_admin()) and
-- fix_student_and_school_spaces.sql.

-- ============================================
-- 1. Allow payment_status = 'refunded'
-- ============================================
-- Cancelling a fully paid booking now triggers a Stripe refund (see
-- /api/bookings/[id]/cancel); the column needs a value to record it.

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('pending_deposit', 'deposit_paid', 'fully_paid', 'refunded'));

-- ============================================
-- 2. Constrain direct client updates to bookings
-- ============================================
-- "Students can update own bookings" / "Auto-ecoles can update bookings for
-- their stages" are row-scoped but column-unrestricted: any logged-in student
-- could PATCH their own booking to status='confirmed', payment_status=
-- 'fully_paid', total_price=0 via the REST API and skip Stripe entirely (the
-- enrollment trigger would then seat them). The UI never does this, but the
-- policies allowed it.
--
-- RLS WITH CHECK cannot compare NEW against OLD, so the rules live in a
-- BEFORE UPDATE trigger instead. It only constrains PostgREST clients:
-- the service role and SECURITY DEFINER functions (reserve_booking_for_checkout
-- runs as its owner and legitimately rewrites payment fields) pass through
-- untouched via the current_user check.

CREATE OR REPLACE FUNCTION public.enforce_booking_update_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- PostgREST runs as 'authenticated'/'anon'. Server flows (service_role) and
  -- SECURITY DEFINER functions (current_user = function owner) are trusted.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- The admin console legitimately moves bookings between arbitrary statuses.
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
    OR NEW.stage_id IS DISTINCT FROM OLD.stage_id
    OR NEW.total_price IS DISTINCT FROM OLD.total_price
    OR NEW.deposit_paid IS DISTINCT FROM OLD.deposit_paid
    OR NEW.balance_due IS DISTINCT FROM OLD.balance_due
    OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
    OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
    OR NEW.metadata IS DISTINCT FROM OLD.metadata
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.confirmation_email_sent_at IS DISTINCT FROM OLD.confirmation_email_sent_at
    OR NEW.receipt_email_sent_at IS DISTINCT FROM OLD.receipt_email_sent_at
    OR NEW.auto_ecole_notified_at IS DISTINCT FROM OLD.auto_ecole_notified_at
  THEN
    RAISE EXCEPTION 'Modification refusée : les informations de paiement d''une réservation ne peuvent pas être modifiées directement.';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status IN ('pending', 'confirmed') AND NEW.status = 'cancelled')
      OR (OLD.status = 'confirmed' AND NEW.status = 'completed')
    ) THEN
      RAISE EXCEPTION 'Transition de statut non autorisée (% -> %).', OLD.status, NEW.status;
    END IF;
  END IF;

  -- Cancellation metadata only makes sense alongside a cancelled status.
  IF NEW.status <> 'cancelled'
    AND (NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
      OR NEW.cancellation_reason IS DISTINCT FROM OLD.cancellation_reason)
  THEN
    RAISE EXCEPTION 'Modification refusée : champs d''annulation réservés aux annulations.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_booking_update_rules ON public.bookings;
CREATE TRIGGER trg_enforce_booking_update_rules
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_update_rules();
