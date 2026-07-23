CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
CREATE TABLE `access_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(128) NOT NULL,
	`customerName` varchar(255),
	`customerEmail` varchar(320),
	`note` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `access_codes_code_unique` UNIQUE(`code`)
);
CREATE TABLE `notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`reminderTime` varchar(5) NOT NULL DEFAULT '09:00',
	`days` varchar(64) NOT NULL DEFAULT '1,2,3,4,5',
	`language` varchar(8) NOT NULL DEFAULT 'ar',
	`scheduleCronTaskUid` varchar(65),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` varchar(512) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `coach_chat_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_chat_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_checkins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`feeling` int NOT NULL,
	`energy` int NOT NULL,
	`sleep` int NOT NULL,
	`aiResponse` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_checkins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(32) NOT NULL,
	`content` text NOT NULL,
	`contentEn` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_memory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`goalWeight` int,
	`currentWeight` int,
	`preferredLanguage` varchar(8) DEFAULT 'ar',
	`notes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coach_memory_id` PRIMARY KEY(`id`),
	CONSTRAINT `coach_memory_userId_unique` UNIQUE(`userId`)
);
CREATE TABLE `challenge_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`userId` int NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenge_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`descriptionAr` text NOT NULL,
	`type` enum('streak','sessions','cardio','weight','custom') NOT NULL DEFAULT 'sessions',
	`targetValue` int NOT NULL DEFAULT 7,
	`xpReward` int NOT NULL DEFAULT 100,
	`startDate` varchar(10) NOT NULL,
	`endDate` varchar(10) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`participantsCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('text','image','achievement','transformation','auto') NOT NULL DEFAULT 'text',
	`content` text NOT NULL,
	`contentEn` text,
	`imageUrl` text,
	`imageKey` text,
	`visibility` enum('public','friends','private') NOT NULL DEFAULT 'public',
	`xpAwarded` int NOT NULL DEFAULT 0,
	`likesCount` int NOT NULL DEFAULT 0,
	`commentsCount` int NOT NULL DEFAULT 0,
	`isTrending` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('like','cheer','fire') NOT NULL DEFAULT 'like',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('streak','achievement','workout','progress') NOT NULL DEFAULT 'workout',
	`content` text NOT NULL,
	`contentEn` text,
	`imageUrl` text,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_stories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_xp_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`event` varchar(64) NOT NULL,
	`points` int NOT NULL,
	`refId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_xp_log_id` PRIMARY KEY(`id`)
);
CREATE TABLE `social_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actorId` int NOT NULL,
	`type` enum('like','cheer','fire','comment','achievement') NOT NULL,
	`postId` int,
	`message` text NOT NULL,
	`messageEn` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_notifications_id` PRIMARY KEY(`id`)
);
ALTER TABLE `access_codes` ADD `orderId` int;--> statement-breakpoint
ALTER TABLE `access_codes` ADD CONSTRAINT `access_codes_orderId_unique` UNIQUE(`orderId`);CREATE TABLE `admin_profile` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`phone` varchar(64),
	`email` varchar(320),
	`photoUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_profile_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcast_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject` varchar(512) NOT NULL,
	`body` text NOT NULL,
	`type` enum('update','news','offer','reminder','other') NOT NULL DEFAULT 'news',
	`recipientCount` int NOT NULL DEFAULT 0,
	`sentBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `broadcast_notifications_id` PRIMARY KEY(`id`)
);
ALTER TABLE `access_codes` ADD `expiresAt` timestamp;CREATE TABLE `billing_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`plan` enum('free','prime_plus','prime_pro') NOT NULL,
	`period` enum('monthly','yearly') NOT NULL,
	`amount` varchar(32) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'KWD',
	`status` enum('paid','failed','refunded','pending') NOT NULL,
	`invoiceId` varchar(255) NOT NULL,
	`paymentRef` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billing_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`plan` enum('free','prime_plus','prime_pro') NOT NULL DEFAULT 'free',
	`status` enum('active','expired','cancelled','trialing','pending') NOT NULL DEFAULT 'active',
	`period` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`trialEndsAt` timestamp,
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`invoiceId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`)
);
ALTER TABLE `subscriptions` ADD `licenseKey` varchar(128);ALTER TABLE `users` ADD `avatarUrl` text;ALTER TABLE `notification_settings` ADD `communityNotifs` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `notification_settings` ADD `appUpdatesNotifs` boolean DEFAULT true NOT NULL;CREATE TABLE `post_mentions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mentionedId` int NOT NULL,
	`actorId` int NOT NULL,
	`postId` int NOT NULL,
	`commentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_mentions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `social_notifications` MODIFY COLUMN `type` enum('like','cheer','fire','comment','achievement','mention') NOT NULL;CREATE TABLE `challenge_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`rewardId` int NOT NULL,
	`weightOverride` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenge_rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jackpot_winners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`spinId` int NOT NULL,
	`rewardId` int NOT NULL,
	`rewardName` varchar(128) NOT NULL,
	`wonAt` timestamp NOT NULL DEFAULT (now()),
	`notifiedAdmin` boolean NOT NULL DEFAULT false,
	CONSTRAINT `jackpot_winners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reward_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`spinId` int NOT NULL,
	`rewardId` int NOT NULL,
	`rewardName` varchar(128) NOT NULL,
	`rarity` enum('common','uncommon','rare','jackpot') NOT NULL,
	`value` int DEFAULT 0,
	`appliedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reward_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reward_probabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`nameAr` varchar(128) NOT NULL,
	`type` enum('premium_days','xp_bonus','badge','ai_boost','streak_protection','workout_unlock','ai_insights','upgrade') NOT NULL,
	`rarity` enum('common','uncommon','rare','jackpot') NOT NULL,
	`weight` int NOT NULL DEFAULT 100,
	`value` int DEFAULT 0,
	`icon` varchar(64) DEFAULT '🎁',
	`color` varchar(16) DEFAULT '#7BB8D4',
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reward_probabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reward_spins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` int NOT NULL,
	`rewardId` int,
	`status` enum('pending','spun','claimed') NOT NULL DEFAULT 'pending',
	`spinToken` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`spunAt` timestamp,
	`claimedAt` timestamp,
	CONSTRAINT `reward_spins_id` PRIMARY KEY(`id`)
);
CREATE TABLE `meal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`mealType` enum('breakfast','lunch','dinner','snack') NOT NULL,
	`foodName` varchar(255) NOT NULL,
	`foodNameAr` varchar(255),
	`calories` int NOT NULL DEFAULT 0,
	`proteinG` double NOT NULL DEFAULT 0,
	`carbsG` double NOT NULL DEFAULT 0,
	`fatG` double NOT NULL DEFAULT 0,
	`servingSize` varchar(64),
	`imageUrl` varchar(512),
	`addedByAI` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nutrition_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`calories` int NOT NULL DEFAULT 2000,
	`proteinG` int NOT NULL DEFAULT 150,
	`carbsG` int NOT NULL DEFAULT 200,
	`fatG` int NOT NULL DEFAULT 65,
	`waterMl` int NOT NULL DEFAULT 2500,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nutrition_goals_id` PRIMARY KEY(`id`),
	CONSTRAINT `nutrition_goals_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `nutrition_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('protein','hydration','calories','macros','recovery','general') NOT NULL,
	`content` text NOT NULL,
	`contentAr` text,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nutrition_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `water_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`amountMl` int NOT NULL DEFAULT 250,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `water_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `meal_log_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mealLogId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`estimatedGrams` double NOT NULL DEFAULT 100,
	`portionDesc` varchar(255),
	`portionDescAr` varchar(255),
	`fdcId` int,
	`confidence` enum('high','medium','low') NOT NULL DEFAULT 'high',
	`calories` double NOT NULL DEFAULT 0,
	`protein` double NOT NULL DEFAULT 0,
	`carbs` double NOT NULL DEFAULT 0,
	`fat` double NOT NULL DEFAULT 0,
	`fiber` double NOT NULL DEFAULT 0,
	`sugar` double NOT NULL DEFAULT 0,
	`sodium` double NOT NULL DEFAULT 0,
	`per100gCalories` double NOT NULL DEFAULT 0,
	`per100gProtein` double NOT NULL DEFAULT 0,
	`per100gCarbs` double NOT NULL DEFAULT 0,
	`per100gFat` double NOT NULL DEFAULT 0,
	CONSTRAINT `meal_log_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mealType` enum('breakfast','lunch','dinner','snack') NOT NULL,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	`imageUrl` varchar(512),
	`notes` text,
	`insightAr` text,
	`insightEn` text,
	`totalCalories` double NOT NULL DEFAULT 0,
	`totalProtein` double NOT NULL DEFAULT 0,
	`totalCarbs` double NOT NULL DEFAULT 0,
	`totalFat` double NOT NULL DEFAULT 0,
	`totalFiber` double NOT NULL DEFAULT 0,
	`totalSugar` double NOT NULL DEFAULT 0,
	`totalSodium` double NOT NULL DEFAULT 0,
	CONSTRAINT `meal_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `ai_health_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportId` int,
	`summaryEn` text NOT NULL,
	`summaryAr` text NOT NULL,
	`conditionsFound` text,
	`restrictions` text,
	`safeExercises` text,
	`warningExercises` text,
	`recoveryTips` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_health_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileUrl` varchar(512) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`reportType` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `health_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personalized_programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`analysisId` int,
	`titleEn` varchar(255) NOT NULL,
	`titleAr` varchar(255) NOT NULL,
	`descriptionEn` text NOT NULL,
	`descriptionAr` text NOT NULL,
	`weeklyPlan` text NOT NULL,
	`cardioGuidance` text,
	`stretchingPlan` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `personalized_programs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `fitness_profile` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255),
	`currentWeight` double,
	`targetWeight` double,
	`startWeight` double,
	`age` int,
	`height` double,
	`bmi` double,
	`gender` varchar(16),
	`startDate` varchar(10),
	`avatarUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fitness_profile_id` PRIMARY KEY(`id`),
	CONSTRAINT `fitness_profile_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `gym_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`localId` varchar(64) NOT NULL,
	`date` varchar(10) NOT NULL,
	`checkInTime` varchar(8) NOT NULL,
	`checkOutTime` varchar(8),
	`sessionType` varchar(64) NOT NULL,
	`mood` varchar(8),
	`energyLevel` int,
	`notes` text,
	`bodyWeight` double,
	`payload` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gym_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weight_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`weight` double NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weight_log_id` PRIMARY KEY(`id`)
);
CREATE TABLE `in_app_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`imageUrl` varchar(512),
	`ctaText` varchar(128),
	`ctaLink` varchar(512),
	`targeting` enum('all','specific','active_subscribers','new_subscribers') NOT NULL DEFAULT 'all',
	`targetUserId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `in_app_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` int NOT NULL,
	`userId` int NOT NULL,
	`isRead` boolean NOT NULL DEFAULT true,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_reads_id` PRIMARY KEY(`id`)
);
CREATE TABLE `app_announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titleAr` varchar(200) NOT NULL,
	`titleEn` varchar(200) NOT NULL,
	`bodyAr` text NOT NULL,
	`bodyEn` text NOT NULL,
	`emoji` varchar(8) NOT NULL DEFAULT '📢',
	`ctaLabelAr` varchar(100),
	`ctaLabelEn` varchar(100),
	`ctaUrl` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_announcements_id` PRIMARY KEY(`id`)
);
DROP TABLE `app_announcements`;--> statement-breakpoint
DROP TABLE `fitness_profile`;--> statement-breakpoint
DROP TABLE `gym_sessions`;--> statement-breakpoint
DROP TABLE `in_app_notifications`;--> statement-breakpoint
DROP TABLE `notification_reads`;--> statement-breakpoint
DROP TABLE `weight_log`;ALTER TABLE `subscriptions` MODIFY COLUMN `period` enum('monthly','yearly','lifetime') NOT NULL DEFAULT 'monthly';ALTER TABLE `subscriptions` MODIFY COLUMN `period` enum('monthly','yearly','lifetime','free_trial') NOT NULL DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `activationCodeId` int;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `paymentStatus` enum('paid','pending','failed','refunded','free') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `paymentProvider` enum('myfatoorah','manual','free') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `transactionId` varchar(255);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `autoRenew` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `fullName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `authProvider` enum('manus','email','google') DEFAULT 'manus' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastLoginAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);ALTER TABLE `users` ADD `age` int;--> statement-breakpoint
ALTER TABLE `users` ADD `height` int;--> statement-breakpoint
ALTER TABLE `users` ADD `currentWeight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `users` ADD `targetWeight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('male','female');CREATE TABLE `gym_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` varchar(64) NOT NULL,
	`date` varchar(10) NOT NULL,
	`checkInTime` varchar(8) NOT NULL,
	`checkOutTime` varchar(8),
	`sessionType` varchar(64) NOT NULL,
	`exercises` text NOT NULL,
	`cardio` text,
	`aqua` text,
	`sauna` text,
	`mood` varchar(4),
	`energyLevel` int,
	`notes` text,
	`bodyWeight` decimal(5,2),
	`caloriesBurned` int,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gym_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weight_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`weight` decimal(5,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weight_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `device_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceId` varchar(128) NOT NULL,
	`userAgent` text,
	`ipAddress` varchar(64),
	`revoked` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `device_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `activeDeviceId` varchar(128);CREATE TABLE `admin_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`message` text NOT NULL,
	`messageAr` text,
	`imageUrl` varchar(512),
	`ctaText` varchar(128),
	`ctaTextAr` varchar(128),
	`ctaLink` varchar(512),
	`channel` enum('inapp','email','both') NOT NULL DEFAULT 'inapp',
	`target` enum('all','active_subscribers','new_subscribers','specific') NOT NULL DEFAULT 'all',
	`targetEmail` varchar(320),
	`type` enum('update','news','offer','reminder','other') NOT NULL DEFAULT 'other',
	`sentBy` varchar(255),
	`recipientCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` int NOT NULL,
	`userId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_reads_id` PRIMARY KEY(`id`)
);
CREATE TABLE `meal_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`calories` int NOT NULL DEFAULT 0,
	`proteinG` double NOT NULL DEFAULT 0,
	`carbsG` double NOT NULL DEFAULT 0,
	`fatG` double NOT NULL DEFAULT 0,
	`mealType` enum('breakfast','lunch','dinner','snack','drink','coffee','protein_shake') NOT NULL DEFAULT 'snack',
	`servingSize` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meal_favorites_id` PRIMARY KEY(`id`)
);
CREATE TABLE `community_bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_bookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `direct_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `direct_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_follows_id` PRIMARY KEY(`id`)
);
CREATE TABLE `community_report_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`reporterId` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`status` enum('pending','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `community_report_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `community_posts` ADD `isPinned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `community_posts` ADD `isHidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isBanned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `bannedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `banReason` text;CREATE TABLE `user_privacy_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`allowDMs` boolean NOT NULL DEFAULT true,
	`allowFollows` boolean NOT NULL DEFAULT true,
	`allowMentions` boolean NOT NULL DEFAULT true,
	`privateAccount` boolean NOT NULL DEFAULT false,
	`notifyLikes` boolean NOT NULL DEFAULT true,
	`notifyComments` boolean NOT NULL DEFAULT true,
	`notifyMentions` boolean NOT NULL DEFAULT true,
	`notifyFollows` boolean NOT NULL DEFAULT true,
	`notifyMessages` boolean NOT NULL DEFAULT true,
	`notifyReplies` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_privacy_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_privacy_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `social_notifications` MODIFY COLUMN `type` enum('like','cheer','fire','comment','achievement','mention','follow','reply','message') NOT NULL;--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `commentId` int;--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `messageId` int;--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `replyId` int;--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `actorName` varchar(255);--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `actorAvatar` text;CREATE TABLE `exercise_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercise_favorites_id` PRIMARY KEY(`id`)
);
CREATE TABLE `gym_branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gymId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`location` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gym_branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gym_classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gymId` int NOT NULL,
	`branchId` int NOT NULL,
	`className` varchar(255) NOT NULL,
	`coach` varchar(255) NOT NULL,
	`day` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
	`time` varchar(20) NOT NULL,
	`durationMin` int NOT NULL DEFAULT 60,
	`intensity` enum('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
	`caloriesOverride` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gym_classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gyms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`logoUrl` text,
	`brandColor` varchar(7) DEFAULT '#1B2E5E',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gyms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `joined_classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`caloriesBurned` int NOT NULL DEFAULT 0,
	`xpAwarded` int NOT NULL DEFAULT 0,
	CONSTRAINT `joined_classes_id` PRIMARY KEY(`id`)
);
ALTER TABLE `joined_classes` ADD `sessionId` int;CREATE TABLE `admin_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`message` text NOT NULL,
	`messageAr` text,
	`imageUrl` varchar(512),
	`ctaText` varchar(128),
	`ctaTextAr` varchar(128),
	`ctaLink` varchar(512),
	`channel` enum('inapp','email','both') NOT NULL DEFAULT 'inapp',
	`target` enum('all','active_subscribers','new_subscribers','specific') NOT NULL DEFAULT 'all',
	`targetEmail` varchar(320),
	`type` enum('update','news','offer','reminder','other') NOT NULL DEFAULT 'other',
	`sentBy` varchar(255),
	`recipientCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `community_bookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_report_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`reporterId` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`status` enum('pending','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `community_report_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `device_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceId` varchar(128) NOT NULL,
	`userAgent` text,
	`ipAddress` varchar(64),
	`revoked` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `device_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `direct_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `direct_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercise_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercise_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gym_branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gymId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`location` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gym_branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gym_classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gymId` int NOT NULL,
	`branchId` int NOT NULL,
	`className` varchar(255) NOT NULL,
	`coach` varchar(255) NOT NULL,
	`day` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
	`time` varchar(20) NOT NULL,
	`durationMin` int NOT NULL DEFAULT 60,
	`intensity` enum('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
	`caloriesOverride` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gym_classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gym_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` varchar(64) NOT NULL,
	`date` varchar(10) NOT NULL,
	`checkInTime` varchar(8) NOT NULL,
	`checkOutTime` varchar(8),
	`sessionType` varchar(64) NOT NULL,
	`exercises` text NOT NULL,
	`cardio` text,
	`aqua` text,
	`sauna` text,
	`mood` varchar(4),
	`energyLevel` int,
	`notes` text,
	`bodyWeight` decimal(5,2),
	`caloriesBurned` int,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gym_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gyms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`logoUrl` text,
	`brandColor` varchar(7) DEFAULT '#1B2E5E',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gyms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `joined_classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`caloriesBurned` int NOT NULL DEFAULT 0,
	`xpAwarded` int NOT NULL DEFAULT 0,
	`sessionId` int,
	CONSTRAINT `joined_classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`calories` int NOT NULL DEFAULT 0,
	`proteinG` double NOT NULL DEFAULT 0,
	`carbsG` double NOT NULL DEFAULT 0,
	`fatG` double NOT NULL DEFAULT 0,
	`mealType` enum('breakfast','lunch','dinner','snack','drink','coffee','protein_shake') NOT NULL DEFAULT 'snack',
	`servingSize` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meal_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` int NOT NULL,
	`userId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_reads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_privacy_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`allowDMs` boolean NOT NULL DEFAULT true,
	`allowFollows` boolean NOT NULL DEFAULT true,
	`allowMentions` boolean NOT NULL DEFAULT true,
	`privateAccount` boolean NOT NULL DEFAULT false,
	`notifyLikes` boolean NOT NULL DEFAULT true,
	`notifyComments` boolean NOT NULL DEFAULT true,
	`notifyMentions` boolean NOT NULL DEFAULT true,
	`notifyFollows` boolean NOT NULL DEFAULT true,
	`notifyMessages` boolean NOT NULL DEFAULT true,
	`notifyReplies` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_privacy_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_privacy_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `weight_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`weight` decimal(5,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weight_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `social_notifications` MODIFY COLUMN `type` enum('like','cheer','fire','comment','achievement','mention','follow','reply','message') NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `period` enum('monthly','yearly','lifetime','free_trial') NOT NULL DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE `community_posts` ADD `isPinned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `community_posts` ADD `isHidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `commentId` int;--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `messageId` int;--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `replyId` int;--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `actorName` varchar(255);--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `actorAvatar` text;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `activationCodeId` int;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `paymentStatus` enum('paid','pending','failed','refunded','free') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `paymentProvider` enum('myfatoorah','manual','free') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `transactionId` varchar(255);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `autoRenew` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `fullName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `authProvider` enum('manus','email','google') DEFAULT 'manus' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastLoginAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `age` int;--> statement-breakpoint
ALTER TABLE `users` ADD `height` int;--> statement-breakpoint
ALTER TABLE `users` ADD `currentWeight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `users` ADD `targetWeight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('male','female');--> statement-breakpoint
ALTER TABLE `users` ADD `activeDeviceId` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `isBanned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `bannedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `banReason` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);CREATE TABLE `app_error_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`severity` enum('error','warning','info') NOT NULL DEFAULT 'error',
	`source` enum('client','server') NOT NULL DEFAULT 'client',
	`message` text NOT NULL,
	`stack` text,
	`url` text,
	`userId` int,
	`userEmail` varchar(320),
	`resolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_error_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercise_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exerciseId` varchar(64) NOT NULL,
	`name` varchar(255),
	`nameAr` varchar(255),
	`sets` varchar(32),
	`reps` varchar(32),
	`rest` varchar(32),
	`notes` text,
	`notesAr` text,
	`imageUrl` text,
	`imageKey` text,
	`youtubeUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exercise_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `exercise_overrides_exerciseId_unique` UNIQUE(`exerciseId`)
);
--> statement-breakpoint
CREATE TABLE `session_icon_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionType` varchar(64) NOT NULL,
	`iconUrl` text NOT NULL,
	`iconKey` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `session_icon_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_icon_overrides_sessionType_unique` UNIQUE(`sessionType`)
);
--> statement-breakpoint
CREATE TABLE `site_appearance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`primaryColor` varchar(32) NOT NULL DEFAULT '#1B2E5E',
	`accentColor` varchar(32) NOT NULL DEFAULT '#7BB8D4',
	`bgColor` varchar(32) NOT NULL DEFAULT '#F0F4F8',
	`textColor` varchar(32) NOT NULL DEFAULT '#1B2E5E',
	`fontFamily` varchar(128) NOT NULL DEFAULT 'Inter',
	`logoUrl` text,
	`logoKey` text,
	`bannerUrl` text,
	`bannerKey` text,
	`footerText` text,
	`footerLinks` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_appearance_id` PRIMARY KEY(`id`)
);
DROP TABLE `app_error_logs`;--> statement-breakpoint
DROP TABLE `exercise_overrides`;--> statement-breakpoint
DROP TABLE `session_icon_overrides`;--> statement-breakpoint
DROP TABLE `site_appearance`;CREATE TABLE `app_error_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`severity` enum('error','warning','info') NOT NULL DEFAULT 'error',
	`message` text NOT NULL,
	`stack` text,
	`url` text,
	`userId` int,
	`userEmail` varchar(255),
	`resolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_error_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercise_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exerciseId` varchar(100) NOT NULL,
	`imageUrl` text,
	`youtubeUrl` text,
	`nameEn` varchar(255),
	`nameAr` varchar(255),
	`sets` int,
	`reps` int,
	`restSec` int,
	`notes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exercise_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `exercise_overrides_exerciseId_unique` UNIQUE(`exerciseId`)
);
--> statement-breakpoint
CREATE TABLE `session_icon_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionType` varchar(100) NOT NULL,
	`iconUrl` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `session_icon_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_icon_overrides_sessionType_unique` UNIQUE(`sessionType`)
);
--> statement-breakpoint
CREATE TABLE `site_appearance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`primaryColor` varchar(20) NOT NULL DEFAULT '#1B2E5E',
	`accentColor` varchar(20) NOT NULL DEFAULT '#7BB8D4',
	`bgColor` varchar(20) NOT NULL DEFAULT '#F0F4F8',
	`textColor` varchar(20) NOT NULL DEFAULT '#1B2E5E',
	`fontFamily` varchar(100) NOT NULL DEFAULT 'Inter',
	`logoUrl` text,
	`bannerUrl` text,
	`footerText` text,
	`footerLinks` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_appearance_id` PRIMARY KEY(`id`)
);
