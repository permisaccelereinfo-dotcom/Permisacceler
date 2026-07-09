-- Migration: atomic auto-école registration.
-- The signup flow previously created the public.users row and the
-- public.auto_ecoles row in two separate client calls; a failure between them
-- left an orphaned user with no auto-école profile. This function performs both
-- inserts in a single transaction (the function body) so they succeed or fail
-- together. It must be called by the freshly-signed-up user (auth.uid() check).
-- Run after the base setup and contract migrations.

CREATE OR REPLACE FUNCTION public.register_auto_ecole(
  p_user_id UUID,
  p_email TEXT,
  p_responsible_name TEXT,
  p_phone TEXT,
  p_auto_ecole_name TEXT,
  p_address TEXT,
  p_city TEXT,
  p_postal_code TEXT
)
RETURNS UUID AS $$
DECLARE
  new_auto_ecole_id UUID;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized to register this account';
  END IF;

  INSERT INTO public.users (id, email, name, phone, role)
  VALUES (p_user_id, p_email, p_responsible_name, NULLIF(p_phone, ''), 'auto_ecole')
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        role = 'auto_ecole',
        updated_at = NOW();

  INSERT INTO public.auto_ecoles (
    user_id, name, email, phone, address, city, postal_code, is_verified, commission_rate
  )
  VALUES (
    p_user_id, p_auto_ecole_name, p_email, p_phone, p_address, p_city, p_postal_code, FALSE, 10
  )
  RETURNING id INTO new_auto_ecole_id;

  RETURN new_auto_ecole_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.register_auto_ecole(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO authenticated;
