CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`package_name` text NOT NULL,
	`app_name` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`timestamp` integer NOT NULL,
	`icon` text
);
--> statement-breakpoint
CREATE INDEX `idx_pkg` ON `notifications` (`package_name`);--> statement-breakpoint
CREATE INDEX `idx_ts` ON `notifications` (`timestamp`);