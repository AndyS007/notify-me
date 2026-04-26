import {
  int,
  sqliteTable,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const notifications = sqliteTable(
  "notifications",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    // Server-assigned UUID. Populated on push (returned by /notifications/batch)
    // and on pull (from /notifications). Used as the canonical dedup key — the
    // legacy packageName+timestamp pair is only consulted for rows that
    // predate this column.
    remoteId: text("remote_id"),
    deviceId: text("device_id").notNull().default(""),
    packageName: text("package_name").notNull(),
    appName: text("app_name").notNull().default(""),
    title: text("title").notNull().default(""),
    text: text("text").notNull().default(""),
    timestamp: int("timestamp").notNull(),
    icon: text("icon"),
    synced: int("synced").notNull().default(0),
  },
  (table) => [
    index("idx_pkg").on(table.packageName),
    index("idx_ts").on(table.timestamp),
    uniqueIndex("idx_notifications_remote_id").on(table.remoteId),
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
