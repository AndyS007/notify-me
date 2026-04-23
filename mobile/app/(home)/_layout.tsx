import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUnistyles } from "react-native-unistyles";
import { syncPushTokenAsync, useRegisterDevice } from "../../src/api/devices";
import {
  pullRemoteNotifications,
  syncUnsynced,
} from "../../src/services/sync-service";
import {
  addPushReceivedListener,
  addPushResponseListener,
} from "../../src/services/push-service";
import { startSmsListener } from "../../src/services/sms-listener";

export default function HomeLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const {
    mutate: registerDevice,
    isSuccess: isDeviceRegistered,
    isPending: isRegistering,
  } = useRegisterDevice();
  const { theme } = useUnistyles();

  useEffect(() => {
    if (!isSignedIn || isDeviceRegistered || isRegistering) return;
    registerDevice(undefined, {
      onSuccess: () => {
        // Fire-and-forget the notification permission prompt + push token
        // upload. This runs AFTER the device row exists so it only ever
        // updates the expoPushToken column.
        syncPushTokenAsync().catch((err) =>
          console.warn("Push token sync failed:", err),
        );
      },
      onError: (err) => {
        console.warn("Device registration failed:", err);
      },
    });
  }, [isSignedIn, isDeviceRegistered, isRegistering, registerDevice]);

  useEffect(() => {
    if (!isDeviceRegistered) return;

    const syncOnPush = () => {
      pullRemoteNotifications().catch((err) =>
        console.warn("[push] pull sync failed:", err),
      );
    };

    const receivedSub = addPushReceivedListener(syncOnPush);
    const responseSub = addPushResponseListener(syncOnPush);

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isDeviceRegistered]);

  useEffect(() => {
    if (!isDeviceRegistered) return;
    startSmsListener(() => {
      syncUnsynced().catch(() => {});
    }).catch(() => {});
  }, [isDeviceRegistered]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Gate every home screen on the device being registered. Downstream code
  // (sync-service, push listeners, SMS listener) can assume the backend has
  // a row for this device.
  if (!isDeviceRegistered) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.surface,
        }}
      >
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textTertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: "Devices",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="phone-portrait-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "App Settings",
          href: Platform.OS === "android" ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
