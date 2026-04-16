import type { ApiClient } from './client';
import type { components } from './schema';

// ---- Types ----

export type AppSettingItem = components['schemas']['AppSettingItem'];
export type SyncAppSettingsRequest = components['schemas']['SyncAppSettingsRequest'];
export type SyncAppSettingsResponse = components['schemas']['SyncAppSettingsResponse'];

// ---- API functions ----

export async function pushAppSettingsApi(
  client: ApiClient,
  settings: AppSettingItem[],
): Promise<SyncAppSettingsResponse> {
  const { data } = await client.PUT('/app-settings/sync', {
    body: { settings },
  });
  return data!;
}

export async function pullAppSettingsApi(
  client: ApiClient,
): Promise<AppSettingItem[]> {
  const { data } = await client.GET('/app-settings');
  return data ?? [];
}
