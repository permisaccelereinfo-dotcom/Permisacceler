-- Migration: add auto_ecoles columns the deployed search_stages() depends on.
--
-- Databases provisioned before setup.sql included these columns (or where
-- stabilize_platform_contract.sql rolled back partway — its region backfill
-- reads lower(city) and aborts the whole transaction when city is absent)
-- lack auto_ecoles.city and auto_ecoles.rating. The deployed search_stages()
-- references both, so every call fails with 42703 ("column ae.city does not
-- exist") and /recherche shows no stages.
--
-- Idempotent: safe to re-run and safe on databases that already have both.

ALTER TABLE public.auto_ecoles
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_auto_ecoles_city ON public.auto_ecoles(city);

-- Backfill region where missing. City is unknown for pre-existing rows, so
-- derive it from the postal code département instead (75/77/78/91-95 = IDF).
UPDATE public.auto_ecoles
SET region = CASE
  WHEN substring(postal_code FROM 1 FOR 2) IN ('75', '77', '78', '91', '92', '93', '94', '95')
    THEN 'ILE DE FRANCE'
  ELSE 'PROVINCE'
END
WHERE region IS NULL;
