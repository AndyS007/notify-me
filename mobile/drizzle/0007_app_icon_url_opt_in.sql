-- Notification capture is now strictly opt-in: every app starts disabled and
-- the user must flip the toggle per app. Reset every existing row so the new
-- default takes effect for upgraders too.
ALTER TABLE `app_settings` ADD `app_icon_url` text;--> statement-breakpoint
UPDATE `app_settings` SET `enabled` = 0, `updated_at` = (strftime('%s','now') * 1000);
