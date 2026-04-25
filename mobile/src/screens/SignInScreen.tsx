import { useSignIn } from "@clerk/expo";
import { useSignInWithApple } from "@clerk/expo/apple";
import { useSignInWithGoogle } from "@clerk/expo/google";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function SignInScreen() {
  const { signIn } = useSignIn();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const router = useRouter();
  const { theme } = useUnistyles();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    setLoading(true);
    try {
      const { error } = await signIn.password({ identifier: email, password });
      if (error) {
        Alert.alert("Sign in failed", error.message);
        return;
      }
      if (signIn.status === "complete") {
        await signIn.finalize();
        router.replace("/(home)");
      }
    } catch (err: any) {
      Alert.alert("Sign in failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const onApplePress = async () => {
    try {
      const { createdSessionId, setActive: activate } =
        await startAppleAuthenticationFlow();
      if (createdSessionId && activate) {
        await activate({ session: createdSessionId });
        router.replace("/(home)");
      }
    } catch (err: any) {
      if (err.code === "ERR_REQUEST_CANCELED") return;
      Alert.alert("Apple sign-in failed", err.message);
    }
  };

  const onGooglePress = async () => {
    try {
      const { createdSessionId, setActive: activate } =
        await startGoogleAuthenticationFlow();
      if (createdSessionId && activate) {
        await activate({ session: createdSessionId });
        router.replace("/(home)");
      }
    } catch (err: any) {
      if (err.code === "ERR_REQUEST_CANCELED") return;
      Alert.alert("Google sign-in failed", err.message);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Welcome back</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.colors.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.colors.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={onSignInPress}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Signing in…" : "Sign in"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable style={[styles.btn, styles.googleBtn]} onPress={onGooglePress}>
        <Text style={[styles.btnText, styles.googleBtnText]}>
          Continue with Google
        </Text>
      </Pressable>

      {Platform.OS === "ios" && (
        <Pressable style={[styles.btn, styles.appleBtn]} onPress={onApplePress}>
          <Text style={styles.appleBtnText}> Continue with Apple</Text>
        </Pressable>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{"Don't have an account?"}</Text>
        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <Text style={styles.link}>Sign up</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btn: {
    backgroundColor: theme.colors.primaryBtn,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: theme.colors.primaryBtnText,
    fontWeight: "600",
    fontSize: 15,
  },
  googleBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  googleBtnText: {
    color: theme.colors.text,
  },
  appleBtn: {
    backgroundColor: theme.colors.appleBtn,
    borderWidth: 1,
    borderColor: theme.colors.appleBtnBorder,
  },
  appleBtnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.divider,
  },
  dividerLabel: {
    color: theme.colors.textTertiary,
    fontSize: 13,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  footerText: {
    color: theme.colors.textTertiary,
    fontSize: 14,
  },
  link: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
}));
