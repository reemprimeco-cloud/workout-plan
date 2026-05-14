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
