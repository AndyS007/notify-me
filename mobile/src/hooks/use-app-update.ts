import { Alert } from 'react-native';
import * as Updates from 'expo-updates';
import { useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';

export function useAppUpdate() {
  const { isUpdateAvailable, isUpdatePending, isDownloading } = Updates.useUpdates();
  const alertShown = useRef(false);
  const t = useTranslation();

  // Check for updates on mount (only in non-dev builds where updates are enabled)
  useEffect(() => {
    if (!Updates.isEnabled) return;
    Updates.checkForUpdateAsync().catch(() => {
      // Silently ignore network errors during update check
    });
  }, []);

  // When an update is downloaded and ready, reload automatically
  useEffect(() => {
    if (isUpdatePending) {
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  // When a new update is available, prompt the user
  useEffect(() => {
    if (!isUpdateAvailable || alertShown.current) return;
    alertShown.current = true;

    Alert.alert(
      t.update.title,
      t.update.message,
      [
        {
          text: t.update.later,
          style: 'cancel',
          onPress: () => {
            alertShown.current = false;
          },
        },
        {
          text: t.update.installNow,
          onPress: () => {
            Updates.fetchUpdateAsync().catch(() => {
              Alert.alert(t.update.errorTitle, t.update.errorMessage);
              alertShown.current = false;
            });
          },
        },
      ],
    );
  }, [isUpdateAvailable, t]);

  return { isDownloading };
}
