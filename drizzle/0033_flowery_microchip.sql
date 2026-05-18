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
