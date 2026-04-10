import AppList from 'react-native-get-app-list';

export type AppInfo = {
  packageName: string;
  appName: string;
  icon: string;
};

let cache: Map<string, AppInfo> | null = null;

export async function loadAppList(): Promise<Map<string, AppInfo>> {
  if (cache && cache.size > 0) return cache;
  try {
    const apps: AppInfo[] = await AppList.getAppList();
    if (apps.length > 0) {
      cache = new Map(apps.map((a) => [a.packageName, a]));
    } else {
      cache = new Map();
    }
  } catch (e) {
    console.warn('Failed to load app list:', e);
    cache = new Map();
  }
  return cache;
}

export function clearAppListCache(): void {
  cache = null;
}
