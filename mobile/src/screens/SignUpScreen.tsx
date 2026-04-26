import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useSignUp } from "@clerk/expo";
import { useSignInWithApple } from "@clerk/expo/apple";
import { useSignInWithGoogle } from "@clerk/expo/google";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function SignUpScreen() {
  const { signUp } = useSignUp();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const router = useRouter();
  const { theme } = useUnistyles();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignUpPress = async () => {
    setLoading(true);
    try {
      const { error } = await signUp.password({
        emailAddress: email,
        password,
      });
      if (error) {
        Alert.alert("Sign up failed", error.message);
        return;
      }
      if (signUp.status === "missing_requirements") {
        const { error: sendError } = await signUp.verifications.sendEmailCode();
        if (sendError) {
          Alert.alert("Failed to send verification code", sendError.message);
          return;
        }
        setPendingVerification(true);
      } else if (signUp.status === "complete") {
        await signUp.finalize();
        router.replace("/(app)");
      }
    } catch (err: any) {
      Alert.alert("Sign up failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    setLoading(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) {
        Alert.alert("Verification failed", error.message);
        return;
      }
      if (signUp.status === "complete") {
        await signUp.finalize();
        router.replace("/(app)");
      }
    } catch (err: any) {
      Alert.alert("Verification failed", err.message);
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
        router.replace("/(app)");
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
        router.replace("/(app)");
      }
    } catch (err: any) {
      if (err.code === "ERR_REQUEST_CANCELED") return;
      Alert.alert("Google sign-in failed", err.message);
    }
  };

  if (pendingVerification) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Verify email</Text>
        <Text style={styles.subtitle}>Enter the code sent to {email}</Text>
        <TextInput
          style={styles.input}
          placeholder="Verification code"
          placeholderTextColor={theme.colors.placeholder}
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />
        <Pressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={onVerifyPress}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Verifying…" : "Verify"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Create account</Text>

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
          onPress={onSignUpPress}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Creating account…" : "Sign up"}
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
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/sign-in" asChild>
          <Pressable>
            <Text style={styles.link}>Sign in</Text>
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
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.textTertiary,
    fontSize: 14,
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
