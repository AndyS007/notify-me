CREATE TABLE `sms_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`timestamp` integer NOT NULL,
	`synced` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sms_address` ON `sms_messages` (`address`);--> statement-breakpoint
CREATE INDEX `idx_sms_ts` ON `sms_messages` (`timestamp`);