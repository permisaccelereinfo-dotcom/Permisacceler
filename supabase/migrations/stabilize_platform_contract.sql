-- Migration: align database contract with the current Next.js app.
-- Run after setup.sql and any previous migrations.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS date_naissance DATE,
  ADD COLUMN IF NOT EXISTS ville_naissance TEXT,
  ADD COLUMN IF NOT EXISTS adresse TEXT,
  ADD COLUMN IF NOT EXISTS complement_adresse TEXT,
  ADD COLUMN IF NOT EXISTS code_postal TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS has_permit BOOLEAN,
  ADD COLUMN IF NOT EXISTS transmission_preference TEXT CHECK (
    transmission_preference IS NULL OR transmission_preference IN ('auto', 'manuelle')
  ),
  ADD COLUMN IF NOT EXISTS has_code BOOLEAN,
  ADD COLUMN IF NOT EXISTS neph_number TEXT,
  ADD COLUMN IF NOT EXISTS quiz_completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.auto_ecoles
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) NOT NULL DEFAULT 0;

UPDATE public.auto_ecoles
SET region = CASE
  WHEN lower(city) IN ('paris', 'boulogne-billancourt', 'saint-denis', 'montreuil', 'versailles', 'noisy-le-grand') THEN 'ILE DE FRANCE'
  ELSE 'PROVINCE'
END
WHERE region IS NULL;

ALTER TABLE public.stages
  ADD COLUMN IF NOT EXISTS stage_type TEXT;

UPDATE public.stages
SET stage_type = COALESCE(stage_type, title, 'Stage intensif');

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session_id
  ON public.bookings(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.search_stages(
    search_region TEXT DEFAULT NULL,
    search_stage_type TEXT DEFAULT NULL,
    search_license_type TEXT DEFAULT NULL,
    search_start_date DATE DEFAULT NULL,
    search_end_date DATE DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL
)
RETURNS TABLE (
    stage_id UUID,
    stage_title TEXT,
    stage_description TEXT,
    license_type TEXT,
    start_date DATE,
    end_date DATE,
    price DECIMAL,
    max_students INTEGER,
    enrolled_students INTEGER,
    available_spots INTEGER,
    auto_ecole_id UUID,
    auto_ecole_name TEXT,
    auto_ecole_region TEXT,
    auto_ecole_rating DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as stage_id,
        s.title as stage_title,
        s.description as stage_description,
        s.license_type,
        s.start_date,
        s.end_date,
        s.price,
        s.max_students,
        s.enrolled_students,
        (s.max_students - s.enrolled_students) as available_spots,
        ae.id as auto_ecole_id,
        ae.name as auto_ecole_name,
        COALESCE(ae.region, ae.city) as auto_ecole_region,
        COALESCE(
            (SELECT AVG(r.rating) FROM public.reviews r WHERE r.auto_ecole_id = ae.id),
            ae.rating,
            0
        )::DECIMAL(3,2) as auto_ecole_rating
    FROM public.stages s
    JOIN public.auto_ecoles ae ON s.auto_ecole_id = ae.id
    WHERE s.is_available = TRUE
      AND s.status = 'active'
      AND (search_region IS NULL OR ae.region ILIKE '%' || search_region || '%' OR ae.city ILIKE '%' || search_region || '%')
      AND (search_stage_type IS NULL OR s.stage_type ILIKE '%' || search_stage_type || '%' OR s.title ILIKE '%' || search_stage_type || '%')
      AND (search_license_type IS NULL OR s.license_type = search_license_type)
      AND (search_start_date IS NULL OR s.start_date >= search_start_date)
      AND (search_end_date IS NULL OR s.end_date <= search_end_date)
      AND (max_price IS NULL OR s.price <= max_price)
      AND (s.max_students - s.enrolled_students) > 0
    ORDER BY s.start_date ASC, s.price ASC;
END;
$$ LANGUAGE plpgsql STABLE;
