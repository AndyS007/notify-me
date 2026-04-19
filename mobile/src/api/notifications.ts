import { useMutation, useQuery } from "@tanstack/react-query";
import { useApiClient, type ApiClient } from "./client";
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
  client: ApiClient,
  request: BatchCreateNotificationRequest,
): Promise<BatchCreateNotificationResponse> {
  const { data } = await client.POST("/notifications/batch", { body: request });
  return data!;
}

export async function fetchNotificationsApi(
  client: ApiClient,
  params?: { packageName?: string; page?: number; size?: number },
): Promise<NotificationPageResponse> {
  const { data } = await client.GET("/notifications", {
    params: { query: params },
  });
  return data!;
}

export async function deleteNotificationApi(
  client: ApiClient,
  id: string,
): Promise<void> {
  await client.DELETE("/notifications/{id}", {
    params: { path: { id } },
  });
}

export async function deleteAllNotificationsApi(
  client: ApiClient,
  packageName?: string,
): Promise<DeleteNotificationsResponse> {
  const { data } = await client.DELETE("/notifications", {
    params: { query: packageName ? { packageName } : {} },
  });
  return data!;
}

// ---- Hooks ----

export function useSyncNotifications() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (request: BatchCreateNotificationRequest) =>
      syncNotificationsApi(client, request),
  });
}

export function useRemoteNotifications(packageName?: string, page?: number) {
  const client = useApiClient();
  return useQuery({
    queryKey: ["remote-notifications", packageName, page],
    queryFn: () => fetchNotificationsApi(client, { packageName, page }),
  });
}

export function useDeleteNotification() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotificationApi(client, id),
  });
}

export function useDeleteAllNotifications() {
  const client = useApiClient();
  return useMutation({
    mutationFn: (packageName?: string) =>
      deleteAllNotificationsApi(client, packageName),
  });
}
