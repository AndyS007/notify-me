import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as Updates from "expo-updates";
import React, { useCallback, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Alert } from "@components/Alert";
import { SafeAreaView } from "@components/Screen";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ScreenHeader } from "@components/ScreenHeader";
import { config } from "@/src/config";
import { db } from "@db";
import { appSettings, notifications, syncState } from "@db/schema";

type SyncStateRow = { key: string; value: string | null };

const ENV_ROWS: SyncStateRow[] = Object.entries(config).map(([key, value]) => ({
  key,
  value: String(value),
}));

const APP_INFO_ROWS: SyncStateRow[] = [
  { key: "env", value: __DEV__ ? "development" : "production" },
  { key: "channel", value: Updates.channel ?? "(none)" },
  { key: "version", value: Constants.expoConfig?.version ?? "(unknown)" },
  { key: "runtime version", value: Updates.runtimeVersion ?? "(none)" },
  { key: "update id", value: Updates.updateId ?? "(embedded)" },
];

export default function DevScreen() {
  const { theme } = useUnistyles();
  const router = useRouter();
  const [syncRows, setSyncRows] = useState<SyncStateRow[]>([]);

  const loadSyncState = useCallback(async () => {
    const rows = await db
      .select({ key: syncState.key, value: syncState.value })
      .from(syncState);
    setSyncRows(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSyncState();
    }, [loadSyncState]),
  );

  const onClearDb = () => {
    Alert.alert(
      "Clear local DB",
      "Delete all locally stored notifications and app settings?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await Promise.all([
              db.delete(notifications),
              db.delete(appSettings),
            ]);
            Alert.alert("Done", "Local SQLite database cleared.");
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader title="Dev" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.actionBtn} onPress={onClearDb}>
          <Ionicons
            name="trash-outline"
            size={20}
            color={theme.colors.badgeText}
          />
          <Text style={styles.actionText}>Clear local SQLite DB</Text>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Environment</Text>
          </View>
          {ENV_ROWS.map((row) => (
            <View key={row.key} style={styles.kvRow}>
              <Text style={styles.kvKey}>{row.key}</Text>
              <Text style={styles.kvValue} selectable>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>App info</Text>
          </View>
          {APP_INFO_ROWS.map((row) => (
            <View key={row.key} style={styles.kvRow}>
              <Text style={styles.kvKey}>{row.key}</Text>
              <Text style={styles.kvValue} selectable>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sync state</Text>
            <Pressable onPress={loadSyncState} hitSlop={8}>
              <Ionicons
                name="refresh"
                size={18}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          </View>
          {syncRows.length === 0 ? (
            <Text style={styles.empty}>(no rows)</Text>
          ) : (
            syncRows.map((row) => (
              <View key={row.key} style={styles.kvRow}>
                <Text style={styles.kvKey}>{row.key}</Text>
                <Text style={styles.kvValue} selectable>
                  {row.value ?? "(null)"}
                </Text>
              </View>
            ))
          )}
        </View>

        {Platform.OS === "android" && (
          <Pressable
            style={styles.navRow}
            onPress={() => router.push("/logs")}
          >
            <View style={styles.navRowLeft}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={theme.colors.text}
              />
              <Text style={styles.navRowLabel}>Logs</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.badge,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionText: {
    color: theme.colors.badgeText,
    fontWeight: "600",
    fontSize: 15,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navRowLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  empty: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontStyle: "italic",
    paddingVertical: 6,
  },
  kvRow: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.divider,
  },
  kvKey: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  kvValue: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: "monospace",
  },
}));
