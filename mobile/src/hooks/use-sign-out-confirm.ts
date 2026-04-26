import { useAuth } from "@clerk/expo";
import { useCallback } from "react";
import { Alert } from "react-native";
import { db } from "../db";
import { appSettings, notifications } from "../db/schema";

export function useSignOutConfirm() {
  const { signOut } = useAuth();

  return useCallback(() => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await Promise.all([
            db.delete(notifications),
            db.delete(appSettings),
            signOut(),
          ]);
        },
      },
    ]);
  }, [signOut]);
}
