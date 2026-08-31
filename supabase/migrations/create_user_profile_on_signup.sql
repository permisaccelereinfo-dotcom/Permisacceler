-- Migration: create public.users profiles automatically on signup.
-- Email/password signup on /login never inserted a public.users row (the
-- post-signup quiz only runs an UPDATE, which matches zero rows), so those
-- accounts hit bookings_user_id_fkey at checkout. A trigger on auth.users
-- covers every signup path (email, OAuth, inline checkout signup); the
-- backfill repairs accounts created before the trigger existed.
-- Run after the base setup and contract migrations.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- role is omitted so the column default ('student') applies;
  -- register_auto_ecole upgrades the role via its own upsert.
  INSERT INTO public.users (id, email, name, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'Utilisateur'
    ),
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: repair auth users created before the trigger existed.
INSERT INTO public.users (id, email, name, phone)
SELECT
  au.id,
  COALESCE(au.email, ''),
  COALESCE(
    NULLIF(au.raw_user_meta_data->>'name', ''),
    NULLIF(au.raw_user_meta_data->>'full_name', ''),
    NULLIF(split_part(COALESCE(au.email, ''), '@', 1), ''),
    'Utilisateur'
  ),
  NULLIF(au.raw_user_meta_data->>'phone', '')
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;
