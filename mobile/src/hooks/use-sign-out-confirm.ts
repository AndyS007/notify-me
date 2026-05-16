import { useAuth } from "@clerk/expo";
import { Alert } from "@components/Alert";
import { db } from "@db";
import { appSettings, notifications, syncState } from "@db/schema";
import { useCallback } from "react";

export function useSignOutConfirm() {
  const { signOut } = useAuth();

  const cleanDb = useCallback(async () => {
    await Promise.all([
      db.delete(notifications),
      db.delete(appSettings),
      db.delete(syncState),
    ]);
  }, []);
  return useCallback(() => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await cleanDb();
          await signOut();
        },
      },
    ]);
  }, [signOut, cleanDb]);
}
