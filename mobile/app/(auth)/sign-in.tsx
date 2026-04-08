import { useSignIn } from "@clerk/expo";
import { useSignInWithApple } from "@clerk/expo/apple";
import { useSignInWithGoogle } from "@clerk/expo/google";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "../../src/i18n";

export default function SignInScreen() {
  const { signIn } = useSignIn();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const router = useRouter();
  const t = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    setLoading(true);
    try {
      const { error } = await signIn.password({ identifier: email, password });
      if (error) {
        Alert.alert(t.auth.signIn.errorTitle, error.message);
        return;
      }
      if (signIn.status === "complete") {
        await signIn.finalize();
        router.replace("/(home)");
      }
    } catch (err: any) {
      Alert.alert(t.auth.signIn.errorTitle, err.message);
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
      Alert.alert(t.auth.signIn.appleErrorTitle, err.message);
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
      Alert.alert(t.auth.signIn.googleErrorTitle, err.message);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{t.auth.signIn.title}</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder={t.auth.signIn.emailPlaceholder}
          placeholderTextColor='#555'
          autoCapitalize='none'
          keyboardType='email-address'
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder={t.auth.signIn.passwordPlaceholder}
          placeholderTextColor='#555'
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
            {loading ? t.auth.signIn.signingIn : t.auth.signIn.signIn}
          </Text>
        </Pressable>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>{t.auth.signIn.or}</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable style={[styles.btn, styles.googleBtn]} onPress={onGooglePress}>
        <Text style={[styles.btnText, styles.googleBtnText]}>
          {t.auth.signIn.continueWithGoogle}
        </Text>
      </Pressable>

      {Platform.OS === "ios" && (
        <Pressable style={[styles.btn, styles.appleBtn]} onPress={onApplePress}>
          <Text style={styles.btnText}>{t.auth.signIn.continueWithApple}</Text>
        </Pressable>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t.auth.signIn.noAccount}</Text>
        <Link href='/(auth)/sign-up' asChild>
          <Pressable>
            <Text style={styles.link}>{t.auth.signIn.signUpLink}</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#111",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: "#1c1c1c",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  btn: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: "#111",
    fontWeight: "600",
    fontSize: 15,
  },
  googleBtn: {
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  googleBtnText: {
    color: "#fff",
  },
  appleBtn: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#333",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#2a2a2a",
  },
  dividerLabel: {
    color: "#555",
    fontSize: 13,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  footerText: {
    color: "#555",
    fontSize: 14,
  },
  link: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
