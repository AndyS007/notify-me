import { int, sqliteTable, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const notifications = sqliteTable(
  'notifications',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    packageName: text('package_name').notNull(),
    appName: text('app_name').notNull().default(''),
    title: text('title').notNull().default(''),
    text: text('text').notNull().default(''),
    timestamp: int('timestamp').notNull(),
    icon: text('icon'),
    synced: int('synced').notNull().default(0),
  },
  (table) => [
    index('idx_pkg').on(table.packageName),
    index('idx_ts').on(table.timestamp),
  ],
);

export const appSettings = sqliteTable(
  'app_settings',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    packageName: text('package_name').notNull(),
    appName: text('app_name').notNull().default(''),
    enabled: int('enabled').notNull().default(1),
    isSystemApp: int('is_system_app').notNull().default(0),
    updatedAt: int('updated_at').notNull().default(0),
  },
  (table) => [
    uniqueIndex('idx_app_settings_pkg').on(table.packageName),
    index('idx_app_settings_system').on(table.isSystemApp),
  ],
);
