import { Stack } from 'expo-router';
import { colors } from '@/lib/theme';

export default function BookLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Book a Service' }} />
      <Stack.Screen name="cleaning" options={{ title: 'Cleaning Booking' }} />
      <Stack.Screen name="laundry" options={{ title: 'Laundry Booking' }} />
      <Stack.Screen name="summary" options={{ title: 'Booking Summary' }} />
    </Stack>
  );
}
