import React from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { AlertButton, AlertOptions } from "react-native";

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
  // Defer so React commits the close before opening the next queued alert.
  setTimeout(pump, 0);
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    !!value &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

export const Alert: {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) => void;
} = {
  alert(title, message, buttons, options) {
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
  const { theme } = useUnistyles();
  const [payload, setPayload] = React.useState<AlertPayload | null>(null);
  const [loadingIndex, setLoadingIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    listener = (next) => {
      setPayload(next);
      setLoadingIndex(null);
    };
    pump();
    return () => {
      listener = null;
    };
  }, []);

  if (!payload) return null;

  const isLoading = loadingIndex !== null;
  const cancelable = payload.options?.cancelable !== false && !isLoading;

  const handleDismiss = () => {
    if (isLoading) return;
    const cancelBtn = payload.buttons.find((b) => b.style === "cancel");
    cancelBtn?.onPress?.();
    payload.options?.onDismiss?.();
    finish();
  };

  const handlePress = (btn: AlertButton, index: number) => {
    if (isLoading) return;
    const result = btn.onPress?.();
    if (isThenable(result)) {
      setLoadingIndex(index);
      Promise.resolve(result).then(
        () => finish(),
        (err) => {
          finish();
          // Surface the rejection so the caller's error handling / dev tools
          // still see it instead of being swallowed by the wrapper.
          throw err;
        },
      );
    } else {
      finish();
    }
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
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropTouchable}
          onPress={cancelable ? handleDismiss : undefined}
        />
        <View style={styles.dialog}>
          <View style={styles.body}>
            <Text style={styles.title}>{payload.title}</Text>
            {payload.message ? (
              <Text style={styles.message}>{payload.message}</Text>
            ) : null}
          </View>
          <View style={stacked ? styles.buttonColumn : styles.buttonRow}>
            {payload.buttons.map((btn, i) => {
              const separator =
                i > 0 && (stacked ? styles.separatorTop : styles.separatorLeft);
              const isBtnLoading = loadingIndex === i;
              const dimmed = isLoading && !isBtnLoading;
              const spinnerColor =
                btn.style === "destructive"
                  ? theme.colors.badge
                  : theme.colors.accent;
              return (
                <Pressable
                  key={i}
                  disabled={isLoading}
                  style={[
                    styles.button,
                    separator,
                    !stacked && styles.buttonRowItem,
                    dimmed && styles.dimmed,
                  ]}
                  onPress={() => handlePress(btn, i)}
                >
                  {isBtnLoading ? (
                    <ActivityIndicator size="small" color={spinnerColor} />
                  ) : (
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
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
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
  backdropTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  dimmed: {
    opacity: 0.4,
  },
}));
