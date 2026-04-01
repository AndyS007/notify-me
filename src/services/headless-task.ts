import { RawNotification, saveNotification } from "./notification-service";

const headlessTask = async ({ notification }: { notification: string }) => {
  if (!notification) return;
  try {
    const parsed: RawNotification = JSON.parse(notification);
    console.log("headlessTask parsed", parsed);
    await saveNotification(parsed);
  } catch (error) {
    // malformed notification payload — ignore
    console.log("headlessTask error", error);
  }
};

export default headlessTask;
