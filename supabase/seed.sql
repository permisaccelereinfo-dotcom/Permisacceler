-- ============================================
-- Permis Accéléré - Seed Data
-- Run this after setup.sql to populate test data
-- ============================================

-- IMPORTANT: To use this seed file, you have two options:
-- Option 1: Create uPermisAccéléré
Vous êtes auto-école ?
Centre d'aide
Se connecter
Gérer mes RDVsers in Supabase Dashboard first, then get their UUIDs
-- Option 2: Run this simplified version that creates test data with temp UUIDs

-- ============================================
-- OPTION 1: If you have existing users in auth.users
-- ============================================
-- First, get your actual user IDs from auth.users:
-- SELECT id, email FROM auth.users;
-- Then replace the placeholder UUIDs below with real ones

-- ============================================
-- OPTION 2: Create test users (requires auth.admin privileges)
-- ============================================
-- Uncomment and run this first to create test auth users:
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES 
  (gen_random_uuid(), 'test1@autoecole.fr', crypt('password123', gen_salt('bf')), NOW(), '{"name": "Auto-École Test 1"}'::jsonb),
  (gen_random_uuid(), 'test2@autoecole.fr', crypt('password123', gen_salt('bf')), NOW(), '{"name": "Auto-École Test 2"}'::jsonb)
RETURNING id;
*/

-- ============================================
-- SAMPLE AUTO-ECOLES
-- ============================================

-- Get real user IDs first, or use this workaround for development:
-- For development/testing, you can temporarily disable the FK check
-- WARNING: Only for development, never in production!

-- Step 1: Create test entries in public.users that reference existing or new auth users
-- If you don't have auth users yet, run this first in Supabase Dashboard Authentication section:
-- Create users with emails: test-paris@permis.fr, test-lyon@permis.fr, etc.

-- Then use their actual UUIDs here, or use the following approach:

-- Create a temporary function to get or create a test user
CREATE OR REPLACE FUNCTION get_or_create_test_user(user_email TEXT, user_name TEXT)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Try to find existing user
    SELECT au.id INTO user_id
    FROM auth.users au
    WHERE au.email = user_email;
    
    -- If not found, create one (requires proper permissions)
    IF user_id IS NULL THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            user_email,
            crypt('testpassword123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW()
        )
        RETURNING id INTO user_id;
    END IF;
    
    -- Ensure user exists in public.users
    INSERT INTO public.users (id, email, name, role, created_at, updated_at)
    VALUES (user_id, user_email, user_name, 'auto_ecole', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW();
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Insert auto-écoles using the function
INSERT INTO public.auto_ecoles (
    id, 
    user_id, 
    name, 
    description, 
    address, 
    city, 
    postal_code, 
    phone, 
    email, 
    website,
    license_types, 
    is_verified, 
    commission_rate,
    latitude,
    longitude
) VALUES 
(
    gen_random_uuid(),
    get_or_create_test_user('test-paris@permis.fr', 'Auto-École Paris Centre'),
    'Auto-École Paris Centre',
    'Formation intensive permis B à Paris. 7 jours pour obtenir votre permis avec nos moniteurs expérimentés.',
    '15 Rue de la Paix',
    'Paris',
    '75002',
    '01 42 60 35 00',
    'contact@autoecole-paris-centre.fr',
    'https://autoecole-paris-centre.fr',
    ARRAY['B', 'A1'],
    true,
    10.00,
    48.8689,
    2.3310
),
(
    gen_random_uuid(),
    get_or_create_test_user('test-lyon@permis.fr', 'Auto-École Lyon Confluence'),
    'Auto-École Lyon Confluence',
    'Stage accéléré permis B dans le quartier de la Confluence. Parking privé pour les manœuvres.',
    '45 Quai Rambaud',
    'Lyon',
    '69002',
    '04 78 42 15 63',
    'contact@autoecole-lyon.fr',
    'https://autoecole-lyon-confluence.fr',
    ARRAY['B'],
    true,
    10.00,
    45.7439,
    4.8156
),
(
    gen_random_uuid(),
    get_or_create_test_user('test-marseille@permis.fr', 'Auto Moto École Marseille'),
    'Auto Moto École Marseille',
    'Spécialiste des formations accélérées permis B et moto A2 à Marseille centre.',
    '128 La Canebière',
    'Marseille',
    '13001',
    '04 91 55 23 89',
    'contact@autoecole-marseille.fr',
    'https://autoecole-marseille.fr',
    ARRAY['B', 'A2', 'A1'],
    true,
    12.00,
    43.2965,
    5.3698
),
(
    gen_random_uuid(),
    get_or_create_test_user('test-bordeaux@permis.fr', 'Auto-École Bordeaux Chartrons'),
    'Auto-École Bordeaux Chartrons',
    'Formation permis B express dans le quartier des Chartrons. Résultats garantis.',
    '78 Cours Portal',
    'Bordeaux',
    '33000',
    '05 56 44 88 12',
    'contact@autoecole-bordeaux.fr',
    'https://autoecole-bordeaux-chartrons.fr',
    ARRAY['B'],
    true,
    10.00,
    44.8570,
    -0.5720
),
(
    gen_random_uuid(),
    get_or_create_test_user('test-nantes@permis.fr', 'Permis Accéléré Nantes'),
    'Permis Accéléré Nantes',
    'Stage intensif permis B en 7 jours. Véhicules récents et doubles commandes.',
    '12 Rue de Strasbourg',
    'Nantes',
    '44000',
    '02 40 35 67 90',
    'contact@permis-accelere-nantes.fr',
    'https://permis-accelere-nantes.fr',
    ARRAY['B', 'A1'],
    false,
    10.00,
    47.2184,
    -1.5536
),
(
    gen_random_uuid(),
    get_or_create_test_user('test-lille@permis.fr', 'Auto-École Lille Centre'),
    'Auto-École Lille Centre',
    'Formation accélérée permis B et C à Lille. Parking privé et simulateur de conduite.',
    '25 Rue Faidherbe',
    'Lille',
    '59000',
    '03 20 55 78 34',
    'contact@autoecole-lille.fr',
    'https://autoecole-lille-centre.fr',
    ARRAY['B', 'C'],
    true,
    10.00,
    50.6292,
    3.0573
);

-- ============================================
-- SAMPLE STAGES (INTENSIVE COURSES)
-- ============================================

-- Get the auto_ecole IDs we just created (you may need to adjust these)
-- For now, we'll use subqueries to get the correct IDs

INSERT INTO public.stages (
    auto_ecole_id,
    title,
    description,
    license_type,
    start_date,
    end_date,
    duration_days,
    max_students,
    enrolled_students,
    price,
    deposit_amount,
    is_available,
    status
)
SELECT 
    id as auto_ecole_id,
    'Stage Intensif Permis B - Début Juillet',
    'Formation complète en 7 jours. Théorie le matin, conduite l''après-midi. Repas inclus. Double commande dans tous les véhicules.',
    'B',
    '2024-07-01'::DATE,
    '2024-07-07'::DATE,
    7,
    6,
    3,
    850.00,
    150.00,
    true,
    'active'
FROM public.auto_ecoles 
WHERE name = 'Auto-École Paris Centre';

INSERT INTO public.stages (
    auto_ecole_id,
    title,
    description,
    license_type,
    start_date,
    end_date,
    duration_days,
    max_students,
    enrolled_students,
    price,
    deposit_amount,
    is_available,
    status
)
SELECT 
    id as auto_ecole_id,
    'Stage Express Permis B - Mi-Juillet',
    'Session intensive de 7 jours. 20h de conduite + code. Prêt de véhicule pour l''examen.',
    'B',
    '2024-07-15'::DATE,
    '2024-07-21'::DATE,
    7,
    6,
    1,
    799.00,
    150.00,
    true,
    'active'
FROM public.auto_ecoles 
WHERE name = 'Auto-École Lyon Confluence';

INSERT INTO public.stages (
    auto_ecole_id,
    title,
    description,
    license_type,
    start_date,
    end_date,
    duration_days,
    max_students,
    enrolled_students,
    price,
    deposit_amount,
    is_available,
    status
)
SELECT 
    id as auto_ecole_id,
    'Stage Accéléré Permis A2 - Moto',
    'Formation 125cc et gros cube en 5 jours intensifs. Équipement fourni.',
    'A2',
    '2024-07-08'::DATE,
    '2024-07-12'::DATE,
    5,
    4,
    2,
    650.00,
    100.00,
    true,
    'active'
FROM public.auto_ecoles 
WHERE name = 'Auto Moto École Marseille';

INSERT INTO public.stages (
    auto_ecole_id,
    title,
    description,
    license_type,
    start_date,
    end_date,
    duration_days,
    max_students,
    enrolled_students,
    price,
    deposit_amount,
    is_available,
    status
)
SELECT 
    id as auto_ecole_id,
    'Stage Intensif Permis B - Août',
    '7 jours pour passer de zéro à permis en poche. Inclus 30h de conduite + code illimité.',
    'B',
    '2024-08-05'::DATE,
    '2024-08-11'::DATE,
    7,
    8,
    5,
    899.00,
    200.00,
    true,
    'active'
FROM public.auto_ecoles 
WHERE name = 'Auto-École Bordeaux Chartrons';

INSERT INTO public.stages (
    auto_ecole_id,
    title,
    description,
    license_type,
    start_date,
    end_date,
    duration_days,
    max_students,
    enrolled_students,
    price,
    deposit_amount,
    is_available,
    status
)
SELECT 
    id as auto_ecole_id,
    'Stage Express Permis B - Fin Juillet',
    'Derniers places pour juillet ! Formation complète en 7 jours intensifs.',
    'B',
    '2024-07-22'::DATE,
    '2024-07-28'::DATE,
    7,
    6,
    0,
    750.00,
    150.00,
    true,
    'active'
FROM public.auto_ecoles 
WHERE name = 'Permis Accéléré Nantes';

INSERT INTO public.stages (
    auto_ecole_id,
    title,
    description,
    license_type,
    start_date,
    end_date,
    duration_days,
    max_students,
    enrolled_students,
    price,
    deposit_amount,
    is_available,
    status
)
SELECT 
    id as auto_ecole_id,
    'Stage Permis Poids Lourd C',
    'Formation professionnelle permis C en 14 jours. Pour devenir chauffeur routier.',
    'C',
    '2024-07-15'::DATE,
    '2024-07-28'::DATE,
    14,
    4,
    1,
    1200.00,
    300.00,
    true,
    'active'
FROM public.auto_ecoles 
WHERE name = 'Auto-École Lille Centre';

INSERT INTO public.stages (
    auto_ecole_id,
    title,
    description,
    license_type,
    start_date,
    end_date,
    duration_days,
    max_students,
    enrolled_students,
    price,
    deposit_amount,
    is_available,
    status
)
SELECT 
    id as auto_ecole_id,
    'Stage Intensif Permis B - Septembre',
    'Rentrez avec votre permis ! Formation complète 7 jours. Places limitées.',
    'B',
    '2024-09-02'::DATE,
    '2024-09-08'::DATE,
    7,
    6,
    2,
    820.00,
    150.00,
    true,
    'active'
FROM public.auto_ecoles 
WHERE name = 'Auto-École Paris Centre';

INSERT INTO public.stages (
    auto_ecole_id,
    title,
    description,
    license_type,
    start_date,
    end_date,
    duration_days,
    max_students,
    enrolled_students,
    price,
    deposit_amount,
    is_available,
    status
)
SELECT 
    id as auto_ecole_id,
    'Stage Moto A1 - 125cc Express',
    'Apprenez à conduire une 125cc en 3 jours. Formation complète théorie + pratique.',
    'A1',
    '2024-07-29'::DATE,
    '2024-07-31'::DATE,
    3,
    5,
    3,
    450.00,
    100.00,
    true,
    'active'
FROM public.auto_ecoles 
WHERE name = 'Auto Moto École Marseille';

-- ============================================
-- SAMPLE REVIEWS
-- ============================================

-- Note: These reference booking_ids that must exist
-- For testing purposes, these would be added after bookings are made

-- Example review structure:
-- INSERT INTO public.reviews (user_id, auto_ecole_id, booking_id, rating, comment)
-- VALUES (
--     'user-uuid',
--     (SELECT id FROM public.auto_ecoles WHERE name = 'Auto-École Paris Centre'),
--     'booking-uuid',
--     5,
--     'Excellent stage intensif ! Moniteur très patient, j''ai eu mon permis du premier coup. Je recommande !'
-- );

-- ============================================
-- END OF SEED DATA
-- ============================================
