import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from '../i18n';

export function EmptyState() {
  const t = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{t.notifications.empty.icon}</Text>
      <Text style={styles.title}>{t.notifications.empty.title}</Text>
      <Text style={styles.subtitle}>{t.notifications.empty.subtitle}</Text>
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
