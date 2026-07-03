import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSidebarStore } from '@/stores/sidebarStore';

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
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Book a Service',
          headerLeft: () => (
            <Pressable
              onPress={() => useSidebarStore.getState().open()}
              style={{ marginRight: 16, padding: 4 }}
              accessibilityLabel="Open menu"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="menu"
                size={28}
                color={theme.colors.onSurface}
              />
            </Pressable>
          ),
        }} 
      />
      <Stack.Screen name="cleaning" options={{ title: 'Cleaning Booking' }} />
      <Stack.Screen name="laundry" options={{ title: 'Laundry Booking' }} />
      <Stack.Screen name="summary" options={{ title: 'Booking Summary' }} />
    </Stack>
  );
}
