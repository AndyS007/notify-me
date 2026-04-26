import { desc } from "drizzle-orm";
import { useCallback, useEffect, useState } from "react";
import { db } from "../db";
import { notifications } from "../db/schema";

export type AppSummary = {
  packageName: string;
  appName: string;
  icon: string | null;
  totalCount: number;
  latestTimestamp: number;
  latestTitle: string;
  latestText: string;
};

const DEFAULT_PAGE_SIZE = 30;

/**
 * Local-first source for the chat-list screen: returns one row per app,
 * picking the row with the highest timestamp per `packageName`. Pagination is
 * by app count, sliced from the in-memory grouped list.
 *
 * The remote `pullAppSummaries()` is invoked separately by the screen and
 * writes into the same `notifications` table, so the next refresh here picks
 * up the freshly-pulled rows automatically.
 *
 * The grouping is done in JS rather than SQL because SQLite/Drizzle don't have
 * a clean idiomatic window-function story across the supported runtimes — and
 * the row count on a phone is small enough that walking it is cheap.
 */
export function useAppSummaries(pageSize: number = DEFAULT_PAGE_SIZE) {
  const [allSummaries, setAllSummaries] = useState<AppSummary[]>([]);
  const [items, setItems] = useState<AppSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    const rows = await db
      .select({
        packageName: notifications.packageName,
        appName: notifications.appName,
        icon: notifications.icon,
        timestamp: notifications.timestamp,
        title: notifications.title,
        text: notifications.text,
      })
      .from(notifications)
      .orderBy(desc(notifications.timestamp));

    const byPkg = new Map<
      string,
      { latest: typeof rows[number]; count: number }
    >();
    for (const r of rows) {
      const existing = byPkg.get(r.packageName);
      if (!existing) {
        byPkg.set(r.packageName, { latest: r, count: 1 });
      } else {
        existing.count++;
        // rows are already sorted DESC, so the first hit is the latest
      }
    }

    const summaries: AppSummary[] = Array.from(byPkg.values())
      .map(({ latest, count }) => ({
        packageName: latest.packageName,
        appName: latest.appName || latest.packageName,
        icon: latest.icon,
        totalCount: count,
        latestTimestamp: latest.timestamp,
        latestTitle: latest.title,
        latestText: latest.text,
      }))
      .sort((a, b) => b.latestTimestamp - a.latestTimestamp);

    setAllSummaries(summaries);
    setLoading(false);
  }, []);

  // Slice into the visible page whenever the underlying list or page changes.
  useEffect(() => {
    setItems(allSummaries.slice(0, (page + 1) * pageSize));
  }, [allSummaries, page, pageSize]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await load();
    setPage(0);
  }, [load]);

  const loadMore = useCallback(() => {
    setPage((p) => {
      const next = p + 1;
      // Only advance if the next page would actually reveal new items.
      return next * pageSize < allSummaries.length ? next : p;
    });
  }, [allSummaries.length, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const hasMore = items.length < allSummaries.length;

  return { items, loading, hasMore, refresh, loadMore };
}
