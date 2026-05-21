CREATE TABLE `app_error_logs` (
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
