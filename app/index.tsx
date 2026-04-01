import React, { useEffect } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { useNotifications } from '../src/hooks/use-notifications';
import { useAppList } from '../src/hooks/use-app-list';
import { usePermission } from '../src/hooks/use-permission';
import { AppNotificationGroup } from '../src/components/AppNotificationGroup';
import { EmptyState } from '../src/components/EmptyState';
import { PermissionBanner } from '../src/components/PermissionBanner';

export default function ActivityScreen() {
  const { groups, loading, refresh } = useNotifications();
  const { appMap } = useAppList();
  const { hasPermission, request, recheck } = usePermission();

  // Refresh list whenever the headless task writes a new notification to the DB
  useEffect(() => {
    const sub = SQLite.addDatabaseChangeListener(({ tableName }) => {
      if (tableName === 'notifications') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // Re-check permission every 3s while not yet granted (user may grant via settings)
  useEffect(() => {
    if (hasPermission) return;
    const id = setInterval(recheck, 3000);
    return () => clearInterval(id);
  }, [hasPermission, recheck]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {groups.length > 0 && (
          <Text style={styles.subtitle}>{groups.length} apps</Text>
        )}
      </View>

      {hasPermission === false && (
        <PermissionBanner onPress={request} />
      )}

      <FlatList
        data={groups}
        keyExtractor={(g) => g.packageName}
        renderItem={({ item }) => (
          <AppNotificationGroup
            group={item}
            appInfo={appMap.get(item.packageName)}
          />
        )}
        ListEmptyComponent={!loading ? <EmptyState /> : null}
        contentContainerStyle={
          groups.length === 0 ? styles.emptyContent : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor="#555"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#555',
    fontSize: 14,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  emptyContent: {
    flex: 1,
  },
});
