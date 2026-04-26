import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ScreenHeader } from "../components/ScreenHeader";
import { db } from "../db";
import { appSettings, notifications } from "../db/schema";

export default function DevScreen() {
  const { theme } = useUnistyles();

  const onClearDb = () => {
    Alert.alert(
      "Clear local DB",
      "Delete all locally stored notifications and app settings?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await Promise.all([
              db.delete(notifications),
              db.delete(appSettings),
            ]);
            Alert.alert("Done", "Local SQLite database cleared.");
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <ScreenHeader title="Dev" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable style={styles.actionBtn} onPress={onClearDb}>
          <Ionicons
            name="trash-outline"
            size={20}
            color={theme.colors.badgeText}
          />
          <Text style={styles.actionText}>Clear local SQLite DB</Text>
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
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.badge,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionText: {
    color: theme.colors.badgeText,
    fontWeight: "600",
    fontSize: 15,
  },
}));
