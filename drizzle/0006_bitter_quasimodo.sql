ALTER TABLE `access_codes` ADD `orderId` int;--> statement-breakpoint
ALTER TABLE `access_codes` ADD CONSTRAINT `access_codes_orderId_unique` UNIQUE(`orderId`);