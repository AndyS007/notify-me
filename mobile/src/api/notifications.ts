import {
  api,
  type AppSummaryPageResponse,
  type SyncPullResponse,
  type SyncPushRequest,
  type SyncPushResponse,
} from "./backend";

export type {
  AppSummaryPageResponse,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
};

export async function fetchAppSummariesApi(params?: {
  page?: number;
  size?: number;
}): Promise<AppSummaryPageResponse> {
  return api.fetchAppSummaries(params);
}

export async function syncPullApi(params?: {
  since?: number;
  before?: number;
  limit?: number;
}): Promise<SyncPullResponse> {
  return api.syncPull(params);
}

export async function syncPushApi(
  request: SyncPushRequest,
): Promise<SyncPushResponse> {
  return api.syncPush(request);
}
