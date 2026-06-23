import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { fetchConversations } from '@/lib/api/messages';
import EmptyState from '@/components/EmptyState';
import { colors, spacing } from '@/lib/theme';

interface Conversation {
  bookingId: string;
  bookingStatus: string;
  serviceName: string;
  otherUser: { id: string; full_name: string; avatar_url: string | null } | null;
  lastMessage: { message: string; created_at: string };
}

export default function CleanerMessagesScreen() {
  const user = useAuthStore((s) => s.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchConversations(user.id).then((data) => {
        // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
        setConversations(data as Conversation[]);
      });
    }
  }, [user?.id]);

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.bookingId}
      style={styles.container}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => router.push(`/(cleaner)/jobs/${item.bookingId}/chat` as never)}
        >
          <Avatar.Text
            size={44}
            label={(item.otherUser as { full_name: string })?.full_name?.charAt(0) ?? '?'}
            style={styles.avatar}
            color={colors.white}
          />
          <View style={styles.info}>
            <Text style={styles.name} variant="titleSmall">
              {(item.otherUser as { full_name: string })?.full_name ?? 'Unknown'}
            </Text>
            <Text style={styles.service} variant="labelSmall">
              {item.serviceName}
            </Text>
            <Text style={styles.preview} variant="bodySmall" numberOfLines={1}>
              {item.lastMessage.message}
            </Text>
          </View>
          <Text style={styles.time} variant="labelSmall">
            {new Date(item.lastMessage.created_at).toLocaleDateString()}
          </Text>
        </Pressable>
      )}
      ListEmptyComponent={
        <EmptyState icon="💬" title="No messages yet" subtitle="Messages will appear once you accept a job" />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    gap: spacing.md,
  },
  avatar: { backgroundColor: colors.primaryDark },
  info: { flex: 1 },
  name: { color: colors.white, fontWeight: '600' },
  service: { color: colors.primary, fontSize: 11 },
  preview: { color: colors.onSurfaceVariant, marginTop: 2 },
  time: { color: colors.onSurfaceVariant },
});
