import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NotificationRecord } from '../hooks/use-notifications';
import { formatRelativeTime } from '../utils/format-time';
import { useTranslation } from '../i18n';

type Props = {
  item: NotificationRecord;
  isLast: boolean;
};

export function NotificationItem({ item, isLast }: Props) {
  const t = useTranslation();
  return (
    <View style={[styles.container, !isLast && styles.divider]}>
      <View style={styles.content}>
        {!!item.title && (
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
        )}
        {!!item.text && (
          <Text style={styles.text} numberOfLines={2}>
            {item.text}
          </Text>
        )}
        {!item.title && !item.text && (
          <Text style={styles.empty}>{t.notifications.noContent}</Text>
        )}
      </View>
      <Text style={styles.time}>{formatRelativeTime(item.timestamp, t.time)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2c2c2c',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#e0e0e0',
    fontSize: 13,
    fontWeight: '600',
  },
  text: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    color: '#555',
    fontSize: 12,
    fontStyle: 'italic',
  },
  time: {
    color: '#555',
    fontSize: 11,
    marginTop: 2,
    flexShrink: 0,
  },
});
