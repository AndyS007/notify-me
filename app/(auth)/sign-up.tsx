import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignUp } from '@clerk/expo';
import { useSignInWithApple } from '@clerk/expo/apple';
import { useSignInWithGoogle } from '@clerk/expo/google';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert('Sign up failed', err.errors?.[0]?.message ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(home)');
      }
    } catch (err: any) {
      Alert.alert('Verification failed', err.errors?.[0]?.message ?? err.message);
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
        router.replace('/(home)');
      }
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple sign-in failed', err.message);
    }
  };

  const onGooglePress = async () => {
    try {
      const { createdSessionId, setActive: activate } =
        await startGoogleAuthenticationFlow();
      if (createdSessionId && activate) {
        await activate({ session: createdSessionId });
        router.replace('/(home)');
      }
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Google sign-in failed', err.message);
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
          placeholderTextColor="#555"
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
            {loading ? 'Verifying…' : 'Verify'}
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
          placeholderTextColor="#555"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#555"
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
            {loading ? 'Creating account…' : 'Sign up'}
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

      {Platform.OS === 'ios' && (
        <Pressable style={[styles.btn, styles.appleBtn]} onPress={onApplePress}>
          <Text style={styles.btnText}> Continue with Apple</Text>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#555',
    fontSize: 14,
    marginBottom: 8,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: '#1c1c1c',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  btn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#111',
    fontWeight: '600',
    fontSize: 15,
  },
  googleBtn: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  googleBtnText: {
    color: '#fff',
  },
  appleBtn: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  dividerLabel: {
    color: '#555',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: '#555',
    fontSize: 14,
  },
  link: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
