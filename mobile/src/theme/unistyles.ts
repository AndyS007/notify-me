import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";
import { storage } from "../storage";

const dark = {
  colors: {
    background: "#111111",
    surface: "#1c1c1e",
    text: "#ffffff",
    textSecondary: "#888888",
    textTertiary: "#555555",
    accent: "#0a84ff",
    accentText: "#ffffff",
    primaryBtn: "#ffffff",
    primaryBtnText: "#111111",
    border: "#2a2a2a",
    divider: "#2c2c2c",
    badge: "#ff3b30",
    badgeText: "#ffffff",
    bannerBg: "#1c2f4a",
    bannerBorder: "#2a4a6e",
    bannerSubtext: "#8aa8c8",
    placeholder: "#555555",
    appleBtn: "#000000",
    appleBtnBorder: "#333333",
    refreshIndicator: "#555555",
  },
};

const light = {
  colors: {
    background: "#f2f2f7",
    surface: "#ffffff",
    text: "#000000",
    textSecondary: "#6e6e73",
    textTertiary: "#aeaeb2",
    accent: "#007aff",
    accentText: "#ffffff",
    primaryBtn: "#000000",
    primaryBtnText: "#ffffff",
    border: "#d1d1d6",
    divider: "#e5e5ea",
    badge: "#ff3b30",
    badgeText: "#ffffff",
    bannerBg: "#e8f0fb",
    bannerBorder: "#a8c4e8",
    bannerSubtext: "#3a6ea8",
    placeholder: "#aeaeb2",
    appleBtn: "#1c1c1e",
    appleBtnBorder: "#3a3a3c",
    refreshIndicator: "#aeaeb2",
  },
};

type AppThemes = { dark: typeof dark; light: typeof light };

declare module "react-native-unistyles" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
}

// Read MMKV synchronously — runs at module evaluation time before first render
const storedPref = storage.getString("theme_preference") as
  | "light"
  | "dark"
  | "system"
  | undefined;
const hasManualPref = storedPref === "light" || storedPref === "dark";

StyleSheet.configure({
  themes: { dark, light },
  settings: hasManualPref
    ? { initialTheme: storedPref } // use stored manual preference, no flash
    : { adaptiveThemes: true }, // follow system color scheme (default)
});

export type ThemePreference = "light" | "dark" | "system";

export function setThemePreference(pref: ThemePreference) {
  storage.set("theme_preference", pref);
  if (pref === "system") {
    UnistylesRuntime.setAdaptiveThemes(true);
  } else {
    if (UnistylesRuntime.hasAdaptiveThemes) {
      UnistylesRuntime.setAdaptiveThemes(false);
    }
    UnistylesRuntime.setTheme(pref);
  }
}
