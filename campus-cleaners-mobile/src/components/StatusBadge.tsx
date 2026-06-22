import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import type { BookingStatus } from '@/lib/database.types';
import { colors } from '@/lib/theme';

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: string }> = {
  requested: { label: 'Requested', color: colors.statusRequested, icon: 'clock-outline' },
  accepted: { label: 'Accepted', color: colors.statusAccepted, icon: 'check-circle-outline' },
  en_route: { label: 'En Route', color: colors.statusEnRoute, icon: 'map-marker-path' },
  arrived: { label: 'Arrived', color: colors.statusArrived, icon: 'map-marker-check' },
  started: { label: 'In Progress', color: colors.statusStarted, icon: 'broom' },
  completed: { label: 'Completed', color: colors.statusCompleted, icon: 'check-all' },
  verified: { label: 'Verified', color: colors.statusVerified, icon: 'shield-check' },
  closed: { label: 'Closed', color: colors.statusClosed, icon: 'lock' },
  cancelled: { label: 'Cancelled', color: colors.statusCancelled, icon: 'close-circle' },
  declined: { label: 'Declined', color: colors.statusDeclined, icon: 'cancel' },
};

interface StatusBadgeProps {
  status: BookingStatus;
  compact?: boolean;
}

export default function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    color: colors.onSurfaceVariant,
    icon: 'help-circle',
  };

  return (
    <Chip
      icon={config.icon}
      style={[styles.chip, { borderColor: config.color }]}
      textStyle={[styles.text, { color: config.color }]}
      compact={compact}
      mode="outlined"
    >
      {config.label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
