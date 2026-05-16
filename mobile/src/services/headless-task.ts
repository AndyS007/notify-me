import * as Sentry from "@sentry/react-native";
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
    // capture explicitly to make sure Sentry sees background-task failures.
    Sentry.captureException(err);
    throw err;
  }
};

export default headlessTask;
