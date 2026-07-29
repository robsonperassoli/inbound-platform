CREATE TABLE `account_members` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`profiles` text DEFAULT '["all"]' NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `form_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`form_id` text NOT NULL,
	`values` text DEFAULT '{}' NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `forms` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`fields` text DEFAULT '[]' NOT NULL,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`token` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`profiles` text NOT NULL,
	`status` text NOT NULL,
	`expires_at` integer NOT NULL,
	`accepted_by_user_id` text,
	`accepted_at` integer,
	`invited_by_user_id` text NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invited_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `links` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`title` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`type` text NOT NULL,
	`form_id` text,
	`url` text,
	`platform` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'complete' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`user_id` text NOT NULL,
	`username` text NOT NULL,
	`title` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`avatar_key` text,
	`background_image_key` text,
	`published_at` integer,
	`theme` text DEFAULT 'Pearl White' NOT NULL,
	`background_color` text DEFAULT '#FFFFFF' NOT NULL,
	`font_family` text DEFAULT 'Inter' NOT NULL,
	`text_color` text DEFAULT '#1E293B' NOT NULL,
	`button_shape` text DEFAULT 'pill' NOT NULL,
	`button_style` text DEFAULT 'solid' NOT NULL,
	`button_color` text DEFAULT '#1E293B' NOT NULL,
	`button_text_color` text DEFAULT '#FFFFFF' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_username_unique` ON `profiles` (`username`);--> statement-breakpoint
CREATE TABLE `stripe_customers` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`user_id` text NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`email` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stripe_customers_account_id_unique` ON `stripe_customers` (`account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `stripe_customers_stripe_customer_id_unique` ON `stripe_customers` (`stripe_customer_id`);--> statement-breakpoint
CREATE TABLE `stripe_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
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
CREATE UNIQUE INDEX `stripe_subscriptions_stripe_subscription_id_unique` ON `stripe_subscriptions` (`stripe_subscription_id`);--> statement-breakpoint
CREATE TABLE `super_users` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `super_users_user_id_unique` ON `super_users` (`user_id`);--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`model` text DEFAULT 'gpt-4o-mini' NOT NULL,
	`system_prompt` text NOT NULL,
	`type` text NOT NULL,
	`form_id` text,
	`form_submission_id` text,
	`profile_id` text,
	`session_ended_at` integer,
	`last_user_message_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_id` text,
	`email` text,
	`name` text,
	`profile_picture_url` text,
	`created_at` integer NOT NULL
);
