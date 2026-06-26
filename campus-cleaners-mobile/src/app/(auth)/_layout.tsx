import { Stack } from "expo-router";
import { useTheme } from "react-native-paper";

export default function AuthLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="register" />
      <Stack.Screen name="register-client" />
      <Stack.Screen name="register-cleaner" />
    </Stack>
  );
}
