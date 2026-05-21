CREATE TABLE `admin_notifications` (
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
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);