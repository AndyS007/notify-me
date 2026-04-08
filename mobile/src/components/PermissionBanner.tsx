import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '../i18n';

type Props = {
  onPress: () => void;
};

export function PermissionBanner({ onPress }: Props) {
  const t = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.permission.title}</Text>
      <Text style={styles.subtitle}>{t.permission.description}</Text>
      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.buttonText}>{t.permission.grantAccess}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1c2f4a',
    borderRadius: 16,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2a4a6e',
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8aa8c8',
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#0a84ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
