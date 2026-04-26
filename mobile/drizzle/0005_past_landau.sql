ALTER TABLE `notifications` ADD `remote_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_notifications_remote_id` ON `notifications` (`remote_id`);--> statement-breakpoint
CREATE INDEX `idx_notifications_pkg_ts` ON `notifications` (`package_name`,`timestamp`);