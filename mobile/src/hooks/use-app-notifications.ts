import { and, desc, eq, lt } from "drizzle-orm";
import { useCallback, useEffect, useState } from "react";
import { db } from "../db";
import { notifications } from "../db/schema";

export type NotificationRecord = typeof notifications.$inferSelect;

const DEFAULT_PAGE_SIZE = 50;

/**
 * Local-first paginated reader for one app's notifications. Uses
 * cursor-by-timestamp pagination (`timestamp < lastSeen`) rather than
 * LIMIT/OFFSET so that newly-inserted rows at the top don't shift later
 * pages — mirrors how chat apps page through messages.
 */
export function useAppNotifications(
  packageName: string | undefined,
  pageSize: number = DEFAULT_PAGE_SIZE,
) {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [oldestTimestamp, setOldestTimestamp] = useState<number | null>(null);

  const fetchPage = useCallback(
    async (cursor: number | null) => {
      if (!packageName) return [];
      const condition =
        cursor != null
          ? and(
              eq(notifications.packageName, packageName),
              lt(notifications.timestamp, cursor),
            )
          : eq(notifications.packageName, packageName);

      return db
        .select()
        .from(notifications)
        .where(condition)
        .orderBy(desc(notifications.timestamp))
        .limit(pageSize + 1);
    },
    [packageName, pageSize],
  );

  const refresh = useCallback(async () => {
    if (!packageName) return;
    setLoading(true);
    const rows = await fetchPage(null);
    const more = rows.length > pageSize;
    const trimmed = more ? rows.slice(0, pageSize) : rows;
    setItems(trimmed);
    setHasMore(more);
    setOldestTimestamp(
      trimmed.length > 0 ? trimmed[trimmed.length - 1].timestamp : null,
    );
    setLoading(false);
  }, [fetchPage, packageName, pageSize]);

  const loadMore = useCallback(async () => {
    if (!packageName || !hasMore || loading || oldestTimestamp == null) return;
    setLoading(true);
    const rows = await fetchPage(oldestTimestamp);
    const more = rows.length > pageSize;
    const trimmed = more ? rows.slice(0, pageSize) : rows;
    setItems((prev) => [...prev, ...trimmed]);
    setHasMore(more);
    if (trimmed.length > 0) {
      setOldestTimestamp(trimmed[trimmed.length - 1].timestamp);
    }
    setLoading(false);
  }, [fetchPage, hasMore, loading, oldestTimestamp, packageName, pageSize]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, hasMore, refresh, loadMore };
}
