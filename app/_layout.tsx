import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { loadAppList } from '../src/services/app-list-service';

export default function RootLayout() {
  useEffect(() => {
    // Pre-warm app list cache so headless task lookups are fast
    loadAppList();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
