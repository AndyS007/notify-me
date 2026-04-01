import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const sqlite = SQLite.openDatabaseSync('notifications.db');

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_name TEXT NOT NULL,
    app_name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL DEFAULT '',
    timestamp INTEGER NOT NULL,
    icon TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_pkg ON notifications(package_name);
  CREATE INDEX IF NOT EXISTS idx_ts ON notifications(timestamp);
`);

export const db = drizzle(sqlite, { schema });
