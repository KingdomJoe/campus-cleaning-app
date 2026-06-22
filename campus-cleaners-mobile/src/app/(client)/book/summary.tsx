import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function BookingSummaryScreen() {
  const { form, createBooking, resetForm } = useBookingStore();
  const profile = useAuthStore((s) => s.profile);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Simple price calculation
  const calculatePrice = (): number => {
    if (form.serviceCategory === 'cleaning') {
      const sizeMultiplier = form.roomSize === 'large' ? 1.5 : form.roomSize === 'medium' ? 1.2 : 1;
      const bathroomExtra = form.bathroomIncluded ? 15 : 0;
      return Math.round((30 * form.roomCount * sizeMultiplier + bathroomExtra) * 100) / 100;
    } else {
      return form.laundryItems.reduce((sum, item) => sum + item.quantity * 4, 0);
    }
  };

  const totalPrice = calculatePrice();

  const handleConfirm = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError('');

    try {
      const booking = await createBooking(profile.id, totalPrice);
      if (booking) {
        router.replace('/(client)/bookings');
      } else {
        setError('Failed to create booking. Please try again.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card} mode="contained">
        <Card.Content>
          <Text style={styles.cardTitle} variant="titleMedium">Booking Details</Text>
          <Divider style={styles.divider} />

          <DetailRow label="Service" value={form.serviceCategory === 'cleaning' ? '🧹 Cleaning' : '👕 Laundry'} />
          <DetailRow label="Location" value={form.location} />
          <DetailRow label="Date" value={form.scheduledDate} />
          <DetailRow label="Time" value={form.scheduledTime} />

          {form.serviceCategory === 'cleaning' && (
            <>
              <DetailRow label="Room Type" value={form.roomType} />
              <DetailRow label="Room Size" value={form.roomSize} />
              <DetailRow label="Rooms" value={String(form.roomCount)} />
              <DetailRow label="Bathroom" value={form.bathroomIncluded ? 'Yes' : 'No'} />
            </>
          )}

          {form.serviceCategory === 'laundry' && form.laundryItems.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.subTitle} variant="labelLarge">Laundry Items</Text>
              {form.laundryItems.map((item) => (
                <DetailRow
                  key={item.item_type}
                  label={item.item_type}
                  value={`× ${item.quantity}`}
                />
              ))}
            </>
          )}

          {form.description ? (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.notesLabel} variant="labelSmall">Notes</Text>
              <Text style={styles.notesValue} variant="bodySmall">{form.description}</Text>
            </>
          ) : null}
        </Card.Content>
      </Card>

      <Card style={styles.priceCard} mode="contained">
        <Card.Content style={styles.priceContent}>
          <Text style={styles.priceLabel} variant="titleSmall">Total Price</Text>
          <Text style={styles.priceValue} variant="headlineMedium">
            GH₵ {totalPrice.toFixed(2)}
          </Text>
          <Text style={styles.priceNote} variant="bodySmall">
            Payment held in escrow until work is verified
          </Text>
        </Card.Content>
      </Card>

      {error ? (
        <Text style={styles.error} variant="bodySmall">{error}</Text>
      ) : null}

      <Button
        mode="contained"
        onPress={handleConfirm}
        loading={isLoading}
        disabled={isLoading}
        style={styles.btn}
        contentStyle={styles.btnContent}
        labelStyle={styles.btnLabel}
        buttonColor={colors.primary}
        icon="check-circle"
      >
        Confirm Booking
      </Button>

      <Button
        mode="text"
        onPress={() => router.back()}
        textColor={colors.onSurfaceVariant}
      >
        ← Edit Details
      </Button>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label} variant="bodySmall">{label}</Text>
      <Text style={detailStyles.value} variant="bodyMedium">{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  label: { color: colors.onSurfaceVariant },
  value: { color: colors.white, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outline },
  cardTitle: { color: colors.white, fontWeight: '700' },
  subTitle: { color: colors.primary, fontWeight: '600', marginBottom: spacing.xs },
  divider: { marginVertical: spacing.sm, backgroundColor: colors.outline },
  notesLabel: { color: colors.onSurfaceVariant, marginBottom: 4 },
  notesValue: { color: colors.onSurface },
  priceCard: { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.lg },
  priceContent: { alignItems: 'center', paddingVertical: spacing.lg },
  priceLabel: { color: colors.onPrimaryContainer },
  priceValue: { color: colors.primary, fontWeight: '800', marginVertical: spacing.xs },
  priceNote: { color: colors.onPrimaryContainer, opacity: 0.8 },
  error: { color: colors.error, textAlign: 'center' },
  btn: { borderRadius: 12 },
  btnContent: { paddingVertical: 6 },
  btnLabel: { fontSize: 16, fontWeight: '700' },
});
