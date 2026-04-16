import { eq } from 'drizzle-orm';
import { db } from '../db';
import { appSettings } from '../db/schema';

export type AppSettingRecord = typeof appSettings.$inferSelect;

export async function getAllAppSettings(): Promise<Map<string, AppSettingRecord>> {
  const rows = await db.select().from(appSettings);
  return new Map(rows.map((r) => [r.packageName, r]));
}

/**
 * Whether notifications from a package should be captured.
 *
 * After the first device sync, every installed app has a row in
 * `app_settings` with `enabled` seeded from its `is_system_app` flag — so
 * this is just a lookup. For packages that haven't been synced yet (e.g.
 * a notification arrives before the UI ever opens), we fall through to
 * `true` so we don't silently drop a real user notification.
 */
export async function isAppEnabled(packageName: string): Promise<boolean> {
  const rows = await db
    .select({ enabled: appSettings.enabled })
    .from(appSettings)
    .where(eq(appSettings.packageName, packageName))
    .limit(1);
  if (rows.length === 0) return true;
  return rows[0].enabled === 1;
}

export async function setAppEnabled(
  packageName: string,
  appName: string,
  enabled: boolean,
): Promise<void> {
  const value = enabled ? 1 : 0;
  const now = Date.now();
  // Upsert: insert or update on conflict. `isSystemApp` is only set on the
  // insert path (rare — the sync job usually creates the row first). On
  // update we intentionally leave `isSystemApp` alone.
  await db
    .insert(appSettings)
    .values({ packageName, appName, enabled: value, updatedAt: now })
    .onConflictDoUpdate({
      target: appSettings.packageName,
      set: { enabled: value, appName, updatedAt: now },
    });
}
