import { reportError } from "@utils/error-reporter";
import { RawNotification, saveNotification } from "./notification-service";
import { pushSync } from "./sync-service";

const headlessTask = async ({ notification }: { notification: string }) => {
  if (!notification) return;
  try {
    const parsed: RawNotification = JSON.parse(notification);
    await saveNotification(parsed);
    await pushSync();
  } catch (err) {
    // Headless JS task — re-throwing won't propagate to any UI boundary, so
    // report explicitly to make sure background-task failures are tracked.
    reportError(err);
    throw err;
  }
};

export default headlessTask;
