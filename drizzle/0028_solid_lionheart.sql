CREATE TABLE `meal_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameAr` varchar(255),
	`calories` int NOT NULL DEFAULT 0,
	`proteinG` double NOT NULL DEFAULT 0,
	`carbsG` double NOT NULL DEFAULT 0,
	`fatG` double NOT NULL DEFAULT 0,
	`mealType` enum('breakfast','lunch','dinner','snack','drink','coffee','protein_shake') NOT NULL DEFAULT 'snack',
	`servingSize` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meal_favorites_id` PRIMARY KEY(`id`)
);
