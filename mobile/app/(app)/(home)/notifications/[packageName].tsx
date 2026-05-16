import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as SQLite from "expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "../../../../src/components/Screen";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import * as Sentry from "@sentry/react-native";
import { AppIcon } from "../../../../src/components/AppIcon";
import { NotificationItem } from "../../../../src/components/NotificationItem";
import { useAppIcon } from "../../../../src/hooks/use-app-icon";
import { useAppList } from "../../../../src/hooks/use-app-list";
import { useAppNotifications } from "../../../../src/hooks/use-app-notifications";
import { pullSync } from "../../../../src/services/sync-service";
import { debounce } from "../../../../src/utils/debounce";

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

  // Keep the local list fresh when the headless task or sync writes new rows.
  // `addDatabaseChangeListener` fires once per row, so a bulk pull (hundreds of
  // inserts) would otherwise stampede `refresh()` and hammer the DB; collapse
  // the burst into a single refresh on the trailing edge.
  useEffect(() => {
    const debouncedRefresh = debounce(refresh, 150);
    const sub = SQLite.addDatabaseChangeListener(({ tableName }) => {
      if (tableName === "notifications") debouncedRefresh();
    });
    return () => {
      debouncedRefresh.cancel();
      sub.remove();
    };
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      // Pull-sync runs at the global level (chat-list focus + push events),
      // but kicking it off again on focus here keeps a stale detail view
      // from lingering if the user navigated straight here.
      pullSync().catch((err) => Sentry.captureException(err));
      refresh();
    }, [refresh]),
  );

  const onRefresh = useCallback(async () => {
    try {
      await pullSync();
    } catch (err) {
      // Pull failed (commonly: offline). Report it but still fall back to
      // whatever's cached locally so the UI stays usable.
      Sentry.captureException(err);
    }
    await refresh();
  }, [refresh]);

  const onEndReached = useCallback(() => {
    if (!hasMore || loading) return;
    loadMore();
  }, [hasMore, loading, loadMore]);

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
        keyExtractor={(item) => item.clientId}
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
