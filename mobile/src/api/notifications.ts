import { useMutation } from "@tanstack/react-query";
import {
  api,
  type AppSummaryPageResponse,
  type BatchCreateNotificationRequest,
  type BatchCreateNotificationResponse,
  type DeleteNotificationsResponse,
  type NotificationPageResponse,
} from "./backend";

export type {
  AppSummaryPageResponse,
  BatchCreateNotificationRequest,
  BatchCreateNotificationResponse,
  NotificationPageResponse,
  DeleteNotificationsResponse,
};

export async function syncNotificationsApi(
  request: BatchCreateNotificationRequest,
): Promise<BatchCreateNotificationResponse> {
  return api.syncNotifications(request);
}

export async function fetchNotificationsApi(params?: {
  packageName?: string;
  page?: number;
  size?: number;
}): Promise<NotificationPageResponse> {
  return api.fetchNotifications(params);
}

export async function fetchAppSummariesApi(params?: {
  page?: number;
  size?: number;
}): Promise<AppSummaryPageResponse> {
  return api.fetchAppSummaries(params);
}

export async function deleteNotificationApi(id: string): Promise<void> {
  await api.deleteNotification(id);
}

export async function deleteAllNotificationsApi(
  packageName?: string,
): Promise<DeleteNotificationsResponse> {
  return api.deleteAllNotifications(packageName);
}

export function useSyncNotifications() {
  return useMutation({
    mutationFn: (request: BatchCreateNotificationRequest) =>
      syncNotificationsApi(request),
  });
}

export function useDeleteNotification() {
  return useMutation({
    mutationFn: (id: string) => deleteNotificationApi(id),
  });
}

export function useDeleteAllNotifications() {
  return useMutation({
    mutationFn: (packageName?: string) =>
      deleteAllNotificationsApi(packageName),
  });
}
