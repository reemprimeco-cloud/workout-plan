CREATE TABLE `post_mentions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mentionedId` int NOT NULL,
	`actorId` int NOT NULL,
	`postId` int NOT NULL,
	`commentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_mentions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `social_notifications` MODIFY COLUMN `type` enum('like','cheer','fire','comment','achievement','mention') NOT NULL;