-- Account deletion left orphans in every table keyed by a user.
--
-- `standaloneAuth.deleteMyAccount` deletes the users row, and its comment says
-- it "relies on the same FK cascade behavior" as the admin delete — but the
-- schema declared no foreign keys at all, so nothing cascaded. Deleting an
-- account removed the login and left that person's workouts, meals, chat
-- history, health reports and notifications behind, keyed to an id that no
-- longer resolves. App Review Guideline 5.1.1(v) requires deletion to delete.
--
-- Two key shapes, because the schema uses both: most tables carry an integer
-- userId referencing users.id, while subscriptions and billing_history carry a
-- varchar userId holding the user's openId.
--
-- Existing orphans are removed first. ADD CONSTRAINT validates existing rows
-- and would fail outright if any row pointed at a deleted user — which, given
-- deletion has never cascaded, is likely.

BEGIN;

-- ── Remove pre-existing orphans ──────────────────────────────────────────
DELETE FROM "push_subscriptions"    WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "notification_settings" WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "coach_chat_history"    WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "coach_checkins"        WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "coach_insights"        WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "coach_memory"          WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "community_posts"       WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "community_reactions"   WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "community_comments"    WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "community_stories"     WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "challenge_participants" WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "social_notifications"  WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "user_privacy_settings" WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "community_xp_log"      WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "reward_spins"          WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "reward_history"        WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "jackpot_winners"       WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "nutrition_goals"       WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "meal_entries"          WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "water_logs"            WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "nutrition_insights"    WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "meal_logs"             WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "health_reports"        WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "ai_health_analysis"    WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "personalized_programs" WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "gym_sessions"          WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "weight_logs"           WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "notification_reads"    WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "device_sessions"       WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "meal_favorites"        WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "community_bookmarks"   WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "exercise_favorites"    WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "joined_classes"        WHERE "userId" NOT IN (SELECT "id" FROM "users");
DELETE FROM "app_error_logs"        WHERE "userId" NOT IN (SELECT "id" FROM "users");

DELETE FROM "subscriptions"    WHERE "userId" NOT IN (SELECT "openId" FROM "users");
DELETE FROM "billing_history"  WHERE "userId" NOT IN (SELECT "openId" FROM "users");

DELETE FROM "user_follows"
  WHERE "followerId"  NOT IN (SELECT "id" FROM "users")
     OR "followingId" NOT IN (SELECT "id" FROM "users");

-- ── Cascade on users.id ──────────────────────────────────────────────────
ALTER TABLE "push_subscriptions"     ADD CONSTRAINT "push_subscriptions_userId_fk"     FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "notification_settings"  ADD CONSTRAINT "notification_settings_userId_fk"  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "coach_chat_history"     ADD CONSTRAINT "coach_chat_history_userId_fk"     FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "coach_checkins"         ADD CONSTRAINT "coach_checkins_userId_fk"         FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "coach_insights"         ADD CONSTRAINT "coach_insights_userId_fk"         FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "coach_memory"           ADD CONSTRAINT "coach_memory_userId_fk"           FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "community_posts"        ADD CONSTRAINT "community_posts_userId_fk"        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "community_reactions"    ADD CONSTRAINT "community_reactions_userId_fk"    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "community_comments"     ADD CONSTRAINT "community_comments_userId_fk"     FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "community_stories"      ADD CONSTRAINT "community_stories_userId_fk"      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_userId_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "social_notifications"   ADD CONSTRAINT "social_notifications_userId_fk"   FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_privacy_settings"  ADD CONSTRAINT "user_privacy_settings_userId_fk"  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "community_xp_log"       ADD CONSTRAINT "community_xp_log_userId_fk"       FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "reward_spins"           ADD CONSTRAINT "reward_spins_userId_fk"           FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "reward_history"         ADD CONSTRAINT "reward_history_userId_fk"         FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "jackpot_winners"        ADD CONSTRAINT "jackpot_winners_userId_fk"        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "nutrition_goals"        ADD CONSTRAINT "nutrition_goals_userId_fk"        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "meal_entries"           ADD CONSTRAINT "meal_entries_userId_fk"           FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "water_logs"             ADD CONSTRAINT "water_logs_userId_fk"             FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "nutrition_insights"     ADD CONSTRAINT "nutrition_insights_userId_fk"     FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "meal_logs"              ADD CONSTRAINT "meal_logs_userId_fk"              FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "health_reports"         ADD CONSTRAINT "health_reports_userId_fk"         FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "ai_health_analysis"     ADD CONSTRAINT "ai_health_analysis_userId_fk"     FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "personalized_programs"  ADD CONSTRAINT "personalized_programs_userId_fk"  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "gym_sessions"           ADD CONSTRAINT "gym_sessions_userId_fk"           FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "weight_logs"            ADD CONSTRAINT "weight_logs_userId_fk"            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "notification_reads"     ADD CONSTRAINT "notification_reads_userId_fk"     FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "device_sessions"        ADD CONSTRAINT "device_sessions_userId_fk"        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "meal_favorites"         ADD CONSTRAINT "meal_favorites_userId_fk"         FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "community_bookmarks"    ADD CONSTRAINT "community_bookmarks_userId_fk"    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "exercise_favorites"     ADD CONSTRAINT "exercise_favorites_userId_fk"     FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "joined_classes"         ADD CONSTRAINT "joined_classes_userId_fk"         FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "app_error_logs"         ADD CONSTRAINT "app_error_logs_userId_fk"         FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- ── Cascade on users.openId ──────────────────────────────────────────────
-- These two hold the openId string rather than the numeric id. users.openId
-- is UNIQUE, so it is a valid foreign-key target.
ALTER TABLE "subscriptions"   ADD CONSTRAINT "subscriptions_userId_fk"   FOREIGN KEY ("userId") REFERENCES "users"("openId") ON DELETE CASCADE;
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_userId_fk" FOREIGN KEY ("userId") REFERENCES "users"("openId") ON DELETE CASCADE;

-- ── Follows point at users twice ─────────────────────────────────────────
-- Deleting an account has to remove both the rows recording who they followed
-- and the rows recording who followed them.
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followerId_fk"  FOREIGN KEY ("followerId")  REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followingId_fk" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE;

COMMIT;
