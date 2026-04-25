import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useAppList } from "../hooks/use-app-list";
import { useAppSettings } from "../hooks/use-app-settings";
import { useAppIcon } from "../hooks/use-app-icon";
import { AppIcon } from "../components/AppIcon";
import { ScreenHeader } from "../components/ScreenHeader";
import type { AppInfo } from "../services/app-list-service";

type AppRow = AppInfo & { enabled: boolean };

function resolveEnabled(info: AppInfo, setting?: { enabled: number }): boolean {
  if (setting) return setting.enabled === 1;
  // No explicit setting — system apps default to disabled, user apps to enabled.
  return !info.isSystemApp;
}

function AppSettingsRow({
  item,
  onToggle,
}: {
  item: AppRow;
  onToggle: (pkg: string, appName: string, value: boolean) => void;
}) {
  const { theme } = useUnistyles();
  const icon = useAppIcon(item.packageName);

  return (
    <View style={styles.row}>
      <AppIcon iconBase64={icon} appName={item.appName} size={40} />
      <View style={styles.info}>
        <Text style={styles.appName} numberOfLines={1}>
          {item.appName}
        </Text>
        <Text style={styles.packageName} numberOfLines={1}>
          {item.packageName}
        </Text>
      </View>
      <Switch
        value={item.enabled}
        onValueChange={(val) => onToggle(item.packageName, item.appName, val)}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.accent,
        }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

export default function AppSettingsScreen() {
  const [showSystem, setShowSystem] = useState(false);
  const { appMap, ready } = useAppList(showSystem);
  const { settings, loading, toggle } = useAppSettings();
  const { theme } = useUnistyles();
  const [search, setSearch] = useState("");

  const apps = useMemo<AppRow[]>(() => {
    if (!ready) return [];
    const list: AppRow[] = [];
    for (const [pkg, info] of appMap) {
      const enabled = resolveEnabled(info, settings.get(pkg));
      list.push({ ...info, enabled });
    }
    list.sort((a, b) => a.appName.localeCompare(b.appName));
    return list;
  }, [appMap, ready, settings]);

  const filtered = useMemo(() => {
    if (!search.trim()) return apps;
    const q = search.toLowerCase();
    return apps.filter(
      (a) =>
        a.appName.toLowerCase().includes(q) ||
        a.packageName.toLowerCase().includes(q),
    );
  }, [apps, search]);

  const onToggle = useCallback(
    (pkg: string, appName: string, value: boolean) => {
      toggle(pkg, appName, value);
    },
    [toggle],
  );

  const renderItem = useCallback(
    ({ item }: { item: AppRow }) => (
      <AppSettingsRow item={item} onToggle={onToggle} />
    ),
    [onToggle],
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScreenHeader title="App Settings" />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps..."
          placeholderTextColor={theme.colors.placeholder}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Pressable
        style={styles.systemToggleBtn}
        onPress={() => setShowSystem((v) => !v)}
      >
        <Text style={styles.systemToggleText}>
          {showSystem ? "Hide system apps" : "Show system apps"}
        </Text>
      </Pressable>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.packageName}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading && ready ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {search ? "No matching apps" : "No apps found"}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={<View style={styles.listFooter} />}
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyContent : styles.listContent
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  systemToggleBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  systemToggleText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.divider,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  appName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  packageName: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: theme.colors.textTertiary,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContent: {
    flex: 1,
  },
  listFooter: {
    height: 40,
  },
}));
