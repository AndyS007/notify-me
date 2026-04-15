import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable } from "react-native";
import { UnistylesRuntime, useUnistyles } from "react-native-unistyles";
import { setThemePreference } from "../theme/unistyles";

export function ThemeToggle() {
  const { theme } = useUnistyles();
  const [isDark, setIsDark] = useState(
    () => UnistylesRuntime.themeName === "dark",
  );

  const onPress = () => {
    const next = !isDark;
    setIsDark(next);
    setThemePreference(next ? "dark" : "light");
  };

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Ionicons
        name={isDark ? "sunny-outline" : "moon-outline"}
        size={22}
        color={theme.colors.text}
      />
    </Pressable>
  );
}
