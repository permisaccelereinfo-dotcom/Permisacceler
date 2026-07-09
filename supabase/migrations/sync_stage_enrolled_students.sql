-- Migration: keep stages.enrolled_students consistent with live booking counts.
-- Capacity is enforced via live COUNT(*) over bookings (see
-- reserve_booking_for_checkout.sql / search_stages), but the denormalised
-- stages.enrolled_students column was never maintained and drifted to stale
-- values. This trigger recomputes it on every booking change so any UI that
-- reads the column shows accurate availability.
-- "Enrolled" uses the same status set as the capacity check.
-- Run after reserve_booking_for_checkout.sql.

CREATE OR REPLACE FUNCTION public.sync_stage_enrolled_students()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE public.stages
    SET enrolled_students = (
      SELECT COUNT(*)
      FROM public.bookings
      WHERE stage_id = OLD.stage_id
        AND status IN ('pending', 'confirmed', 'completed')
    )
    WHERE id = OLD.stage_id;
    RETURN OLD;
  END IF;

  UPDATE public.stages
  SET enrolled_students = (
    SELECT COUNT(*)
    FROM public.bookings
    WHERE stage_id = NEW.stage_id
      AND status IN ('pending', 'confirmed', 'completed')
  )
  WHERE id = NEW.stage_id;

  -- If a booking moved between stages, refresh the previous stage too.
  IF (TG_OP = 'UPDATE' AND NEW.stage_id IS DISTINCT FROM OLD.stage_id) THEN
    UPDATE public.stages
    SET enrolled_students = (
      SELECT COUNT(*)
      FROM public.bookings
      WHERE stage_id = OLD.stage_id
        AND status IN ('pending', 'confirmed', 'completed')
    )
    WHERE id = OLD.stage_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_stage_enrolled_students ON public.bookings;
CREATE TRIGGER trg_sync_stage_enrolled_students
AFTER INSERT OR DELETE OR UPDATE OF status, stage_id ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_stage_enrolled_students();

-- One-time backfill so existing rows are correct immediately.
UPDATE public.stages s
SET enrolled_students = (
  SELECT COUNT(*)
  FROM public.bookings b
  WHERE b.stage_id = s.id
    AND b.status IN ('pending', 'confirmed', 'completed')
);
