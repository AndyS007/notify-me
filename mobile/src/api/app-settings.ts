import type { ApiClient } from './client';

export type AppSettingItem = {
  packageName: string;
  appName: string;
  enabled: boolean;
  isSystemApp: boolean;
  updatedAt: number;
};

type SyncAppSettingsRequest = {
  settings: AppSettingItem[];
};

type SyncAppSettingsResponse = {
  created: number;
  updated: number;
};

export async function pushAppSettingsApi(
  client: ApiClient,
  settings: AppSettingItem[],
): Promise<SyncAppSettingsResponse> {
  const res = await client.PUT('/app-settings/sync' as any, {
    body: { settings } as any,
  });
  return (res.data ?? { created: 0, updated: 0 }) as SyncAppSettingsResponse;
}

export async function pullAppSettingsApi(
  client: ApiClient,
): Promise<AppSettingItem[]> {
  const res = await client.GET('/app-settings' as any);
  return (res.data ?? []) as AppSettingItem[];
}
