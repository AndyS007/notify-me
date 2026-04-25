import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Avatar } from "../components/Avatar";
import { ScreenHeader } from "../components/ScreenHeader";
import { useSignOutConfirm } from "../hooks/use-sign-out-confirm";
import { getDisplayName, getInitials } from "../utils/user";

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const { user, isLoaded } = useUser();
  const { theme } = useUnistyles();
  const onSignOut = useSignOutConfirm();

  if (!isLoaded || !user) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <ScreenHeader title="Profile" />
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.textSecondary} />
        </View>
      </SafeAreaView>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const displayName = getDisplayName(user) || "Account";
  const showEmailLine = email && email !== displayName;
  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";
  const lastSignInAt = user.lastSignInAt
    ? new Date(user.lastSignInAt).toLocaleString()
    : "—";

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScreenHeader title="Profile" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.identityCard}>
          <Avatar
            uri={user.imageUrl}
            initials={getInitials(displayName, email)}
            size={96}
          />
          <Text style={styles.name}>{displayName}</Text>
          {showEmailLine ? (
            <Text style={styles.emailLine}>{email}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MetaRow label="Email" value={email || "—"} />
          <MetaRow
            label="Verified"
            value={
              user.primaryEmailAddress?.verification?.status === "verified"
                ? "Yes"
                : "No"
            }
          />
          <MetaRow label="Member since" value={createdAt} />
          <MetaRow label="Last sign-in" value={lastSignInAt} />
          <MetaRow label="User ID" value={user.id} />
        </View>

        <Pressable style={styles.signOutBtn} onPress={onSignOut}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color={theme.colors.badgeText}
          />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  identityCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  name: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  emailLine: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metaLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  metaValue: {
    color: theme.colors.text,
    fontSize: 13,
    flexShrink: 1,
    textAlign: "right",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.badge,
    paddingVertical: 14,
    borderRadius: 12,
  },
  signOutText: {
    color: theme.colors.badgeText,
    fontWeight: "600",
    fontSize: 15,
  },
}));
