CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`account_id` text NOT NULL,
	`password` text,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `daily_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`position` integer NOT NULL,
	`idea_id` text NOT NULL,
	`archetype` text NOT NULL,
	`scenario_md` text NOT NULL,
	`options_json` text NOT NULL,
	`correct_key` text NOT NULL,
	`explanation_md` text NOT NULL,
	`pm_takeaway` text NOT NULL,
	`citation_json` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_questions_date_position_uniq` ON `daily_questions` (`date`,`position`);--> statement-breakpoint
CREATE TABLE `daily_sessions` (
	`date` text PRIMARY KEY NOT NULL,
	`headline` text NOT NULL,
	`theme_pillar` text NOT NULL,
	`digest_md` text NOT NULL,
	`takeaways_json` text NOT NULL,
	`source_json` text NOT NULL,
	`published_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quiz_answers` (
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`selected_key` text NOT NULL,
	`is_correct` integer NOT NULL,
	`answered_at` integer NOT NULL,
	PRIMARY KEY(`attempt_id`, `question_id`),
	FOREIGN KEY (`attempt_id`) REFERENCES `quiz_attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `daily_questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`started_at` integer NOT NULL,
	`submitted_at` integer,
	`total_correct` integer,
	`total_seconds` integer,
	`base_points` integer,
	`speed_bonus` integer,
	`streak_multiplier` real,
	`total_points` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quiz_attempts_user_date_uniq` ON `quiz_attempts` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_stats` (
	`user_id` text PRIMARY KEY NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`best_streak` integer DEFAULT 0 NOT NULL,
	`last_attempt_date` text,
	`total_points` integer DEFAULT 0 NOT NULL,
	`weekly_points` integer DEFAULT 0 NOT NULL,
	`week_key` text NOT NULL,
	`total_attempts` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`company` text,
	`role` text,
	`timezone` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_active_at` integer NOT NULL,
	`terms_accepted_at` integer,
	`terms_version` text,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `weekly_archive` (
	`user_id` text NOT NULL,
	`week_key` text NOT NULL,
	`points` integer NOT NULL,
	`rank` integer NOT NULL,
	PRIMARY KEY(`user_id`, `week_key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
