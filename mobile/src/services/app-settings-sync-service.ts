import { eq } from "drizzle-orm";
import { db } from "../db";
import { appSettings } from "../db/schema";
import {
  pushAppSettingsApi,
  pullAppSettingsApi,
  type AppSettingItem,
} from "../api/app-settings";

export async function pushAppSettings(): Promise<{
  created: number;
  updated: number;
}> {
  const rows = await db.select().from(appSettings);
  if (rows.length === 0) return { created: 0, updated: 0 };

  const items: AppSettingItem[] = rows.map((r) => ({
    packageName: r.packageName,
    appName: r.appName,
    enabled: r.enabled === 1,
    isSystemApp: r.isSystemApp === 1,
    updatedAt: r.updatedAt,
  }));

  return pushAppSettingsApi(items);
}

export async function pullAppSettings(): Promise<{ merged: number }> {
  const remote = await pullAppSettingsApi();
  if (remote.length === 0) return { merged: 0 };

  let merged = 0;

  for (const item of remote) {
    const existing = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.packageName, item.packageName))
      .limit(1);

    if (existing.length === 0) {
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

export async function syncAppSettings(): Promise<void> {
  await pushAppSettings();
  await pullAppSettings();
}
