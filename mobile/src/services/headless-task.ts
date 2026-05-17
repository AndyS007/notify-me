import { reportError } from "@utils/error-reporter";
import { appendDebugLog } from "./debug-log-service";
import { RawNotification, saveNotification } from "./notification-service";
import { pushSync } from "./sync-service";

const headlessTask = async ({ notification }: { notification: string }) => {
  if (!notification) return;
  try {
    const parsed: RawNotification = JSON.parse(notification);
    await appendDebugLog({
      source: "headless-task",
      message: `notification from ${parsed.app ?? "(unknown)"}`,
      data: parsed,
    });
    await saveNotification(parsed);
    await pushSync();
  } catch (err) {
    await appendDebugLog({
      level: "error",
      source: "headless-task",
      message: err instanceof Error ? err.message : String(err),
      data: { raw: notification },
    });
    // Headless JS task — re-throwing won't propagate to any UI boundary, so
    // report explicitly to make sure background-task failures are tracked.
    reportError(err);
    throw err;
  }
};

export default headlessTask;
