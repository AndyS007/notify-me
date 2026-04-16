import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { StyleSheet } from 'react-native-unistyles';
import { AppIcon } from './AppIcon';
import { NotificationItem } from './NotificationItem';
import { ContextMenu, type ContextMenuAction } from './ContextMenu';
import { NotificationGroup } from '../hooks/use-notifications';
import { useAppIcon } from '../hooks/use-app-icon';
import { AppInfo } from '../services/app-list-service';
import { formatRelativeTime } from '../utils/format-time';

type Props = {
  group: NotificationGroup;
  appInfo: AppInfo | undefined;
  onDisableApp?: (packageName: string, appName: string) => void;
};

export function AppNotificationGroup({ group, appInfo, onDisableApp }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const asyncIcon = useAppIcon(group.packageName);

  const displayName = appInfo?.appName || group.appName || group.packageName;
  const icon = asyncIcon || group.icon;
  const latest = group.items[0];

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenuVisible(true);
  };

  const menuActions = useMemo<ContextMenuAction[]>(
    () => [
      {
        label: `Stop notifications from ${displayName}`,
        destructive: true,
        onPress: () => onDisableApp?.(group.packageName, displayName),
      },
    ],
    [displayName, group.packageName, onDisableApp],
  );

  return (
    <Animated.View layout={LinearTransition} style={styles.card}>
      <ContextMenu
        visible={menuVisible}
        title={displayName}
        actions={menuActions}
        onClose={() => setMenuVisible(false)}
      />
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        onLongPress={handleLongPress}
        activeOpacity={0.75}
      >
        <AppIcon iconBase64={icon} appName={displayName} size={44} />

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.appName} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{group.items.length}</Text>
            </View>
          </View>

          {!expanded && (
            <Text style={styles.preview} numberOfLines={1}>
              {latest.title ? `${latest.title}: ` : ''}
              {latest.text}
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
            <NotificationItem
              key={item.id}
              item={item}
              isLast={index === group.items.length - 1}
              onLongPress={handleLongPress}
            />
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
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
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
}));
