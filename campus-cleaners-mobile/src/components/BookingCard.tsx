import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Card, Text, Avatar, useTheme } from 'react-native-paper';
import { format } from 'date-fns';
import type { Booking } from '@/lib/database.types';
import StatusBadge from './StatusBadge';
import { colors, spacing, borderRadius } from '@/lib/theme';

interface BookingCardProps {
  booking: Booking;
  userRole: 'client' | 'cleaner';
  onPress?: () => void;
}

export default function BookingCard({ booking, userRole, onPress }: BookingCardProps) {
  const theme = useTheme();
  const otherPerson =
    userRole === 'client' ? booking.cleaner : booking.client;
  const serviceName = booking.service_type?.name ?? 'Service';

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateAnim = useRef(new Animated.Value(15)).current;

  // Glow/Pulse animation for active bookings
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isActive = ['requested', 'accepted', 'en_route', 'arrived', 'started'].includes(booking.status);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    // Infinite pulsing loop for active/pending bookings to signify activity
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.015,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive, fadeAnim, scaleAnim, translateAnim, pulseAnim]);

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateAnim },
            { scaleX: pulseAnim },
            { scaleY: pulseAnim },
          ],
        }}
      >
        <Card
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: isActive ? theme.colors.primary : theme.colors.outline,
              borderWidth: isActive ? 1.5 : 1,
              shadowColor: isActive ? theme.colors.primary : '#000',
              shadowOpacity: isActive ? 0.15 : 0.05,
              shadowRadius: isActive ? 8 : 4,
              elevation: isActive ? 4 : 2,
            },
          ]}
          mode="contained"
        >
          <Card.Content style={styles.content}>
            <View style={styles.topRow}>
              <View style={styles.serviceInfo}>
                <Text style={[styles.serviceName, { color: theme.colors.onSurface }]} variant="titleSmall">
                  {serviceName}
                </Text>
                <Text style={[styles.location, { color: theme.colors.onSurfaceVariant }]} variant="bodySmall">
                  📍 {booking.location}
                </Text>
              </View>
              <StatusBadge status={booking.status} compact />
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.dateTime}>
                <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]} variant="bodySmall">
                  📅 {booking.scheduled_date ? format(new Date(booking.scheduled_date), 'MMM d, yyyy') : '—'}
                </Text>
                <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]} variant="bodySmall">
                  🕐 {booking.scheduled_time ?? '—'}
                </Text>
              </View>
              <Text style={styles.price} variant="titleMedium">
                GH₵ {booking.total_price?.toFixed(2) ?? '0.00'}
              </Text>
            </View>

            {otherPerson && (
              <View style={[styles.personRow, { borderTopColor: theme.colors.outline }]}>
                <Avatar.Text
                  size={28}
                  label={otherPerson.full_name?.charAt(0) ?? '?'}
                  style={styles.avatar}
                  color={colors.white}
                />
                <Text style={[styles.personName, { color: theme.colors.onSurfaceVariant }]} variant="bodySmall">
                  {userRole === 'client' ? 'Cleaner: ' : 'Client: '}
                  {otherPerson.full_name}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  content: {
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  serviceName: {
    fontWeight: '700',
  },
  location: {
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTime: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateText: {
  },
  price: {
    color: colors.primary,
    fontWeight: '700',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
  },
  avatar: {
    backgroundColor: colors.primaryDark,
  },
  personName: {
  },
});
