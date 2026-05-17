import { Alert } from "@components/Alert";
import { reportError } from "@utils/error-reporter";
import { useFocusEffect } from "expo-router";
import * as Updates from "expo-updates";
import { useCallback, useRef } from "react";

export function useAppUpdate() {
  const { isUpdatePending, isDownloading } = Updates.useUpdates();
  const alertShown = useRef(false);

  const showUpdateReadyPrompt = useCallback(() => {
    if (alertShown.current) return;
    alertShown.current = true;

    Alert.alert(
      "Update Ready",
      "A new version has been downloaded. Restart now to apply.",
      [
        {
          text: "Later",
          style: "cancel",
          onPress: () => {
            alertShown.current = false;
          },
        },
        {
          text: "Restart Now",
          onPress: () => {
            void Updates.reloadAsync();
          },
        },
      ],
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!Updates.isEnabled) return;
      let cancelled = false;

      void (async () => {
        try {
          if (isUpdatePending) {
            showUpdateReadyPrompt();
            return;
          }
          const result = await Updates.checkForUpdateAsync();
          if (cancelled || !result.isAvailable) return;
          await Updates.fetchUpdateAsync();
          if (cancelled) return;
          showUpdateReadyPrompt();
        } catch (err) {
          if (!cancelled) reportError(err);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [isUpdatePending, showUpdateReadyPrompt]),
  );

  return { isDownloading };
}
