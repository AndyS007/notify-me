import { Platform } from "react-native";
import RNAndroidNotificationListener from "react-native-android-notification-listener";
import { db } from "../db";
import { notifications } from "../db/schema";
import { isAppEnabled } from "./app-settings-service";

export type RawNotification = {
  app: string;
  title: string;
  titleBig: string;
  text: string;
  subText: string;
  summaryText: string;
  bigText: string;
  audioContentsURI: string;
  imageBackgroundURI: string;
  extraInfoText: string;
  groupedMessages: { title: string; text: string }[];
};

export async function getPermissionStatus(): Promise<string> {
  // iOS has no equivalent to Android's NotificationListenerService — report
  // authorized so the permission banner never appears on iOS.
  if (Platform.OS !== "android") return "authorized";
  return RNAndroidNotificationListener.getPermissionStatus();
}

export function openPermissionSettings(): void {
  if (Platform.OS !== "android") return;
  RNAndroidNotificationListener.requestPermission();
}

export async function saveNotification(
  payload: RawNotification,
  appName = "",
): Promise<void> {
  const title = payload.title ?? "";
  const text = payload.text || payload.bigText || "";

  // Skip notifications with empty title and content
  if (!title.trim() && !text.trim()) return;

  // Skip notifications from disabled apps
  const packageName = payload.app ?? "";
  const enabled = await isAppEnabled(packageName);
  if (!enabled) return;

  await db.insert(notifications).values({
    packageName,
    appName,
    title,
    text,
    timestamp: Date.now(),
    icon: null,
  });
}
