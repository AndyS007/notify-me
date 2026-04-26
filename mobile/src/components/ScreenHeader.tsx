import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { DrawerToggleButton } from "./DrawerToggleButton";

type ScreenHeaderProps = {
  title: string;
  rightContent?: React.ReactNode;
};

export function ScreenHeader({ title, rightContent }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <DrawerToggleButton />
        <Text style={styles.title}>{title}</Text>
      </View>
      {rightContent ? (
        <View style={styles.headerRight}>{rightContent}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
}));
