import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { StyleSheet } from "react-native-unistyles";
import { AppIcon } from "./AppIcon";
import { ContextMenu, type ContextMenuAction } from "./ContextMenu";
import { useAppIcon } from "../hooks/use-app-icon";
import { AppInfo } from "../services/app-list-service";
import { AppSummary } from "../hooks/use-app-summaries";
import { formatRelativeTime } from "../utils/format-time";

type Props = {
  summary: AppSummary;
  appInfo: AppInfo | undefined;
  onPress: (summary: AppSummary) => void;
  onDisableApp?: (packageName: string, appName: string) => void;
};

export function AppSummaryRow({
  summary,
  appInfo,
  onPress,
  onDisableApp,
}: Props) {
  const [menuVisible, setMenuVisible] = useState(false);
  const asyncIcon = useAppIcon(summary.packageName);

  const displayName =
    appInfo?.appName || summary.appName || summary.packageName;
  const icon = asyncIcon || summary.icon;

  const preview = summary.latestTitle
    ? `${summary.latestTitle}: ${summary.latestText}`
    : summary.latestText;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMenuVisible(true);
  };

  const menuActions = useMemo<ContextMenuAction[]>(
    () => [
      {
        label: `Stop notifications from ${displayName}`,
        destructive: true,
        onPress: () => onDisableApp?.(summary.packageName, displayName),
      },
    ],
    [displayName, summary.packageName, onDisableApp],
  );

  return (
    <View>
      <ContextMenu
        visible={menuVisible}
        title={displayName}
        actions={menuActions}
        onClose={() => setMenuVisible(false)}
      />
      <TouchableOpacity
        style={styles.row}
        onPress={() => onPress(summary)}
        onLongPress={handleLongPress}
        activeOpacity={0.6}
      >
        <AppIcon iconBase64={icon} appName={displayName} size={48} />
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={styles.appName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.time}>
              {formatRelativeTime(summary.latestTimestamp)}
            </Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.preview} numberOfLines={1}>
              {preview || "(no content)"}
            </Text>
            {summary.totalCount > 1 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{summary.totalCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: theme.colors.surface,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  time: {
    color: theme.colors.textTertiary,
    fontSize: 11,
  },
  preview: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  badge: {
    backgroundColor: theme.colors.badge,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: theme.colors.badgeText,
    fontSize: 11,
    fontWeight: "700",
  },
}));
