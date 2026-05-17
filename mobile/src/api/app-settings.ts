import {
  api,
  type AppSettingItem,
  type SyncAppSettingsResponse,
  type UploadAppIconRequest,
  type UploadAppIconResponse,
} from "./backend";

export type {
  AppSettingItem,
  SyncAppSettingsResponse,
  UploadAppIconRequest,
  UploadAppIconResponse,
};

export async function pushAppSettingsApi(
  settings: AppSettingItem[],
): Promise<SyncAppSettingsResponse> {
  return api.pushAppSettings(settings);
}

export async function pullAppSettingsApi(): Promise<AppSettingItem[]> {
  return api.pullAppSettings();
}

export async function uploadAppIconApi(
  body: UploadAppIconRequest,
): Promise<UploadAppIconResponse> {
  return api.uploadAppIcon(body);
}
