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
CREATE TABLE `weight_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`weight` decimal(5,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weight_logs_id` PRIMARY KEY(`id`)
);
