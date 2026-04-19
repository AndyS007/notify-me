import React from "react";
import { ActivityIndicator, FlatList, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
  useDevices,
  useUpdateDevicePushEnabled,
  type DeviceResponse,
} from "../api/devices";
import { ThemeToggle } from "../components/ThemeToggle";

function DeviceCard({ device }: { device: DeviceResponse }) {
  const { theme } = useUnistyles();
  const { mutate: updatePushEnabled, isPending } = useUpdateDevicePushEnabled();

  const updatedAt = device.updatedAt ? new Date(device.updatedAt) : null;
  const lastSeen = updatedAt
    ? updatedAt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const pushEnabled = device.pushEnabled ?? true;
  const hasToken = !!device.expoPushToken;

  const onTogglePush = (next: boolean) => {
    if (!device.id) return;
    updatePushEnabled({ id: device.id, pushEnabled: next });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.deviceName} numberOfLines={1}>
          {device.deviceName ?? device.model ?? "Unknown Device"}
        </Text>
        {lastSeen && <Text style={styles.lastSeen}>Last seen {lastSeen}</Text>}
      </View>

      <View style={styles.pushRow}>
        <View style={styles.pushTextCol}>
          <Text style={styles.pushLabel}>Push notifications</Text>
          <Text style={styles.pushHint}>
            {hasToken
              ? "Receive notifications from other devices on this one"
              : "No push token — open the app on this device to register"}
          </Text>
        </View>
        <Switch
          value={pushEnabled}
          onValueChange={onTogglePush}
          disabled={!hasToken || isPending || !device.id}
          trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Brand</Text>
        <Text style={styles.metaValue}>{device.brand ?? "—"}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Model</Text>
        <Text style={styles.metaValue}>{device.model ?? "—"}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>OS</Text>
        <Text style={styles.metaValue}>
          {device.osName && device.osVersion
            ? `${device.osName} ${device.osVersion}`
            : (device.osName ?? "—")}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>App version</Text>
        <Text style={styles.metaValue}>{device.appVersion ?? "—"}</Text>
      </View>
    </View>
  );
}

export default function DevicesScreen() {
  const { data: devices, isLoading, refetch, isRefetching } = useDevices();
  const { theme } = useUnistyles();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Devices</Text>
        <View style={styles.headerRight}>
          {devices && devices.length > 0 && (
            <Text style={styles.subtitle}>{devices.length} registered</Text>
          )}
          <ThemeToggle />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.textSecondary} />
        </View>
      ) : (
        <FlatList
          data={devices ?? []}
          keyExtractor={(d) => d.id ?? d.deviceId ?? Math.random().toString()}
          renderItem={({ item }) => <DeviceCard device={item} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No devices registered</Text>
            </View>
          }
          contentContainerStyle={
            (devices?.length ?? 0) === 0
              ? styles.emptyContent
              : styles.listContent
          }
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: theme.colors.textTertiary,
    fontSize: 14,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: theme.colors.textTertiary,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContent: {
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  deviceName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  lastSeen: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  pushRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    marginVertical: 4,
    gap: 12,
  },
  pushTextCol: {
    flex: 1,
    gap: 2,
  },
  pushLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  pushHint: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  metaValue: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
}));
