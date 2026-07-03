import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text as PaperText, Button, Card, Divider, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { showToast } from '@/lib/toast';

export default function BookingSummaryScreen() {
  const theme = useTheme();
  const { form, createBooking } = useBookingStore();
  const profile = useAuthStore((s) => s.profile);
  const profileLoading = useAuthStore((s) => s.profileLoading);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Security guard: redirect back if service type is not selected
  React.useEffect(() => {
    if (!form.serviceTypeId) {
      router.replace('/(client)/book');
    }
  }, [form.serviceTypeId]);

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <PaperText style={styles.loadingText} variant="bodyMedium">
          Loading your profile...
        </PaperText>
      </View>
    );
  }

  // Validate form before submission
  const validateForm = (): string | null => {
    if (!form.location?.trim()) return 'Location is required';
    if (!form.scheduledDate) return 'Date is required';
    if (!form.scheduledTime) return 'Time is required';
    if (form.serviceCategory === 'cleaning') {
      if (!form.roomType) return 'Room type is required';
      if (!form.roomSize) return 'Room size is required';
      if (!form.roomCount || form.roomCount < 1) return 'At least 1 room is required';
    }
    if (form.serviceCategory === 'laundry') {
      if (!form.laundryItems || form.laundryItems.length === 0) return 'At least one laundry item is required';
    }
    return null;
  };

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
    console.log('[BookingSummary] Confirm booking pressed');
    
    // Validate form first
    const validationError = validateForm();
    if (validationError) {
      console.log('[BookingSummary] Validation failed:', validationError);
      showToast(validationError, 'error');
      return;
    }

    if (!profile?.id) {
      console.log('[BookingSummary] No profile found, redirecting to login');
      showToast('Please log in to book a service', 'error');
      router.replace('/(auth)/login');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('[BookingSummary] Creating booking with:', { clientId: profile.id, totalPrice, form });
      const booking = await createBooking(profile.id, totalPrice);
      console.log('[BookingSummary] Booking created:', booking);
      
      if (booking) {
        showToast('Booking confirmed! A cleaner will be assigned shortly.', 'success');
        router.replace('/(client)/bookings');
      } else {
        const errMsg = 'Failed to create booking. Please try again.';
        console.error('[BookingSummary] createBooking returned null');
        setError(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Something went wrong. Please try again.';
      console.error('[BookingSummary] Error creating booking:', err);
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
        <Card.Content>
          <PaperText style={[styles.cardTitle, { color: theme.colors.onSurface }]} variant="titleMedium">Booking Details</PaperText>
          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

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
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <PaperText style={styles.subTitle} variant="labelLarge">Laundry Items</PaperText>
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
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <PaperText style={[styles.notesLabel, { color: theme.colors.onSurfaceVariant }]} variant="labelSmall">Notes</PaperText>
              <PaperText style={[styles.notesValue, { color: theme.colors.onSurface }]} variant="bodySmall">{form.description}</PaperText>
            </>
          ) : null}
        </Card.Content>
      </Card>

      <Card style={[styles.priceCard, { backgroundColor: theme.colors.primaryContainer }]} mode="contained">
        <Card.Content style={styles.priceContent}>
          <PaperText style={[styles.priceLabel, { color: theme.colors.onPrimaryContainer }]} variant="titleSmall">Total Price</PaperText>
          <PaperText style={styles.priceValue} variant="headlineMedium">
            GH₵ {totalPrice.toFixed(2)}
          </PaperText>
          <PaperText style={[styles.priceNote, { color: theme.colors.onPrimaryContainer }]} variant="bodySmall">
            Payment held in escrow until work is verified
          </PaperText>
        </Card.Content>
      </Card>

      {error ? (
        <PaperText style={styles.error} variant="bodySmall">{error}</PaperText>
      ) : null}

      <Button
        mode="contained"
        onPress={handleConfirm}
        loading={isLoading}
        disabled={isLoading}
        style={styles.btn}
        contentStyle={styles.btnContent}
        labelStyle={styles.btnLabel}
        buttonColor={theme.colors.primary}
        icon="check-circle"
      >
        Confirm Booking
      </Button>

      <Button
        mode="text"
        onPress={() => router.back()}
        textColor={theme.colors.onSurfaceVariant}
      >
        ← Edit Details
      </Button>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={detailStyles.row}>
      <PaperText style={[detailStyles.label, { color: theme.colors.onSurfaceVariant }]} variant="bodySmall">{label}</PaperText>
      <PaperText style={[detailStyles.value, { color: theme.colors.onSurface }]} variant="bodyMedium">{value}</PaperText>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  label: {},
  value: { fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: { borderRadius: borderRadius.lg, borderWidth: 1 },
  cardTitle: { fontWeight: '700' },
  subTitle: { color: colors.primary, fontWeight: '600', marginBottom: spacing.xs },
  divider: { marginVertical: spacing.sm },
  notesLabel: { marginBottom: 4 },
  notesValue: {},
  priceCard: { borderRadius: borderRadius.lg },
  priceContent: { alignItems: 'center', paddingVertical: spacing.lg },
  priceLabel: {},
  priceValue: { color: colors.primary, fontWeight: '800', marginVertical: spacing.xs },
  priceNote: { opacity: 0.8 },
  error: { color: colors.error, textAlign: 'center' },
  btn: { borderRadius: 12 },
  btnContent: { paddingVertical: 6 },
  btnLabel: { fontSize: 16, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { color: colors.onSurfaceVariant },
});
