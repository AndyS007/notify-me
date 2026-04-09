import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  onPress: () => void;
};

export function PermissionBanner({ onPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification access required</Text>
      <Text style={styles.subtitle}>
        Grant notification listener access so this app can track incoming
        notifications.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Grant Access</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    margin: 16,
    padding: 16,
    backgroundColor: theme.colors.bannerBg,
    borderRadius: 16,
    gap: 8,
    borderWidth: 0.5,
    borderColor: theme.colors.bannerBorder,
  },
  title: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.bannerSubtext,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  buttonText: {
    color: theme.colors.accentText,
    fontSize: 13,
    fontWeight: '700',
  },
}));
