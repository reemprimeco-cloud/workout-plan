CREATE TABLE `admin_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleAr` varchar(255),
	`message` text NOT NULL,
	`messageAr` text,
	`imageUrl` varchar(512),
	`ctaText` varchar(128),
	`ctaTextAr` varchar(128),
	`ctaLink` varchar(512),
	`channel` enum('inapp','email','both') NOT NULL DEFAULT 'inapp',
	`target` enum('all','active_subscribers','new_subscribers','specific') NOT NULL DEFAULT 'all',
	`targetEmail` varchar(320),
	`type` enum('update','news','offer','reminder','other') NOT NULL DEFAULT 'other',
	`sentBy` varchar(255),
	`recipientCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_reads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`notificationId` int NOT NULL,
	`userId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_reads_id` PRIMARY KEY(`id`)
);
