import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function RegisterRoleScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} variant="headlineMedium">
          Join Campus Cleaners
        </Text>
        <Text style={styles.subtitle} variant="bodyLarge">
          How would you like to use the platform?
        </Text>
      </View>

      <View style={styles.cards}>
        <Pressable onPress={() => router.push('/(auth)/register-client')}>
          <Card style={styles.card} mode="contained">
            <Card.Content style={styles.cardContent}>
              <Text style={styles.cardIcon}>🏠</Text>
              <Text style={styles.cardTitle} variant="titleLarge">
                I need cleaning
              </Text>
              <Text style={styles.cardDesc} variant="bodyMedium">
                Book verified cleaners for your room, apartment, or laundry. Pay securely, chat in real-time.
              </Text>
              <View style={styles.cardBadge}>
                <Text style={styles.badgeText}>Client Account</Text>
              </View>
            </Card.Content>
          </Card>
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/register-cleaner')}>
          <Card style={styles.card} mode="contained">
            <Card.Content style={styles.cardContent}>
              <Text style={styles.cardIcon}>🧹</Text>
              <Text style={styles.cardTitle} variant="titleLarge">
                I'm a cleaner
              </Text>
              <Text style={styles.cardDesc} variant="bodyMedium">
                Join as a verified cleaner, accept jobs, earn money, and build your reputation on campus.
              </Text>
              <View style={[styles.cardBadge, styles.cleanerBadge]}>
                <Text style={styles.badgeText}>Cleaner Account</Text>
              </View>
            </Card.Content>
          </Card>
        </Pressable>
      </View>

      <Text style={styles.footer} variant="bodySmall">
        Already have an account?{' '}
        <Text
          style={styles.link}
          onPress={() => router.push('/(auth)/login')}
        >
          Sign in
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  footer: {
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});
