import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { lightTheme, darkTheme } from "@/lib/theme";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import {
  setupNotificationResponseHandler,
  registerForPushNotifications,
  savePushToken,
} from "@/lib/notifications";
import { ToastProvider, showToast } from "@/lib/toast";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const session = useAuthStore((s) => s.session);
  const { themeMode, initializeTheme } = useThemeStore();

  const registerPushToken = async (userId: string) => {
    try {
      const token = await registerForPushNotifications();
      if (token) {
        await savePushToken(userId, token);
      }
    } catch (err) {
      console.error("Error registering push token:", err);
    }
  };

  useEffect(() => {
    initialize();
    initializeTheme();

    const cleanup = setupNotificationResponseHandler();
    return () => {
      cleanup();
    };
  }, [initialize, initializeTheme]);

  useEffect(() => {
    if (session?.user?.id) {
      registerPushToken(session.user.id);
    }
  }, [session]);

  // Surface uncaught native/JS errors as on-screen toasts so failures are
  // never silent on preview/production builds.
  useEffect(() => {
    const report = (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Error: ${msg}`, 'error', 8000);
      console.error('[GlobalError]', err);
    };

    const g: any = (globalThis as any).ErrorUtils;
    let prevHandler: ((err: unknown, isFatal?: boolean) => void) | null = null;
    if (g && typeof g.setGlobalHandler === 'function') {
      prevHandler = g.getGlobalHandler?.();
      g.setGlobalHandler((err: unknown, isFatal?: boolean) => {
        report(err);
        if (prevHandler) prevHandler(err, isFatal);
      });
    }

    return () => {
      if (g && typeof g.setGlobalHandler === 'function' && prevHandler) {
        g.setGlobalHandler(prevHandler);
      }
    };
  }, []);

  const activeTheme = themeMode === "dark" ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={activeTheme}>
        <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
        <ToastProvider>
          <ErrorBoundary>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: activeTheme.colors.background },
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="auth/callback" options={{ animation: "fade" }} />
              <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
              <Stack.Screen name="(client)" options={{ animation: "fade" }} />
              <Stack.Screen name="(cleaner)" options={{ animation: "fade" }} />
            </Stack>
          </ErrorBoundary>
        </ToastProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
