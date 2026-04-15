CREATE TABLE `apps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`package_name` text NOT NULL,
	`app_name` text DEFAULT '' NOT NULL,
	`is_system_app` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_apps_pkg` ON `apps` (`package_name`);--> statement-breakpoint
CREATE INDEX `idx_apps_system` ON `apps` (`is_system_app`);