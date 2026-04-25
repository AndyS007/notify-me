import { useMutation, useQuery } from "@tanstack/react-query";
import {
  api,
  type BatchCreateNotificationRequest,
  type BatchCreateNotificationResponse,
  type DeleteNotificationsResponse,
  type NotificationPageResponse,
} from "./backend";

export type {
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

export function useRemoteNotifications(packageName?: string, page?: number) {
  return useQuery({
    queryKey: ["remote-notifications", packageName, page],
    queryFn: () => fetchNotificationsApi({ packageName, page }),
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
