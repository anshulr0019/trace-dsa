CREATE TABLE `practice_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`problem_id` text NOT NULL,
	`at` text NOT NULL,
	`level` text NOT NULL,
	`case_id` text NOT NULL,
	`language` text NOT NULL,
	`score` integer NOT NULL,
	`passed` integer NOT NULL,
	`total` integer NOT NULL,
	`assisted` integer NOT NULL,
	`explanation` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_practice_attempts_user_problem_at` ON `practice_attempts` (`user_id`,`problem_id`,`at`);--> statement-breakpoint
CREATE TABLE `practice_usage` (
	`user_id` text NOT NULL,
	`bucket` text NOT NULL,
	`used` integer NOT NULL,
	PRIMARY KEY(`user_id`, `bucket`)
);
