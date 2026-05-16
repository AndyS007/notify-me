import { Alert } from "@components/Alert";
import { reportError } from "@utils/error-reporter";
import { useFocusEffect } from "expo-router";
import * as Updates from "expo-updates";
import { useCallback, useEffect, useRef } from "react";

function showUpdateAvailablePrompt(alertShown: React.RefObject<boolean>) {
  if (alertShown.current) return;
  alertShown.current = true;

  Alert.alert(
    "Update Available",
    "A new version is ready. Install now for the latest improvements.",
    [
      {
        text: "Later",
        style: "cancel",
        onPress: () => {
          alertShown.current = false;
        },
      },
      {
        text: "Install Now",
        onPress: async () => {
          try {
            await Updates.fetchUpdateAsync();
          } catch (err) {
            reportError(err);
            Alert.alert(
              "Update Failed",
              "Could not download the update. Please try again later.",
            );
            alertShown.current = false;
          }
        },
      },
    ],
  );
}

export function useAppUpdate() {
  const { isUpdateAvailable, isUpdatePending, isDownloading } =
    Updates.useUpdates();
  const alertShown = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!Updates.isEnabled) return;
      let cancelled = false;

      void (async () => {
        try {
          const result = await Updates.checkForUpdateAsync();
          if (cancelled) return;
          if (!result.isAvailable) return;
          showUpdateAvailablePrompt(alertShown);
        } catch (err) {
          if (!cancelled) reportError(err);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  useEffect(() => {
    if (isUpdatePending) {
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  useEffect(() => {
    if (!isUpdateAvailable) return;
    showUpdateAvailablePrompt(alertShown);
  }, [isUpdateAvailable]);

  return { isDownloading };
}
