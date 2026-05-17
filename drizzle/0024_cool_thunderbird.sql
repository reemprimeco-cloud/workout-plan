ALTER TABLE `users` ADD `age` int;--> statement-breakpoint
ALTER TABLE `users` ADD `height` int;--> statement-breakpoint
ALTER TABLE `users` ADD `currentWeight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `users` ADD `targetWeight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('male','female');