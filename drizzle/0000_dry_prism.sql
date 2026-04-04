CREATE TABLE IF NOT EXISTS `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`package_name` text NOT NULL,
	`app_name` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`timestamp` integer NOT NULL,
	`icon` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_pkg` ON `notifications` (`package_name`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_ts` ON `notifications` (`timestamp`);