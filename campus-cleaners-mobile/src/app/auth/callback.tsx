import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string }>();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const theme = useTheme();

  useEffect(() => {
    async function handleSession() {
      try {
        const accessToken = params.access_token;
        const refreshToken = params.refresh_token;

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session && accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }

        // Fetch user profile and redirect
        await fetchProfile();
        router.replace('/');
      } catch (err) {
        console.error('Error handling auth callback:', err);
        router.replace('/(auth)/login');
      }
    }

    handleSession();
  }, [params]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]} variant="bodyMedium">
        Completing sign in...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
  },
});
