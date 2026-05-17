ALTER TABLE `subscriptions` MODIFY COLUMN `period` enum('monthly','yearly','lifetime','free_trial') NOT NULL DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `activationCodeId` int;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `paymentStatus` enum('paid','pending','failed','refunded','free') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `paymentProvider` enum('myfatoorah','manual','free') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `transactionId` varchar(255);--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `autoRenew` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `fullName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `authProvider` enum('manus','email','google') DEFAULT 'manus' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastLoginAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);