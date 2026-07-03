import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { lightTheme, darkTheme } from "@/lib/theme";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { setupNotificationResponseHandler } from "@/lib/notifications";
import { ToastProvider } from "@/lib/toast";

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const session = useAuthStore((s) => s.session);
  const { themeMode, initializeTheme } = useThemeStore();

  const registerPushToken = async (userId: string) => {
    try {
      const { registerForPushNotifications, savePushToken } =
        await import("@/lib/notifications");
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

  const activeTheme = themeMode === "dark" ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={activeTheme}>
        <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
        <ToastProvider>
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
        </ToastProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
