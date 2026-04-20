import { useMutation, useQuery } from "@tanstack/react-query";
import { client } from "./client";
import type { components } from "./schema";

// ---- Types ----

export type CreateNotificationRequest =
  components["schemas"]["CreateNotificationRequest"];
export type BatchCreateNotificationRequest =
  components["schemas"]["BatchCreateNotificationRequest"];
export type BatchCreateNotificationResponse =
  components["schemas"]["BatchCreateNotificationResponse"];
export type NotificationResponse =
  components["schemas"]["NotificationResponse"];
export type NotificationPageResponse =
  components["schemas"]["NotificationPageResponse"];
export type DeleteNotificationsResponse =
  components["schemas"]["DeleteNotificationsResponse"];

// ---- API functions ----

export async function syncNotificationsApi(
  request: BatchCreateNotificationRequest,
): Promise<BatchCreateNotificationResponse> {
  const { data } = await client.POST("/notifications/batch", { body: request });
  return data!;
}

export async function fetchNotificationsApi(params?: {
  packageName?: string;
  page?: number;
  size?: number;
}): Promise<NotificationPageResponse> {
  const { data } = await client.GET("/notifications", {
    params: { query: params },
  });
  return data!;
}

export async function deleteNotificationApi(id: string): Promise<void> {
  await client.DELETE("/notifications/{id}", {
    params: { path: { id } },
  });
}

export async function deleteAllNotificationsApi(
  packageName?: string,
): Promise<DeleteNotificationsResponse> {
  const { data } = await client.DELETE("/notifications", {
    params: { query: packageName ? { packageName } : {} },
  });
  return data!;
}

// ---- Hooks ----

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
