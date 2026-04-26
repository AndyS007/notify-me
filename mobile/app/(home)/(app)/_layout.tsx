import { Stack } from "expo-router";
import { useUnistyles } from "react-native-unistyles";

/**
 * Sits between the drawer and the leaf screens so that pushing the
 * per-app detail view from the chat-list animates as a Stack push
 * (slide from right) rather than a Drawer screen swap (no animation).
 */
export default function AppStackLayout() {
  const { theme } = useUnistyles();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="notifications/[packageName]"
        options={{ animation: "slide_from_right" }}
      />
    </Stack>
  );
}
