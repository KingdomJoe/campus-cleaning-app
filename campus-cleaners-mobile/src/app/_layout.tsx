import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from '@/lib/theme';
import { useAuthStore } from '@/stores/authStore';
import { setupNotificationResponseHandler } from '@/lib/notifications';

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
    const cleanup = setupNotificationResponseHandler();
    return cleanup;
  }, [initialize]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(client)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(cleaner)" options={{ animation: 'fade' }} />
      </Stack>
    </PaperProvider>
  );
}
