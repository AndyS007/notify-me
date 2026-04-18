import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles } from 'react-native-unistyles';
import { useRegisterDevice } from '../../src/api/devices';
import { useApiClient } from '../../src/api/client';
import { pullRemoteNotifications } from '../../src/services/sync-service';
import {
  addPushReceivedListener,
  addPushResponseListener,
} from '../../src/services/push-service';

export default function HomeLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { mutate: registerDevice } = useRegisterDevice();
  const registered = useRef(false);
  const { theme } = useUnistyles();
  const apiClient = useApiClient();

  useEffect(() => {
    if (!isSignedIn || registered.current) return;
    registered.current = true;
    registerDevice(undefined, {
      onError: (err) => console.warn('Device registration failed:', err),
    });
  }, [isSignedIn, registerDevice]);

  useEffect(() => {
    if (!isSignedIn) return;

    // When a push arrives we pull fresh notifications into local SQLite so
    // that when the user focuses the list it reflects what the other device
    // just captured. The screen itself re-loads on focus.
    const syncOnPush = () => {
      pullRemoteNotifications(apiClient).catch((err) =>
        console.warn('[push] pull sync failed:', err),
      );
    };

    const receivedSub = addPushReceivedListener(syncOnPush);
    const responseSub = addPushResponseListener(syncOnPush);

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isSignedIn, apiClient]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
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
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: 'Devices',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="phone-portrait-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'App Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
