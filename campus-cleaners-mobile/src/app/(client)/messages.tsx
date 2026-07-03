import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { Text, Avatar, useTheme } from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { fetchConversations } from "@/lib/api/messages";
import EmptyState from "@/components/EmptyState";
import { spacing } from "@/lib/theme";

interface Conversation {
  bookingId: string;
  bookingStatus: string;
  serviceName: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  lastMessage: { message: string; created_at: string };
}

export default function MessagesScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const userId = user?.id;
  const loadConversations = useCallback(() => {
    if (userId) {
      fetchConversations(userId).then((data) => {
        // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
        setConversations(data as Conversation[]);
      });
    }
  }, [userId]);

  useFocusEffect(loadConversations);

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.bookingId}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.row, { borderBottomColor: theme.colors.outline }]}
          onPress={() =>
            router.push(`/(client)/bookings/${item.bookingId}/chat` as never)
          }
        >
          <Avatar.Text
            size={44}
            label={
              (item.otherUser as { full_name: string })?.full_name?.charAt(0) ??
              "?"
            }
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
            color={theme.colors.onPrimaryContainer}
          />
          <View style={styles.info}>
            <Text
              style={[styles.name, { color: theme.colors.onSurface }]}
              variant="titleSmall"
            >
              {(item.otherUser as { full_name: string })?.full_name ??
                "Unknown"}
            </Text>
            <Text
              style={[styles.preview, { color: theme.colors.onSurfaceVariant }]}
              variant="bodySmall"
              numberOfLines={1}
            >
              {item.lastMessage.message}
            </Text>
          </View>
          <Text
            style={[styles.time, { color: theme.colors.onSurfaceVariant }]}
            variant="labelSmall"
          >
            {new Date(item.lastMessage.created_at).toLocaleDateString()}
          </Text>
        </Pressable>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="💬"
          title="No messages yet"
          subtitle="Start a conversation from a booking"
          theme={theme}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: spacing.xxl, flexGrow: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  avatar: { backgroundColor: "transparent" },
  info: { flex: 1 },
  name: { fontWeight: "600" },
  preview: { marginTop: 2 },
  time: {},
});
