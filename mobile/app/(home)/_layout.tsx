import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect, useRef } from "react";
import { useUnistyles } from "react-native-unistyles";
import { syncPushTokenAsync, useRegisterDevice } from "../../src/api/devices";
import { DrawerContent } from "../../src/components/DrawerContent";
import {
  addPushReceivedListener,
  addPushResponseListener,
} from "../../src/services/push-service";
import { startSmsListener } from "../../src/services/sms-listener";
import {
  pullRemoteNotifications,
  syncUnsynced,
} from "../../src/services/sync-service";

export default function HomeLayout() {
  const { isSignedIn } = useAuth();
  const { mutate: registerDevice } = useRegisterDevice();
  const registered = useRef(false);
  const { theme } = useUnistyles();

  useEffect(() => {
    if (!isSignedIn || registered.current) return;
    registered.current = true;
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
        // Allow the next run of this effect to retry (e.g. on re-sign-in).
        registered.current = false;
      },
    });
  }, [isSignedIn, registerDevice]);

  useEffect(() => {
    if (!isSignedIn) return;

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
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    startSmsListener(() => {
      syncUnsynced().catch(() => {});
    }).catch(() => {});
  }, [isSignedIn]);

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: theme.colors.background,
        },
        drawerStyle: {
          backgroundColor: theme.colors.background,
        },
        drawerActiveTintColor: theme.colors.accent,
        drawerInactiveTintColor: theme.colors.text,
        drawerActiveBackgroundColor: theme.colors.surface,
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: "500",
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: "Home",
          title: "Home",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "Profile",
          title: "Profile",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      {/*
       * The per-app notifications screen is reachable only via push from the
       * chat-list view, so we keep it out of the drawer's menu but still
       * registered as a Drawer.Screen so the drawer renders its own swipe
       * gestures correctly.
       */}
      <Drawer.Screen
        name="notifications/[packageName]"
        options={{
          drawerItemStyle: { display: "none" },
          title: "Notifications",
          swipeEnabled: false,
        }}
      />
    </Drawer>
  );
}
