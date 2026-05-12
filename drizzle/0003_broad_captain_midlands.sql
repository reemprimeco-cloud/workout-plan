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
