-- Migration: fix data bugs behind the student space (/mon-compte) and the
-- auto-ecole space (/dashboard).
-- Run after sync_stage_enrolled_students.sql.

-- ============================================
-- 1. Remove the legacy enrollment trigger (double counting)
-- ============================================
-- setup.sql installs update_stage_enrollment_on_booking, which does a relative
-- `enrolled_students = enrolled_students + 1` on every pending -> confirmed
-- transition. sync_stage_enrolled_students.sql later added a trigger that
-- recomputes the same column from an absolute COUNT(*). Both fire AFTER UPDATE
-- on bookings and Postgres runs them in trigger-name order, so `trg_sync_...`
-- recomputes the correct value and then `update_stage_enrollment_on_booking`
-- adds one more on top: every confirmation over-counted by 1 (and every
-- cancellation under-counted by 1). The absolute recompute supersedes it.

DROP TRIGGER IF EXISTS update_stage_enrollment_on_booking ON public.bookings;
DROP FUNCTION IF EXISTS public.update_stage_enrollment();

-- ============================================
-- 2. Make the "stage is full" flag reversible
-- ============================================
-- check_stage_availability() only ever closed a stage (is_available := FALSE
-- once full) and never re-opened it, so a single cancellation left the stage
-- permanently hidden from /recherche and rejected by
-- reserve_booking_for_checkout even though a seat was free.
-- Re-open only on the exact full -> not-full transition, and never when the
-- caller is writing a different is_available itself (that is how the admin
-- console masks a stage by hand -- see src/app/(admin)/admin/actions.ts).
-- Replaced before the backfill below so the repaired counts also release the
-- stages that the double-count had wrongly marked full.

CREATE OR REPLACE FUNCTION public.check_stage_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.enrolled_students >= NEW.max_students THEN
        NEW.is_available := FALSE;
    ELSIF TG_OP = 'UPDATE'
      AND NEW.is_available IS NOT DISTINCT FROM OLD.is_available
      AND OLD.enrolled_students >= OLD.max_students
      AND NEW.status = 'active' THEN
        NEW.is_available := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Repair rows that already drifted (and, via the trigger above, re-open the
-- ones that were closed because of the inflated count).
UPDATE public.stages s
SET enrolled_students = (
  SELECT COUNT(*)
  FROM public.bookings b
  WHERE b.stage_id = s.id
    AND b.status IN ('pending', 'confirmed', 'completed')
)
WHERE s.enrolled_students IS DISTINCT FROM (
  SELECT COUNT(*)
  FROM public.bookings b
  WHERE b.stage_id = s.id
    AND b.status IN ('pending', 'confirmed', 'completed')
);

-- ============================================
-- 3. Let students read the stages they booked
-- ============================================
-- "Stages public read" is USING (is_available = TRUE AND status = 'active'),
-- so as soon as a stage filled up or was closed the student who paid for it
-- lost SELECT access to it. The embedded `stage:stage_id (*)` in
-- /mon-compte and /mon-compte/reservations then came back NULL and the page
-- rendered an untitled booking with "Invalid Date".
--
-- The predicate has to read public.bookings, whose own policies read
-- public.stages -- a direct EXISTS(...) here would make Postgres raise
-- "infinite recursion detected in policy". A SECURITY DEFINER helper runs the
-- lookup with RLS bypassed and breaks the cycle.

CREATE OR REPLACE FUNCTION public.current_user_booked_stage(p_stage_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.stage_id = p_stage_id
      AND b.user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Permissive policies are ORed into one qualifier and every role that reads
-- public.stages may end up evaluating this one, so anon needs EXECUTE too or
-- the public stage listing would fail with "permission denied for function".
-- It is safe: auth.uid() is NULL for anon, so the function just returns false.
GRANT EXECUTE ON FUNCTION public.current_user_booked_stage(UUID)
  TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Students can read stages they booked" ON public.stages;
CREATE POLICY "Students can read stages they booked" ON public.stages
    FOR SELECT USING (public.current_user_booked_stage(id));

-- ============================================
-- 4. Keep auto_ecoles.rating in sync with reviews
-- ============================================
-- Nothing ever wrote auto_ecoles.rating, so the rating badge on
-- /dashboard/profile was stuck at 0 for every school no matter how many
-- reviews it had. search_stages already averages the reviews table on the fly;
-- this keeps the stored column consistent for the pages that read it directly.

CREATE OR REPLACE FUNCTION public.sync_auto_ecole_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_id UUID;
  previous_id UUID;
BEGIN
  -- NEW is unassigned in a row-level DELETE trigger; touching NEW.<field>
  -- there raises "record new is not assigned yet", so branch on TG_OP.
  IF TG_OP = 'DELETE' THEN
    target_id := OLD.auto_ecole_id;
  ELSE
    target_id := NEW.auto_ecole_id;
    IF TG_OP = 'UPDATE' AND NEW.auto_ecole_id IS DISTINCT FROM OLD.auto_ecole_id THEN
      previous_id := OLD.auto_ecole_id;
    END IF;
  END IF;

  UPDATE public.auto_ecoles ae
  SET rating = COALESCE(
    (SELECT ROUND(AVG(r.rating), 2) FROM public.reviews r WHERE r.auto_ecole_id = target_id),
    0
  )
  WHERE ae.id = target_id;

  IF previous_id IS NOT NULL THEN
    UPDATE public.auto_ecoles ae
    SET rating = COALESCE(
      (SELECT ROUND(AVG(r.rating), 2) FROM public.reviews r WHERE r.auto_ecole_id = previous_id),
      0
    )
    WHERE ae.id = previous_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_auto_ecole_rating ON public.reviews;
CREATE TRIGGER trg_sync_auto_ecole_rating
AFTER INSERT OR DELETE OR UPDATE OF rating, auto_ecole_id ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.sync_auto_ecole_rating();

-- Backfill existing schools.
UPDATE public.auto_ecoles ae
SET rating = COALESCE(
  (SELECT ROUND(AVG(r.rating), 2) FROM public.reviews r WHERE r.auto_ecole_id = ae.id),
  0
);

-- ============================================
-- 5. Let a student withdraw their own review
-- ============================================
-- reviews had SELECT / INSERT / UPDATE policies but no DELETE one, so a
-- student could publish a review and never take it down.
DROP POLICY IF EXISTS "Students can delete own reviews" ON public.reviews;
CREATE POLICY "Students can delete own reviews" ON public.reviews
    FOR DELETE USING (user_id = auth.uid());
