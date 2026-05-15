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
