import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";

export function useSignOutConfirm() {
  const { signOut } = useAuth();
  const router = useRouter();

  return useCallback(() => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  }, [signOut, router]);
}
