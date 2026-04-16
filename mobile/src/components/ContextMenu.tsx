import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type ContextMenuAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  visible: boolean;
  title?: string;
  actions: ContextMenuAction[];
  onClose: () => void;
};

export function ContextMenu({ visible, title, actions, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheet}>
            {!!title && (
              <View style={styles.headerRow}>
                <Text style={styles.titleText} numberOfLines={1}>
                  {title}
                </Text>
              </View>
            )}
            {actions.map((action, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.action,
                  i < actions.length - 1 && styles.actionDivider,
                  pressed && styles.actionPressed,
                ]}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
              >
                <Text
                  style={[
                    styles.actionText,
                    action.destructive && styles.destructiveText,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.cancel,
              pressed && styles.actionPressed,
            ]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    marginHorizontal: 12,
    marginBottom: 24,
    gap: 8,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  headerRow: {
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.divider,
    alignItems: 'center',
  },
  titleText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  action: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.divider,
  },
  actionPressed: {
    backgroundColor: theme.colors.border,
  },
  actionText: {
    color: theme.colors.accent,
    fontSize: 17,
  },
  destructiveText: {
    color: theme.colors.badge,
  },
  cancel: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
}));
