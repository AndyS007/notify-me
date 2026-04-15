import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useSms } from '../hooks/use-sms';
import { useSmsPermission } from '../hooks/use-sms-permission';
import { useApiClient } from '../api/client';
import { pullRemoteSms, syncUnsyncedSms } from '../services/sms-sync-service';
import { startSmsListener } from '../services/sms-listener';
import { SmsGroup } from '../components/SmsGroup';
import { EmptyState } from '../components/EmptyState';
import { ThemeToggle } from '../components/ThemeToggle';

export default function SmsScreen() {
  const { groups, loading, refresh } = useSms();
  const { hasPermission, request, recheck } = useSmsPermission();
  const { theme } = useUnistyles();
  const client = useApiClient();

  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerPushSync = useCallback(() => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      syncUnsyncedSms(client).catch(() => {});
    }, 1000);
  }, [client]);

  const triggerPullSync = useCallback(() => {
    if (pullTimerRef.current) clearTimeout(pullTimerRef.current);
    pullTimerRef.current = setTimeout(() => {
      pullRemoteSms(client).catch(() => {});
    }, 1000);
  }, [client]);

  // Refresh list + push sync whenever the SMS listener writes a new row
  useEffect(() => {
    const sub = SQLite.addDatabaseChangeListener(({ tableName }) => {
      if (tableName === 'sms_messages') {
        refresh();
        triggerPushSync();
      }
    });
    return () => sub.remove();
  }, [refresh, triggerPushSync]);

  // On focus: refresh, push, pull, and (re)start the listener
  useFocusEffect(
    useCallback(() => {
      refresh();
      triggerPushSync();
      triggerPullSync();
      if (hasPermission) {
        startSmsListener(triggerPushSync).catch(() => {});
      }
    }, [refresh, triggerPushSync, triggerPullSync, hasPermission]),
  );

  // Poll permission while not granted (user may grant via system dialog)
  useEffect(() => {
    if (hasPermission) return;
    const id = setInterval(recheck, 3000);
    return () => clearInterval(id);
  }, [hasPermission, recheck]);

  const onRefresh = useCallback(async () => {
    try {
      await pullRemoteSms(client);
    } catch {
      // ignore — keep local data
    }
    refresh();
    triggerPushSync();
  }, [client, refresh, triggerPushSync]);

  const handleRequestPermission = useCallback(async () => {
    const granted = await request();
    if (granted) {
      startSmsListener(triggerPushSync).catch(() => {});
    }
  }, [request, triggerPushSync]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>SMS</Text>
        <View style={styles.headerRight}>
          {groups.length > 0 && (
            <Text style={styles.subtitle}>{groups.length} senders</Text>
          )}
          <ThemeToggle />
        </View>
      </View>

      {hasPermission === false && (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>SMS access required</Text>
          <Text style={styles.bannerSubtitle}>
            Grant READ_SMS and RECEIVE_SMS permissions so this app can record
            incoming messages.
          </Text>
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={handleRequestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.bannerButtonText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={groups}
        keyExtractor={(g) => g.address}
        renderItem={({ item }) => <SmsGroup group={item} />}
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
  banner: {
    margin: 16,
    padding: 16,
    backgroundColor: theme.colors.bannerBg,
    borderRadius: 16,
    gap: 8,
    borderWidth: 0.5,
    borderColor: theme.colors.bannerBorder,
  },
  bannerTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: theme.colors.bannerSubtext,
    fontSize: 13,
    lineHeight: 18,
  },
  bannerButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  bannerButtonText: {
    color: theme.colors.accentText,
    fontSize: 13,
    fontWeight: '700',
  },
}));
