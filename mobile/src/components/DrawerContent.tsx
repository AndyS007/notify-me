import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useSignOutConfirm } from "../hooks/use-sign-out-confirm";
import { getDisplayName, getInitials } from "../utils/user";
import { Avatar } from "./Avatar";
import { ThemeToggle } from "./ThemeToggle";

export function DrawerContent(props: DrawerContentComponentProps) {
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const onSignOut = useSignOutConfirm();

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const displayName = getDisplayName(user) || "Account";
  const showEmailLine = email && email !== displayName;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Pressable
        style={styles.profileHeader}
        accessibilityRole="button"
        onPress={() => {
          props.navigation.closeDrawer();
          router.push("/(home)/profile");
        }}
      >
        <Avatar
          uri={user?.imageUrl}
          initials={getInitials(displayName, email)}
          size={44}
        />
        <View style={styles.profileText}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {showEmailLine ? (
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.textTertiary}
        />
      </Pressable>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.itemList}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.themeRow}>
          <Text style={styles.themeLabel}>Theme</Text>
          <ThemeToggle />
        </View>
        <Pressable style={styles.signOutBtn} onPress={onSignOut} hitSlop={6}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color={theme.colors.badge}
          />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  email: {
    color: theme.colors.textTertiary,
    fontSize: 13,
  },
  itemList: {
    paddingTop: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.divider,
    gap: 12,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  themeLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  signOutText: {
    color: theme.colors.badge,
    fontSize: 15,
    fontWeight: "600",
  },
}));
