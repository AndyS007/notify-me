import {
  api,
  type AppSettingItem,
  type SyncAppSettingsResponse,
} from "./backend";

export type { AppSettingItem, SyncAppSettingsResponse };

export async function pushAppSettingsApi(
  settings: AppSettingItem[],
): Promise<SyncAppSettingsResponse> {
  return api.pushAppSettings(settings);
}

export async function pullAppSettingsApi(): Promise<AppSettingItem[]> {
  return api.pullAppSettings();
}
