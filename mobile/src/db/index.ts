import {
  drizzle as drizzleSync,
  type ExpoSQLiteDatabase,
} from "drizzle-orm/expo-sqlite";
import { drizzle as drizzleAsync } from "drizzle-orm/sqlite-proxy";
import {
  openDatabaseAsync,
  openDatabaseSync,
  type SQLiteDatabase,
} from "expo-sqlite";
import { Platform } from "react-native";
import migrationsModule from "../../drizzle/migrations";
import * as schema from "./schema";

export type Db = ExpoSQLiteDatabase<typeof schema>;

// Web: drizzle's sync expo-sqlite driver busy-loops on the wa-sqlite worker
// and times out (expo/expo#36392). Use sqlite-proxy + expo-sqlite's async
// API instead. Migrations run lazily on the first query so consumers don't
// have to await initialization.

let webSqlite: Promise<SQLiteDatabase> | null = null;
function getWebSqlite() {
  webSqlite ??= openDatabaseAsync("notifications.db", {
    enableChangeListener: true,
  }).then(async (sqlite) => {
    await runWebMigrations(sqlite);
    return sqlite;
  });
  return webSqlite;
}

async function runWebMigrations(sqlite: SQLiteDatabase) {
  await sqlite.execAsync(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at NUMERIC
    )
  `);
  const last = await sqlite.getFirstAsync<{ created_at: number }>(
    "SELECT created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1",
  );
  const lastTimestamp = last?.created_at ?? 0;

  const { journal, migrations } = migrationsModule as {
    journal: { entries: { idx: number; when: number; tag: string }[] };
    migrations: Record<string, string>;
  };

  for (const entry of journal.entries) {
    if (entry.when <= lastTimestamp) continue;
    const sql = migrations[`m${String(entry.idx).padStart(4, "0")}`];
    if (!sql) continue;
    for (const stmt of sql.split("--> statement-breakpoint")) {
      const trimmed = stmt.trim();
      if (trimmed) await sqlite.execAsync(trimmed);
    }
    await sqlite.runAsync(
      "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      [entry.tag, entry.when],
    );
  }
}

function makeWebDb(): Db {
  const proxy = drizzleAsync<typeof schema>(
    async (sql, params, method) => {
      const sqlite = await getWebSqlite();
      switch (method) {
        case "all":
        case "values": {
          const rows = await sqlite.getAllAsync<Record<string, unknown>>(
            sql,
            params,
          );
          return { rows: rows.map((r) => Object.values(r)) };
        }
        case "get": {
          const row = await sqlite.getFirstAsync<Record<string, unknown>>(
            sql,
            params,
          );
          return { rows: row ? [Object.values(row)] : [] };
        }
        case "run": {
          await sqlite.runAsync(sql, params);
          return { rows: [] };
        }
      }
    },
    { schema },
  );
  // Sync and async drizzle share the same chainable query API; consumers
  // already use `await db.select()...` everywhere, so this cast is safe.
  return proxy as unknown as Db;
}

export const db: Db =
  Platform.OS === "web"
    ? makeWebDb()
    : drizzleSync(
        openDatabaseSync("notifications.db", { enableChangeListener: true }),
        { schema },
      );
