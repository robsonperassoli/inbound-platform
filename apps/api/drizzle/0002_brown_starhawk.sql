PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_stripe_customers` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`user_id` text,
	`stripe_customer_id` text NOT NULL,
	`email` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_stripe_customers`("id", "account_id", "user_id", "stripe_customer_id", "email", "created_at") SELECT "id", "account_id", "user_id", "stripe_customer_id", "email", "created_at" FROM `stripe_customers`;--> statement-breakpoint
DROP TABLE `stripe_customers`;--> statement-breakpoint
ALTER TABLE `__new_stripe_customers` RENAME TO `stripe_customers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `stripe_customers_account_id_unique` ON `stripe_customers` (`account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `stripe_customers_stripe_customer_id_unique` ON `stripe_customers` (`stripe_customer_id`);--> statement-breakpoint
CREATE TABLE `__new_stripe_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`stripe_customer_id` text NOT NULL,
	`stripe_subscription_id` text NOT NULL,
	`status` text NOT NULL,
	`price_id` text,
	`plan_type` text,
	`current_period_end` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_stripe_subscriptions`("id", "account_id", "stripe_customer_id", "stripe_subscription_id", "status", "price_id", "plan_type", "current_period_end", "created_at", "updated_at") SELECT "id", "account_id", "stripe_customer_id", "stripe_subscription_id", "status", "price_id", "plan_type", "current_period_end", "created_at", "updated_at" FROM `stripe_subscriptions`;--> statement-breakpoint
DROP TABLE `stripe_subscriptions`;--> statement-breakpoint
ALTER TABLE `__new_stripe_subscriptions` RENAME TO `stripe_subscriptions`;--> statement-breakpoint
CREATE UNIQUE INDEX `stripe_subscriptions_stripe_subscription_id_unique` ON `stripe_subscriptions` (`stripe_subscription_id`);