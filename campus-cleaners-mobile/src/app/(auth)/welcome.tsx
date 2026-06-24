import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/lib/theme';
import Logo from '@/components/Logo';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: Math.max(insets.top, 24) + 16,
          paddingBottom: Math.max(insets.bottom, 24) + 16,
        }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Logo size={96} style={styles.logo} />
        <Text style={styles.title} variant="headlineLarge">
          Uber for Cleaning
        </Text>
        <Text style={styles.description} variant="bodyLarge">
          Book trusted cleaners and laundry services right from your phone. Fast, affordable, and reliable.
        </Text>
      </View>

      <View style={styles.features}>
        <FeatureRow icon="✨" text="Verified & vetted cleaners" />
        <FeatureRow icon="💬" text="In-app chat with your cleaner" />
        <FeatureRow icon="🔒" text="Secure escrow payments" />
        <FeatureRow icon="⭐" text="Ratings & reviews you can trust" />
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => router.push('/(auth)/login')}
          style={styles.primaryBtn}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
          buttonColor={colors.primary}
        >
          Get Started
        </Button>
        <Button
          mode="text"
          onPress={() => router.push('/(auth)/login')}
          textColor={colors.onSurfaceVariant}
          style={styles.secondaryBtn}
        >
          Already have an account? Sign in
        </Button>
      </View>
    </ScrollView>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText} variant="bodyMedium">
        {text}
      </Text>
    </View>
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
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.white,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  features: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceVariant,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    color: colors.onSurface,
    flex: 1,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryBtn: {
    borderRadius: 12,
  },
  btnContent: {
    paddingVertical: 6,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    marginTop: spacing.xs,
  },
});
