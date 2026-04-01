import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function EmptyState() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔔</Text>
      <Text style={styles.title}>No notifications yet</Text>
      <Text style={styles.subtitle}>
        Notifications will appear here once your device receives them.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  icon: {
    fontSize: 52,
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
