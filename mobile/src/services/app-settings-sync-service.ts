import { eq } from 'drizzle-orm';
import { db } from '../db';
import { appSettings } from '../db/schema';
import {
  pushAppSettingsApi,
  pullAppSettingsApi,
  type AppSettingItem,
} from '../api/app-settings';
import type { ApiClient } from '../api/client';

/**
 * Push all local app settings to the backend.
 */
export async function pushAppSettings(
  client: ApiClient,
): Promise<{ created: number; updated: number }> {
  const rows = await db.select().from(appSettings);
  if (rows.length === 0) return { created: 0, updated: 0 };

  const items: AppSettingItem[] = rows.map((r) => ({
    packageName: r.packageName,
    appName: r.appName,
    enabled: r.enabled === 1,
    isSystemApp: r.isSystemApp === 1,
    updatedAt: r.updatedAt,
  }));

  return pushAppSettingsApi(client, items);
}

/**
 * Pull app settings from the backend and merge into local SQLite.
 * The server row wins when its `updatedAt` is more recent, ensuring
 * that a setting toggled on another device propagates here.
 */
export async function pullAppSettings(
  client: ApiClient,
): Promise<{ merged: number }> {
  const remote = await pullAppSettingsApi(client);
  if (remote.length === 0) return { merged: 0 };

  let merged = 0;

  for (const item of remote) {
    const existing = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.packageName, item.packageName))
      .limit(1);

    if (existing.length === 0) {
      // New row from server — insert
      await db.insert(appSettings).values({
        packageName: item.packageName,
        appName: item.appName,
        enabled: item.enabled ? 1 : 0,
        isSystemApp: item.isSystemApp ? 1 : 0,
        updatedAt: item.updatedAt,
      });
      merged++;
    } else {
      const local = existing[0];
      // Only overwrite if server row is newer
      if (item.updatedAt > local.updatedAt) {
        await db
          .update(appSettings)
          .set({
            appName: item.appName,
            enabled: item.enabled ? 1 : 0,
            isSystemApp: item.isSystemApp ? 1 : 0,
            updatedAt: item.updatedAt,
          })
          .where(eq(appSettings.packageName, item.packageName));
        merged++;
      }
    }
  }

  return { merged };
}

/**
 * Full bidirectional sync: push local → pull remote.
 */
export async function syncAppSettings(
  client: ApiClient,
): Promise<void> {
  await pushAppSettings(client);
  await pullAppSettings(client);
}
