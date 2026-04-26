import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as SQLite from "expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { AppIcon } from "../../../src/components/AppIcon";
import { NotificationItem } from "../../../src/components/NotificationItem";
import { useAppIcon } from "../../../src/hooks/use-app-icon";
import { useAppList } from "../../../src/hooks/use-app-list";
import { useAppNotifications } from "../../../src/hooks/use-app-notifications";
import { pullAppNotifications } from "../../../src/services/sync-service";

const PAGE_SIZE = 50;

export default function AppNotificationsScreen() {
  const params = useLocalSearchParams<{
    packageName: string;
    appName?: string;
  }>();
  const router = useRouter();
  const { theme } = useUnistyles();
  const { appMap } = useAppList(true);

  const packageName = params.packageName ?? "";
  const { items, loading, hasMore, refresh, loadMore } = useAppNotifications(
    packageName,
    PAGE_SIZE,
  );

  const appInfo = appMap.get(packageName);
  const asyncIcon = useAppIcon(packageName);
  const displayName =
    appInfo?.appName || params.appName || packageName || "Unknown app";
  const icon = asyncIcon ?? null;

  // Tracks the next remote page to fetch on infinite scroll. Reset to 0 on
  // refresh so we re-pull the head and detect any backend deletions/edits.
  const remotePageRef = useRef(0);
  const remoteExhaustedRef = useRef(false);

  const pullRemote = useCallback(
    async (page: number) => {
      if (!packageName || remoteExhaustedRef.current) return;
      try {
        const resp = await pullAppNotifications(packageName, {
          page,
          size: PAGE_SIZE,
        });
        if (page + 1 >= resp.totalPages) {
          remoteExhaustedRef.current = true;
        }
      } catch {
        // Network error — leave the remote cursor where it is so the next
        // attempt retries the same page.
      }
    },
    [packageName],
  );

  // Reload when route param changes (navigating between two apps).
  useEffect(() => {
    remotePageRef.current = 0;
    remoteExhaustedRef.current = false;
  }, [packageName]);

  // Keep the local list fresh when the headless task or sync writes new rows.
  useEffect(() => {
    const sub = SQLite.addDatabaseChangeListener(({ tableName }) => {
      if (tableName === "notifications") {
        refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      remotePageRef.current = 0;
      remoteExhaustedRef.current = false;
      pullRemote(0).then(() => refresh());
    }, [pullRemote, refresh]),
  );

  const onRefresh = useCallback(async () => {
    remotePageRef.current = 0;
    remoteExhaustedRef.current = false;
    await pullRemote(0);
    await refresh();
  }, [pullRemote, refresh]);

  const onEndReached = useCallback(() => {
    if (!hasMore || loading) {
      // Even if local has no more, see if the backend has more.
      if (!remoteExhaustedRef.current) {
        const next = remotePageRef.current + 1;
        remotePageRef.current = next;
        pullRemote(next);
      }
      return;
    }
    loadMore();
  }, [hasMore, loading, loadMore, pullRemote]);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={12}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color={theme.colors.accent}
          />
        </TouchableOpacity>
        <AppIcon iconBase64={icon} appName={displayName} size={36} />
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {items.length} loaded
          </Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) =>
          item.remoteId ?? `${item.packageName}:${item.timestamp}:${item.id}`
        }
        renderItem={({ item, index }) => (
          <NotificationItem
            item={item}
            isLast={index === items.length - 1}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && items.length > 0 ? (
            <ActivityIndicator
              style={styles.footer}
              color={theme.colors.accent}
            />
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={loading && items.length === 0}
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    paddingHorizontal: 4,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  list: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: theme.colors.textTertiary,
    fontSize: 14,
  },
  footer: {
    paddingVertical: 16,
  },
}));
