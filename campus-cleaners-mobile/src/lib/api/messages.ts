import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/database.types';

/**
 * Fetch messages for a booking, ordered by creation time.
 */
export async function fetchMessages(bookingId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role)
    `)
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Send a text message in a booking chat.
 */
export async function sendMessage(
  bookingId: string,
  senderId: string,
  message: string,
  imageUrl?: string
): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      booking_id: bookingId,
      sender_id: senderId,
      message,
      image_url: imageUrl ?? null,
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role)
    `)
    .single();

  if (error) {
    console.error('Error sending message:', error.message);
    return null;
  }

  return data;
}

/**
 * Fetch the latest messages since a given timestamp (for polling).
 */
export async function fetchNewMessages(
  bookingId: string,
  sinceTimestamp: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url, role)
    `)
    .eq('booking_id', bookingId)
    .gt('created_at', sinceTimestamp)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching new messages:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Fetch conversation list (latest message per booking) for a user.
 */
export async function fetchConversations(userId: string) {
  // Get all bookings the user is part of that have messages
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      service_type:service_types(name),
      client:profiles!bookings_client_id_fkey(id, full_name, avatar_url),
      cleaner:profiles!bookings_cleaner_id_fkey(id, full_name, avatar_url)
    `)
    .or(`client_id.eq.${userId},cleaner_id.eq.${userId}`)
    .not('status', 'in', '("cancelled","declined")')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error.message);
    return [];
  }

  // For each booking, get the latest message
  const conversations = await Promise.all(
    (bookings ?? []).map(async (booking) => {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMessage = messages?.[0] ?? null;
      if (!lastMessage) return null;

      return {
        bookingId: booking.id,
        bookingStatus: booking.status,
        serviceName: (booking.service_type as { name: string })?.name ?? '',
        otherUser:
          (booking.client as { id: string })?.id === userId
            ? booking.cleaner
            : booking.client,
        lastMessage,
      };
    })
  );

  return conversations.filter(Boolean);
}
