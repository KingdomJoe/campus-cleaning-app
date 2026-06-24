import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { colors } from '@/lib/theme';

export default function BookingsLayout() {
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
      <Stack.Screen name="index" options={{ title: 'My Bookings' }} />
      <Stack.Screen name="[id]" options={{ title: 'Booking Details' }} />
    </Stack>
  );
}
