import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

const ANDROID_CHANNEL_ID = "notifications";

// Called once at app start to configure how incoming Expo pushes are rendered
// while the app is in the foreground, and to create the Android channel.
export async function initPushNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Notifications",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563EB",
    });
  }

  // TODO(ios): request provisional / critical alert options here once an
  // Apple Developer account is configured and an APNS key is uploaded to
  // EAS. See docs/push-notifications.md for the setup checklist.
}

// Requests runtime permission (Android 13+) and returns the Expo push token.
// Returns null on simulators/emulators, or when permission is denied.
export async function registerForPushTokenAsync(): Promise<string | null> {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") {
    console.warn("[push] notification permission not granted");
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

  if (!projectId) {
    console.warn(
      "[push] missing EAS projectId; cannot request Expo push token",
    );
    return null;
  }

  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    return result.data;
  } catch (err) {
    console.warn("[push] failed to get Expo push token:", err);
    return null;
  }
}

export function addPushReceivedListener(
  listener: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(listener);
}

export function addPushResponseListener(
  listener: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}
