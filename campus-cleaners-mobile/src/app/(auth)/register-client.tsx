import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/lib/theme';

export default function RegisterClientScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ghanaCard, setGhanaCard] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+233${phone.replace(/^0/, '')}`;

      // Sign up with phone OTP
      const { data, error: signUpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: formattedPhone,
            email: email.trim(),
            role: 'client',
          },
        },
      });

      if (signUpError) throw signUpError;

      // Navigate to OTP verification
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          method: 'phone',
          identifier: formattedPhone,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
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
        <Text style={styles.title} variant="headlineMedium">
          Create Client Account
        </Text>
        <Text style={styles.subtitle} variant="bodyMedium">
          Book cleaning and laundry services
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
          />

          <TextInput
            label="Ghana Card Number"
            value={ghanaCard}
            onChangeText={setGhanaCard}
            mode="outlined"
            left={<TextInput.Icon icon="card-account-details" />}
            placeholder="GHA-XXXXXXXXX-X"
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            textColor={colors.onSurface}
            theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
          />

          <TextInput
            label="Location"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            left={<TextInput.Icon icon="map-marker" />}
            placeholder="e.g., Amamoma, Room B204"
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            textColor={colors.onSurface}
            theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
          />
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
          Register & Verify
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
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
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
});
