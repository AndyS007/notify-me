import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import { db } from '../db';
import { notifications } from '../db/schema';

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
  groupedMessages: Array<{ title: string; text: string }>;
};

export async function getPermissionStatus(): Promise<string> {
  return RNAndroidNotificationListener.getPermissionStatus();
}

export function openPermissionSettings(): void {
  RNAndroidNotificationListener.requestPermission();
}

export async function saveNotification(
  payload: RawNotification,
  appName = '',
): Promise<void> {
  await db.insert(notifications).values({
    packageName: payload.app ?? '',
    appName,
    title: payload.title ?? '',
    text: payload.text || payload.bigText || '',
    timestamp: Date.now(),
    icon: null,
  });
}
