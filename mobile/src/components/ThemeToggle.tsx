import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUnistyles } from 'react-native-unistyles';
import { setThemePreference } from '../theme/unistyles';

export function ThemeToggle() {
  const { theme, themeName } = useUnistyles();
  const isDark = themeName === 'dark';

  const onPress = () => {
    setThemePreference(isDark ? 'light' : 'dark');
  };

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={22}
        color={theme.colors.text}
      />
    </Pressable>
  );
}
