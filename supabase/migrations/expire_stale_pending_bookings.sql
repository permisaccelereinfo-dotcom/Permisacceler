-- Migration: release seats held by abandoned checkouts.
-- A booking is set to 'pending' the moment checkout starts and counts toward a
-- stage's capacity. If the customer never pays, the seat would otherwise stay
-- reserved until Stripe's `checkout.session.expired` webhook fires (and only if
-- that webhook is delivered). This sweeper is a backstop that cancels pending
-- bookings older than the Stripe Checkout session lifetime.
-- Run after reserve_booking_for_checkout.sql.

CREATE OR REPLACE FUNCTION public.expire_stale_pending_bookings(
  p_max_age INTERVAL DEFAULT INTERVAL '45 minutes'
)
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE public.bookings
    SET
      status = 'cancelled',
      cancellation_reason = 'Checkout abandonné (expiration automatique)',
      cancelled_at = NOW(),
      updated_at = NOW()
    WHERE status = 'pending'
      AND COALESCE(updated_at, created_at) < NOW() - p_max_age
    RETURNING 1
  )
  SELECT COUNT(*) INTO expired_count FROM expired;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.expire_stale_pending_bookings(INTERVAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_stale_pending_bookings(INTERVAL) TO service_role;

-- Schedule the sweeper every 10 minutes when pg_cron is available (Supabase:
-- enable the "pg_cron" extension under Database > Extensions). The block is a
-- no-op (with a notice) on instances where pg_cron is not installed, so the
-- migration never fails because of it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-stale-pending-bookings') THEN
      PERFORM cron.unschedule('expire-stale-pending-bookings');
    END IF;

    PERFORM cron.schedule(
      'expire-stale-pending-bookings',
      '*/10 * * * *',
      $cron$ SELECT public.expire_stale_pending_bookings(); $cron$
    );
  ELSE
    RAISE NOTICE 'pg_cron not installed: enable it and re-run this migration, or call public.expire_stale_pending_bookings() from an external scheduler.';
  END IF;
END;
$$;
