CREATE TABLE `social_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actorId` int NOT NULL,
	`type` enum('like','cheer','fire','comment','achievement') NOT NULL,
	`postId` int,
	`message` text NOT NULL,
	`messageEn` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_notifications_id` PRIMARY KEY(`id`)
);
