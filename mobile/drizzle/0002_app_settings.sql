CREATE TABLE `app_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`package_name` text NOT NULL,
	`app_name` text DEFAULT '' NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_app_settings_pkg` ON `app_settings` (`package_name`);