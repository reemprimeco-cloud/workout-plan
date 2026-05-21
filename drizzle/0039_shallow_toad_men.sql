CREATE TABLE `app_error_logs` (
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
