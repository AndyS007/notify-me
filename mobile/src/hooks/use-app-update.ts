import { Alert } from "@components/Alert";
import { reportError } from "@utils/error-reporter";
import * as Updates from "expo-updates";
import { useEffect } from "react";

export function useAppUpdate() {
  const { isUpdateAvailable, isUpdatePending, isDownloading } =
    Updates.useUpdates();

  useEffect(() => {
    if (!Updates.isEnabled) return;
    if (!isUpdateAvailable || isUpdatePending || isDownloading) return;

    Updates.fetchUpdateAsync().catch(reportError);
  }, [isUpdateAvailable, isUpdatePending, isDownloading]);

  useEffect(() => {
    if (!isUpdatePending) return;

    Alert.alert(
      "Update Ready",
      "A new version has been downloaded. Restart now to apply.",
      [
        { text: "Later", style: "cancel" },
        {
          text: "Restart Now",
          onPress: () => {
            void Updates.reloadAsync();
          },
        },
      ],
    );
  }, [isUpdatePending]);

  return { isDownloading };
}
