import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { SmsGroup as SmsGroupType } from '../hooks/use-sms';
import { formatRelativeTime } from '../utils/format-time';

type Props = {
  group: SmsGroupType;
};

export function SmsGroup({ group }: Props) {
  const [expanded, setExpanded] = useState(false);
  const latest = group.items[0];
  const displayAddress = group.address || 'Unknown';

  return (
    <Animated.View layout={LinearTransition} style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.75}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayAddress.slice(0, 2).toUpperCase()}
          </Text>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.address} numberOfLines={1}>
              {displayAddress}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{group.items.length}</Text>
            </View>
          </View>

          {!expanded && (
            <Text style={styles.preview} numberOfLines={1}>
              {latest.body}
            </Text>
          )}
        </View>

        <View style={styles.headerMeta}>
          <Text style={styles.time}>
            {formatRelativeTime(group.latestTimestamp)}
          </Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.itemList}
        >
          {group.items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.item,
                index === group.items.length - 1 && styles.itemLast,
              ]}
            >
              <Text style={styles.itemBody}>{item.body}</Text>
              <Text style={styles.itemTime}>
                {formatRelativeTime(item.timestamp)}
              </Text>
            </View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.badge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.badgeText,
    fontSize: 14,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  address: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    backgroundColor: theme.colors.badge,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: theme.colors.badgeText,
    fontSize: 11,
    fontWeight: '700',
  },
  preview: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  headerMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  time: {
    color: theme.colors.textTertiary,
    fontSize: 11,
  },
  chevron: {
    color: theme.colors.textTertiary,
    fontSize: 9,
  },
  itemList: {
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.divider,
  },
  item: {
    padding: 12,
    gap: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.divider,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemBody: {
    color: theme.colors.text,
    fontSize: 14,
  },
  itemTime: {
    color: theme.colors.textTertiary,
    fontSize: 11,
  },
}));
