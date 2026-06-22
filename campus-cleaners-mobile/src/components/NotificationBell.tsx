import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Badge } from 'react-native-paper';
import { useNotificationStore } from '@/stores/notificationStore';
import { colors } from '@/lib/theme';

interface NotificationBellProps {
  onPress?: () => void;
}

export default function NotificationBell({ onPress }: NotificationBellProps) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Pressable onPress={onPress} style={styles.container} hitSlop={12}>
      <Text style={styles.icon}>🔔</Text>
      {unreadCount > 0 && (
        <Badge style={styles.badge} size={18}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    color: colors.white,
    fontWeight: '700',
  },
});
