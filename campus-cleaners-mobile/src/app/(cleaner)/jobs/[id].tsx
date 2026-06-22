import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { createNotification } from '@/lib/notifications';
import type { Booking, BookingStatus } from '@/lib/database.types';
import StatusBadge from '@/components/StatusBadge';
import LoadingScreen from '@/components/LoadingScreen';
import { colors, spacing, borderRadius } from '@/lib/theme';

const STATUS_TRANSITIONS: Record<string, { next: BookingStatus; label: string; icon: string; color: string }> = {
  requested: { next: 'accepted', label: 'Accept Job', icon: 'check', color: colors.success },
  accepted: { next: 'en_route', label: 'On My Way', icon: 'navigation', color: colors.statusEnRoute },
  en_route: { next: 'arrived', label: 'I\'ve Arrived', icon: 'map-marker-check', color: colors.statusArrived },
  arrived: { next: 'started', label: 'Start Cleaning', icon: 'broom', color: colors.statusStarted },
  started: { next: 'completed', label: 'Mark Complete', icon: 'check-all', color: colors.statusCompleted },
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const { updateBookingStatus } = useBookingStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        service_type:service_types(*),
        client:profiles!bookings_client_id_fkey(*),
        cleaner:profiles!bookings_cleaner_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    setBooking(data);
    setIsLoading(false);
  };

  const handleStatusUpdate = async () => {
    if (!booking || !profile) return;
    const transition = STATUS_TRANSITIONS[booking.status];
    if (!transition) return;

    setUpdating(true);

    // If accepting, assign cleaner to the booking
    if (booking.status === 'requested') {
      const { error } = await supabase
        .from('bookings')
        .update({
          cleaner_id: profile.id,
          status: transition.next,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (!error) {
        // Notify client
        await createNotification({
          userId: booking.client_id,
          title: 'Job Accepted! 🎉',
          body: `${profile.full_name} has accepted your booking.`,
          data: { bookingId: booking.id, role: 'client' },
        });
      }
    } else {
      const success = await updateBookingStatus(booking.id, transition.next);
      if (success && booking.client_id) {
        const statusLabels: Record<string, string> = {
          en_route: 'Your cleaner is on the way! 🚶',
          arrived: 'Your cleaner has arrived! 🏠',
          started: 'Cleaning has started! 🧹',
          completed: 'Cleaning is complete! ✅ Please verify the work.',
        };

        await createNotification({
          userId: booking.client_id,
          title: 'Booking Update',
          body: statusLabels[transition.next] ?? `Status changed to ${transition.next}`,
          data: { bookingId: booking.id, role: 'client' },
        });
      }
    }

    setUpdating(false);
    loadBooking();
  };

  const handleDecline = async () => {
    if (!booking) return;
    setUpdating(true);
    await updateBookingStatus(booking.id, 'declined');
    setUpdating(false);
    loadBooking();
  };

  if (isLoading) return <LoadingScreen />;
  if (!booking) return <LoadingScreen message="Job not found" />;

  const transition = STATUS_TRANSITIONS[booking.status];
  const canChat = !['cancelled', 'declined', 'closed'].includes(booking.status);
  const canUploadPhotos = ['arrived', 'started', 'completed'].includes(booking.status);
  const isUnassigned = booking.status === 'requested' && !booking.cleaner_id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusRow}>
        <StatusBadge status={booking.status} />
      </View>

      {/* Service Details */}
      <Card style={styles.card} mode="contained">
        <Card.Content>
          <Text style={styles.serviceName} variant="titleLarge">
            {booking.service_type?.name ?? 'Service'}
          </Text>
          <Divider style={styles.divider} />
          <DetailRow label="Location" value={booking.location} />
          <DetailRow label="Date" value={booking.scheduled_date} />
          <DetailRow label="Time" value={booking.scheduled_time} />
          <DetailRow label="Payout" value={`GH₵ ${((booking.total_price ?? 0) * 0.8).toFixed(2)}`} highlight />
          {booking.description && <DetailRow label="Notes" value={booking.description} />}

          {booking.room_type && (
            <>
              <Divider style={styles.divider} />
              <DetailRow label="Room Type" value={booking.room_type} />
              <DetailRow label="Room Size" value={booking.room_size ?? '—'} />
              <DetailRow label="Rooms" value={String(booking.room_count ?? 1)} />
              <DetailRow label="Bathroom" value={booking.bathroom_included ? 'Yes' : 'No'} />
            </>
          )}

          {booking.laundry_items && Array.isArray(booking.laundry_items) && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.subTitle} variant="labelLarge">Laundry Items</Text>
              {(booking.laundry_items as { item_type: string; quantity: number }[]).map((item) => (
                <DetailRow key={item.item_type} label={item.item_type} value={`× ${item.quantity}`} />
              ))}
            </>
          )}
        </Card.Content>
      </Card>

      {/* Client Info */}
      {booking.client && (
        <Card style={styles.card} mode="contained">
          <Card.Content>
            <Text style={styles.subTitle} variant="titleSmall">Client</Text>
            <Text style={styles.clientName} variant="titleMedium">
              {(booking.client as { full_name: string }).full_name}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Primary status transition */}
        {transition && (
          <Button
            mode="contained"
            icon={transition.icon}
            onPress={handleStatusUpdate}
            loading={updating}
            disabled={updating}
            buttonColor={transition.color}
            textColor={colors.white}
            style={styles.actionBtn}
            contentStyle={styles.actionBtnContent}
            labelStyle={styles.actionBtnLabel}
          >
            {transition.label}
          </Button>
        )}

        {/* Decline (only for unassigned) */}
        {isUnassigned && (
          <Button
            mode="outlined"
            icon="close"
            onPress={handleDecline}
            textColor={colors.error}
            style={[styles.actionBtn, { borderColor: colors.error }]}
            disabled={updating}
          >
            Decline
          </Button>
        )}

        {/* Chat */}
        {canChat && booking.cleaner_id && (
          <Button
            mode="contained"
            icon="chat"
            onPress={() => router.push(`/(cleaner)/jobs/${booking.id}/chat` as never)}
            buttonColor={colors.secondary}
            textColor={colors.white}
            style={styles.actionBtn}
          >
            Chat with Client
          </Button>
        )}

        {/* Photos */}
        {canUploadPhotos && (
          <Button
            mode="outlined"
            icon="camera"
            onPress={() => router.push(`/(cleaner)/jobs/${booking.id}/photos` as never)}
            textColor={colors.primary}
            style={styles.actionBtn}
          >
            Upload Photos
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label} variant="bodySmall">{label}</Text>
      <Text style={[detailStyles.value, highlight && { color: colors.primary }]} variant="bodyMedium">{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { color: colors.onSurfaceVariant },
  value: { color: colors.white, fontWeight: '600', flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  statusRow: { alignItems: 'flex-start' },
  card: { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outline },
  serviceName: { color: colors.white, fontWeight: '700', marginBottom: spacing.xs },
  subTitle: { color: colors.onSurfaceVariant, marginBottom: spacing.xs },
  divider: { backgroundColor: colors.outline, marginVertical: spacing.sm },
  clientName: { color: colors.white, fontWeight: '700' },
  actions: { gap: spacing.md },
  actionBtn: { borderRadius: 12 },
  actionBtnContent: { paddingVertical: 6 },
  actionBtnLabel: { fontSize: 16, fontWeight: '700' },
});
