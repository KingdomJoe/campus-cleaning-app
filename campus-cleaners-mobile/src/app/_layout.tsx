import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { setupNotificationResponseHandler } from '@/lib/notifications';

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const { themeMode, initializeTheme } = useThemeStore();

  useEffect(() => {
    initialize();
    initializeTheme();

    const handleUrl = async (url: string) => {
      if (url.includes('access_token=')) {
        const hash = url.split('#')[1] || url.split('?')[1];
        if (hash) {
          const params = Object.fromEntries(
            hash.split('&').map((pair) => pair.split('='))
          );
          if (params.access_token && params.refresh_token) {
            await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            await useAuthStore.getState().fetchProfile();
          }
        }
      }
    };

    const getInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) handleUrl(url);
    };

    getInitialUrl();
    const subscription = Linking.addEventListener('url', (event) => handleUrl(event.url));

    const cleanup = setupNotificationResponseHandler();
    return () => {
      subscription.remove();
      cleanup();
    };
  }, [initialize]);

  const activeTheme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={activeTheme}>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: activeTheme.colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(client)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(cleaner)" options={{ animation: 'fade' }} />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
