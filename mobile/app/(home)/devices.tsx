import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useDevices, type DeviceResponse } from '../../src/api/devices';

function DeviceCard({ device }: { device: DeviceResponse }) {
  const updatedAt = device.updatedAt ? new Date(device.updatedAt) : null;
  const lastSeen = updatedAt
    ? updatedAt.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.deviceName} numberOfLines={1}>
          {device.deviceName ?? device.model ?? 'Unknown Device'}
        </Text>
        {lastSeen && <Text style={styles.lastSeen}>Last seen {lastSeen}</Text>}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Brand</Text>
        <Text style={styles.metaValue}>{device.brand ?? '—'}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Model</Text>
        <Text style={styles.metaValue}>{device.model ?? '—'}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>OS</Text>
        <Text style={styles.metaValue}>
          {device.osName && device.osVersion
            ? `${device.osName} ${device.osVersion}`
            : device.osName ?? '—'}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>App version</Text>
        <Text style={styles.metaValue}>{device.appVersion ?? '—'}</Text>
      </View>
    </View>
  );
}

export default function DevicesScreen() {
  const { data: devices, isLoading, refetch, isRefetching } = useDevices();
  const { signOut } = useAuth();
  const router = useRouter();

  const onSignOut = async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Devices</Text>
        <View style={styles.headerRight}>
          {devices && devices.length > 0 && (
            <Text style={styles.subtitle}>{devices.length} registered</Text>
          )}
          <Pressable onPress={onSignOut}>
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#fff" />
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
            (devices?.length ?? 0) === 0 ? styles.emptyContent : styles.listContent
          }
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
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
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
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
  signOut: {
    color: '#555',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#555',
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
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  deviceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  lastSeen: {
    color: '#555',
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: '#666',
    fontSize: 13,
  },
  metaValue: {
    color: '#aaa',
    fontSize: 13,
  },
});
