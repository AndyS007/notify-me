import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { AlertButton, AlertOptions, AlertStatic } from "react-native";

type AlertPayload = {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  options?: AlertOptions;
};

type Listener = (payload: AlertPayload | null) => void;

let listener: Listener | null = null;
const queue: AlertPayload[] = [];
let current: AlertPayload | null = null;
let nextId = 1;

function pump() {
  if (current || !listener) return;
  const next = queue.shift();
  if (!next) return;
  current = next;
  listener(next);
}

function finish() {
  current = null;
  listener?.(null);
  // Defer so React commits the close before opening the next one.
  setTimeout(pump, 0);
}

export const Alert: Pick<AlertStatic, "alert"> = {
  alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) {
    queue.push({
      id: nextId++,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: "OK" }],
      options,
    });
    pump();
  },
};

export function AlertHost() {
  const [payload, setPayload] = React.useState<AlertPayload | null>(null);

  React.useEffect(() => {
    listener = setPayload;
    pump();
    return () => {
      listener = null;
    };
  }, []);

  if (!payload) return null;

  const cancelable = payload.options?.cancelable !== false;

  const handleDismiss = () => {
    const cancelBtn = payload.buttons.find((b) => b.style === "cancel");
    cancelBtn?.onPress?.();
    payload.options?.onDismiss?.();
    finish();
  };

  const handlePress = (btn: AlertButton) => {
    btn.onPress?.();
    finish();
  };

  const stacked = payload.buttons.length > 2;

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={() => {
        if (cancelable) handleDismiss();
      }}
    >
      <Pressable
        style={styles.backdrop}
        onPress={cancelable ? handleDismiss : undefined}
      >
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <View style={styles.body}>
            <Text style={styles.title}>{payload.title}</Text>
            {payload.message ? (
              <Text style={styles.message}>{payload.message}</Text>
            ) : null}
          </View>
          <View style={stacked ? styles.buttonColumn : styles.buttonRow}>
            {payload.buttons.map((btn, i) => {
              const separatorStyle =
                i > 0 && (stacked ? styles.separatorTop : styles.separatorLeft);
              return (
                <Pressable
                  key={i}
                  style={[
                    styles.button,
                    separatorStyle,
                    !stacked && styles.buttonRowItem,
                  ]}
                  onPress={() => handlePress(btn)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      btn.style === "destructive" && styles.destructive,
                      btn.style === "cancel" && styles.cancel,
                      btn.isPreferred && styles.preferred,
                    ]}
                  >
                    {btn.text ?? "OK"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  dialog: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: theme.colors.border,
  },
  body: {
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  message: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.divider,
  },
  buttonColumn: {
    flexDirection: "column",
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.divider,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonRowItem: {
    flex: 1,
  },
  separatorLeft: {
    borderLeftWidth: 0.5,
    borderLeftColor: theme.colors.divider,
  },
  separatorTop: {
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.divider,
  },
  buttonText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: "400",
  },
  preferred: {
    fontWeight: "700",
  },
  cancel: {
    fontWeight: "600",
  },
  destructive: {
    color: theme.colors.badge,
  },
}));
