import { config } from "@/src/config";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider } from "@tanstack/react-query";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";
import migrations from "../drizzle/migrations";
import { queryClient } from "../src/api/query-client";
import { db } from "../src/db";
import { useAppUpdate } from "../src/hooks/use-app-update";
import { initPushNotifications } from "../src/services/push-service";

function AppContent() {
  useAppUpdate();
  useEffect(() => {
    initPushNotifications().catch((err) =>
      console.warn("[push] init failed:", err),
    );
  }, []);
  return <Slot />;
}

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return <Text>Migration error: {error.message}</Text>;
  }

  if (!success) {
    return null;
  }

  return (
    <ClerkProvider
      publishableKey={config.publishableKey}
      tokenCache={tokenCache}
    >
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
