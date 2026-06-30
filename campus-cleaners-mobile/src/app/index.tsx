import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/lib/theme";
import Logo from "@/components/Logo";

export default function IndexScreen() {
  const { isLoading, isInitialized, session, role, profile } = useAuthStore();
  const theme = useTheme();
  const url = Linking.useURL();

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    // If a deep-link auth callback is in-flight, let auth/callback.tsx handle routing
    if (url && (url.includes("auth/callback") || url.includes("callback"))) {
      console.log('IndexScreen: Auth callback in progress, skipping redirect');
      return;
    }

    if (!session) {
      router.replace("/(auth)/welcome");
      return;
    }

    // If role is not selected, redirect to role selection
    if (!role) {
      router.replace("/(auth)/register");
      return;
    }

    // If profile phone is missing, redirect directly to role-specific form to complete onboarding
    if (!profile?.phone) {
      if (role === "cleaner") {
        router.replace("/(auth)/register-cleaner");
      } else {
        router.replace("/(auth)/register-client");
      }
      return;
    }

    if (role === "cleaner") {
      router.replace("/(cleaner)/jobs");
    } else {
      router.replace("/(client)/home");
    }
  }, [isInitialized, isLoading, session, role, profile, url]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Logo size={96} style={styles.logo} />
      <Text
        style={[styles.title, { color: theme.colors.onBackground }]}
        variant="headlineMedium"
      >
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
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    marginBottom: 24,
  },
  title: {
    fontWeight: "700",
  },
  subtitle: {
    color: colors.primary,
    fontWeight: "600",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginTop: 4,
  },
  loader: {
    marginTop: 48,
  },
});
