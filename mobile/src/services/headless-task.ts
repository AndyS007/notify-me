import { RawNotification, saveNotification } from "./notification-service";
import { syncUnsynced } from "./sync-service";

const headlessTask = async ({ notification }: { notification: string }) => {
  if (!notification) return;
  try {
    const parsed: RawNotification = JSON.parse(notification);
    console.log("headlessTask parsed", parsed);
    await saveNotification(parsed);
    await syncUnsynced();
  } catch (error) {
    console.log("headlessTask error", error);
  }
};

export default headlessTask;
