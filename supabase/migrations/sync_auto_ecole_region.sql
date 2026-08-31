-- Migration: keep auto_ecoles.region consistent with postal_code.
-- search_stages buckets schools by region ('ILE DE FRANCE' / 'PROVINCE',
-- derived from the postal-code département), but region was only ever written
-- by one-off backfills: register_auto_ecole never sets it (new schools got
-- NULL) and the dashboard profile page lets a school change its postal code
-- without anything recomputing region, so relocated schools kept showing in
-- the wrong search bucket.
-- Run after add_missing_auto_ecole_columns.sql.

CREATE OR REPLACE FUNCTION public.derive_region_from_postal_code(p_postal_code TEXT)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN substring(p_postal_code FROM 1 FOR 2) IN ('75', '77', '78', '91', '92', '93', '94', '95')
      THEN 'ILE DE FRANCE'
    ELSE 'PROVINCE'
  END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.sync_auto_ecole_region()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.postal_code IS NULL OR NEW.postal_code = '' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.region IS NULL THEN
      NEW.region := public.derive_region_from_postal_code(NEW.postal_code);
    END IF;
  ELSIF NEW.postal_code IS DISTINCT FROM OLD.postal_code
    AND NEW.region IS NOT DISTINCT FROM OLD.region THEN
    -- Postal code changed and the caller did not set region explicitly.
    NEW.region := public.derive_region_from_postal_code(NEW.postal_code);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_auto_ecole_region ON public.auto_ecoles;
CREATE TRIGGER trg_sync_auto_ecole_region
BEFORE INSERT OR UPDATE OF postal_code, region ON public.auto_ecoles
FOR EACH ROW EXECUTE FUNCTION public.sync_auto_ecole_region();

-- Backfill: region is postal-code-derived everywhere (the previous backfills
-- used this exact CASE), so realign every row that drifted or was never set.
UPDATE public.auto_ecoles
SET region = public.derive_region_from_postal_code(postal_code)
WHERE postal_code IS NOT NULL AND postal_code <> ''
  AND region IS DISTINCT FROM public.derive_region_from_postal_code(postal_code);
