CREATE TABLE `challenge_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`rewardId` int NOT NULL,
	`weightOverride` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenge_rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jackpot_winners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`spinId` int NOT NULL,
	`rewardId` int NOT NULL,
	`rewardName` varchar(128) NOT NULL,
	`wonAt` timestamp NOT NULL DEFAULT (now()),
	`notifiedAdmin` boolean NOT NULL DEFAULT false,
	CONSTRAINT `jackpot_winners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reward_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`spinId` int NOT NULL,
	`rewardId` int NOT NULL,
	`rewardName` varchar(128) NOT NULL,
	`rarity` enum('common','uncommon','rare','jackpot') NOT NULL,
	`value` int DEFAULT 0,
	`appliedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reward_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reward_probabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`nameAr` varchar(128) NOT NULL,
	`type` enum('premium_days','xp_bonus','badge','ai_boost','streak_protection','workout_unlock','ai_insights','upgrade') NOT NULL,
	`rarity` enum('common','uncommon','rare','jackpot') NOT NULL,
	`weight` int NOT NULL DEFAULT 100,
	`value` int DEFAULT 0,
	`icon` varchar(64) DEFAULT '🎁',
	`color` varchar(16) DEFAULT '#7BB8D4',
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reward_probabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reward_spins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` int NOT NULL,
	`rewardId` int,
	`status` enum('pending','spun','claimed') NOT NULL DEFAULT 'pending',
	`spinToken` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`spunAt` timestamp,
	`claimedAt` timestamp,
	CONSTRAINT `reward_spins_id` PRIMARY KEY(`id`)
);
