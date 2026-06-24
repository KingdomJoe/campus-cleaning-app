import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/lib/theme';
import Logo from '@/components/Logo';

export default function IndexScreen() {
  const { isLoading, isInitialized, session, role, profile } = useAuthStore();
  const theme = useTheme();

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (!session) {
      router.replace('/(auth)/welcome');
      return;
    }

    // If role is not selected, or profile phone is missing (incomplete onboarding), redirect to role selection
    if (!role || !profile?.phone) {
      router.replace('/(auth)/register');
      return;
    }

    if (role === 'cleaner') {
      router.replace('/(cleaner)/jobs');
    } else {
      router.replace('/(client)/home');
    }
  }, [isInitialized, isLoading, session, role, profile]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Logo size={96} style={styles.logo} />
      <Text style={[styles.title, { color: theme.colors.onBackground }]} variant="headlineMedium">
        Uber for Cleaning
      </Text>
      <ActivityIndicator
        animating
        color={colors.primary}
        size="large"
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    marginBottom: 24,
  },
  title: {
    color: colors.white,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.primary,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  loader: {
    marginTop: 48,
  },
});
