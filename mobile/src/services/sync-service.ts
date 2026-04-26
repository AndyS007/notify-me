import { Mutex } from "async-mutex";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  getLocalDeviceId,
  isDeviceRegistered,
  waitForDeviceRegistration,
} from "../api/devices";
import {
  fetchAppSummariesApi,
  fetchNotificationsApi,
  syncNotificationsApi,
} from "../api/notifications";
import { db } from "../db";
import { notifications } from "../db/schema";

const PUSH_BATCH_SIZE = 100;
// Page size used while walking the remote feed during pull. Tuned to balance
// number of round-trips against payload size.
const PULL_PAGE_SIZE = 100;
// Hard upper bound on pages to fetch in a single pull pass. Prevents an
// unbounded loop in the (already unlikely) case that the dedup short-circuit
// fails to fire.
const PULL_MAX_PAGES = 50;

const pushMutex = new Mutex();
const pullMutex = new Mutex();

export async function syncUnsynced(): Promise<{
  created: number;
  duplicates: number;
}> {
  return pushMutex.runExclusive(async () => {
    // The backend rejects notification syncs from unregistered devices, so we
    // wait for registration before sending anything. If registration is still
    // in flight we block on it; if it has never been attempted we bail out
    // and leave the rows in the unsynced state for the next pass.
    if (!isDeviceRegistered()) {
      const pending = waitForDeviceRegistration();
      if (!pending) return { created: 0, duplicates: 0 };
      try {
        await pending;
      } catch {
        return { created: 0, duplicates: 0 };
      }
    }

    const localDeviceId = await getLocalDeviceId();

    const unsynced = await db
      .select()
      .from(notifications)
      .where(eq(notifications.synced, 0));

    if (unsynced.length === 0) return { created: 0, duplicates: 0 };

    let totalCreated = 0;
    let totalDuplicates = 0;

    for (let i = 0; i < unsynced.length; i += PUSH_BATCH_SIZE) {
      const chunk = unsynced.slice(i, i + PUSH_BATCH_SIZE);

      const result = await syncNotificationsApi({
        notifications: chunk.map((n) => ({
          deviceId: n.deviceId || localDeviceId,
          packageName: n.packageName,
          appName: n.appName,
          title: n.title,
          text: n.text,
          timestamp: n.timestamp,
        })),
      });

      totalCreated += result.created ?? 0;
      totalDuplicates += result.duplicates ?? 0;

      // Index returned createdItems by their natural key so we can attach the
      // server-assigned UUID to the matching local row.
      const createdByKey = new Map<string, string>();
      for (const item of result.createdItems ?? []) {
        if (!item.id || item.timestamp == null) continue;
        createdByKey.set(
          `${item.deviceId}:${item.packageName}:${item.timestamp}`,
          item.id,
        );
      }

      for (const n of chunk) {
        const key = `${n.deviceId || localDeviceId}:${n.packageName}:${n.timestamp}`;
        const remoteId = createdByKey.get(key) ?? null;
        await db
          .update(notifications)
          .set({ synced: 1, ...(remoteId ? { remoteId } : {}) })
          .where(eq(notifications.id, n.id));
      }
    }

    return { created: totalCreated, duplicates: totalDuplicates };
  });
}

/**
 * Pull remote notifications page by page until we either run out of pages or
 * encounter a page that yields no new local rows (meaning we've caught up).
 *
 * Dedup strategy:
 *  - Primary: match by `remoteId` (server-assigned UUID). This is exact and
 *    survives clock skew or duplicate timestamps across devices.
 *  - Fallback: match by `(deviceId, packageName, timestamp)` for legacy local
 *    rows that predate the `remoteId` column (synced before the upgrade), so
 *    we don't reinsert the same notification once the server returns it.
 */
export async function pullRemoteNotifications(): Promise<{ inserted: number }> {
  return pullMutex.runExclusive(async () => {
    let inserted = 0;
    let page = 0;

    while (page < PULL_MAX_PAGES) {
      const pageResp = await fetchNotificationsApi({
        page,
        size: PULL_PAGE_SIZE,
      });
      const remoteItems = pageResp.content ?? [];
      if (remoteItems.length === 0) break;

      const pageInserted = await ingestRemoteNotifications(remoteItems);
      inserted += pageInserted;

      // If nothing new on this page, we're caught up. (Legacy rows would
      // back-fill remoteId here on first match.)
      if (pageInserted === 0) break;

      const totalPages = pageResp.totalPages ?? 0;
      if (page + 1 >= totalPages) break;
      page++;
    }

    return { inserted };
  });
}

type RemoteNotification = {
  id?: string;
  deviceId?: string;
  packageName?: string;
  appName?: string;
  title?: string;
  text?: string;
  timestamp?: number;
};

/**
 * Inserts remote notifications that aren't already present locally and
 * back-fills `remoteId` on legacy rows that match by natural key. Returns the
 * number of newly-inserted rows (back-fills don't count).
 */
async function ingestRemoteNotifications(
  remoteItems: RemoteNotification[],
): Promise<number> {
  const valid = remoteItems.filter(
    (n): n is RemoteNotification & {
      id: string;
      packageName: string;
      timestamp: number;
    } =>
      typeof n.id === "string" &&
      typeof n.packageName === "string" &&
      typeof n.timestamp === "number",
  );
  if (valid.length === 0) return 0;

  const remoteIds = valid.map((n) => n.id);
  const existingByRemoteId = await db
    .select({ remoteId: notifications.remoteId })
    .from(notifications)
    .where(inArray(notifications.remoteId, remoteIds));
  const knownRemoteIds = new Set(
    existingByRemoteId
      .map((r) => r.remoteId)
      .filter((v): v is string => typeof v === "string"),
  );

  // For legacy back-fill: rows missing remoteId that match by natural key.
  const candidates = valid.filter((n) => !knownRemoteIds.has(n.id));
  if (candidates.length === 0) return 0;

  const minTs = Math.min(...candidates.map((n) => n.timestamp));
  const maxTs = Math.max(...candidates.map((n) => n.timestamp));
  const legacyRows = await db
    .select({
      id: notifications.id,
      deviceId: notifications.deviceId,
      packageName: notifications.packageName,
      timestamp: notifications.timestamp,
    })
    .from(notifications)
    .where(
      and(
        isNull(notifications.remoteId),
        sql`${notifications.timestamp} BETWEEN ${minTs} AND ${maxTs}`,
      ),
    );
  const legacyByKey = new Map<
    string,
    { id: number; deviceId: string; packageName: string; timestamp: number }
  >();
  for (const r of legacyRows) {
    legacyByKey.set(`${r.deviceId}:${r.packageName}:${r.timestamp}`, r);
  }

  let inserted = 0;
  for (const item of candidates) {
    const naturalKey = `${item.deviceId ?? ""}:${item.packageName}:${item.timestamp}`;
    const legacy = legacyByKey.get(naturalKey);
    if (legacy) {
      // Back-fill the existing row; don't double-insert.
      await db
        .update(notifications)
        .set({ remoteId: item.id, synced: 1 })
        .where(eq(notifications.id, legacy.id));
      continue;
    }

    await db.insert(notifications).values({
      remoteId: item.id,
      deviceId: item.deviceId ?? "",
      packageName: item.packageName,
      appName: item.appName ?? "",
      title: item.title ?? "",
      text: item.text ?? "",
      timestamp: item.timestamp,
      icon: null,
      synced: 1,
    });
    inserted++;
  }

  return inserted;
}

/**
 * Drives the chat-list view: fetches the apps page from the backend so the UI
 * can show one row per app with metadata (latest notification, total count)
 * even before the local mirror has caught up. Also opportunistically ingests
 * the latest-per-app payload so subsequent local queries see the same data.
 *
 * Pagination is page/size based — the caller controls which page to render.
 */
export async function pullAppSummaries(params?: {
  page?: number;
  size?: number;
}): Promise<{
  items: {
    packageName: string;
    appName: string;
    totalCount: number;
    latest: RemoteNotification & { id: string; timestamp: number };
  }[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}> {
  const resp = await fetchAppSummariesApi(params);
  const content = resp.content ?? [];

  // Best-effort ingest of the latest notifications so the local DB stays warm.
  await ingestRemoteNotifications(content.map((c) => c.latest));

  return {
    items: content
      .filter(
        (c): c is typeof c & {
          latest: RemoteNotification & { id: string; timestamp: number };
        } =>
          typeof c.latest?.id === "string" &&
          typeof c.latest?.timestamp === "number",
      )
      .map((c) => ({
        packageName: c.packageName,
        appName: c.appName,
        totalCount: c.totalCount,
        latest: c.latest,
      })),
    totalElements: resp.totalElements ?? 0,
    totalPages: resp.totalPages ?? 0,
    page: resp.page ?? 0,
    size: resp.size ?? (params?.size ?? 0),
  };
}

/**
 * Fetches a single page of notifications for one app and ingests them locally.
 * Used by the detail screen's infinite scroll. Returns pagination metadata so
 * the caller can decide whether to fetch the next page.
 */
export async function pullAppNotifications(
  packageName: string,
  params?: { page?: number; size?: number },
): Promise<{
  inserted: number;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}> {
  const resp = await fetchNotificationsApi({
    packageName,
    page: params?.page ?? 0,
    size: params?.size ?? PULL_PAGE_SIZE,
  });
  const inserted = await ingestRemoteNotifications(resp.content ?? []);
  return {
    inserted,
    page: resp.page ?? 0,
    size: resp.size ?? (params?.size ?? PULL_PAGE_SIZE),
    totalElements: resp.totalElements ?? 0,
    totalPages: resp.totalPages ?? 0,
  };
}

