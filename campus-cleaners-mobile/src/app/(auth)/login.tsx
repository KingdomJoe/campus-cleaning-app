import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/lib/theme';

type LoginMethod = 'phone' | 'email';

export default function LoginScreen() {
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    setError('');
    setIsLoading(true);

    try {
      if (method === 'phone') {
        if (!phone.trim()) {
          setError('Please enter your phone number');
          return;
        }
        const formattedPhone = phone.startsWith('+') ? phone : `+233${phone.replace(/^0/, '')}`;
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
          return;
        }
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
        });
        if (otpError) throw otpError;
        router.push({
          pathname: '/(auth)/verify-otp',
          params: { method: 'email', identifier: email.trim() },
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
        )}

        {error ? (
          <Text style={styles.error} variant="bodySmall">
            {error}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSendOTP}
          loading={isLoading}
          disabled={isLoading}
          style={styles.btn}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
          buttonColor={colors.primary}
        >
          Send OTP Code
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
    paddingTop: 80,
    paddingBottom: 40,
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
    marginBottom: spacing.md,
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
});
