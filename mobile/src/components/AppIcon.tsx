import React from "react";
import { Image, View, Text, StyleSheet } from "react-native";

type Props = {
  iconBase64?: string | null;
  appName: string;
  size?: number;
};

export function AppIcon({ iconBase64, appName, size = 44 }: Props) {
  const initial = (appName[0] ?? "?").toUpperCase();

  if (iconBase64) {
    return (
      <Image
        source={{ uri: `data:image/png;base64,${iconBase64}` }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 5 },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 5,
          backgroundColor: stringToColor(appName),
        },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 45%, 38%)`;
}

const styles = StyleSheet.create({
  image: {
    resizeMode: "cover",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initial: {
    color: "#fff",
    fontWeight: "700",
  },
});
