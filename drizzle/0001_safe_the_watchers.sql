CREATE TABLE `access_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(128) NOT NULL,
	`customerName` varchar(255),
	`customerEmail` varchar(320),
	`note` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `access_codes_code_unique` UNIQUE(`code`)
);
