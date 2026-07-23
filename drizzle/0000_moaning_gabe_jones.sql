CREATE TYPE "public"."admin_notifications_channel" AS ENUM('inapp', 'email', 'both');--> statement-breakpoint
CREATE TYPE "public"."admin_notifications_target" AS ENUM('all', 'active_subscribers', 'new_subscribers', 'specific');--> statement-breakpoint
CREATE TYPE "public"."admin_notifications_type" AS ENUM('update', 'news', 'offer', 'reminder', 'other');--> statement-breakpoint
CREATE TYPE "public"."app_error_severity" AS ENUM('error', 'warning', 'info');--> statement-breakpoint
CREATE TYPE "public"."billing_history_period" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."billing_history_plan" AS ENUM('free', 'prime_plus', 'prime_pro');--> statement-breakpoint
CREATE TYPE "public"."billing_history_status" AS ENUM('paid', 'failed', 'refunded', 'pending');--> statement-breakpoint
CREATE TYPE "public"."broadcast_notifications_type" AS ENUM('update', 'news', 'offer', 'reminder', 'other');--> statement-breakpoint
CREATE TYPE "public"."coach_chat_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."community_challenges_type" AS ENUM('streak', 'sessions', 'cardio', 'weight', 'custom');--> statement-breakpoint
CREATE TYPE "public"."community_posts_type" AS ENUM('text', 'image', 'achievement', 'transformation', 'auto');--> statement-breakpoint
CREATE TYPE "public"."community_posts_visibility" AS ENUM('public', 'friends', 'private');--> statement-breakpoint
CREATE TYPE "public"."community_reactions_type" AS ENUM('like', 'cheer', 'fire');--> statement-breakpoint
CREATE TYPE "public"."community_report_status" AS ENUM('pending', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."community_stories_type" AS ENUM('streak', 'achievement', 'workout', 'progress');--> statement-breakpoint
CREATE TYPE "public"."gym_classes_day" AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');--> statement-breakpoint
CREATE TYPE "public"."gym_classes_intensity" AS ENUM('Beginner', 'Intermediate', 'Advanced');--> statement-breakpoint
CREATE TYPE "public"."meal_favorites_meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack', 'drink', 'coffee', 'protein_shake');--> statement-breakpoint
CREATE TYPE "public"."meal_log_items_confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."meal_logs_meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TYPE "public"."nutrition_insights_priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."nutrition_insights_type" AS ENUM('protein', 'hydration', 'calories', 'macros', 'recovery', 'general');--> statement-breakpoint
CREATE TYPE "public"."reward_history_rarity" AS ENUM('common', 'uncommon', 'rare', 'jackpot');--> statement-breakpoint
CREATE TYPE "public"."reward_probabilities_type" AS ENUM('premium_days', 'xp_bonus', 'badge', 'ai_boost', 'streak_protection', 'workout_unlock', 'ai_insights', 'upgrade');--> statement-breakpoint
CREATE TYPE "public"."reward_rarity" AS ENUM('common', 'uncommon', 'rare', 'jackpot');--> statement-breakpoint
CREATE TYPE "public"."reward_spins_status" AS ENUM('pending', 'spun', 'claimed');--> statement-breakpoint
CREATE TYPE "public"."social_notifications_type" AS ENUM('like', 'cheer', 'fire', 'comment', 'achievement', 'mention', 'follow', 'reply', 'message');--> statement-breakpoint
CREATE TYPE "public"."subscriptions_payment_provider" AS ENUM('myfatoorah', 'manual', 'free');--> statement-breakpoint
CREATE TYPE "public"."subscriptions_payment_status" AS ENUM('paid', 'pending', 'failed', 'refunded', 'free');--> statement-breakpoint
CREATE TYPE "public"."subscriptions_period" AS ENUM('monthly', 'yearly', 'lifetime', 'free_trial');--> statement-breakpoint
CREATE TYPE "public"."subscriptions_plan" AS ENUM('free', 'prime_plus', 'prime_pro');--> statement-breakpoint
CREATE TYPE "public"."subscriptions_status" AS ENUM('active', 'expired', 'cancelled', 'trialing', 'pending');--> statement-breakpoint
CREATE TYPE "public"."users_auth_provider" AS ENUM('manus', 'email', 'google');--> statement-breakpoint
CREATE TYPE "public"."users_gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."users_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "access_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(128) NOT NULL,
	"customerName" varchar(255),
	"customerEmail" varchar(320),
	"note" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"usedAt" timestamp,
	"orderId" integer,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_codes_code_unique" UNIQUE("code"),
	CONSTRAINT "access_codes_orderId_unique" UNIQUE("orderId")
);
--> statement-breakpoint
CREATE TABLE "admin_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"titleAr" varchar(255),
	"message" text NOT NULL,
	"messageAr" text,
	"imageUrl" varchar(512),
	"ctaText" varchar(128),
	"ctaTextAr" varchar(128),
	"ctaLink" varchar(512),
	"channel" "admin_notifications_channel" DEFAULT 'inapp' NOT NULL,
	"target" "admin_notifications_target" DEFAULT 'all' NOT NULL,
	"targetEmail" varchar(320),
	"type" "admin_notifications_type" DEFAULT 'other' NOT NULL,
	"sentBy" varchar(255),
	"recipientCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"phone" varchar(64),
	"email" varchar(320),
	"photoUrl" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_health_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"reportId" integer,
	"summaryEn" text NOT NULL,
	"summaryAr" text NOT NULL,
	"conditionsFound" text,
	"restrictions" text,
	"safeExercises" text,
	"warningExercises" text,
	"recoveryTips" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_error_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"severity" "app_error_severity" DEFAULT 'error' NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"url" text,
	"userId" integer,
	"userEmail" varchar(255),
	"resolved" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"plan" "billing_history_plan" NOT NULL,
	"period" "billing_history_period" NOT NULL,
	"amount" varchar(32) NOT NULL,
	"currency" varchar(8) DEFAULT 'KWD' NOT NULL,
	"status" "billing_history_status" NOT NULL,
	"invoiceId" varchar(255) NOT NULL,
	"paymentRef" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" varchar(512) NOT NULL,
	"body" text NOT NULL,
	"type" "broadcast_notifications_type" DEFAULT 'news' NOT NULL,
	"recipientCount" integer DEFAULT 0 NOT NULL,
	"sentBy" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completedAt" timestamp,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"challengeId" integer NOT NULL,
	"rewardId" integer NOT NULL,
	"weightOverride" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_chat_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"role" "coach_chat_role" NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_checkins" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"feeling" integer NOT NULL,
	"energy" integer NOT NULL,
	"sleep" integer NOT NULL,
	"aiResponse" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" varchar(32) NOT NULL,
	"content" text NOT NULL,
	"contentEn" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_memory" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"goalWeight" integer,
	"currentWeight" integer,
	"preferredLanguage" varchar(8) DEFAULT 'ar',
	"notes" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coach_memory_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "community_bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"postId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "community_bookmarks_pair_unique" UNIQUE("userId","postId")
);
--> statement-breakpoint
CREATE TABLE "community_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"titleAr" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"descriptionAr" text NOT NULL,
	"type" "community_challenges_type" DEFAULT 'sessions' NOT NULL,
	"targetValue" integer DEFAULT 7 NOT NULL,
	"xpReward" integer DEFAULT 100 NOT NULL,
	"startDate" varchar(10) NOT NULL,
	"endDate" varchar(10) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"participantsCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"postId" integer NOT NULL,
	"userId" integer NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" "community_posts_type" DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"contentEn" text,
	"imageUrl" text,
	"imageKey" text,
	"visibility" "community_posts_visibility" DEFAULT 'public' NOT NULL,
	"xpAwarded" integer DEFAULT 0 NOT NULL,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"commentsCount" integer DEFAULT 0 NOT NULL,
	"isTrending" boolean DEFAULT false NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"isHidden" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"postId" integer NOT NULL,
	"userId" integer NOT NULL,
	"type" "community_reactions_type" DEFAULT 'like' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_report_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"postId" integer NOT NULL,
	"reporterId" integer NOT NULL,
	"reason" varchar(255) NOT NULL,
	"status" "community_report_status" DEFAULT 'pending' NOT NULL,
	"adminNote" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "community_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" "community_stories_type" DEFAULT 'workout' NOT NULL,
	"content" text NOT NULL,
	"contentEn" text,
	"imageUrl" text,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_xp_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"event" varchar(64) NOT NULL,
	"points" integer NOT NULL,
	"refId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"deviceId" varchar(128) NOT NULL,
	"userAgent" text,
	"ipAddress" varchar(64),
	"revoked" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "direct_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"senderId" integer NOT NULL,
	"receiverId" integer NOT NULL,
	"content" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"exerciseId" varchar(128) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"exerciseId" varchar(100) NOT NULL,
	"imageUrl" text,
	"youtubeUrl" text,
	"nameEn" varchar(255),
	"nameAr" varchar(255),
	"sets" integer,
	"reps" integer,
	"restSec" integer,
	"notes" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_overrides_exerciseId_unique" UNIQUE("exerciseId")
);
--> statement-breakpoint
CREATE TABLE "gym_branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"gymId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"location" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gym_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"gymId" integer NOT NULL,
	"branchId" integer NOT NULL,
	"className" varchar(255) NOT NULL,
	"coach" varchar(255) NOT NULL,
	"day" "gym_classes_day" NOT NULL,
	"time" varchar(20) NOT NULL,
	"durationMin" integer DEFAULT 60 NOT NULL,
	"intensity" "gym_classes_intensity" DEFAULT 'Beginner' NOT NULL,
	"caloriesOverride" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gym_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"clientId" varchar(64) NOT NULL,
	"date" varchar(10) NOT NULL,
	"checkInTime" varchar(8) NOT NULL,
	"checkOutTime" varchar(8),
	"sessionType" varchar(64) NOT NULL,
	"exercises" text NOT NULL,
	"cardio" text,
	"aqua" text,
	"sauna" text,
	"mood" varchar(4),
	"energyLevel" integer,
	"notes" text,
	"bodyWeight" numeric(5, 2),
	"caloriesBurned" integer,
	"isActive" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gyms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"logoUrl" text,
	"brandColor" varchar(7) DEFAULT '#1B2E5E',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"fileUrl" varchar(512) NOT NULL,
	"fileKey" varchar(512) NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileType" varchar(50) NOT NULL,
	"reportType" varchar(100),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jackpot_winners" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"spinId" integer NOT NULL,
	"rewardId" integer NOT NULL,
	"rewardName" varchar(128) NOT NULL,
	"wonAt" timestamp DEFAULT now() NOT NULL,
	"notifiedAdmin" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "joined_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"classId" integer NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"caloriesBurned" integer DEFAULT 0 NOT NULL,
	"xpAwarded" integer DEFAULT 0 NOT NULL,
	"sessionId" integer
);
--> statement-breakpoint
CREATE TABLE "meal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"mealType" "meal_type" NOT NULL,
	"foodName" varchar(255) NOT NULL,
	"foodNameAr" varchar(255),
	"calories" integer DEFAULT 0 NOT NULL,
	"proteinG" double precision DEFAULT 0 NOT NULL,
	"carbsG" double precision DEFAULT 0 NOT NULL,
	"fatG" double precision DEFAULT 0 NOT NULL,
	"servingSize" varchar(64),
	"imageUrl" varchar(512),
	"addedByAI" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"nameAr" varchar(255),
	"calories" integer DEFAULT 0 NOT NULL,
	"proteinG" double precision DEFAULT 0 NOT NULL,
	"carbsG" double precision DEFAULT 0 NOT NULL,
	"fatG" double precision DEFAULT 0 NOT NULL,
	"mealType" "meal_favorites_meal_type" DEFAULT 'snack' NOT NULL,
	"servingSize" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_log_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"mealLogId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"nameAr" varchar(255),
	"estimatedGrams" double precision DEFAULT 100 NOT NULL,
	"portionDesc" varchar(255),
	"portionDescAr" varchar(255),
	"fdcId" integer,
	"confidence" "meal_log_items_confidence" DEFAULT 'high' NOT NULL,
	"calories" double precision DEFAULT 0 NOT NULL,
	"protein" double precision DEFAULT 0 NOT NULL,
	"carbs" double precision DEFAULT 0 NOT NULL,
	"fat" double precision DEFAULT 0 NOT NULL,
	"fiber" double precision DEFAULT 0 NOT NULL,
	"sugar" double precision DEFAULT 0 NOT NULL,
	"sodium" double precision DEFAULT 0 NOT NULL,
	"per100gCalories" double precision DEFAULT 0 NOT NULL,
	"per100gProtein" double precision DEFAULT 0 NOT NULL,
	"per100gCarbs" double precision DEFAULT 0 NOT NULL,
	"per100gFat" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"mealType" "meal_logs_meal_type" NOT NULL,
	"loggedAt" timestamp DEFAULT now() NOT NULL,
	"imageUrl" varchar(512),
	"notes" text,
	"insightAr" text,
	"insightEn" text,
	"totalCalories" double precision DEFAULT 0 NOT NULL,
	"totalProtein" double precision DEFAULT 0 NOT NULL,
	"totalCarbs" double precision DEFAULT 0 NOT NULL,
	"totalFat" double precision DEFAULT 0 NOT NULL,
	"totalFiber" double precision DEFAULT 0 NOT NULL,
	"totalSugar" double precision DEFAULT 0 NOT NULL,
	"totalSodium" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_reads" (
	"id" serial PRIMARY KEY NOT NULL,
	"notificationId" integer NOT NULL,
	"userId" integer NOT NULL,
	"readAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"reminderTime" varchar(5) DEFAULT '09:00' NOT NULL,
	"days" varchar(64) DEFAULT '1,2,3,4,5' NOT NULL,
	"language" varchar(8) DEFAULT 'ar' NOT NULL,
	"scheduleCronTaskUid" varchar(65),
	"communityNotifs" boolean DEFAULT true NOT NULL,
	"appUpdatesNotifs" boolean DEFAULT true NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "nutrition_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"calories" integer DEFAULT 2000 NOT NULL,
	"proteinG" integer DEFAULT 150 NOT NULL,
	"carbsG" integer DEFAULT 200 NOT NULL,
	"fatG" integer DEFAULT 65 NOT NULL,
	"waterMl" integer DEFAULT 2500 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nutrition_goals_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "nutrition_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" "nutrition_insights_type" NOT NULL,
	"content" text NOT NULL,
	"contentAr" text,
	"priority" "nutrition_insights_priority" DEFAULT 'medium' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personalized_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"analysisId" integer,
	"titleEn" varchar(255) NOT NULL,
	"titleAr" varchar(255) NOT NULL,
	"descriptionEn" text NOT NULL,
	"descriptionAr" text NOT NULL,
	"weeklyPlan" text NOT NULL,
	"cardioGuidance" text,
	"stretchingPlan" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_mentions" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentionedId" integer NOT NULL,
	"actorId" integer NOT NULL,
	"postId" integer NOT NULL,
	"commentId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" varchar(512) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"spinId" integer NOT NULL,
	"rewardId" integer NOT NULL,
	"rewardName" varchar(128) NOT NULL,
	"rarity" "reward_history_rarity" NOT NULL,
	"value" integer DEFAULT 0,
	"appliedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_probabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"nameAr" varchar(128) NOT NULL,
	"type" "reward_probabilities_type" NOT NULL,
	"rarity" "reward_rarity" NOT NULL,
	"weight" integer DEFAULT 100 NOT NULL,
	"value" integer DEFAULT 0,
	"icon" varchar(64) DEFAULT '🎁',
	"color" varchar(16) DEFAULT '#7BB8D4',
	"isEnabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_spins" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"challengeId" integer NOT NULL,
	"rewardId" integer,
	"status" "reward_spins_status" DEFAULT 'pending' NOT NULL,
	"spinToken" varchar(64) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"spunAt" timestamp,
	"claimedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "session_icon_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionType" varchar(100) NOT NULL,
	"iconUrl" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_icon_overrides_sessionType_unique" UNIQUE("sessionType")
);
--> statement-breakpoint
CREATE TABLE "site_appearance" (
	"id" serial PRIMARY KEY NOT NULL,
	"primaryColor" varchar(20) DEFAULT '#1B2E5E' NOT NULL,
	"accentColor" varchar(20) DEFAULT '#7BB8D4' NOT NULL,
	"bgColor" varchar(20) DEFAULT '#F0F4F8' NOT NULL,
	"textColor" varchar(20) DEFAULT '#1B2E5E' NOT NULL,
	"fontFamily" varchar(100) DEFAULT 'Inter' NOT NULL,
	"logoUrl" text,
	"bannerUrl" text,
	"footerText" text,
	"footerLinks" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"actorId" integer NOT NULL,
	"type" "social_notifications_type" NOT NULL,
	"postId" integer,
	"commentId" integer,
	"messageId" integer,
	"replyId" integer,
	"actorName" varchar(255),
	"actorAvatar" text,
	"message" text NOT NULL,
	"messageEn" text,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"plan" "subscriptions_plan" DEFAULT 'free' NOT NULL,
	"status" "subscriptions_status" DEFAULT 'active' NOT NULL,
	"period" "subscriptions_period" DEFAULT 'monthly' NOT NULL,
	"trialEndsAt" timestamp,
	"startsAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp,
	"invoiceId" varchar(255),
	"licenseKey" varchar(128),
	"email" varchar(320),
	"activationCodeId" integer,
	"paymentStatus" "subscriptions_payment_status" DEFAULT 'free' NOT NULL,
	"paymentProvider" "subscriptions_payment_provider" DEFAULT 'free' NOT NULL,
	"transactionId" varchar(255),
	"autoRenew" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "user_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"followerId" integer NOT NULL,
	"followingId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_follows_pair_unique" UNIQUE("followerId","followingId")
);
--> statement-breakpoint
CREATE TABLE "user_privacy_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"allowDMs" boolean DEFAULT true NOT NULL,
	"allowFollows" boolean DEFAULT true NOT NULL,
	"allowMentions" boolean DEFAULT true NOT NULL,
	"privateAccount" boolean DEFAULT false NOT NULL,
	"notifyLikes" boolean DEFAULT true NOT NULL,
	"notifyComments" boolean DEFAULT true NOT NULL,
	"notifyMentions" boolean DEFAULT true NOT NULL,
	"notifyFollows" boolean DEFAULT true NOT NULL,
	"notifyMessages" boolean DEFAULT true NOT NULL,
	"notifyReplies" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_privacy_settings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"fullName" varchar(255),
	"email" varchar(320),
	"passwordHash" varchar(255),
	"authProvider" "users_auth_provider" DEFAULT 'manus' NOT NULL,
	"loginMethod" varchar(64),
	"role" "users_role" DEFAULT 'user' NOT NULL,
	"avatarUrl" text,
	"resetToken" varchar(128),
	"resetTokenExpiresAt" timestamp,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"lastLoginAt" timestamp,
	"age" integer,
	"height" integer,
	"currentWeight" numeric(5, 2),
	"targetWeight" numeric(5, 2),
	"gender" "users_gender",
	"activeDeviceId" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	"isBanned" boolean DEFAULT false NOT NULL,
	"bannedAt" timestamp,
	"banReason" text,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "water_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"amountMl" integer DEFAULT 250 NOT NULL,
	"loggedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weight_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"weight" numeric(5, 2) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
