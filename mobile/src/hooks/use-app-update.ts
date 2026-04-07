import { Alert } from 'react-native';
import * as Updates from 'expo-updates';
import { useEffect, useRef } from 'react';

export function useAppUpdate() {
  const { isUpdateAvailable, isUpdatePending, isDownloading } = Updates.useUpdates();
  const alertShown = useRef(false);

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
      'Update Available',
      'A new version is ready. Install now for the latest improvements.',
      [
        {
          text: 'Later',
          style: 'cancel',
          onPress: () => {
            alertShown.current = false;
          },
        },
        {
          text: 'Install Now',
          onPress: () => {
            Updates.fetchUpdateAsync().catch(() => {
              Alert.alert('Update Failed', 'Could not download the update. Please try again later.');
              alertShown.current = false;
            });
          },
        },
      ],
    );
  }, [isUpdateAvailable]);

  return { isDownloading };
}
