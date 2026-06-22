import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, IconButton } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { fetchMessages, sendMessage, fetchNewMessages } from '@/lib/api/messages';
import type { Message } from '@/lib/database.types';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function ChatScreen() {
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    loadMessages();

    // 3-second polling
    pollingRef.current = setInterval(() => {
      pollNewMessages();
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [bookingId]);

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

    const newMsgs = await fetchNewMessages(bookingId!, lastTimestamp);
    if (newMsgs.length > 0) {
      setMessages((prev) => [...prev, ...newMsgs]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !user?.id || !bookingId) return;
    setSending(true);

    const msg = await sendMessage(bookingId, user.id, input.trim());
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      setInput('');
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }

    setSending(false);
  };

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isMe = item.sender_id === user?.id;
      return (
        <View style={[msgStyles.bubble, isMe ? msgStyles.myBubble : msgStyles.theirBubble]}>
          {!isMe && (
            <Text style={msgStyles.sender} variant="labelSmall">
              {(item.sender as { full_name?: string })?.full_name ?? 'User'}
            </Text>
          )}
          <Text style={[msgStyles.text, isMe ? msgStyles.myText : msgStyles.theirText]}>
            {item.message}
          </Text>
          <Text style={msgStyles.time} variant="labelSmall">
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      );
    },
    [user?.id]
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
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: 4,
  },
  sender: {
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  myText: { color: colors.white },
  theirText: { color: colors.onSurface },
  time: {
    color: 'rgba(255,255,255,0.5)',
    alignSelf: 'flex-end',
    marginTop: 4,
    fontSize: 10,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, paddingBottom: spacing.md },
  inputBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  textInput: {
    backgroundColor: colors.surfaceVariant,
  },
});
