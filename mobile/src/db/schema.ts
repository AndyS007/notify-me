import {
  int,
  sqliteTable,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Captured notifications. The id remains a local autoincrement (cheap to
 * read/write); identity for sync purposes lives in `clientId`, a UUID
 * generated on the device when the row is created and shared with the
 * backend so push/pull are idempotent across retries.
 *
 *  - `serverRevision` is the cursor value the server stamped on this row
 *    when it was last accepted; null while the row is still pending push.
 *  - `deletedAt` is a soft-delete tombstone (ms since epoch) — needs to
 *    propagate to other devices on their next pull.
 *  - `updatedAt` (ms since epoch) drives last-write-wins conflict
 *    resolution: when two devices race, the side with the larger
 *    `updatedAt` wins.
 *  - `synced` is the local pending-push flag (0 = pending, 1 = pushed).
 *    A row also flips back to 0 on local edits/deletes so the next push
 *    picks them up.
 */
export const notifications = sqliteTable(
  "notifications",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    clientId: text("client_id").notNull(),
    deviceId: text("device_id").notNull().default(""),
    packageName: text("package_name").notNull(),
    appName: text("app_name").notNull().default(""),
    title: text("title").notNull().default(""),
    text: text("text").notNull().default(""),
    timestamp: int("timestamp").notNull(),
    icon: text("icon"),
    deletedAt: int("deleted_at"),
    updatedAt: int("updated_at").notNull().default(0),
    serverRevision: int("server_revision"),
    synced: int("synced").notNull().default(0),
  },
  (table) => [
    index("idx_pkg").on(table.packageName),
    index("idx_ts").on(table.timestamp),
    uniqueIndex("idx_notifications_client_id").on(table.clientId),
    index("idx_notifications_pkg_ts").on(table.packageName, table.timestamp),
  ],
);

export type NotificationRecord = typeof notifications.$inferSelect;

export const appSettings = sqliteTable(
  "app_settings",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    packageName: text("package_name").notNull(),
    appName: text("app_name").notNull().default(""),
    enabled: int("enabled").notNull().default(1),
    isSystemApp: int("is_system_app").notNull().default(0),
    updatedAt: int("updated_at").notNull().default(0),
  },
  (table) => [
    uniqueIndex("idx_app_settings_pkg").on(table.packageName),
    index("idx_app_settings_system").on(table.isSystemApp),
  ],
);

/**
 * Tiny key/value bag used to persist sync state across launches. Currently
 * holds `last_sync_revision` (the highest server revision we've successfully
 * pulled) but is intentionally generic so future sync machinery can park
 * cursors here without another migration.
 */
export const syncState = sqliteTable("sync_state", {
  key: text("key").primaryKey(),
  value: text("value"),
});

/**
 * Debug log entries surfaced on the Dev screen. The headless notification
 * task can't easily print to the Metro/JS console once the app is backgrounded,
 * so we persist a row per captured notification (plus any errors) here.
 */
export const debugLogs = sqliteTable(
  "debug_logs",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    createdAt: int("created_at").notNull(),
    level: text("level").notNull().default("info"),
    source: text("source").notNull().default(""),
    message: text("message").notNull().default(""),
    data: text("data"),
  },
  (table) => [index("idx_debug_logs_created_at").on(table.createdAt)],
);

export type DebugLogRecord = typeof debugLogs.$inferSelect;
