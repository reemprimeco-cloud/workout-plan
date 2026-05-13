CREATE TABLE `billing_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`plan` enum('free','prime_plus','prime_pro') NOT NULL,
	`period` enum('monthly','yearly') NOT NULL,
	`amount` varchar(32) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'KWD',
	`status` enum('paid','failed','refunded','pending') NOT NULL,
	`invoiceId` varchar(255) NOT NULL,
	`paymentRef` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billing_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`plan` enum('free','prime_plus','prime_pro') NOT NULL DEFAULT 'free',
	`status` enum('active','expired','cancelled','trialing','pending') NOT NULL DEFAULT 'active',
	`period` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`trialEndsAt` timestamp,
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`invoiceId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`)
);
