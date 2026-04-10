import { eq } from 'drizzle-orm';
import { db } from '../db';
import { appSettings } from '../db/schema';

export type AppSettingRecord = typeof appSettings.$inferSelect;

export async function getAllAppSettings(): Promise<Map<string, AppSettingRecord>> {
  const rows = await db.select().from(appSettings);
  return new Map(rows.map((r) => [r.packageName, r]));
}

export async function isAppEnabled(packageName: string): Promise<boolean> {
  const rows = await db
    .select({ enabled: appSettings.enabled })
    .from(appSettings)
    .where(eq(appSettings.packageName, packageName))
    .limit(1);
  // If no setting exists, app is enabled by default
  if (rows.length === 0) return true;
  return rows[0].enabled === 1;
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
