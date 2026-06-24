import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

    const cleanup = setupNotificationResponseHandler();
    return () => {
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
