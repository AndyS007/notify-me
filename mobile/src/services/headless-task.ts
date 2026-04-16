import { getClerkInstance } from "@clerk/expo";
import { createApiClient } from "../api/client";
import { RawNotification, saveNotification } from "./notification-service";
import { syncUnsynced } from "./sync-service";

const headlessTask = async ({ notification }: { notification: string }) => {
  if (!notification) return;
  try {
    const parsed: RawNotification = JSON.parse(notification);
    console.log("headlessTask parsed", parsed);
    await saveNotification(parsed);

    // Attempt background sync using Clerk instance (supports token refresh)
    const clerk = getClerkInstance();
    const token = await clerk.session?.getToken();
    if (token) {
      const client = createApiClient(() => Promise.resolve(token));
      await syncUnsynced(client);
    }
  } catch (error) {
    console.log("headlessTask error", error);
  }
};

export default headlessTask;
