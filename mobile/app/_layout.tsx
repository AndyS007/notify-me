import { config } from "@/src/config";
import { ClerkLoaded, ClerkLoading, ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider } from "@tanstack/react-query";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useUnistyles } from "react-native-unistyles";
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

SplashScreen.preventAutoHideAsync().catch(() => {});

function useHideSplashOnMount() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
}

function AppContent() {
  useAppUpdate();
  useHideSplashOnMount();

  useEffect(() => {
    initPushNotifications().catch((err) =>
      console.warn("[push] init failed:", err),
    );
  }, []);

  return <Slot />;
}

function MigrationError({ message }: { message: string }) {
  const { theme } = useUnistyles();
  useHideSplashOnMount();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.background,
        padding: 24,
      }}
    >
      <Text style={{ color: theme.colors.text, fontSize: 16 }}>
        Migration error: {message}
      </Text>
    </View>
  );
}

function ClerkLoadingFallback() {
  const { theme } = useUnistyles();
  // Without this, a slow / hung Clerk hydration would leave the native splash
  // pinned over the spinner forever and the user would see no progress.
  useHideSplashOnMount();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      <ActivityIndicator size="large" color={theme.colors.accent} />
    </View>
  );
}

export default Sentry.wrap(function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return <MigrationError message={error.message} />;
  }

  if (!success) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider
        publishableKey={config.publishableKey}
        tokenCache={tokenCache}
      >
        <ClerkLoading>
          <ClerkLoadingFallback />
        </ClerkLoading>
        <ClerkLoaded>
          <QueryClientProvider client={queryClient}>
            <AppContent />
          </QueryClientProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
});
