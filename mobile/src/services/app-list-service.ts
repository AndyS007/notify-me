import { ExpoAndroidAppList } from "expo-android-app-list";

export type AppInfo = {
  packageName: string;
  appName: string;
  icon: string | null;
};

let cache: Map<string, AppInfo> | null = null;

export async function loadAppList(): Promise<Map<string, AppInfo>> {
  if (cache && cache.size > 0) return cache;
  try {
    const apps = await ExpoAndroidAppList.getAll();
    if (apps.length > 0) {
      cache = new Map(
        apps.map((a) => [
          a.packageName,
          { packageName: a.packageName, appName: a.appName, icon: null },
        ]),
      );
    } else {
      cache = new Map();
    }
  } catch (e) {
    console.warn("Failed to load app list:", e);
    cache = new Map();
  }
  return cache;
}

const iconCache = new Map<string, string>();

export async function loadAppIcon(
  packageName: string,
  size = 256,
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

export function clearAppListCache(): void {
  cache = null;
}
