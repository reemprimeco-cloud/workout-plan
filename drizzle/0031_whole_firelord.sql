CREATE TABLE `user_privacy_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`allowDMs` boolean NOT NULL DEFAULT true,
	`allowFollows` boolean NOT NULL DEFAULT true,
	`allowMentions` boolean NOT NULL DEFAULT true,
	`privateAccount` boolean NOT NULL DEFAULT false,
	`notifyLikes` boolean NOT NULL DEFAULT true,
	`notifyComments` boolean NOT NULL DEFAULT true,
	`notifyMentions` boolean NOT NULL DEFAULT true,
	`notifyFollows` boolean NOT NULL DEFAULT true,
	`notifyMessages` boolean NOT NULL DEFAULT true,
	`notifyReplies` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_privacy_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_privacy_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `social_notifications` MODIFY COLUMN `type` enum('like','cheer','fire','comment','achievement','mention','follow','reply','message') NOT NULL;--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `commentId` int;--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `messageId` int;--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `replyId` int;--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `actorName` varchar(255);--> statement-breakpoint
ALTER TABLE `social_notifications` ADD `actorAvatar` text;