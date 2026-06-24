import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string }>();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const theme = useTheme();
  const url = Linking.useURL();

  useEffect(() => {
    async function handleSession() {
      try {
        let accessToken = params.access_token;
        let refreshToken = params.refresh_token;

        if ((!accessToken || !refreshToken) && url) {
          const hash = url.split('#')[1] || url.split('?')[1];
          if (hash) {
            const parsedParams = Object.fromEntries(
              hash.split('&').map((pair) => pair.split('='))
            );
            accessToken = parsedParams.access_token;
            refreshToken = parsedParams.refresh_token;
          }
        }

        let activeSession = null;
        const { data: { session } } = await supabase.auth.getSession();
        activeSession = session;
        
        if (!activeSession && accessToken && refreshToken) {
          const { data: { session: newSession }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          activeSession = newSession;
        }

        // Fetch user profile first
        await fetchProfile();

        const currentProfile = useAuthStore.getState().profile;
        const storedRole = await SecureStore.getItemAsync('registration_role');
        const validRole = (storedRole === 'client' || storedRole === 'cleaner') ? storedRole : null;

        if (validRole && activeSession?.user) {
          // If profile doesn't exist or has mismatched role, update/upsert
          if (!currentProfile || currentProfile.role !== validRole) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: validRole })
              .eq('id', activeSession.user.id);

            if (!updateError) {
              if (validRole === 'cleaner') {
                await supabase
                  .from('cleaner_profiles')
                  .upsert({ user_id: activeSession.user.id });
              }
              await fetchProfile();
            }
          }
          await SecureStore.deleteItemAsync('registration_role');
        }

        // Redirect to index route
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
