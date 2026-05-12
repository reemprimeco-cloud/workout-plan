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
