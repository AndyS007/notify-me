import { desc } from "drizzle-orm";
import { useCallback, useEffect, useState } from "react";
import { db } from "../db";
import { notifications } from "../db/schema";

export type NotificationRecord = typeof notifications.$inferSelect;

export type NotificationGroup = {
  packageName: string;
  appName: string;
  icon: string | null;
  latestTimestamp: number;
  items: NotificationRecord[];
};

export function useNotifications() {
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const rows = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.timestamp));

    const map = new Map<string, NotificationRecord[]>();
    for (const row of rows) {
      if (!map.has(row.packageName)) map.set(row.packageName, []);
      map.get(row.packageName)!.push(row);
    }

    const result: NotificationGroup[] = Array.from(map.entries()).map(
      ([pkg, items]) => ({
        packageName: pkg,
        appName: items[0].appName || pkg,
        icon: items[0].icon,
        latestTimestamp: items[0].timestamp,
        items,
      }),
    );
    result.sort((a, b) => b.latestTimestamp - a.latestTimestamp);

    setGroups(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { groups, loading, refresh: load };
}
