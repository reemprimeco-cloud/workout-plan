-- Prime Fit — staging bootstrap: Realtime + seed + RLS hardening + verify.
-- Paste this whole file into the Supabase SQL Editor (project dccxerplokwvecdwhytr) and Run.
-- Idempotent: safe to run more than once.

-- ═══ 1. Realtime publication ══════════════════════════════════════════════
-- Adds the two tables the client subscribes to. Under the deny-all RLS applied
-- in section 3 the browser (anon) receives no live events and the app uses its
-- automatic polling fallback. To enable live Realtime later, add an anon SELECT
-- policy to a table (accepting that it becomes publicly readable via the API).
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE social_notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══ 2. Seed demo data ════════════════════════════════════════════════════
-- Test accounts (login at /auth):
--   admin@primefit.test / Admin123!  · trainer@primefit.test / Trainer123!
--   premium@primefit.test / Premium123!  · free@primefit.test / Free123!
INSERT INTO users ("openId", email, "fullName", name, "passwordHash", "authProvider", "loginMethod", "emailVerified", role) VALUES
  ('email_seed_admin',   'admin@primefit.test',   'Prime Admin',   'Prime Admin',   '$2b$12$7en08kWkN5qIOzksoctLe.9pDEqmsK1Vt4ZMeJ6MeK9ajNikoHSXG', 'email', 'email', true, 'admin'),
  ('email_seed_trainer', 'trainer@primefit.test', 'Prime Trainer', 'Prime Trainer', '$2b$12$quZ84ondMYs/21.gAwaAAePcMFkDBReJ.jpuyxhDACSSkWC3.Dxam', 'email', 'email', true, 'admin'),
  ('email_seed_premium', 'premium@primefit.test', 'Reem Premium',  'Reem Premium',  '$2b$12$AqWMart398NCGBRt40q//e9EK60c5j6343bDi8f9nj.OekaqPrvAe', 'email', 'email', true, 'user'),
  ('email_seed_free',    'free@primefit.test',    'Noura Free',    'Noura Free',    '$2b$12$cFw2M29SlsGWSmysak.NZe4jPnb5IZp2HykejxGBLeUm0p7AhJrxe', 'email', 'email', true, 'user')
ON CONFLICT ("openId") DO NOTHING;

INSERT INTO subscriptions ("userId", plan, status, period, "paymentStatus", "paymentProvider", "startsAt", "expiresAt", email) VALUES
  ('email_seed_admin',   'prime_pro', 'active', 'yearly',     'free', 'free',       now(), NULL,                 'admin@primefit.test'),
  ('email_seed_trainer', 'prime_pro', 'active', 'yearly',     'free', 'free',       now(), NULL,                 'trainer@primefit.test'),
  ('email_seed_premium', 'prime_pro', 'active', 'yearly',     'paid', 'myfatoorah', now(), now() + interval '365 days', 'premium@primefit.test'),
  ('email_seed_free',    'free',      'active', 'free_trial', 'free', 'free',       now(), NULL,                 'free@primefit.test')
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO nutrition_goals ("userId", calories, "proteinG", "carbsG", "fatG", "waterMl")
SELECT id, 2000, 150, 200, 65, 2500 FROM users WHERE "openId" LIKE 'email_seed_%'
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO notification_settings ("userId", enabled, "reminderTime", days, language)
SELECT id, false, '18:00', '1,2,3,4,5', 'ar' FROM users WHERE "openId" LIKE 'email_seed_%'
ON CONFLICT ("userId") DO NOTHING;

WITH g AS (
  INSERT INTO gyms (name, "brandColor")
  SELECT 'Prime Fitness', '#1B2E5E' WHERE NOT EXISTS (SELECT 1 FROM gyms)
  RETURNING id
), b AS (
  INSERT INTO gym_branches ("gymId", name, location)
  SELECT id, 'Main Branch', 'Kuwait City' FROM g
  RETURNING id, "gymId"
)
INSERT INTO gym_classes ("gymId", "branchId", "className", coach, day, time, "durationMin", intensity)
SELECT b."gymId", b.id, x.cn, x.co, x.d::gym_classes_day, x.t, x.dm, x.i::gym_classes_intensity
FROM b, (VALUES
  ('Lower Body Blast', 'Coach Noura', 'Monday',    '07:00 PM', 45, 'Intermediate'),
  ('Aqua Fitness',     'Coach Sara',  'Wednesday', '08:30 PM', 40, 'Beginner')
) AS x(cn, co, d, t, dm, i);

INSERT INTO community_challenges (title, "titleAr", description, "descriptionAr", type, "targetValue", "xpReward", "startDate", "endDate", "isActive")
SELECT '30-Day Consistency', 'تحدي ٣٠ يوم', 'Complete 20 workouts in 30 days.', 'أنجزي ٢٠ تمرين خلال ٣٠ يوم.',
       'sessions', 20, 300, to_char(now(),'YYYY-MM-DD'), to_char(now() + interval '30 days','YYYY-MM-DD'), true
WHERE NOT EXISTS (SELECT 1 FROM community_challenges);

INSERT INTO community_posts ("userId", type, content, "contentEn", visibility, "xpAwarded", "likesCount")
SELECT * FROM (
  SELECT (SELECT id FROM users WHERE "openId"='email_seed_premium'), 'achievement'::community_posts_type, 'خلصت أول تحدي! 🔥', 'Finished my first challenge!', 'public'::community_posts_visibility, 50, 3
  UNION ALL
  SELECT (SELECT id FROM users WHERE "openId"='email_seed_free'), 'text'::community_posts_type, 'بديت رحلتي اليوم 💪', 'Started my journey today', 'public'::community_posts_visibility, 20, 0
) v
WHERE NOT EXISTS (SELECT 1 FROM community_posts);

INSERT INTO social_notifications ("userId", "actorId", type, message, "messageEn", "isRead")
SELECT (SELECT id FROM users WHERE "openId"='email_seed_premium'),
       (SELECT id FROM users WHERE "openId"='email_seed_free'),
       'like', 'أعجب بمنشورك', 'liked your post', false
WHERE NOT EXISTS (SELECT 1 FROM social_notifications);

INSERT INTO reward_probabilities (name, "nameAr", type, rarity, weight, value)
SELECT * FROM (VALUES
  ('50 XP Bonus',        '٥٠ نقطة',              'xp_bonus'::reward_probabilities_type,          'common'::reward_rarity,   100, 50),
  ('3 Premium Days',     '٣ أيام بريميوم',       'premium_days'::reward_probabilities_type,      'uncommon'::reward_rarity, 40,  3),
  ('Streak Shield',      'درع السلسلة',          'streak_protection'::reward_probabilities_type, 'rare'::reward_rarity,     10,  1),
  ('Lifetime Prime Fit', 'برايم فيت مدى الحياة', 'upgrade'::reward_probabilities_type,           'jackpot'::reward_rarity,  1,   1)
) AS v(name, namear, type, rarity, weight, value)
WHERE NOT EXISTS (SELECT 1 FROM reward_probabilities);

INSERT INTO site_appearance DEFAULT VALUES;

INSERT INTO exercise_overrides ("exerciseId", "nameEn", "nameAr", sets, reps, "restSec") VALUES
  ('squat',    'Barbell Squat', 'سكوات بار', 4, 12, 90),
  ('deadlift', 'Deadlift',      'ديدليفت',   4, 10, 120)
ON CONFLICT ("exerciseId") DO NOTHING;

-- ═══ 3. Security hardening: enable RLS (deny-all) on every public table ════
-- The app reads/writes via the service-role key (server-side), which BYPASSES
-- RLS. Enabling RLS with no policies blocks the public anon key from touching
-- any table via the auto-generated API. This resolves the advisor finding
-- "rls_disabled_in_public".
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;

-- ═══ 4. Verify ════════════════════════════════════════════════════════════
SELECT 'users' t, count(*) n FROM users
UNION ALL SELECT 'subscriptions', count(*) FROM subscriptions
UNION ALL SELECT 'nutrition_goals', count(*) FROM nutrition_goals
UNION ALL SELECT 'notification_settings', count(*) FROM notification_settings
UNION ALL SELECT 'gyms', count(*) FROM gyms
UNION ALL SELECT 'gym_branches', count(*) FROM gym_branches
UNION ALL SELECT 'gym_classes', count(*) FROM gym_classes
UNION ALL SELECT 'community_challenges', count(*) FROM community_challenges
UNION ALL SELECT 'community_posts', count(*) FROM community_posts
UNION ALL SELECT 'social_notifications', count(*) FROM social_notifications
UNION ALL SELECT 'reward_probabilities', count(*) FROM reward_probabilities
UNION ALL SELECT 'site_appearance', count(*) FROM site_appearance
UNION ALL SELECT 'exercise_overrides', count(*) FROM exercise_overrides
ORDER BY t;

-- RLS coverage (expect rls_enabled = 55, rls_disabled = 0):
SELECT
  count(*) FILTER (WHERE rowsecurity)     AS rls_enabled,
  count(*) FILTER (WHERE NOT rowsecurity) AS rls_disabled
FROM pg_tables WHERE schemaname = 'public';
