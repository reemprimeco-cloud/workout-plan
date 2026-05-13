CREATE TABLE `admin_profile` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`phone` varchar(64),
	`email` varchar(320),
	`photoUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_profile_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcast_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject` varchar(512) NOT NULL,
	`body` text NOT NULL,
	`type` enum('update','news','offer','reminder','other') NOT NULL DEFAULT 'news',
	`recipientCount` int NOT NULL DEFAULT 0,
	`sentBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `broadcast_notifications_id` PRIMARY KEY(`id`)
);
