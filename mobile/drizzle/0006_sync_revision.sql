-- Sync protocol overhaul: every notification carries a client-supplied UUID
-- (`client_id`) used for idempotent push, plus the server-assigned cursor
-- (`server_revision`), a soft-delete tombstone, and a wall-clock for LWW.
ALTER TABLE `notifications` RENAME COLUMN `remote_id` TO `client_id`;--> statement-breakpoint
ALTER TABLE `notifications` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `notifications` ADD `updated_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `server_revision` integer;--> statement-breakpoint

-- Backfill `updated_at` from the original notification timestamp so legacy
-- rows have a sane LWW value the first time they get pushed.
UPDATE `notifications` SET `updated_at` = `timestamp` WHERE `updated_at` = 0;--> statement-breakpoint

-- Backfill `client_id` for any row that was created before remote_id was
-- introduced. Use `randomblob` to synthesize a UUID v4-shaped string —
-- SQLite has no built-in UUID, but the server only cares about
-- `UUID.fromString`-parseable input.
UPDATE `notifications`
SET `client_id` = (
  lower(substr(hex(randomblob(4)),1,8))
  || '-' || lower(substr(hex(randomblob(2)),1,4))
  || '-4' || lower(substr(hex(randomblob(2)),2,3))
  || '-' || substr('89ab', abs(random() % 4) + 1, 1) || lower(substr(hex(randomblob(2)),2,3))
  || '-' || lower(substr(hex(randomblob(6)),1,12))
)
WHERE `client_id` IS NULL;--> statement-breakpoint

-- The unique index from migration 0005 was on the old name; recreate under
-- the new column name.
DROP INDEX IF EXISTS `idx_notifications_remote_id`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_notifications_client_id` ON `notifications` (`client_id`);--> statement-breakpoint

-- Tiny key/value bag for sync cursors and similar metadata.
CREATE TABLE `sync_state` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text
);
