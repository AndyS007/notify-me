import { ExpoAndroidAppList } from "expo-android-app-list";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { appSettings } from "../db/schema";

export type AppInfo = {
  packageName: string;
  appName: string;
  isSystemApp: boolean;
};

/**
 * Fetch the installed app list from the device and upsert it into the
 * `app_settings` table. On insert we seed `enabled` from `isSystemApp`
 * (system apps default off, user apps default on). On conflict we refresh
 * the metadata but preserve whatever `enabled` the user has chosen.
 */
export async function syncAppsFromDevice(): Promise<AppInfo[]> {
  try {
    const devices = await ExpoAndroidAppList.getAll();
    if (devices.length === 0) return [];
    const now = Date.now();
    for (const a of devices) {
      const isSystem = a.isSystemApp ? 1 : 0;
      await db
        .insert(appSettings)
        .values({
          packageName: a.packageName,
          appName: a.appName,
          enabled: a.isSystemApp ? 0 : 1,
          isSystemApp: isSystem,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: appSettings.packageName,
          // Do NOT overwrite `enabled` — preserve the user's toggle.
          set: {
            appName: a.appName,
            isSystemApp: isSystem,
            updatedAt: now,
          },
        });
    }
    deviceSyncedThisSession = true;
    return devices.map((a) => ({
      packageName: a.packageName,
      appName: a.appName,
      isSystemApp: a.isSystemApp,
    }));
  } catch (e) {
    console.warn("Failed to sync app list from device:", e);
    return [];
  }
}

/**
 * Read the cached app list from SQLite. Pass `includeSystem=true` to include
 * system apps (by default they're hidden from the list view).
 */
export async function getAllApps(
  includeSystem = false,
): Promise<Map<string, AppInfo>> {
  const rows = includeSystem
    ? await db.select().from(appSettings)
    : await db.select().from(appSettings).where(eq(appSettings.isSystemApp, 0));
  return new Map(
    rows.map((r) => [
      r.packageName,
      {
        packageName: r.packageName,
        appName: r.appName,
        isSystemApp: r.isSystemApp === 1,
      },
    ]),
  );
}

export async function getAppInfo(
  packageName: string,
): Promise<AppInfo | null> {
  const rows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.packageName, packageName))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    packageName: r.packageName,
    appName: r.appName,
    isSystemApp: r.isSystemApp === 1,
  };
}

let deviceSyncedThisSession = false;

/**
 * Whether we've already synced the installed-app list from the device
 * during this app session. Resets on cold start so we always pick up
 * newly installed / uninstalled apps.
 */
export function hasDeviceSyncedThisSession(): boolean {
  return deviceSyncedThisSession;
}

const iconCache = new Map<string, string>();

export async function loadAppIcon(
  packageName: string,
  _size = 256,
): Promise<string | null> {
  if (iconCache.has(packageName)) return iconCache.get(packageName)!;
  try {
    const base64 = await ExpoAndroidAppList.getAppIcon(packageName);
    if (base64) {
      iconCache.set(packageName, base64);
      return base64;
    }
  } catch {
    // icon not available
  }
  return null;
}
