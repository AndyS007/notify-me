import { ExpoAndroidAppList } from "expo-android-app-list";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { apps } from "../db/schema";

export type AppInfo = {
  packageName: string;
  appName: string;
  isSystemApp: boolean;
};

/**
 * Fetch the installed app list from the device and upsert it into SQLite.
 * Returns the freshly-synced rows.
 */
export async function syncAppsFromDevice(): Promise<AppInfo[]> {
  try {
    const devices = await ExpoAndroidAppList.getAll();
    if (devices.length === 0) return [];
    const now = Date.now();
    // Upsert each app. Drizzle doesn't batch onConflictDoUpdate across multiple
    // rows in a single insert, so loop — device counts are in the low hundreds.
    for (const a of devices) {
      await db
        .insert(apps)
        .values({
          packageName: a.packageName,
          appName: a.appName,
          isSystemApp: a.isSystemApp ? 1 : 0,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: apps.packageName,
          set: {
            appName: a.appName,
            isSystemApp: a.isSystemApp ? 1 : 0,
            updatedAt: now,
          },
        });
    }
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
 * system apps (by default they're hidden).
 */
export async function getAllApps(
  includeSystem = false,
): Promise<Map<string, AppInfo>> {
  const rows = includeSystem
    ? await db.select().from(apps)
    : await db.select().from(apps).where(eq(apps.isSystemApp, 0));
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
    .from(apps)
    .where(eq(apps.packageName, packageName))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    packageName: r.packageName,
    appName: r.appName,
    isSystemApp: r.isSystemApp === 1,
  };
}

/**
 * True iff the package is recorded as a system app in SQLite. Returns `false`
 * for unknown packages (safer default — we'd rather let a notification
 * through than silently drop it).
 */
export async function isKnownSystemApp(packageName: string): Promise<boolean> {
  const rows = await db
    .select({ isSystemApp: apps.isSystemApp })
    .from(apps)
    .where(eq(apps.packageName, packageName))
    .limit(1);
  if (rows.length === 0) return false;
  return rows[0].isSystemApp === 1;
}

export async function hasAnyApps(): Promise<boolean> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(apps)
    .limit(1);
  return (rows[0]?.count ?? 0) > 0;
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
