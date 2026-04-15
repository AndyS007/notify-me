import { eq } from 'drizzle-orm';
import { db } from '../db';
import { appSettings } from '../db/schema';
import { isKnownSystemApp } from './app-list-service';

export type AppSettingRecord = typeof appSettings.$inferSelect;

export async function getAllAppSettings(): Promise<Map<string, AppSettingRecord>> {
  const rows = await db.select().from(appSettings);
  return new Map(rows.map((r) => [r.packageName, r]));
}

/**
 * Resolve whether notifications from a package should be captured.
 *
 * - If the user has explicitly toggled the app, honor that setting.
 * - Otherwise, system apps are disabled by default; user-installed apps are
 *   enabled by default.
 */
export async function isAppEnabled(packageName: string): Promise<boolean> {
  const rows = await db
    .select({ enabled: appSettings.enabled })
    .from(appSettings)
    .where(eq(appSettings.packageName, packageName))
    .limit(1);
  if (rows.length > 0) return rows[0].enabled === 1;
  // No explicit setting — fall back to the system-app default.
  const systemApp = await isKnownSystemApp(packageName);
  return !systemApp;
}

export async function setAppEnabled(
  packageName: string,
  appName: string,
  enabled: boolean,
): Promise<void> {
  const value = enabled ? 1 : 0;
  // Upsert: insert or update on conflict
  await db
    .insert(appSettings)
    .values({ packageName, appName, enabled: value })
    .onConflictDoUpdate({
      target: appSettings.packageName,
      set: { enabled: value, appName },
    });
}
