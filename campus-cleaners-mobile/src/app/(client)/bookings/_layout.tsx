import { Stack } from 'expo-router';
import { colors } from '@/lib/theme';

export default function BookingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'My Bookings' }} />
      <Stack.Screen name="[id]" options={{ title: 'Booking Details' }} />
    </Stack>
  );
}
