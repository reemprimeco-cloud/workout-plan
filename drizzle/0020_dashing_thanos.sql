CREATE TABLE `app_announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titleAr` varchar(200) NOT NULL,
	`titleEn` varchar(200) NOT NULL,
	`bodyAr` text NOT NULL,
	`bodyEn` text NOT NULL,
	`emoji` varchar(8) NOT NULL DEFAULT '📢',
	`ctaLabelAr` varchar(100),
	`ctaLabelEn` varchar(100),
	`ctaUrl` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_announcements_id` PRIMARY KEY(`id`)
);
