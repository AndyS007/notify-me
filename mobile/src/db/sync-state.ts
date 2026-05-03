import { eq } from "drizzle-orm";
import { db } from ".";
import { syncState } from "./schema";

/**
 * Tiny accessor for the `sync_state` key/value table. Used to persist sync
 * cursors (currently `last_sync_revision`) across launches.
 *
 * Values are stored as strings; callers parse to whatever shape they need.
 * Keep keys flat — this is not a place for complex nesting.
 */
export const SYNC_KEYS = {
  /** Highest server revision the client has fully ingested. */
  lastSyncRevision: "last_sync_revision",
  /**
   * Lowest revision reached during initial bootstrap pagination. While the
   * bootstrap is still walking history backwards, this lives here so we can
   * resume across launches if the user kills the app mid-sync.
   */
  bootstrapBeforeCursor: "bootstrap_before_cursor",
  /** Set to "1" once initial DESC bootstrap has fully completed. */
  bootstrapComplete: "bootstrap_complete",
} as const;

export async function getSyncStateValue(key: string): Promise<string | null> {
  const rows = await db
    .select({ value: syncState.value })
    .from(syncState)
    .where(eq(syncState.key, key))
    .limit(1);
  return rows[0]?.value ?? null;
}

export async function setSyncStateValue(
  key: string,
  value: string | null,
): Promise<void> {
  await db
    .insert(syncState)
    .values({ key, value })
    .onConflictDoUpdate({ target: syncState.key, set: { value } });
}

export async function getSyncStateNumber(key: string): Promise<number | null> {
  const v = await getSyncStateValue(key);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function setSyncStateNumber(
  key: string,
  value: number | null,
): Promise<void> {
  await setSyncStateValue(key, value == null ? null : String(value));
}
