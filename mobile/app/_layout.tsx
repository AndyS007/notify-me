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
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://7054d28acc84ba0d73c4b7a0c917fe1f@o4511240273461248.ingest.us.sentry.io/4511240331264000",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: false,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

function AppContent() {
  useAppUpdate();
  useEffect(() => {
    initPushNotifications().catch((err) =>
      console.warn("[push] init failed:", err),
    );
  }, []);
  return <Slot />;
}

export default Sentry.wrap(function RootLayout() {
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
});
