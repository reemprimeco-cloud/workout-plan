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
