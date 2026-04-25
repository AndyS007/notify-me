import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable } from "react-native";
import { useUnistyles } from "react-native-unistyles";

export function DrawerToggleButton() {
  const navigation = useNavigation();
  const { theme } = useUnistyles();

  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
      <Ionicons name="menu-outline" size={26} color={theme.colors.text} />
    </Pressable>
  );
}
