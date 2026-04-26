import { client } from "./client";
import type { components } from "./schema";

export type RegisterDeviceRequest =
  components["schemas"]["RegisterDeviceRequest"];
export type RegisterDeviceResponse =
  components["schemas"]["RegisterDeviceResponse"];
export type DeviceResponse = components["schemas"]["DeviceResponse"];
export type UpdateDeviceRequest = components["schemas"]["UpdateDeviceRequest"];

export type BatchCreateNotificationRequest =
  components["schemas"]["BatchCreateNotificationRequest"];
export type BatchCreateNotificationResponse =
  components["schemas"]["BatchCreateNotificationResponse"];
export type CreatedNotificationItem =
  components["schemas"]["CreatedNotificationItem"];
export type NotificationPageResponse =
  components["schemas"]["NotificationPageResponse"];
export type NotificationResponse =
  components["schemas"]["NotificationResponse"];
export type AppSummaryResponse =
  components["schemas"]["AppSummaryResponse"];
export type AppSummaryPageResponse =
  components["schemas"]["AppSummaryPageResponse"];
export type DeleteNotificationsResponse =
  components["schemas"]["DeleteNotificationsResponse"];

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

  async syncNotifications(
    body: BatchCreateNotificationRequest,
  ): Promise<BatchCreateNotificationResponse> {
    const { data } = await client.POST("/notifications/batch", { body });
    return data!;
  },

  async fetchNotifications(params?: {
    packageName?: string;
    page?: number;
    size?: number;
  }): Promise<NotificationPageResponse> {
    const { data } = await client.GET("/notifications", {
      params: { query: params },
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

  async deleteNotification(id: string): Promise<void> {
    await client.DELETE("/notifications/{id}", {
      params: { path: { id } },
    });
  },

  async deleteAllNotifications(
    packageName?: string,
  ): Promise<DeleteNotificationsResponse> {
    const { data } = await client.DELETE("/notifications", {
      params: { query: packageName ? { packageName } : {} },
    });
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
