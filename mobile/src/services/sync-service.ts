import { between, eq } from "drizzle-orm";
import { ApiClient } from "../api/client";
import {
  fetchNotificationsApi,
  syncNotificationsApi,
} from "../api/notifications";
import { db } from "../db";
import { notifications } from "../db/schema";

const BATCH_SIZE = 100;

/**
 * Push unsynced local notifications to the backend.
 */
export async function syncUnsynced(
  client: ApiClient,
): Promise<{ created: number; duplicates: number }> {
  const unsynced = await db
    .select()
    .from(notifications)
    .where(eq(notifications.synced, 0));

  if (unsynced.length === 0) return { created: 0, duplicates: 0 };

  let totalCreated = 0;
  let totalDuplicates = 0;

  for (let i = 0; i < unsynced.length; i += BATCH_SIZE) {
    const chunk = unsynced.slice(i, i + BATCH_SIZE);

    const result = await syncNotificationsApi(client, {
      notifications: chunk.map((n) => ({
        packageName: n.packageName,
        appName: n.appName,
        title: n.title,
        text: n.text,
        timestamp: n.timestamp,
      })),
    });

    totalCreated += result.created ?? 0;
    totalDuplicates += result.duplicates ?? 0;

    // Mark these rows as synced
    const ids = chunk.map((n) => n.id);
    for (const id of ids) {
      await db
        .update(notifications)
        .set({ synced: 1 })
        .where(eq(notifications.id, id));
    }
  }

  return { created: totalCreated, duplicates: totalDuplicates };
}

/**
 * Pull remote notifications from the backend into local SQLite.
 * Skips notifications that already exist locally (by packageName + timestamp).
 */
export async function pullRemoteNotifications(
  client: ApiClient,
): Promise<{ inserted: number }> {
  const page = await fetchNotificationsApi(client, { page: 0, size: 200 });
  const remoteItems = page.content ?? [];

  if (remoteItems.length === 0) return { inserted: 0 };

  // Get the timestamp range of remote items for efficient local lookup
  const timestamps = remoteItems
    .map((n) => n.timestamp)
    .filter((t): t is number => t != null);

  if (timestamps.length === 0) return { inserted: 0 };

  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);

  // Fetch all local notifications in the timestamp range
  const localRows = await db
    .select({
      packageName: notifications.packageName,
      timestamp: notifications.timestamp,
    })
    .from(notifications)
    .where(between(notifications.timestamp, minTs, maxTs));

  // Build a Set for fast dedup lookup
  const localKeys = new Set(
    localRows.map((r) => `${r.packageName}:${r.timestamp}`),
  );

  let inserted = 0;

  for (const item of remoteItems) {
    if (!item.packageName || item.timestamp == null) continue;

    const key = `${item.packageName}:${item.timestamp}`;
    if (localKeys.has(key)) continue;

    await db.insert(notifications).values({
      packageName: item.packageName,
      appName: item.appName ?? "",
      title: item.title ?? "",
      text: item.text ?? "",
      timestamp: item.timestamp,
      icon: null,
      synced: 1,
    });

    localKeys.add(key); // prevent inserting duplicates within the same batch
    inserted++;
  }

  return { inserted };
}
