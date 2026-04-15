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
  },
  (table) => [
    uniqueIndex('idx_app_settings_pkg').on(table.packageName),
  ],
);

export const smsMessages = sqliteTable(
  'sms_messages',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    address: text('address').notNull(),
    body: text('body').notNull().default(''),
    timestamp: int('timestamp').notNull(),
    synced: int('synced').notNull().default(0),
  },
  (table) => [
    index('idx_sms_address').on(table.address),
    index('idx_sms_ts').on(table.timestamp),
  ],
);
