import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { signInWithGoogle } from '@/lib/auth/google';
import { colors, spacing } from '@/lib/theme';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';

import { useEffect } from 'react';

export default function RegisterClientScreen() {
  const theme = useTheme();
  const { session, profile, fetchProfile } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'phone' | 'email_pass' | 'email_otp'>('email_pass');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'client' | 'cleaner'>('client');
  const insets = useSafeAreaInsets();

  // Prefill details if Google OAuth has established a session
  useEffect(() => {
    if (session && profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.email) setEmail(profile.email);
      if (profile.phone) setPhone(profile.phone);
    }
  }, [session, profile]);

  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Clean phone input (remove spaces, parentheses, etc.)
      const cleaned = phone.replace(/[^\d+]/g, '');
      const formattedPhone = cleaned.startsWith('+') ? cleaned : `+233${cleaned.replace(/^0/, '')}`;

      // Validate Ghana phone number format (checking +233 followed by exactly 9 digits)
      const ghanaPhoneRegex = /^\+233\d{9}$/;
      if (!ghanaPhoneRegex.test(formattedPhone)) {
        setError('Please enter a valid Ghana mobile number (e.g., 024 123 4567 or 055 123 4567)');
        setIsLoading(false);
        return;
      }

      if (session) {
        // Active Google OAuth session: just update the profiles database row directly
        const user = useAuthStore.getState().user;
        if (!user) throw new Error('No active user session');

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            phone: formattedPhone,
            role: selectedRole,
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        if (selectedRole === 'cleaner') {
          const { error: profileError } = await supabase
            .from('cleaner_profiles')
            .upsert({ user_id: user.id });
          if (profileError) throw profileError;
        }

        await fetchProfile();
        
        if (selectedRole === 'cleaner') {
          router.replace('/(cleaner)/jobs');
        } else {
          router.replace('/(client)/home');
        }
      } else {
        // Normal signup with OTP
        let signUpResult;
        let usedMethod: 'phone' | 'email' = 'phone';
        let verifyType: 'sms' | 'email' | 'signup' = 'sms';

        if (verificationMethod === 'phone') {
          usedMethod = 'phone';
          verifyType = 'sms';
          try {
            signUpResult = await supabase.auth.signInWithOtp({
              phone: formattedPhone,
              options: {
                shouldCreateUser: true,
                data: {
                  full_name: fullName.trim(),
                  phone: formattedPhone,
                  email: email.trim(),
                  role: 'client',
                },
              },
            });
            if (signUpResult.error) throw signUpResult.error;
          } catch (phoneErr: any) {
            console.warn('SMS OTP signup failed, falling back to Email OTP:', phoneErr.message);
            usedMethod = 'email';
            verifyType = 'email';
            signUpResult = await supabase.auth.signInWithOtp({
              email: email.trim(),
              options: {
                shouldCreateUser: true,
                data: {
                  full_name: fullName.trim(),
                  phone: formattedPhone,
                  email: email.trim(),
                  role: 'client',
                },
              },
            });
            if (signUpResult.error) throw signUpResult.error;

            Alert.alert(
              'SMS Verification Unavailable',
              'Your carrier is unsupported for SMS OTP. We have sent a verification code to your Email instead.'
            );
          }
        } else if (verificationMethod === 'email_otp') {
          usedMethod = 'email';
          verifyType = 'email';
          signUpResult = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: {
              shouldCreateUser: true,
              data: {
                full_name: fullName.trim(),
                phone: formattedPhone,
                email: email.trim(),
                role: 'client',
              },
              emailRedirectTo: Linking.createURL('auth/callback'),
            },
          });
          if (signUpResult.error) throw signUpResult.error;
        } else {
          // email_pass
          usedMethod = 'email';
          verifyType = 'signup';
          if (!password) {
            setError('Please enter a password');
            setIsLoading(false);
            return;
          }
          if (!isPasswordValid) {
            setError('Please make sure your password satisfies all safety criteria');
            setIsLoading(false);
            return;
          }
          signUpResult = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
              emailRedirectTo: Linking.createURL('auth/callback'),
              data: {
                full_name: fullName.trim(),
                phone: formattedPhone,
                email: email.trim(),
                role: 'client',
              },
            },
          });
          if (signUpResult.error) throw signUpResult.error;
        }

        // Navigate to OTP verification
        router.push({
          pathname: '/(auth)/verify-otp',
          params: {
            method: usedMethod,
            identifier: usedMethod === 'phone' ? formattedPhone : email.trim(),
            type: verifyType,
          },
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      await SecureStore.setItemAsync('registration_role', 'client');
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
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
        {!session && (
          <>
            <View style={styles.divider}>
              <Text style={styles.dividerText}>or continue with</Text>
            </View>

            <Button
              mode="outlined"
              onPress={handleGoogleSignIn}
              loading={isLoading}
              disabled={isLoading}
              icon="google"
              style={styles.googleBtn}
              contentStyle={styles.googleBtnContent}
            >
              Continue with Google
            </Button>

            <View style={styles.divider}>
              <Text style={styles.dividerText}>or register with details</Text>
            </View>
          </>
        )}

        <Text style={[styles.title, { color: theme.colors.onBackground }]} variant="headlineMedium">
          {session ? 'Complete Your Profile' : 'Create Client Account'}
        </Text>
        <Text style={styles.subtitle} variant="bodyMedium">
          {session ? 'Provide your phone number to complete setup' : 'Book cleaning and laundry services'}
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Full Name *"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            textColor={colors.onSurface}
            theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
            disabled={false} // Allow editing name even if logged in with Google
          />

          <TextInput
            label="Phone Number *"
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
            placeholder="24 123 4567"
          />

          <TextInput
            label="Email Address *"
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
            disabled={!!session} // Email is fixed from Google OAuth
          />

          {session && (
            <>
              <Text style={styles.sectionLabel} variant="labelMedium">
                I want to join as *
              </Text>
              <SegmentedButtons
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as 'client' | 'cleaner')}
                buttons={[
                  { value: 'client', label: '🏠 Client (I need cleaning)' },
                  { value: 'cleaner', label: '🧹 Cleaner (I\'m a cleaner)' },
                ]}
                style={styles.segment}
                theme={{ colors: { secondaryContainer: colors.primaryContainer } }}
              />
            </>
          )}

          {!session && verificationMethod === 'email_pass' && (
            <View style={{ marginBottom: spacing.md }}>
              <TextInput
                label="Password *"
                value={password}
                onChangeText={setPassword}
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
              <PasswordStrengthIndicator
                password={password}
                email={email}
                fullName={fullName}
                onStrengthChange={setIsPasswordValid}
              />
            </View>
          )}

          {!session && (
            <>
              <Text style={styles.sectionLabel} variant="labelMedium">
                Verification Method *
              </Text>
              <SegmentedButtons
                value={verificationMethod}
                onValueChange={(v) => setVerificationMethod(v as 'phone' | 'email_pass' | 'email_otp')}
                buttons={[
                  { value: 'email_pass', label: '📧 Email & Pass' },
                  { value: 'email_otp', label: '✉️ Email OTP' },
                  { value: 'phone', label: '📱 SMS OTP' },
                ]}
                style={styles.segment}
                theme={{ colors: { secondaryContainer: colors.primaryContainer } }}
              />
            </>
          )}
        </View>

        {error ? (
          <Text style={styles.error} variant="bodySmall">
            {error}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          style={styles.btn}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
          buttonColor={colors.primary}
        >
          {session ? 'Complete Setup' : 'Register & Verify'}
        </Button>

        <Button
          mode="text"
          onPress={() => router.back()}
          textColor={colors.onSurfaceVariant}
        >
          ← Go back
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
  title: {
    color: colors.white,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surfaceVariant,
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
  error: {
    color: colors.error,
    marginBottom: spacing.md,
  },
  btn: {
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  btnContent: {
    paddingVertical: 6,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionLabel: {
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  segment: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
});