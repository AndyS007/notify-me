import React from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { NotificationRecord } from "@db/schema";
import { formatExactTime } from "@utils/format-time";

type Props = {
  item: NotificationRecord;
  onLongPress?: () => void;
};

export function NotificationItem({ item, onLongPress }: Props) {
  return (
    <Pressable style={styles.container} onLongPress={onLongPress}>
      <View style={styles.bubble}>
        <View style={styles.content}>
          {!!item.title && (
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
          )}
          {!!item.text && <Text style={styles.text}>{item.text}</Text>}
          {!item.title && !item.text && (
            <Text style={styles.empty}>(no content)</Text>
          )}
        </View>
        <Text style={styles.time}>{formatExactTime(item.timestamp)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 14,
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
    flexShrink: 0,
  },
}));
