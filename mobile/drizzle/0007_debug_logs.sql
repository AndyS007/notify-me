CREATE TABLE `debug_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`level` text DEFAULT 'info' NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`data` text
);
--> statement-breakpoint
CREATE INDEX `idx_debug_logs_created_at` ON `debug_logs` (`created_at`);
