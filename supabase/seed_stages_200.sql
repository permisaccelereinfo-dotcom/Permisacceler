-- ============================================
-- Permis Accéléré - 200 Test Stages Seed Data
-- Run this after setup.sql to populate stages with test data
-- ============================================

-- ============================================
-- STEP 1: Ensure we have at least one auto-école first
-- If you don't have auto-écoles, run this first:
-- ============================================

-- Check if auto_ecoles table has data, if not create a default one
DO $$
DECLARE
    auto_ecole_count INTEGER;
    default_auto_ecole_id UUID;
BEGIN
    SELECT COUNT(*) INTO auto_ecole_count FROM public.auto_ecoles;
    
    IF auto_ecole_count = 0 THEN
        -- Create a default test auto-école if none exist
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
        )
        SELECT 
            gen_random_uuid(),
            id,
            'Auto-École Test National',
            'Auto-école de test pour les données de développement',
            '123 Rue de Test',
            'Paris',
            '75001',
            '01 23 45 67 89',
            'test@autoecole.fr',
            'https://test-autoecole.fr',
            ARRAY['B', 'A1', 'A2'],
            true,
            10.00,
            48.8566,
            2.3522
        FROM auth.users 
        LIMIT 1;
    END IF;
END $$;

-- ============================================
-- STEP 2: Insert 200 Test Stages
-- ============================================

WITH cities AS (
    SELECT unnest(ARRAY[
        'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 
        'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 
        'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 
        'Le Mans', 'Aix-en-Provence', 'Clermont-Ferrand', 'Brest', 'Limoges', 
        'Tours', 'Amiens', 'Perpignan', 'Metz', 'Besançon', 'Orléans', 'Rouen', 
        'Mulhouse', 'Caen', 'Nancy', 'Saint-Denis', 'Argenteuil', 'Montreuil', 
        'Roubaix', 'Dunkerque', 'Avignon', 'Poitiers', 'Nanterre', 'Créteil', 
        'Versailles', 'Courbevoie', 'Colombes', 'Vitry-sur-Seine', 'Asnières-sur-Seine', 
        'Aulnay-sous-Bois', 'Pau', 'Rueil-Malmaison', 'Champigny-sur-Marne', 
        'La Rochelle', 'Antibes', 'Calais', 'Saint-Maur-des-Fossés', 'Cannes', 
        'Béziers', 'Bourges', 'Saint-Nazaire', 'Colmar', 'Ajaccio', 'Quimper', 
        'Valence', 'Pessac', 'Cergy', 'Troyes', 'Chambéry', 'Lorient', 'Mérignac', 
        'Saint-Quentin', 'Noisy-le-Grand', 'Villeneuve-d''Ascq', 'Vannes', 'Sète', 
        'Saint-Malo', 'Gennevilliers', 'Douai', 'Saint-Brieuc', 'Tarbes', 
        'Angoulême', 'Cholet', 'Alfortville', 'Gap', 'Roanne', 'Charleville-Mézières', 
        'Thonon-les-Bains', 'Châteauroux', 'Vichy', 'Arles', 'Annecy', 'Bayonne', 
        'Carcassonne', 'Blois', 'Saint-Germain-en-Laye', 'Drancy', 'Saint-Raphaël', 
        'Hyères', 'Évreux', 'Mâcon', 'Chalon-sur-Saône', 'Beauvais', 'Aubagne', 
        'Boulogne-sur-Mer', 'Saint-Laurent-du-Var', 'Châlons-en-Champagne', 
        'Bourg-en-Bresse', 'Sens', 'Biarritz', 'Menton', 'Bergerac'
    ]) AS city_name
),
titles AS (
    SELECT unnest(ARRAY[
        'Stage Intensif Permis B - Express',
        'Stage Accéléré Permis B - 7 Jours',
        'Formation Express Permis B',
        'Stage Intensif Permis B - Accéléré',
        'Stage Permis B - Formation Complète',
        'Stage Permis B - Semi-Intensif',
        'Stage Permis B - Ultra Intensif',
        'Formation Accélérée Permis B',
        'Stage Permis B - Cours du Soir',
        'Stage Permis B - Week-end',
        'Stage Intensif Permis B - Étudiant',
        'Stage Permis B - Formation Rapide',
        'Stage Express Permis B - 5 Jours',
        'Stage Permis B - Accéléré Pro',
        'Formation Permis B - Condensée',
        'Stage Permis B - Immersion Totale',
        'Stage Permis B - Apprendre Vite',
        'Stage Accéléré Permis B - Certifiant',
        'Stage Permis B - Garantie Passage',
        'Stage Intensif Permis B - Premium'
    ]) AS title_template
),
descriptions AS (
    SELECT unnest(ARRAY[
        'Formation complète en 7 jours. Théorie le matin, conduite l''après-midi. Repas inclus.',
        'Session intensive avec 30h de conduite. Moniteurs expérimentés. Taux de réussite élevé.',
        'Stage express pour obtenir votre permis rapidement. Double commande dans tous les véhicules.',
        'Formation accélérée avec code illimité. Prêt de véhicule pour l''examen.',
        'Stage intensif avec hébergement possible. Formation théorique et pratique complète.',
        'Formation rapide pour les personnes pressées. Cours particuliers disponibles.',
        'Stage ultra intensif en 5 jours. Pour les apprentissages rapides et efficaces.',
        'Formation condensée avec simulateur de conduite. Résultats garantis.',
        'Stage semi-intensif compatible avec le travail. Horaires flexibles.',
        'Formation complète avec suivi personnalisé. Accompagnement jusqu''à l''examen.',
        'Stage étudiant avec tarifs préférentiels. Formation adaptée aux juniors.',
        'Formation professionnelle intensive. Pour devenir conducteur autonome rapidement.',
        'Stage week-end pour les actifs occupés. Samedi et dimanche intensifs.',
        'Formation premium avec véhicules haut de gamme. Service VIP inclus.',
        'Stage immersion totale en 7 jours. Formation théorie + pratique non-stop.',
        'Formation rapide avec taux de réussite 95%. Satisfait ou remboursé.',
        'Stage accéléré avec coaching personnalisé. Méthode pédagogique innovante.',
        'Formation express avec examen blanc inclus. Préparation optimale.',
        'Stage intensif été 2026. Profitez des vacances pour obtenir votre permis.',
        'Stage hiver 2026. Formation dans de bonnes conditions avec chauffage.',
        'Stage printemps 2026. Renouveau et nouveau permis !',
        'Stage automne 2026. Session de rentrée avec tarifs spéciaux.',
        'Formation courte durée 5 jours. Pour les plus motivés et déterminés.',
        'Stage classique 7 jours. Le format le plus populaire et efficace.',
        'Formation longue durée 10 jours. Pour ceux qui veulent prendre leur temps.'
    ]) AS description_template
),
license_types AS (
    SELECT unnest(ARRAY['B', 'B', 'B', 'B', 'B Automatique', 'B Manuelle']) AS license_type
),
transmission_types AS (
    SELECT unnest(ARRAY['Boîte manuelle', 'Boîte automatique']) AS transmission
),
base_data AS (
    SELECT 
        c.city_name,
        t.title_template,
        d.description_template,
        l.license_type,
        tr.transmission,
        (random() * 400 + 600)::numeric(10,2) AS price,
        (random() * 150 + 100)::numeric(10,2) AS deposit,
        (floor(random() * 4) + 3)::int AS duration_days,
        (floor(random() * 4) + 4)::int AS max_students,
        floor(random() * 3)::int AS enrolled
    FROM 
        (SELECT city_name, row_number() OVER () as rn FROM cities) c
        JOIN (SELECT title_template, row_number() OVER () as rn FROM titles) t ON (c.rn % 20) + 1 = t.rn
        JOIN (SELECT description_template, row_number() OVER () as rn FROM descriptions) d ON (c.rn % 25) + 1 = d.rn
        JOIN (SELECT license_type, row_number() OVER () as rn FROM license_types) l ON (c.rn % 6) + 1 = l.rn
        JOIN (SELECT transmission, row_number() OVER () as rn FROM transmission_types) tr ON (c.rn % 2) + 1 = tr.rn
    LIMIT 200
)
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
    (SELECT id FROM public.auto_ecoles ORDER BY random() LIMIT 1),
    bd.title_template || ' - ' || bd.city_name,
    bd.description_template || ' Boîte ' || 
        CASE 
            WHEN bd.license_type LIKE '%Automatique%' THEN 'automatique.'
            WHEN bd.license_type LIKE '%Manuelle%' THEN 'manuelle.'
            WHEN bd.transmission = 'Boîte automatique' THEN 'automatique.'
            ELSE 'manuelle.'
        END,
    CASE 
        WHEN bd.license_type LIKE '%Automatique%' OR bd.license_type LIKE '%Manuelle%' THEN 'B'
        ELSE bd.license_type
    END,
    (CURRENT_DATE + (floor(random() * 180) + 1)::int)::date,
    (CURRENT_DATE + (floor(random() * 180) + 1 + bd.duration_days)::int)::date,
    bd.duration_days,
    bd.max_students,
    LEAST(bd.enrolled, bd.max_students - 1),
    bd.price,
    bd.deposit,
    CASE WHEN bd.enrolled < bd.max_students THEN true ELSE false END,
    'active'
FROM base_data bd;

-- ============================================
-- VERIFICATION QUERY (Run separately to check data)
-- ============================================
/*
SELECT 
    COUNT(*) as total_stages,
    COUNT(DISTINCT city) as unique_cities,
    license_type,
    is_available,
    AVG(price)::numeric(10,2) as avg_price
FROM (
    SELECT 
        s.*,
        ae.city
    FROM public.stages s
    JOIN public.auto_ecoles ae ON s.auto_ecole_id = ae.id
) sub
GROUP BY license_type, is_available;
*/

-- ============================================
-- SAMPLE DATA CHECK
-- ============================================
/*
SELECT 
    s.id,
    s.title,
    s.license_type,
    s.start_date,
    s.end_date,
    s.duration_days,
    s.max_students,
    s.enrolled_students,
    s.price,
    s.deposit_amount,
    s.is_available,
    ae.name as auto_ecole_name,
    ae.city
FROM public.stages s
JOIN public.auto_ecoles ae ON s.auto_ecole_id = ae.id
ORDER BY s.created_at DESC
LIMIT 20;
*/

-- ============================================
-- END OF SEED DATA
-- ============================================
