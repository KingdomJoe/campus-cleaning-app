import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { colors } from '@/lib/theme';

export default function BookLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Book a Service' }} />
      <Stack.Screen name="cleaning" options={{ title: 'Cleaning Booking' }} />
      <Stack.Screen name="laundry" options={{ title: 'Laundry Booking' }} />
      <Stack.Screen name="summary" options={{ title: 'Booking Summary' }} />
    </Stack>
  );
}
