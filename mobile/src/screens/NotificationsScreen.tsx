import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useNotifications } from '../hooks/use-notifications';
import { useAppList } from '../hooks/use-app-list';
import { usePermission } from '../hooks/use-permission';
import { useApiClient } from '../api/client';
import { syncUnsynced, pullRemoteNotifications } from '../services/sync-service';
import { AppNotificationGroup } from '../components/AppNotificationGroup';
import { EmptyState } from '../components/EmptyState';
import { PermissionBanner } from '../components/PermissionBanner';
import { ThemeToggle } from '../components/ThemeToggle';

export default function NotificationsScreen() {
  const { groups, loading, refresh } = useNotifications();
  // Include system apps in the lookup map so that any notifications from
  // system apps the user has explicitly enabled still get their icon/name.
  const { appMap } = useAppList(true);
  const { hasPermission, request, recheck } = usePermission();
  const { theme } = useUnistyles();
  const client = useApiClient();

  // Debounce timers
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerPushSync = useCallback(() => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      syncUnsynced(client).catch(() => {});
    }, 1000);
  }, [client]);

  const triggerPullSync = useCallback(() => {
    if (pullTimerRef.current) clearTimeout(pullTimerRef.current);
    pullTimerRef.current = setTimeout(() => {
      pullRemoteNotifications(client).catch(() => {});
    }, 1000);
  }, [client]);

  // Refresh list + push sync whenever the headless task writes a new notification to the DB
  useEffect(() => {
    const sub = SQLite.addDatabaseChangeListener(({ tableName }) => {
      if (tableName === 'notifications') {
        refresh();
        triggerPushSync();
      }
    });
    return () => sub.remove();
  }, [refresh, triggerPushSync]);

  // On screen focus: refresh from local DB, push unsynced, pull remote
  useFocusEffect(
    useCallback(() => {
      refresh();
      triggerPushSync();
      triggerPullSync();
    }, [refresh, triggerPushSync, triggerPullSync])
  );

  // Re-check permission every 3s while not yet granted (user may grant via settings)
  useEffect(() => {
    if (hasPermission) return;
    const id = setInterval(recheck, 3000);
    return () => clearInterval(id);
  }, [hasPermission, recheck]);

  const onRefresh = useCallback(async () => {
    try {
      await pullRemoteNotifications(client);
    } catch {
      // pull failed — continue with local data
    }
    refresh();
    triggerPushSync();
  }, [client, refresh, triggerPushSync]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerRight}>
          {groups.length > 0 && (
            <Text style={styles.subtitle}>{groups.length} apps</Text>
          )}
          <ThemeToggle />
        </View>
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
            onRefresh={onRefresh}
            tintColor={theme.colors.refreshIndicator}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textTertiary,
    fontSize: 14,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  emptyContent: {
    flex: 1,
  },
}));
