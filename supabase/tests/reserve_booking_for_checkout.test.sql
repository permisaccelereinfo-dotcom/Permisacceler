-- Behavioral test for public.reserve_booking_for_checkout (and the
-- enrolled_students sync trigger). Unlike the static contract check in
-- supabase/migrations/reserve_booking_for_checkout.test.ts, this executes the
-- function against a real Postgres.
--
-- Run with:  supabase test db
-- Requires the `pgtap` extension and that all migrations have been applied.

BEGIN;
SELECT plan(5);

-- Fixtures: two students + one auto-école owner.
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'student1@test.dev', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'student2@test.dev', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'owner@test.dev', '', now(), now());

INSERT INTO public.users (id, email, name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'student1@test.dev', 'Student One', 'student'),
  ('22222222-2222-2222-2222-222222222222', 'student2@test.dev', 'Student Two', 'student'),
  ('33333333-3333-3333-3333-333333333333', 'owner@test.dev', 'Owner', 'auto_ecole');

INSERT INTO public.auto_ecoles (id, user_id, name, address, city, postal_code, phone, email)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333',
        'Test AE', '1 rue', 'Paris', '75001', '0100000000', 'ae@test.dev');

INSERT INTO public.stages (id, auto_ecole_id, title, license_type, start_date, end_date, price, max_students, is_available, status)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Stage Test', 'B', current_date + 7, current_date + 14, 1000, 1, true, 'active');

-- 1. First reservation succeeds: total = stage price + exam support.
SELECT is(
  (SELECT total_price FROM public.reserve_booking_for_checkout(
     '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 65)),
  1065::numeric,
  'first reservation returns stage price + exam support'
);

-- 2. enrolled_students kept in sync by the trigger (1 active booking).
SELECT is(
  (SELECT enrolled_students FROM public.stages WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  1,
  'enrolled_students reflects the pending booking'
);

-- 3. Stage is now full (max_students = 1): a different student is rejected.
SELECT throws_ok(
  $$ SELECT public.reserve_booking_for_checkout('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 65) $$,
  'P0001',
  'Ce stage est complet.',
  'second student cannot reserve a full stage'
);

-- 4. The same student re-initiating checkout reuses their pending booking.
SELECT lives_ok(
  $$ SELECT public.reserve_booking_for_checkout('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 65) $$,
  'existing pending booking can be refreshed by the same user'
);

-- 5. A confirmed booking cannot be downgraded by a new checkout.
UPDATE public.bookings SET status = 'confirmed'
 WHERE user_id = '11111111-1111-1111-1111-111111111111'
   AND stage_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SELECT throws_ok(
  $$ SELECT public.reserve_booking_for_checkout('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 65) $$,
  'P0001',
  'Vous avez déjà une réservation confirmée pour ce stage.',
  'a confirmed booking is not downgraded by a new checkout'
);

SELECT * FROM finish();
ROLLBACK;
