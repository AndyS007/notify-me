-- Make notifications.device_id NOT NULL.
--
-- The entity `com.andyhuang.notifyme.entity.Notification` now declares
-- `device: Device` as non-nullable. Hibernate's `ddl-auto=update` only ADDS
-- columns — it does NOT tighten nullability on existing columns. This script
-- must be run against each environment once before deploying the new code.
--
-- Any rows with a NULL device_id are orphaned (they were created before
-- device tracking was required) and are deleted. The matching constraint in
-- the mobile sync path now rejects notifications without a registered device,
-- so those rows could never have been re-synced in any useful way.

BEGIN;

DELETE FROM notifications WHERE device_id IS NULL;

ALTER TABLE notifications ALTER COLUMN device_id SET NOT NULL;

COMMIT;
