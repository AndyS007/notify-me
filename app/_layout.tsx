import { useEffect } from 'react';
import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '../src/db';
import migrations from '../drizzle/migrations';
import { loadAppList } from '../src/services/app-list-service';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success) {
      loadAppList();
    }
  }, [success]);

  if (error) {
    return <Text>Migration error: {error.message}</Text>;
  }

  if (!success) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
