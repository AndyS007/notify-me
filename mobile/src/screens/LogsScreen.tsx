import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { SafeAreaView } from "@components/Screen";
import {
  clearDebugLogs,
  listDebugLogs,
} from "@/src/services/debug-log-service";
import type { DebugLogRecord } from "@db/schema";

const PAGE_SIZE = 500;

export default function LogsScreen() {
  const router = useRouter();
  const { theme } = useUnistyles();
  const [logs, setLogs] = useState<DebugLogRecord[]>([]);

  const loadLogs = useCallback(async () => {
    setLogs(await listDebugLogs(PAGE_SIZE));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs]),
  );

  const onClear = useCallback(async () => {
    await clearDebugLogs();
    await loadLogs();
  }, [loadLogs]);

  const supported = Platform.OS === "android";

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.accent} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Logs</Text>
          <Text style={styles.subtitle}>{logs.length} entries</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={loadLogs} hitSlop={8}>
            <Ionicons
              name="refresh"
              size={22}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClear} hitSlop={8}>
            <Ionicons
              name="trash-outline"
              size={22}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {!supported ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Debug logs are only captured on Android.
          </Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No logs yet</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <LogRow item={item} />}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

function LogRow({ item }: { item: DebugLogRecord }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowMeta}>
        {formatTimestamp(item.createdAt)} · {item.level} · {item.source}
      </Text>
      <Text style={styles.rowMessage} selectable>
        {item.message}
      </Text>
      {item.data ? (
        <Text style={styles.rowData} selectable>
          {item.data}
        </Text>
      ) : null}
    </View>
  );
}

function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  list: {
    paddingVertical: 4,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  rowMeta: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  rowMessage: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: "monospace",
  },
  rowData: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    color: theme.colors.textTertiary,
    fontSize: 14,
    textAlign: "center",
  },
}));
