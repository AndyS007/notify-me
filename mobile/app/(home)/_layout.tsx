import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRegisterDevice } from '../../src/api/devices';

export default function HomeLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { mutate: registerDevice } = useRegisterDevice();
  const registered = useRef(false);

  useEffect(() => {
    if (!isSignedIn || registered.current) return;
    registered.current = true;
    registerDevice(undefined, {
      onError: (err) => console.warn('Device registration failed:', err),
    });
  }, [isSignedIn, registerDevice]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111', borderTopColor: '#222' },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#555',
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
    </Tabs>
  );
}
