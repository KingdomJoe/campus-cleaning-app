import React, { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export default function OAuthCallbackScreen() {
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string }>();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const theme = useTheme();
  const url = Linking.useURL();

  useEffect(() => {
    async function handleSession() {
      try {
        console.log('OAuth callback received, URL:', url);
        
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
        console.log('Current session from getSession:', activeSession ? 'exists' : 'none');
        
        if (!activeSession && accessToken && refreshToken) {
          console.log('Setting session from callback tokens...');
          const { data: { session: newSession }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          activeSession = newSession;
          console.log('Session set successfully');
        }

        // If still no session, try to refresh
        if (!activeSession) {
          console.log('No session yet, attempting refresh...');
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          activeSession = refreshedSession;
        }

        // Fetch user profile first
        await fetchProfile();

        const currentProfile = useAuthStore.getState().profile;
        let storedRole: string | null = null;
        if (Platform.OS === 'web') {
          storedRole = localStorage.getItem('registration_role');
        } else {
          const SecureStore = require('expo-secure-store');
          storedRole = await SecureStore.getItemAsync('registration_role');
        }
        const validRole = (storedRole === 'client' || storedRole === 'cleaner') ? storedRole : null;

        console.log('Profile:', currentProfile?.role, 'Stored role:', storedRole, 'Valid role:', validRole);

        if (validRole && activeSession?.user) {
          // If profile doesn't exist or has mismatched role, update/upsert
          if (!currentProfile || currentProfile.role !== validRole) {
            console.log('Updating profile role to:', validRole);
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
          if (Platform.OS === 'web') {
            localStorage.removeItem('registration_role');
          } else {
            const SecureStore = require('expo-secure-store');
            await SecureStore.deleteItemAsync('registration_role');
          }
        }

        // Redirect directly to app screen based on role (bypass index.tsx routing race condition)
        const finalRole = validRole || currentProfile?.role;
        console.log('Final role for redirect:', finalRole);
        if (finalRole === 'cleaner') {
          router.replace('/(cleaner)/jobs');
        } else {
          router.replace('/(client)/home');
        }
      } catch (err) {
        console.error('Error handling oauth callback:', err);
        router.replace('/(auth)/login');
      }
    }

    handleSession();
  }, [params, fetchProfile, url]);

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