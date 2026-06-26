import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Animated,
} from "react-native";
import { Text, Button, ActivityIndicator, useTheme } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { uploadAvatar, uploadDocument } from "@/lib/api/uploads";
import { colors, spacing } from "@/lib/theme";

const OTP_LENGTH = 6;

export default function VerifyOTPScreen() {
  const theme = useTheme();
  const { method, identifier, type } = useLocalSearchParams<{
    method: "phone" | "email";
    identifier: string;
    type?: "email" | "signup";
  }>();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(RNTextInput | null)[]>([]);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const { session, role, isLoading: isAuthLoading } = useAuthStore();
  const insets = useSafeAreaInsets();
  const isRedirectingRef = useRef(false);
  const url = Linking.useURL();

  // Pulse animation for the email icon — useState lazy initializer is React Compiler-safe
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (method === "email") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  // Session detection & Auto-redirect Hook
  useEffect(() => {
    const handleRedirect = async () => {
      // Skip redirect if OAuth callback is in progress
      if (url && (url.includes("auth/callback") || url.includes("callback"))) {
        console.log('VerifyOTP: Auth callback in progress, skipping redirect');
        return;
      }
      
      if (session && !isAuthLoading && !isRedirectingRef.current) {
        isRedirectingRef.current = true;
        setIsLoading(true);
        try {
          const user = useAuthStore.getState().user;
          const userRole = useAuthStore.getState().role;

          if (user) {
            try {
              const { identifyUser, trackEvent } =
                await import("@/lib/analytics");
              identifyUser(user.id, user.email, user.user_metadata?.full_name);
              trackEvent("login", { role: userRole });
            } catch (err) {
              console.error("Analytics tracking failed:", err);
            }
          }

          if (!userRole) {
            // No role specified yet, send them to register roles
            router.replace("/(auth)/register");
            return;
          }

          if (userRole === "cleaner") {
            const meta = user?.user_metadata || {};
            // Sync registration details from user metadata into public.cleaner_profiles
            await supabase
              .from("cleaner_profiles")
              .update({
                bio: meta.bio || "",
                skills: meta.skills || [],
                mobile_money_number: meta.mobile_money_number || "",
                guarantor_name: meta.guarantor_name || "",
                guarantor_phone: meta.guarantor_phone || "",
              })
              .eq("user_id", user!.id);

            // Upload pending photo and documents
            const {
              pendingDocuments,
              pendingProfilePhoto,
              clearPendingUploads,
            } = useAuthStore.getState();
            if (pendingProfilePhoto) {
              await uploadAvatar(user!.id, pendingProfilePhoto);
            }
            if (pendingDocuments) {
              for (const [docType, uri] of Object.entries(pendingDocuments)) {
                if (uri) {
                  await uploadDocument(user!.id, docType, uri);
                }
              }
            }
            clearPendingUploads();
            router.replace("/(cleaner)/jobs");
          } else {
            router.replace("/(client)/home");
          }
        } catch (err: unknown) {
          console.error("Error in post-verification sync:", err);
          Alert.alert(
            "Setup Incomplete",
            "Successfully logged in, but we had trouble saving your credentials or photos. Please verify your connection.",
          );
          // Fallback redirect
          const currentRole = useAuthStore.getState().role;
          router.replace(
            currentRole === "cleaner" ? "/(cleaner)/jobs" : "/(client)/home",
          );
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleRedirect();
  }, [session, role, isAuthLoading]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (
      newOtp.every((d) => d !== "") &&
      newOtp.join("").length === OTP_LENGTH
    ) {
      verifyOTP(newOtp.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (code: string) => {
    setError("");
    setIsLoading(true);

    try {
      let result;
      if (method === "phone") {
        result = await supabase.auth.verifyOtp({
          phone: identifier!,
          token: code,
          type: "sms",
        });
      } else {
        result = await supabase.auth.verifyOtp({
          email: identifier!,
          token: code,
          type: type || "email",
        });
      }

      if (result.error) throw result.error;

      // Update local profile which will trigger the auto-redirect hook
      await fetchProfile();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid OTP code";
      setError(message);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      if (method === "phone") {
        const { error: resendErr } = await supabase.auth.signInWithOtp({
          phone: identifier!,
        });
        if (resendErr) throw resendErr;
        Alert.alert(
          "Code Resent",
          "A new verification code has been sent to your phone.",
        );
      } else {
        if (type === "signup") {
          const { error: resendErr } = await supabase.auth.resend({
            type: "signup",
            email: identifier!,
            options: {
              emailRedirectTo: Linking.createURL("auth/callback"),
            },
          });
          if (resendErr) throw resendErr;
          Alert.alert("Code Resent", "A new confirmation email has been sent.");
        } else {
          const { error: otpErr } = await supabase.auth.signInWithOtp({
            email: identifier!,
            options: {
              emailRedirectTo: Linking.createURL("auth/callback"),
            },
          });
          if (otpErr) throw otpErr;
          Alert.alert("Code Resent", "A new verification email has been sent.");
        }
      }
    } catch (err: any) {
      setError(
        err instanceof Error ? err.message : "Failed to resend verification",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {method === "email" ? (
            <View style={styles.emailPromptContainer}>
              <Animated.View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="email-fast"
                  size={44}
                  color={theme.colors.primary}
                />
              </Animated.View>

              <Text
                style={[
                  styles.emailTitle,
                  { color: theme.colors.onBackground },
                ]}
                variant="headlineMedium"
              >
                Verify Your Account
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                variant="bodyLarge"
              >
                {"We\u2019ve sent a verification link to"}
              </Text>

              <Text style={styles.identifier} variant="titleMedium">
                {identifier}
              </Text>

              <Text
                style={[
                  styles.instructionText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                variant="bodyMedium"
              >
                Please open your email client, locate our email, and click the
                confirmation button/link to verify your account.
              </Text>

              <View
                style={[
                  styles.statusRow,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <ActivityIndicator
                  size={16}
                  color={theme.colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                  variant="bodySmall"
                >
                  Waiting for verification...
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={handleResend}
                loading={isLoading}
                disabled={isLoading}
                style={styles.btn}
                contentStyle={styles.btnContent}
                buttonColor={theme.colors.primary}
              >
                Resend Verification Link
              </Button>

              <Button
                mode="text"
                onPress={() => router.back()}
                textColor={theme.colors.onSurfaceVariant}
                style={styles.resendBtn}
              >
                ← Go back
              </Button>
            </View>
          ) : (
            // SMS OTP input layout
            <View>
              <Text
                style={[styles.title, { color: theme.colors.onBackground }]}
                variant="headlineMedium"
              >
                Verify OTP
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
                variant="bodyLarge"
              >
                Enter the {OTP_LENGTH}-digit code sent to
              </Text>
              <Text style={styles.identifier} variant="titleSmall">
                {identifier}
              </Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <RNTextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      digit ? styles.otpFilled : null,
                      {
                        color: theme.colors.onSurface,
                        backgroundColor: theme.colors.surfaceVariant,
                        borderColor: digit
                          ? theme.colors.primary
                          : theme.colors.outline,
                      },
                    ]}
                    value={digit}
                    onChangeText={(text) => handleChange(text.slice(-1), index)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(nativeEvent.key, index)
                    }
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {error ? (
                <Text style={styles.error} variant="bodySmall">
                  {error}
                </Text>
              ) : null}

              <Button
                mode="contained"
                onPress={() => verifyOTP(otp.join(""))}
                loading={isLoading}
                disabled={isLoading || otp.some((d) => !d)}
                style={styles.btn}
                contentStyle={styles.btnContent}
                buttonColor={theme.colors.primary}
              >
                Verify
              </Button>

              <Button
                mode="text"
                onPress={handleResend}
                textColor={theme.colors.onSurfaceVariant}
                style={styles.resendBtn}
              >
                {"Didn\u2019t receive a code? Resend"}
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    color: colors.white,
    fontWeight: "700",
  },
  emailTitle: {
    color: colors.white,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  identifier: {
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: "600",
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.outline,
    backgroundColor: colors.surfaceVariant,
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  otpFilled: {
    borderColor: colors.primary,
  },
  error: {
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  btn: {
    borderRadius: 12,
    width: "100%",
  },
  btnContent: {
    paddingVertical: 6,
  },
  resendBtn: {
    marginTop: spacing.md,
  },
  emailPromptContainer: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  instructionText: {
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceVariant,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.xl,
  },
  statusText: {
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },
});
