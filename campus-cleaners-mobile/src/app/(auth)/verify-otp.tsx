import React, { useState, useRef } from 'react';
import { View, StyleSheet, TextInput as RNTextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { uploadAvatar, uploadDocument } from '@/lib/api/uploads';
import { colors, spacing } from '@/lib/theme';

const OTP_LENGTH = 6;

export default function VerifyOTPScreen() {
  const { method, identifier } = useLocalSearchParams<{
    method: 'phone' | 'email';
    identifier: string;
  }>();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(RNTextInput | null)[]>([]);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const insets = useSafeAreaInsets();

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === OTP_LENGTH) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (code: string) => {
    setError('');
    setIsLoading(true);

    try {
      let result;
      if (method === 'phone') {
        result = await supabase.auth.verifyOtp({
          phone: identifier!,
          token: code,
          type: 'sms',
        });
      } else {
        result = await supabase.auth.verifyOtp({
          email: identifier!,
          token: code,
          type: 'email',
        });
      }

      if (result.error) throw result.error;

      // Fetch the user profile to determine role
      await fetchProfile();
      const role = useAuthStore.getState().role;

      if (!role) {
        // New user — go to registration
        router.replace('/(auth)/register');
      } else if (role === 'cleaner') {
        const { pendingDocuments, pendingProfilePhoto, clearPendingUploads, user } = useAuthStore.getState();
        if (user) {
          // If cleaner, upload photo and documents
          if (pendingProfilePhoto) {
            await uploadAvatar(user.id, pendingProfilePhoto);
          }
          if (pendingDocuments) {
            for (const [docType, uri] of Object.entries(pendingDocuments)) {
              if (uri) {
                await uploadDocument(user.id, docType, uri);
              }
            }
          }
          clearPendingUploads();
        }
        router.replace('/(cleaner)/jobs');
      } else {
        router.replace('/(client)/home');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid OTP code';
      setError(message);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      if (method === 'phone') {
        await supabase.auth.signInWithOtp({ phone: identifier! });
      } else {
        await supabase.auth.signInWithOtp({ email: identifier! });
      }
    } catch {
      setError('Failed to resend OTP');
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
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title} variant="headlineMedium">
            Verify OTP
          </Text>
          <Text style={styles.subtitle} variant="bodyLarge">
            Enter the {OTP_LENGTH}-digit code sent to
          </Text>
          <Text style={styles.identifier} variant="titleSmall">
            {identifier}
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <RNTextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[styles.otpInput, digit ? styles.otpFilled : null]}
                value={digit}
                onChangeText={(text) => handleChange(text.slice(-1), index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? (
            <Text style={styles.error} variant="bodySmall">
              {error}
            </Text>
          ) : null}

          <Button
            mode="contained"
            onPress={() => verifyOTP(otp.join(''))}
            loading={isLoading}
            disabled={isLoading || otp.some((d) => !d)}
            style={styles.btn}
            contentStyle={styles.btnContent}
            buttonColor={colors.primary}
          >
            Verify
          </Button>

          <Button
            mode="text"
            onPress={handleResend}
            textColor={colors.onSurfaceVariant}
            style={styles.resendBtn}
          >
            Didn't receive a code? Resend
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.white,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  identifier: {
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.outline,
    backgroundColor: colors.surfaceVariant,
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  otpFilled: {
    borderColor: colors.primary,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  btn: {
    borderRadius: 12,
  },
  btnContent: {
    paddingVertical: 6,
  },
  resendBtn: {
    marginTop: spacing.md,
  },
});
