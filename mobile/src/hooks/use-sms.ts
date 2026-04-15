import { desc } from 'drizzle-orm';
import { useCallback, useEffect, useState } from 'react';
import { db } from '../db';
import { smsMessages } from '../db/schema';

export type SmsRecord = typeof smsMessages.$inferSelect;

export type SmsGroup = {
  address: string;
  latestTimestamp: number;
  items: SmsRecord[];
};

export function useSms() {
  const [groups, setGroups] = useState<SmsGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const rows = await db
      .select()
      .from(smsMessages)
      .orderBy(desc(smsMessages.timestamp));

    const map = new Map<string, SmsRecord[]>();
    for (const row of rows) {
      if (!map.has(row.address)) map.set(row.address, []);
      map.get(row.address)!.push(row);
    }

    const result: SmsGroup[] = Array.from(map.entries()).map(
      ([address, items]) => ({
        address,
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
