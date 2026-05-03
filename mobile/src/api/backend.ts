import { client } from "./client";
import type { components } from "./schema";

export type RegisterDeviceRequest =
  components["schemas"]["RegisterDeviceRequest"];
export type RegisterDeviceResponse =
  components["schemas"]["RegisterDeviceResponse"];
export type DeviceResponse = components["schemas"]["DeviceResponse"];
export type UpdateDeviceRequest = components["schemas"]["UpdateDeviceRequest"];

export type NotificationResponse =
  components["schemas"]["NotificationResponse"];
export type AppSummaryResponse = components["schemas"]["AppSummaryResponse"];
export type AppSummaryPageResponse =
  components["schemas"]["AppSummaryPageResponse"];

export type SyncPushItem = components["schemas"]["SyncPushItem"];
export type SyncPushRequest = components["schemas"]["SyncPushRequest"];
export type SyncPushResponse = components["schemas"]["SyncPushResponse"];
export type SyncPushResultItem =
  components["schemas"]["SyncPushResultItem"];
export type SyncRecord = components["schemas"]["SyncRecord"];
export type SyncPullResponse = components["schemas"]["SyncPullResponse"];

export type AppSettingItem = components["schemas"]["AppSettingItem"];
export type SyncAppSettingsResponse =
  components["schemas"]["SyncAppSettingsResponse"];

export const api = {
  async registerDevice(
    body: RegisterDeviceRequest,
  ): Promise<RegisterDeviceResponse> {
    const { data } = await client.POST("/devices/register", { body });
    return data!;
  },

  async fetchDevices(): Promise<DeviceResponse[]> {
    const { data } = await client.GET("/devices");
    return data ?? [];
  },

  async updateDevice(
    id: string,
    body: UpdateDeviceRequest,
  ): Promise<DeviceResponse> {
    const { data } = await client.PATCH("/devices/{id}", {
      params: { path: { id } },
      body,
    });
    return data!;
  },

  async fetchAppSummaries(params?: {
    page?: number;
    size?: number;
  }): Promise<AppSummaryPageResponse> {
    const { data } = await client.GET("/notifications/apps", {
      params: { query: params },
    });
    return data!;
  },

  async syncPull(params?: {
    since?: number;
    before?: number;
    limit?: number;
  }): Promise<SyncPullResponse> {
    const { data } = await client.GET("/sync/notifications", {
      params: { query: params },
    });
    return data!;
  },

  async syncPush(body: SyncPushRequest): Promise<SyncPushResponse> {
    const { data } = await client.POST("/sync/notifications", { body });
    return data!;
  },

  async pushAppSettings(settings: AppSettingItem[]): Promise<SyncAppSettingsResponse> {
    const { data } = await client.PUT("/app-settings/sync", {
      body: { settings },
    });
    return data!;
  },

  async pullAppSettings(): Promise<AppSettingItem[]> {
    const { data } = await client.GET("/app-settings");
    return data ?? [];
  },
};
