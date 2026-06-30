import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { fetchMessages, sendMessage, fetchNewMessages } from '@/lib/api/messages';
import { pickImage, takePhoto, uploadImage } from '@/lib/api/uploads';
import type { Message } from '@/lib/database.types';
import { colors, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

export default function CleanerChatScreen() {
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = async () => {
    const data = await fetchMessages(bookingId!);
    setMessages(data);
  };

  const pollNewMessages = async () => {
    if (messages.length === 0) {
      await loadMessages();
      return;
    }
    const lastTimestamp = messages[messages.length - 1]?.created_at;
    if (!lastTimestamp) return;
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('booking_id', bookingId!)
      .gt('created_at', lastTimestamp)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setMessages((prev) => [...prev, ...(data as any[])]);
    }
  };

  useEffect(() => {
    if (!bookingId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMessages();

    pollingRef.current = setInterval(() => {
      pollNewMessages();
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const handleSend = async () => {
    if (!input.trim() || !user?.id || !bookingId) return;
    setSending(true);
    const msg = await sendMessage(bookingId, user.id, input.trim());
    if (msg) {
      setMessages((prev: Message[]) => [...prev, msg]);
      setInput('');
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
    setSending(false);
  };

  const handlePickImage = async () => {
    Alert.alert(
      'Send Image',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo',
          onPress: async () => {
            const uri = await takePhoto({ aspect: [4, 3], quality: 0.8 });
            if (uri) uploadAndSendMessage(uri);
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const uri = await pickImage({ aspect: [4, 3], quality: 0.8 });
            if (uri) uploadAndSendMessage(uri);
          },
        },
      ]
    );
  };

  const uploadAndSendMessage = async (uri: string) => {
    if (!user?.id || !bookingId) return;
    setSending(true);
    try {
      const publicUrl = await uploadImage(
        uri,
        'booking-photos',
        `chats/${bookingId}/${Date.now()}.jpg`
      );
      if (publicUrl) {
        const msg = await sendMessage(bookingId, user.id, '[Image]', publicUrl);
        if (msg) {
          setMessages((prev: Message[]) => [...prev, msg]);
          setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        }
      } else {
        Alert.alert('Error', 'Failed to upload image.');
      }
    } catch (err) {
      console.error('Error sending image:', err);
      Alert.alert('Error', 'Failed to send image.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isMe = item.sender_id === user?.id;
      return (
        <View style={[msgStyles.bubble, isMe ? msgStyles.myBubble : msgStyles.theirBubble]}>
          {!isMe && (
            <Text style={msgStyles.sender} variant="labelSmall">
              {(item.sender as { full_name?: string })?.full_name ?? 'Client'}
            </Text>
          )}
          {item.image_url && (
            <Image
              source={{ uri: item.image_url }}
              style={msgStyles.image}
              resizeMode="cover"
            />
          )}
          {item.message && item.message !== '[Image]' && (
            <Text style={[msgStyles.text, isMe ? msgStyles.myText : msgStyles.theirText]}>
              {item.message}
            </Text>
          )}
          <Text style={[msgStyles.time, { color: isMe ? 'rgba(255,255,255,0.6)' : theme.colors.onSurfaceVariant }]} variant="labelSmall">
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      );
    },
    [user?.id, theme]
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          mode="outlined"
          style={styles.textInput}
          outlineColor={colors.outline}
          activeOutlineColor={colors.primary}
          textColor={colors.onSurface}
          theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
          dense
          left={
            <TextInput.Icon
              icon="camera"
              color={colors.primary}
              onPress={handlePickImage}
            />
          }
          right={
            <TextInput.Icon
              icon="send"
              color={colors.primary}
              onPress={handleSend}
              disabled={sending || !input.trim()}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const msgStyles = StyleSheet.create({
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, marginBottom: 8 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: colors.surfaceElevated, borderBottomLeftRadius: 4 },
  sender: { color: colors.primary, fontWeight: '600', marginBottom: 2 },
  text: { fontSize: 15, lineHeight: 20 },
  myText: { color: colors.white },
  theirText: { color: colors.onSurface },
  time: { color: 'rgba(255,255,255,0.5)', alignSelf: 'flex-end', marginTop: 4, fontSize: 10 },
  image: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginVertical: 4,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing.md },
  inputBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.outline },
  textInput: { backgroundColor: colors.surfaceVariant },
});
