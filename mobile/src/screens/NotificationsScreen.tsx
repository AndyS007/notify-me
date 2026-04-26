import React, { useCallback, useEffect, useRef } from "react";
import { FlatList, Platform, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SQLite from "expo-sqlite";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useAppSummaries, AppSummary } from "../hooks/use-app-summaries";
import { useAppList } from "../hooks/use-app-list";
import { useAppSettings } from "../hooks/use-app-settings";
import { usePermission } from "../hooks/use-permission";
import { useSmsPermission } from "../hooks/use-sms-permission";
import {
  pullAppSummaries,
  pullRemoteNotifications,
  syncUnsynced,
} from "../services/sync-service";
import { startSmsListener } from "../services/sms-listener";
import { AppSummaryRow } from "../components/AppSummaryRow";
import { EmptyState } from "../components/EmptyState";
import { PermissionBanner } from "../components/PermissionBanner";
import { ScreenHeader } from "../components/ScreenHeader";

export default function NotificationsScreen() {
  const { items, loading, hasMore, refresh, loadMore } = useAppSummaries();
  const { appMap } = useAppList(true);
  const {
    settings: appSettings,
    toggle: toggleApp,
    refresh: refreshSettings,
  } = useAppSettings();
  const { hasPermission, request, recheck } = usePermission();
  const {
    hasPermission: hasSmsPermission,
    request: requestSms,
    recheck: recheckSms,
  } = useSmsPermission();
  const { theme } = useUnistyles();
  const router = useRouter();

  const visibleItems = items.filter((s) => {
    const setting = appSettings.get(s.packageName);
    return setting ? setting.enabled === 1 : true;
  });

  const handleDisableApp = useCallback(
    (packageName: string, appName: string) => {
      toggleApp(packageName, appName, false);
    },
    [toggleApp],
  );

  const handlePressApp = useCallback(
    (summary: AppSummary) => {
      router.push({
        pathname: "/notifications/[packageName]",
        params: {
          packageName: summary.packageName,
          appName: summary.appName,
        },
      });
    },
    [router],
  );

  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerPushSync = useCallback(() => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      syncUnsynced().catch(() => {});
    }, 1000);
  }, []);

  // First the apps endpoint for fast first paint, then a full pull to keep
  // the local mirror complete. Both write into the same `notifications` table
  // which the SQLite change listener picks up.
  const triggerPullSync = useCallback(() => {
    if (pullTimerRef.current) clearTimeout(pullTimerRef.current);
    pullTimerRef.current = setTimeout(() => {
      pullAppSummaries({ page: 0, size: 30 })
        .catch(() => {})
        .finally(() => {
          pullRemoteNotifications().catch(() => {});
        });
    }, 1000);
  }, []);

  useEffect(() => {
    const sub = SQLite.addDatabaseChangeListener(({ tableName }) => {
      if (tableName === "notifications") {
        refresh();
        triggerPushSync();
      }
      if (tableName === "app_settings") {
        refreshSettings();
      }
    });
    return () => sub.remove();
  }, [refresh, refreshSettings, triggerPushSync]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      triggerPushSync();
      triggerPullSync();
    }, [refresh, triggerPushSync, triggerPullSync]),
  );

  useEffect(() => {
    if (hasPermission) return;
    const id = setInterval(recheck, 3000);
    return () => clearInterval(id);
  }, [hasPermission, recheck]);

  useEffect(() => {
    if (hasSmsPermission) {
      startSmsListener(triggerPushSync).catch(() => {});
      return;
    }
    const id = setInterval(recheckSms, 3000);
    return () => clearInterval(id);
  }, [hasSmsPermission, recheckSms, triggerPushSync]);

  const handleRequestSms = useCallback(async () => {
    const granted = await requestSms();
    if (granted) {
      startSmsListener(triggerPushSync).catch(() => {});
    }
  }, [requestSms, triggerPushSync]);

  const onRefresh = useCallback(async () => {
    try {
      await pullAppSummaries({ page: 0, size: 30 });
      await pullRemoteNotifications();
    } catch {
      // network failure — fall back to whatever's cached locally
    }
    await refresh();
    triggerPushSync();
  }, [refresh, triggerPushSync]);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScreenHeader
        title="Notifications"
        rightContent={
          visibleItems.length > 0 ? (
            <Text style={styles.subtitle}>{visibleItems.length} apps</Text>
          ) : null
        }
      />

      {Platform.OS === "android" && hasPermission === false && (
        <PermissionBanner onPress={request} />
      )}

      {Platform.OS === "android" && hasSmsPermission === false && (
        <PermissionBanner
          onPress={handleRequestSms}
          title="SMS access required"
          subtitle="Grant READ_SMS and RECEIVE_SMS so incoming text messages are captured alongside notifications."
        />
      )}

      <FlatList
        data={visibleItems}
        keyExtractor={(s) => s.packageName}
        renderItem={({ item }) => (
          <AppSummaryRow
            summary={item}
            appInfo={appMap.get(item.packageName)}
            onPress={handlePressApp}
            onDisableApp={handleDisableApp}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={!loading ? <EmptyState /> : null}
        contentContainerStyle={
          visibleItems.length === 0 ? styles.emptyContent : undefined
        }
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
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
  subtitle: {
    color: theme.colors.textTertiary,
    fontSize: 14,
  },
  emptyContent: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76,
    backgroundColor: theme.colors.divider,
  },
}));
