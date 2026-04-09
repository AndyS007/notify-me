import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

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

const styles = StyleSheet.create((theme) => ({
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
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
}));
