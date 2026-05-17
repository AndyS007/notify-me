import { Platform } from "react-native";
import { desc } from "drizzle-orm";
import { db } from "@db";
import { debugLogs, type DebugLogRecord } from "@db/schema";

export type DebugLogLevel = "info" | "warn" | "error";

const MAX_ROWS = 500;

// Android-only because the only producer today is the
// NotificationListenerService headless task, which never fires on iOS/web.
function isSupported() {
  return Platform.OS === "android";
}

export async function appendDebugLog(opts: {
  level?: DebugLogLevel;
  source: string;
  message: string;
  data?: unknown;
}): Promise<void> {
  if (!isSupported()) return;
  try {
    await db.insert(debugLogs).values({
      createdAt: Date.now(),
      level: opts.level ?? "info",
      source: opts.source,
      message: opts.message,
      data: opts.data === undefined ? null : safeStringify(opts.data),
    });
  } catch {
    // Swallow: the headless task should never crash because debug logging
    // failed.
  }
}

export async function listDebugLogs(
  limit = MAX_ROWS,
): Promise<DebugLogRecord[]> {
  if (!isSupported()) return [];
  return db
    .select()
    .from(debugLogs)
    .orderBy(desc(debugLogs.createdAt))
    .limit(limit);
}

export async function clearDebugLogs(): Promise<void> {
  if (!isSupported()) return;
  await db.delete(debugLogs);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
