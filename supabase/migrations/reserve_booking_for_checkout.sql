-- Migration: create an atomic reservation function for Stripe checkout.
-- Run after stabilize_platform_contract.sql and add_email_tracking_fields.sql.

CREATE OR REPLACE FUNCTION public.reserve_booking_for_checkout(
  p_user_id UUID,
  p_stage_id UUID,
  p_metadata JSONB DEFAULT NULL,
  p_exam_support_price NUMERIC DEFAULT 65
)
RETURNS TABLE (
  booking_id UUID,
  total_price NUMERIC,
  stage_title TEXT,
  stage_type TEXT
) AS $$
DECLARE
  stage_row public.stages%ROWTYPE;
  existing_booking public.bookings%ROWTYPE;
  has_existing_booking BOOLEAN := FALSE;
  reserved_count INTEGER := 0;
  computed_total NUMERIC(10,2);
BEGIN
  IF p_user_id IS NULL OR p_stage_id IS NULL THEN
    RAISE EXCEPTION 'Missing user or stage id';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Cannot reserve a booking for another user';
  END IF;

  SELECT *
  INTO stage_row
  FROM public.stages
  WHERE id = p_stage_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stage not found';
  END IF;

  IF stage_row.is_available IS DISTINCT FROM TRUE OR stage_row.status <> 'active' THEN
    RAISE EXCEPTION 'Ce stage n''est plus disponible.';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO reserved_count
  FROM public.bookings
  WHERE stage_id = p_stage_id
    AND status IN ('pending', 'confirmed', 'completed');

  SELECT *
  INTO existing_booking
  FROM public.bookings
  WHERE user_id = p_user_id
    AND stage_id = p_stage_id
  FOR UPDATE;

  has_existing_booking := FOUND;

  IF has_existing_booking THEN
    IF existing_booking.status IN ('confirmed', 'completed') THEN
      RAISE EXCEPTION 'Vous avez déjà une réservation confirmée pour ce stage.';
    END IF;

    IF existing_booking.status = 'pending' THEN
      reserved_count := GREATEST(reserved_count - 1, 0);
    END IF;
  END IF;

  IF reserved_count >= stage_row.max_students THEN
    RAISE EXCEPTION 'Ce stage est complet.';
  END IF;

  computed_total := stage_row.price + GREATEST(COALESCE(p_exam_support_price, 0), 0);

  IF has_existing_booking THEN
    UPDATE public.bookings
    SET
      status = 'pending',
      total_price = computed_total,
      deposit_paid = 0,
      balance_due = computed_total,
      payment_status = 'pending_deposit',
      stripe_session_id = NULL,
      metadata = p_metadata,
      cancellation_reason = NULL,
      cancelled_at = NULL,
      updated_at = NOW()
    WHERE id = existing_booking.id
    RETURNING id INTO booking_id;
  ELSE
    INSERT INTO public.bookings (
      user_id,
      stage_id,
      status,
      total_price,
      deposit_paid,
      balance_due,
      payment_status,
      metadata
    )
    VALUES (
      p_user_id,
      p_stage_id,
      'pending',
      computed_total,
      0,
      computed_total,
      'pending_deposit',
      p_metadata
    )
    RETURNING id INTO booking_id;
  END IF;

  total_price := computed_total;
  stage_title := stage_row.title;
  stage_type := stage_row.stage_type;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.reserve_booking_for_checkout(UUID, UUID, JSONB, NUMERIC)
  TO authenticated, service_role;

-- The setup.sql version returns a different row type; CREATE OR REPLACE cannot
-- change a return type, so the old function must be dropped first.
DROP FUNCTION IF EXISTS public.search_stages(TEXT, TEXT, TEXT, DATE, DATE, DECIMAL);

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
        (
          s.max_students - (
            SELECT COUNT(*)::INTEGER
            FROM public.bookings b
            WHERE b.stage_id = s.id
              AND b.status IN ('pending', 'confirmed', 'completed')
          )
        ) as available_spots,
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
      AND (
        s.max_students - (
          SELECT COUNT(*)::INTEGER
          FROM public.bookings b
          WHERE b.stage_id = s.id
            AND b.status IN ('pending', 'confirmed', 'completed')
        )
      ) > 0
    ORDER BY s.start_date ASC, s.price ASC;
END;
$$ LANGUAGE plpgsql STABLE;
