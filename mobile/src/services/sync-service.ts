import { Mutex } from "async-mutex";
import { eq, inArray } from "drizzle-orm";
import {
  getLocalDeviceId,
  isDeviceRegistered,
  waitForDeviceRegistration,
} from "../api/devices";
import { syncPullApi, syncPushApi } from "../api/notifications";
import type { SyncRecord } from "../api/backend";
import { db } from "../db";
import { notifications } from "../db/schema";
import {
  SYNC_KEYS,
  getSyncStateNumber,
  getSyncStateValue,
  setSyncStateNumber,
  setSyncStateValue,
} from "../db/sync-state";

const PUSH_BATCH_SIZE = 100;
const PULL_PAGE_SIZE = 200;
// Cap the number of pages we walk in one bootstrap pass. The bootstrap is
// resumable (we persist the cursor as we go) so dropping out early just
// means the next launch picks up where we left off, which is preferable to
// thrashing the device for minutes on a huge backlog.
const PULL_MAX_PAGES = 50;

const pushMutex = new Mutex();
const pullMutex = new Mutex();

/**
 * Push every locally-modified row to the server.
 *
 * Each push is a full upsert keyed by the row's `clientId`; the server
 * applies last-write-wins on `updatedAt`. For each result we either:
 *  - mark the row synced and stamp the assigned `serverRevision`, or
 *  - leave it pending if the server kept its own newer copy (`accepted=false`),
 *    which the next pull will hand us as the canonical version.
 */
export async function pushSync(): Promise<{
  pushed: number;
  rejected: number;
}> {
  return pushMutex.runExclusive(async () => {
    if (!isDeviceRegistered()) {
      const pending = waitForDeviceRegistration();
      if (!pending) return { pushed: 0, rejected: 0 };
      try {
        await pending;
      } catch {
        return { pushed: 0, rejected: 0 };
      }
    }

    const localDeviceId = await getLocalDeviceId();

    const pending = await db
      .select()
      .from(notifications)
      .where(eq(notifications.synced, 0));

    if (pending.length === 0) return { pushed: 0, rejected: 0 };

    let pushed = 0;
    let rejected = 0;

    for (let i = 0; i < pending.length; i += PUSH_BATCH_SIZE) {
      const chunk = pending.slice(i, i + PUSH_BATCH_SIZE);

      const resp = await syncPushApi({
        items: chunk.map((n) => ({
          id: n.clientId,
          deviceId: n.deviceId || localDeviceId,
          packageName: n.packageName,
          appName: n.appName,
          title: n.title,
          text: n.text,
          timestamp: n.timestamp,
          updatedAt: n.updatedAt,
          deletedAt: n.deletedAt ?? undefined,
        })),
      });

      const resultByClientId = new Map(
        resp.results.map((r) => [r.id, r]),
      );

      for (const n of chunk) {
        const r = resultByClientId.get(n.clientId);
        if (!r) continue;
        if (r.accepted) {
          await db
            .update(notifications)
            .set({ synced: 1, serverRevision: r.revision })
            .where(eq(notifications.id, n.id));
          pushed++;
        } else {
          // Server has a newer version; record its revision but keep our
          // pending flag so a future edit re-pushes. The next pull will
          // overwrite our local copy with the server's.
          await db
            .update(notifications)
            .set({ serverRevision: r.revision })
            .where(eq(notifications.id, n.id));
          rejected++;
        }
      }
    }

    return { pushed, rejected };
  });
}

/**
 * Walk the server feed and write any new/updated rows into the local DB.
 *
 * Two phases:
 *  1. **Bootstrap (DESC by `before`)** — runs only on devices that have
 *     never completed a full sync. Pulls newest-first so the chat-list is
 *     usable as soon as the first page lands. Persists the cursor between
 *     pages so an interrupted bootstrap resumes on next launch.
 *  2. **Incremental (ASC by `since`)** — once bootstrap is done, we keep up
 *     by asking for items with `revision > lastSyncRevision`. The cursor
 *     advances monotonically and stops when a page returns nothing new.
 */
export async function pullSync(): Promise<{ ingested: number }> {
  return pullMutex.runExclusive(async () => {
    let ingested = 0;

    const bootstrapDone = await getSyncStateValue(SYNC_KEYS.bootstrapComplete);
    if (bootstrapDone !== "1") {
      ingested += await runBootstrapPull();
    }

    ingested += await runIncrementalPull();
    return { ingested };
  });
}

async function runBootstrapPull(): Promise<number> {
  let ingested = 0;
  let before = await getSyncStateNumber(SYNC_KEYS.bootstrapBeforeCursor);

  for (let page = 0; page < PULL_MAX_PAGES; page++) {
    const resp = await syncPullApi({
      before: before ?? undefined,
      limit: PULL_PAGE_SIZE,
    });

    if (resp.items.length === 0) {
      // Nothing older to fetch — bootstrap is complete. Stash the current
      // server head so the incremental pass starts from the right place.
      await setSyncStateNumber(SYNC_KEYS.lastSyncRevision, resp.serverRevision);
      await setSyncStateValue(SYNC_KEYS.bootstrapBeforeCursor, null);
      await setSyncStateValue(SYNC_KEYS.bootstrapComplete, "1");
      return ingested;
    }

    ingested += await ingestRecords(resp.items);

    if (resp.nextBefore != null) {
      before = resp.nextBefore;
      await setSyncStateNumber(SYNC_KEYS.bootstrapBeforeCursor, before);
    }

    if (!resp.hasMore) {
      await setSyncStateNumber(SYNC_KEYS.lastSyncRevision, resp.serverRevision);
      await setSyncStateValue(SYNC_KEYS.bootstrapBeforeCursor, null);
      await setSyncStateValue(SYNC_KEYS.bootstrapComplete, "1");
      return ingested;
    }
  }

  // Hit the page cap — we'll resume next time.
  return ingested;
}

async function runIncrementalPull(): Promise<number> {
  let ingested = 0;
  let since = (await getSyncStateNumber(SYNC_KEYS.lastSyncRevision)) ?? 0;

  for (let page = 0; page < PULL_MAX_PAGES; page++) {
    const resp = await syncPullApi({ since, limit: PULL_PAGE_SIZE });

    if (resp.items.length === 0) {
      // Caught up. Persist server head as our cursor so the next pull skips
      // any pure-no-op gap (e.g. revisions that ended up filtered out).
      await setSyncStateNumber(SYNC_KEYS.lastSyncRevision, resp.serverRevision);
      return ingested;
    }

    ingested += await ingestRecords(resp.items);

    if (resp.nextSince != null) {
      since = resp.nextSince;
      await setSyncStateNumber(SYNC_KEYS.lastSyncRevision, since);
    }

    if (!resp.hasMore) {
      await setSyncStateNumber(SYNC_KEYS.lastSyncRevision, resp.serverRevision);
      return ingested;
    }
  }

  return ingested;
}

/**
 * Upsert remote rows into the local DB, applying LWW on `updated_at`.
 * Returns the number of rows that produced a change locally (insert + LWW
 * update); rows that lost the LWW comparison or were no-ops are not counted.
 */
async function ingestRecords(records: SyncRecord[]): Promise<number> {
  if (records.length === 0) return 0;

  const ids = records.map((r) => r.id);
  const existing = await db
    .select({
      id: notifications.id,
      clientId: notifications.clientId,
      updatedAt: notifications.updatedAt,
    })
    .from(notifications)
    .where(inArray(notifications.clientId, ids));
  const existingByClientId = new Map(
    existing.map((r) => [r.clientId, r]),
  );

  let touched = 0;
  for (const item of records) {
    const local = existingByClientId.get(item.id);
    if (local) {
      // LWW: skip if our copy is newer (or equal — server already saw it).
      if (item.updatedAt <= local.updatedAt) continue;
      await db
        .update(notifications)
        .set({
          deviceId: item.deviceId,
          packageName: item.packageName,
          appName: item.appName,
          title: item.title,
          text: item.text,
          timestamp: item.timestamp,
          updatedAt: item.updatedAt,
          deletedAt: item.deletedAt ?? null,
          serverRevision: item.revision,
          synced: 1,
        })
        .where(eq(notifications.id, local.id));
      touched++;
    } else {
      await db.insert(notifications).values({
        clientId: item.id,
        deviceId: item.deviceId,
        packageName: item.packageName,
        appName: item.appName,
        title: item.title,
        text: item.text,
        timestamp: item.timestamp,
        updatedAt: item.updatedAt,
        deletedAt: item.deletedAt ?? null,
        serverRevision: item.revision,
        synced: 1,
        icon: null,
      });
      touched++;
    }
  }
  return touched;
}


