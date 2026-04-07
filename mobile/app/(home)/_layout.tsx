import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useEffect, useRef } from 'react';
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

  return <Stack screenOptions={{ headerShown: false }} />;
}
