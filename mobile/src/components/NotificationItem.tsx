import React from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { NotificationRecord } from "../db/schema";
import { formatRelativeTime } from "../utils/format-time";

type Props = {
  item: NotificationRecord;
  isLast: boolean;
  onLongPress?: () => void;
};

export function NotificationItem({ item, isLast, onLongPress }: Props) {
  return (
    <Pressable
      style={[styles.container, !isLast && styles.divider]}
      onLongPress={onLongPress}
    >
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
          <Text style={styles.empty}>(no content)</Text>
        )}
      </View>
      <Text style={styles.time}>{formatRelativeTime(item.timestamp)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.divider,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  text: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontStyle: "italic",
  },
  time: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
    flexShrink: 0,
  },
}));
