import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useEffect, useRef } from 'react';
import { registerDevice } from '../../src/services/device-registration-service';

export default function HomeLayout() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!isSignedIn || registered.current) return;
    registered.current = true;

    getToken().then((token) => {
      if (token) {
        registerDevice(token).catch((err) =>
          console.warn('Device registration failed:', err)
        );
      }
    });
  }, [isSignedIn, getToken]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
