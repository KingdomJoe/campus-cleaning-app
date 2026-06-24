import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { signInWithGoogle } from '@/lib/auth/google';
import { colors, spacing } from '@/lib/theme';

type LoginMethod = 'phone' | 'email';

export default function LoginScreen() {
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emailLoginMethod, setEmailLoginMethod] = useState<'password' | 'otp'>('password');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const insets = useSafeAreaInsets();

  const handleGoogleSignInUnified = async () => {
    setError('');
    setIsLoading(true);
    try {
      const success = await signInWithGoogle();
      if (success) {
        await fetchProfile();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInAction = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (method === 'phone') {
        if (!phone.trim()) {
          setError('Please enter your phone number');
          setIsLoading(false);
          return;
        }
        // Clean phone input
        const cleaned = phone.replace(/[^\d+]/g, '');
        const formattedPhone = cleaned.startsWith('+') ? cleaned : `+233${cleaned.replace(/^0/, '')}`;
        
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });
        if (otpError) throw otpError;
        router.push({
          pathname: '/(auth)/verify-otp',
          params: { method: 'phone', identifier: formattedPhone },
        });
      } else {
        if (!email.trim()) {
          setError('Please enter your email');
          setIsLoading(false);
          return;
        }

        if (emailLoginMethod === 'password') {
          if (!password) {
            setError('Please enter your password');
            setIsLoading(false);
            return;
          }
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });
          if (signInError) throw signInError;

          // Successful password login, fetch profile and redirect
          await fetchProfile();
          const role = useAuthStore.getState().role;
          if (!role) {
            router.replace('/(auth)/register');
          } else if (role === 'cleaner') {
            router.replace('/(cleaner)/jobs');
          } else {
            router.replace('/(client)/home');
          }
        } else {
          // Magic link (email OTP)
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
              emailRedirectTo: Linking.createURL('auth/callback'),
            }
          });
          if (otpError) throw otpError;
          router.push({
            pathname: '/(auth)/verify-otp',
            params: { method: 'email', identifier: email.trim() },
          });
        }
      }
    } catch (err: unknown) {
      let message = err instanceof Error ? err.message : 'Authentication failed';
      if (
        message.toLowerCase().includes('unsupported phone provider') ||
        message.toLowerCase().includes('carrier') ||
        message.toLowerCase().includes('sms')
      ) {
        message = 'Your SMS provider/carrier is unsupported. Please switch to the "Email" tab above to log in with your email address.';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title} variant="headlineMedium">
            Welcome back
          </Text>
          <Text style={styles.subtitle} variant="bodyLarge">
            Sign in with your phone or email
          </Text>
        </View>

        <SegmentedButtons
          value={method}
          onValueChange={(v) => setMethod(v as LoginMethod)}
          buttons={[
            { value: 'phone', label: '📱 Phone', style: styles.segmentBtn },
            { value: 'email', label: '📧 Email', style: styles.segmentBtn },
          ]}
          style={styles.segment}
          theme={{ colors: { secondaryContainer: colors.primaryContainer } }}
        />

        {method === 'phone' ? (
          <TextInput
            label="Phone number"
            placeholder="024 XXX XXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            mode="outlined"
            left={<TextInput.Affix text="+233" />}
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            textColor={colors.onSurface}
            theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            <TextInput
              label="Email address"
              placeholder="you@student.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              left={<TextInput.Icon icon="email-outline" />}
              style={styles.input}
              outlineColor={colors.outline}
              activeOutlineColor={colors.primary}
              textColor={colors.onSurface}
              theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
            />

            <SegmentedButtons
              value={emailLoginMethod}
              onValueChange={(v) => setEmailLoginMethod(v as 'password' | 'otp')}
              buttons={[
                { value: 'password', label: '🔒 Password' },
                { value: 'otp', label: '✉️ Magic Link' },
              ]}
              style={styles.emailMethodSegment}
              theme={{ colors: { secondaryContainer: colors.primaryContainer } }}
            />

            {emailLoginMethod === 'password' && (
              <TextInput
                label="Password"
                value={password}
                onChangeText={password => setPassword(password)}
                secureTextEntry={!showPassword}
                mode="outlined"
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                outlineColor={colors.outline}
                activeOutlineColor={colors.primary}
                textColor={colors.onSurface}
                theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
              />
            )}
          </View>
        )}

        {error ? (
          <Text style={styles.error} variant="bodySmall">
            {error}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSignInAction}
          loading={isLoading}
          disabled={isLoading}
          style={styles.btn}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
          buttonColor={colors.primary}
        >
          {method === 'phone'
            ? 'Send OTP Code'
            : emailLoginMethod === 'password'
            ? 'Sign In'
            : 'Send Magic Link'}
        </Button>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>or continue with</Text>
        </View>

        <Button
          mode="outlined"
          onPress={handleGoogleSignInUnified}
          loading={isLoading}
          disabled={isLoading}
          icon="google"
          style={styles.googleBtn}
          contentStyle={styles.googleBtnContent}
        >
          Continue with Google
        </Button>

        <Button
          mode="text"
          onPress={() => router.push('/(auth)/register')}
          textColor={colors.primary}
          style={styles.linkBtn}
        >
          Don't have an account? Register
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.white,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  segment: {
    marginBottom: spacing.lg,
  },
  segmentBtn: {
    borderColor: colors.outline,
  },
  input: {
    backgroundColor: colors.surfaceVariant,
    marginBottom: spacing.xs,
  },
  emailMethodSegment: {
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  error: {
    color: colors.error,
    marginBottom: spacing.md,
  },
  btn: {
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  btnContent: {
    paddingVertical: 6,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  linkBtn: {
    marginTop: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  googleBtn: {
    borderColor: colors.outline,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  googleBtnContent: {
    paddingVertical: 10,
  },
});
