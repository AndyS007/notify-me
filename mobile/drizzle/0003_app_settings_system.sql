ALTER TABLE `app_settings` ADD `is_system_app` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `updated_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_app_settings_system` ON `app_settings` (`is_system_app`);