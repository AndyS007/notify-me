import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const notifications = sqliteTable('notifications', {
  id: int('id').primaryKey({ autoIncrement: true }),
  packageName: text('package_name').notNull(),
  appName: text('app_name').notNull().default(''),
  title: text('title').notNull().default(''),
  text: text('text').notNull().default(''),
  timestamp: int('timestamp').notNull(),
  icon: text('icon'),
});
