import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { signInWithGoogle } from '@/lib/auth/google';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function RegisterRoleScreen() {
  const { session, profile, fetchProfile } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<'client' | 'cleaner' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const handleGoogleSignInUnified = async () => {
    if (!selectedRole) return;
    setIsLoading(true);
    try {
      // Store the selected role in SecureStore so the callback knows what to assign
      await SecureStore.setItemAsync('registration_role', selectedRole);
      
      const success = await signInWithGoogle();
      if (success) {
        await fetchProfile();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      Alert.alert('Google Sign-In Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRole = async (role: 'client' | 'cleaner') => {
    const user = useAuthStore.getState().user;
    if (user) {
      setIsLoading(true);
      try {
        // Update user role in public.profiles table
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role })
          .eq('id', user.id);

        if (updateError) throw updateError;

        if (role === 'cleaner') {
          // Create cleaner_profile row
          const { error: profileError } = await supabase
            .from('cleaner_profiles')
            .upsert({ user_id: user.id });
          if (profileError) throw profileError;
        }

        await fetchProfile();

        if (role === 'cleaner') {
          router.push('/(auth)/register-cleaner');
        } else {
          router.push('/(auth)/register-client');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update role';
        Alert.alert('Error', message);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSelectedRole(role);
    }
  };

  const handleManualRegister = () => {
    if (selectedRole === 'cleaner') {
      router.push('/(auth)/register-cleaner');
    } else {
      router.push('/(auth)/register-client');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: Math.max(insets.top, 24) + 16,
          paddingBottom: Math.max(insets.bottom, 24) + 16,
        }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]} variant="headlineMedium">
          {session ? 'Complete Your Account' : 'Join Uber for Cleaning'}
        </Text>
        <Text style={styles.subtitle} variant="bodyLarge">
          {session
            ? 'Select your role to complete setup'
            : selectedRole
            ? `Registering as a ${selectedRole === 'cleaner' ? 'Cleaner' : 'Client'}`
            : 'How would you like to use the platform?'}
        </Text>
      </View>

      {isLoading && (
        <ActivityIndicator animating color={theme.colors.primary} style={{ marginBottom: spacing.md }} />
      )}

      {selectedRole === null ? (
        // Step 1: Choose Role
        <View style={styles.cards}>
          <Pressable onPress={() => handleSelectRole('client')} disabled={isLoading}>
            <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
              <Card.Content style={styles.cardContent}>
                <Text style={styles.cardIcon}>🏠</Text>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]} variant="titleLarge">
                  I need cleaning
                </Text>
                <Text style={styles.cardDesc} variant="bodyMedium">
                  Book verified cleaners for your room, apartment, or laundry. Pay securely, chat in real-time.
                </Text>
                <View style={[styles.cardBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.primary }]}>Client Account</Text>
                </View>
              </Card.Content>
            </Card>
          </Pressable>

          <Pressable onPress={() => handleSelectRole('cleaner')} disabled={isLoading}>
            <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
              <Card.Content style={styles.cardContent}>
                <Text style={styles.cardIcon}>🧹</Text>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]} variant="titleLarge">
                  I'm a cleaner
                </Text>
                <Text style={styles.cardDesc} variant="bodyMedium">
                  Join as a verified cleaner, accept jobs, earn money, and build your reputation on campus.
                </Text>
                <View style={[styles.cardBadge, styles.cleanerBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.secondary }]}>Cleaner Account</Text>
                </View>
              </Card.Content>
            </Card>
          </Pressable>
        </View>
      ) : (
        // Step 2: Choose Auth Method for selected role
        <View style={styles.authSection}>
          <Button
            mode="contained"
            onPress={handleGoogleSignInUnified}
            icon="google"
            style={styles.googleBtn}
            contentStyle={styles.googleBtnContent}
            buttonColor={theme.colors.primary}
            disabled={isLoading}
          >
            Continue with Google
          </Button>

          <View style={styles.divider}>
            <Text style={styles.dividerText}>or</Text>
          </View>

          <Button
            mode="outlined"
            onPress={handleManualRegister}
            style={styles.manualBtn}
            contentStyle={styles.manualBtnContent}
            textColor={theme.colors.onBackground}
            disabled={isLoading}
          >
            Register Manually
          </Button>

          <Button
            mode="text"
            onPress={() => setSelectedRole(null)}
            style={styles.backBtn}
            textColor={theme.colors.primary}
            disabled={isLoading}
          >
            Go Back / Choose Different Role
          </Button>
        </View>
      )}

      <Text style={styles.footer} variant="bodySmall">
        Already have an account?{' '}
        <Text
          style={styles.link}
          onPress={() => router.push('/(auth)/login')}
        >
          Sign in
        </Text>
      </Text>
    </ScrollView>
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
  googleSection: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  googleTitle: {
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  googleBtn: {
    borderRadius: 12,
  },
  googleBtnContent: {
    paddingVertical: 12,
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
  cards: {
    gap: spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    color: colors.white,
    fontWeight: '700',
  },
  cardDesc: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  cleanerBadge: {
    backgroundColor: colors.secondaryContainer,
  },
  badgeText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  authSection: {
    gap: spacing.md,
    justifyContent: 'center',
    flex: 1,
    marginTop: spacing.xl,
  },
  manualBtn: {
    borderRadius: 12,
    borderColor: colors.outline,
  },
  manualBtnContent: {
    paddingVertical: 8,
  },
  backBtn: {
    marginTop: spacing.sm,
  },
  footer: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});