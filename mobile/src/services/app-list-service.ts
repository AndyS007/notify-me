import AppList from 'react-native-get-app-list';

export type AppInfo = {
  packageName: string;
  appName: string;
  icon: string;
};

let cache: Map<string, AppInfo> | null = null;

export async function loadAppList(): Promise<Map<string, AppInfo>> {
  if (cache) return cache;
  try {
    const apps: AppInfo[] = await AppList.getAppList();
    cache = new Map(apps.map((a) => [a.packageName, a]));
  } catch {
    cache = new Map();
  }
  return cache;
}
