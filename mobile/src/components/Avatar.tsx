import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type AvatarProps = {
  uri: string | null | undefined;
  initials: string;
  size: number;
};

export function Avatar({ uri, initials, size }: AvatarProps) {
  const dim = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, dim]} />;
  }

  return (
    <View style={[styles.fallback, dim]}>
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.36) }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  avatar: {
    backgroundColor: theme.colors.surface,
  },
  fallback: {
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: theme.colors.accentText,
    fontWeight: "700",
  },
}));
