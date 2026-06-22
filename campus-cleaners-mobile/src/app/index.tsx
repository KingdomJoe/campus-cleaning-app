import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/lib/theme';

export default function IndexScreen() {
  const { isLoading, isInitialized, session, role } = useAuthStore();

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (!session) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (role === 'cleaner') {
      router.replace('/(cleaner)/jobs');
    } else {
      router.replace('/(client)/home');
    }
  }, [isInitialized, isLoading, session, role]);

  return (
    <View style={styles.container}>
      <Text style={styles.brand} variant="headlineLarge">
        🧹
      </Text>
      <Text style={styles.title} variant="headlineMedium">
        Campus Cleaners
      </Text>
      <Text style={styles.subtitle} variant="bodyMedium">
        Ghana
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
  brand: {
    fontSize: 64,
    marginBottom: 16,
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
