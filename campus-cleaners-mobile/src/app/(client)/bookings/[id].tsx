import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import type { Booking } from '@/lib/database.types';
import StatusBadge from '@/components/StatusBadge';
import LoadingScreen from '@/components/LoadingScreen';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const { updateBookingStatus, cancelBooking } = useBookingStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        cleaner:profiles!bookings_cleaner_id_fkey(*),
        client:profiles!bookings_client_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    setBooking(data);
    setIsLoading(false);
  };

  if (isLoading) return <LoadingScreen />;
  if (!booking) return <LoadingScreen message="Booking not found" />;

  const canCancel = ['requested', 'accepted'].includes(booking.status);
  const canVerify = booking.status === 'completed';
  const canRate = ['verified', 'closed'].includes(booking.status);
  const canChat = !['cancelled', 'declined', 'closed'].includes(booking.status);

  const handleVerify = async () => {
    const success = await updateBookingStatus(booking.id, 'verified');
    if (success) loadBooking();
  };

  const handleCancel = async () => {
    const success = await cancelBooking(booking.id, 'Client cancelled');
    if (success) loadBooking();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusRow}>
        <StatusBadge status={booking.status} />
      </View>

      <Card style={styles.card} mode="contained">
        <Card.Content>
          <Text style={styles.serviceName} variant="titleLarge">
            {booking.service_type?.name ?? 'Service'}
          </Text>
          <Divider style={styles.divider} />
          <DetailRow label="Location" value={booking.location} />
          <DetailRow label="Date" value={booking.scheduled_date} />
          <DetailRow label="Time" value={booking.scheduled_time} />
          <DetailRow label="Price" value={`GH₵ ${booking.total_price?.toFixed(2)}`} highlight />
          {booking.description && <DetailRow label="Notes" value={booking.description} />}
        </Card.Content>
      </Card>

      {booking.cleaner && (
        <Card style={styles.card} mode="contained">
          <Card.Content>
            <Text style={styles.sectionTitle} variant="titleSmall">Assigned Cleaner</Text>
            <Text style={styles.cleanerName} variant="titleMedium">
              {(booking.cleaner as { full_name: string }).full_name}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {canChat && (
          <Button
            mode="contained"
            icon="chat"
            onPress={() => router.push(`/(client)/bookings/${booking.id}/chat` as never)}
            buttonColor={colors.secondary}
            textColor={colors.white}
            style={styles.actionBtn}
          >
            Chat
          </Button>
        )}

        {canVerify && (
          <Button
            mode="contained"
            icon="check-circle"
            onPress={handleVerify}
            buttonColor={colors.success}
            textColor={colors.white}
            style={styles.actionBtn}
          >
            Verify & Release Payment
          </Button>
        )}

        {canRate && (
          <Button
            mode="outlined"
            icon="star"
            onPress={() => router.push(`/(client)/bookings/${booking.id}/rate` as never)}
            textColor={colors.star}
            style={styles.actionBtn}
          >
            Rate Cleaner
          </Button>
        )}

        {canCancel && (
          <Button
            mode="outlined"
            icon="close-circle"
            onPress={handleCancel}
            textColor={colors.error}
            style={[styles.actionBtn, { borderColor: colors.error }]}
          >
            Cancel Booking
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
  divider: { backgroundColor: colors.outline, marginVertical: spacing.sm },
  sectionTitle: { color: colors.onSurfaceVariant, marginBottom: spacing.xs },
  cleanerName: { color: colors.white, fontWeight: '700' },
  actions: { gap: spacing.md },
  actionBtn: { borderRadius: 12 },
});
