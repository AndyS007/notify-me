import { between, eq } from 'drizzle-orm';
import { db } from '../db';
import { smsMessages } from '../db/schema';
import {
  fetchSmsApi,
  syncSmsApi,
} from '../api/sms';
import type { ApiClient } from '../api/client';

const BATCH_SIZE = 100;

/**
 * Push unsynced local SMS messages to the backend.
 */
export async function syncUnsyncedSms(
  client: ApiClient,
): Promise<{ created: number; duplicates: number }> {
  const unsynced = await db
    .select()
    .from(smsMessages)
    .where(eq(smsMessages.synced, 0));

  if (unsynced.length === 0) return { created: 0, duplicates: 0 };

  let totalCreated = 0;
  let totalDuplicates = 0;

  for (let i = 0; i < unsynced.length; i += BATCH_SIZE) {
    const chunk = unsynced.slice(i, i + BATCH_SIZE);

    const result = await syncSmsApi(client, {
      messages: chunk.map((m) => ({
        address: m.address,
        body: m.body,
        timestamp: m.timestamp,
      })),
    });

    totalCreated += result.created ?? 0;
    totalDuplicates += result.duplicates ?? 0;

    const ids = chunk.map((m) => m.id);
    for (const id of ids) {
      await db
        .update(smsMessages)
        .set({ synced: 1 })
        .where(eq(smsMessages.id, id));
    }
  }

  return { created: totalCreated, duplicates: totalDuplicates };
}

/**
 * Pull remote SMS messages from the backend into local SQLite.
 * Skips rows that already exist locally (by address + timestamp).
 */
export async function pullRemoteSms(
  client: ApiClient,
): Promise<{ inserted: number }> {
  const page = await fetchSmsApi(client, { page: 0, size: 200 });
  const remoteItems = page.content ?? [];

  if (remoteItems.length === 0) return { inserted: 0 };

  const timestamps = remoteItems
    .map((m) => m.timestamp)
    .filter((t): t is number => t != null);

  if (timestamps.length === 0) return { inserted: 0 };

  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);

  const localRows = await db
    .select({
      address: smsMessages.address,
      timestamp: smsMessages.timestamp,
    })
    .from(smsMessages)
    .where(between(smsMessages.timestamp, minTs, maxTs));

  const localKeys = new Set(
    localRows.map((r) => `${r.address}:${r.timestamp}`),
  );

  let inserted = 0;

  for (const item of remoteItems) {
    if (!item.address || item.timestamp == null) continue;

    const key = `${item.address}:${item.timestamp}`;
    if (localKeys.has(key)) continue;

    await db.insert(smsMessages).values({
      address: item.address,
      body: item.body ?? '',
      timestamp: item.timestamp,
      synced: 1,
    });

    localKeys.add(key);
    inserted++;
  }

  return { inserted };
}
