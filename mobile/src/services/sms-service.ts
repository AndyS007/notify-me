import { db } from '../db';
import { smsMessages } from '../db/schema';

export type RawSms = {
  address: string;
  body: string;
  timestamp?: number;
};

/**
 * Persist an inbound SMS to the local SQLite store.
 * Skips entries with an empty body AND empty address (nothing useful to record).
 */
export async function saveSms(payload: RawSms): Promise<void> {
  const address = (payload.address ?? '').trim();
  const body = (payload.body ?? '').trim();

  if (!address && !body) return;

  await db.insert(smsMessages).values({
    address,
    body,
    timestamp: payload.timestamp ?? Date.now(),
  });
}
