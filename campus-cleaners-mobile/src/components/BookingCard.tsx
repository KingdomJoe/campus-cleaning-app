import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
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

  return (
    <Pressable onPress={onPress}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
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
