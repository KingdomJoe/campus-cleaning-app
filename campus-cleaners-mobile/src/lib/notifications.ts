import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and return the Expo push token.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  // Configure Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Uber for Cleaning',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00C896',
    });
  }

  // Get the push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (err) {
    console.error('Error getting push token:', err);
    return null;
  }
}

/**
 * Save the push token to the user's profile in Supabase.
 */
export async function savePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', userId);

  if (error) {
    console.error('Error saving push token:', error.message);
  }
}

/**
 * Set up notification response handler (when user taps a notification).
 * Returns a cleanup function for the subscription.
 */
export function setupNotificationResponseHandler(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;

      if (data?.bookingId) {
        const role = data.role as string;
        if (role === 'client') {
          router.push(`/(client)/bookings/${data.bookingId}`);
        } else if (role === 'cleaner') {
          router.push(`/(cleaner)/jobs/${data.bookingId}`);
        }
      }
    }
  );

  return () => subscription.remove();
}

/**
 * Create a notification record in the database and optionally send a push.
 * In production, push sending would be done server-side via Supabase Edge Functions.
 */
export async function createNotification(params: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    body: params.body,
    data: params.data ?? null,
    read: false,
  });

  if (error) {
    console.error('Error creating notification:', error.message);
  }
}
