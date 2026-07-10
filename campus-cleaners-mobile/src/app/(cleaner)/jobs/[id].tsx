import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Divider, useTheme, ActivityIndicator, Portal, Dialog, RadioButton } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { createNotification } from '@/lib/notifications';
import { trackEvent } from '@/lib/analytics';
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
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const cleanerProfile = useAuthStore((s) => s.cleanerProfile);
  const { updateBookingStatus, applyForJob, cancelBooking } = useBookingStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [loadingApp, setLoadingApp] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('Emergency');
  const [documents, setDocuments] = useState<Record<string, string | null>>({
    ghana_card: null,
    selfie: null,
  });

  // Profile completion (mirrors jobs list: 100% required to apply)
  const hasPhoto = !!profile?.avatar_url;
  const hasBio = !!cleanerProfile?.bio?.trim();
  const hasMomo = !!cleanerProfile?.mobile_money_number?.trim();
  const hasSkills = !!(
    cleanerProfile?.skills && cleanerProfile.skills.length > 0
  );
  const hasGuarantor = !!(
    cleanerProfile?.guarantor_name?.trim() &&
    cleanerProfile?.guarantor_phone?.trim()
  );
  const hasGhanaCard = !!documents.ghana_card;
  const hasSelfie = !!documents.selfie;
  const isProfileComplete =
    hasPhoto && hasBio && hasMomo && hasSkills && hasGuarantor && hasGhanaCard && hasSelfie;
  const isApproved = cleanerProfile?.verification_status === 'approved';
  const canApply = isApproved && isProfileComplete;

  const loadDocuments = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('cleaner_documents')
        .select('document_type, file_url')
        .eq('cleaner_id', profile.id);
      if (error) throw error;
      const docsMap: Record<string, string | null> = { ghana_card: null, selfie: null };
      data?.forEach((doc) => {
        docsMap[doc.document_type] = doc.file_url;
      });
      setDocuments(docsMap);
    } catch (err) {
      console.error('Error loading documents in job detail:', err);
    }
  };

  const loadBooking = async () => {
    if (!id) return;
    setIsLoading(true);

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

    if (profile && data) {
      setLoadingApp(true);
      const { data: appData } = await supabase
        .from('booking_applications')
        .select('*')
        .eq('booking_id', data.id)
        .eq('cleaner_id', profile.id)
        .maybeSingle();

      if (appData) {
        setHasApplied(true);
        setAppStatus(appData.status);
      } else {
        setHasApplied(false);
        setAppStatus(null);
      }
      setLoadingApp(false);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBooking();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Realtime: reflect client hire/decline and status changes live.
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`cleaner-job-detail-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `id=eq.${id}` },
        () => loadBooking()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'booking_applications', filter: `booking_id=eq.${id}` },
        () => loadBooking()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleApply = async () => {
    if (!booking || !profile) return;

    // Security check: only approved cleaners with a complete profile can apply.
    // (Also enforced in the DB via RLS — booking_applications INSERT policy.)
    if (!canApply) {
      Alert.alert(
        'Profile Required',
        isApproved
          ? 'Complete your cleaner profile (photo, bio, mobile money, skills, guarantor, and ID/selfie documents) before applying for jobs.'
          : 'Your cleaner profile must be verified by an admin before applying for jobs.'
      );
      return;
    }

    setUpdating(true);
    const success = await applyForJob(booking.id, profile.id);
    if (success) {
      // Notify client
      await createNotification({
        userId: booking.client_id,
        title: 'New offer for your booking! 🧹',
        body: `${profile.full_name} has applied for your job at ${booking.location}.`,
        data: { bookingId: booking.id, role: 'client' },
      });

      Alert.alert('Success', 'Application submitted successfully!');
      loadBooking();
    } else {
      Alert.alert('Error', 'Failed to submit application.');
    }
    setUpdating(false);
  };

  const handleStatusUpdate = async () => {
    if (!booking || !profile) return;
    const transition = STATUS_TRANSITIONS[booking.status];
    if (!transition) return;

    const cleanerProfile = useAuthStore.getState().cleanerProfile;
    const isApproved = cleanerProfile?.verification_status === 'approved';
    if (!isApproved) {
      Alert.alert('Not Verified', 'Your cleaner profile must be verified by an admin.');
      return;
    }

    setUpdating(true);

    const success = await updateBookingStatus(booking.id, transition.next);
    if (success) {
      try {
        trackEvent('job_status_changed', {
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: transition.next,
        });
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }

      if (booking.client_id) {
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

  const handleCancelJob = async () => {
    if (!booking || !profile) return;
    setUpdating(true);
    const success = await cancelBooking(booking.id, `Cleaner Cancelled: ${cancelReason}`);
    if (success) {
      if (booking.client_id) {
        await createNotification({
          userId: booking.client_id,
          title: 'Cleaner Cancelled Booking ⚠️',
          body: `Your cleaner has cancelled the booking due to: ${cancelReason}.`,
          data: { bookingId: booking.id, role: 'client' },
        });
      }

      Alert.alert('Cancelled', 'You have successfully cancelled the job.');
      loadBooking();
    } else {
      Alert.alert('Error', 'Failed to cancel the job.');
    }
    setUpdating(false);
    setShowCancelDialog(false);
  };

  if (isLoading) return <LoadingScreen />;
  if (!booking) return <LoadingScreen message="Job not found" />;

  const isAssignedToMe = booking.cleaner_id === profile?.id;
  const isUnassigned = booking.status === 'requested' && !booking.cleaner_id;

  const transition = isAssignedToMe ? STATUS_TRANSITIONS[booking.status] : null;
  const canChat = isAssignedToMe && !['cancelled', 'declined', 'closed'].includes(booking.status);
  const canUploadPhotos = isAssignedToMe && ['arrived', 'started', 'completed'].includes(booking.status);
  const canCancel = isAssignedToMe && ['accepted', 'en_route', 'arrived'].includes(booking.status);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.statusRow}>
        <StatusBadge status={booking.status} />
      </View>

      {/* Service Details */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
        <Card.Content>
          <Text style={[styles.serviceName, { color: theme.colors.onSurface }]} variant="titleLarge">
            {booking.service_type?.name ?? 'Service'}
          </Text>
          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          <DetailRow label="Location" value={booking.location} />
          <DetailRow label="Date" value={booking.scheduled_date} />
          <DetailRow label="Time" value={booking.scheduled_time} />
          <DetailRow label="Payout" value={`GH₵ ${((booking.total_price ?? 0) * 0.8).toFixed(2)}`} highlight />
          {booking.description && <DetailRow label="Notes" value={booking.description} />}

          {booking.room_type && (
            <>
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <DetailRow label="Room Type" value={booking.room_type} />
              <DetailRow label="Room Size" value={booking.room_size ?? '—'} />
              <DetailRow label="Rooms" value={String(booking.room_count ?? 1)} />
              <DetailRow label="Bathroom" value={booking.bathroom_included ? 'Yes' : 'No'} />
            </>
          )}

          {booking.laundry_items && Array.isArray(booking.laundry_items) && (
            <>
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <Text style={[styles.subTitle, { color: theme.colors.primary }]} variant="labelLarge">Laundry Items</Text>
              {(booking.laundry_items as { item_type: string; quantity: number }[]).map((item) => (
                <DetailRow key={item.item_type} label={item.item_type} value={`× ${item.quantity}`} />
              ))}
            </>
          )}
        </Card.Content>
      </Card>

      {/* Client Info */}
      {booking.client && isAssignedToMe && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
          <Card.Content>
            <Text style={[styles.subTitle, { color: theme.colors.onSurfaceVariant }]} variant="titleSmall">Client</Text>
            <Text style={[styles.clientName, { color: theme.colors.onSurface }]} variant="titleMedium">
              {(booking.client as { full_name: string }).full_name}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Bid/Application Flow */}
        {isUnassigned && !isAssignedToMe && (
          loadingApp ? (
            <ActivityIndicator animating color={theme.colors.primary} />
          ) : hasApplied ? (
            <Button
              mode="contained"
              disabled
              style={styles.actionBtn}
            >
              {appStatus === 'declined' ? 'Application Declined' : 'Applied - Awaiting Client Choice'}
            </Button>
          ) : canApply ? (
            <Button
              mode="contained"
              icon="hand-pointing-right"
              onPress={handleApply}
              loading={updating}
              disabled={updating}
              buttonColor={theme.colors.primary}
              textColor={colors.white}
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
              labelStyle={styles.actionBtnLabel}
            >
              Apply for Job
            </Button>
          ) : (
            <View style={styles.actionBtn}>
              <Button
                mode="contained"
                disabled
                buttonColor={theme.colors.outline}
                textColor={theme.colors.onSurface}
                contentStyle={styles.actionBtnContent}
                labelStyle={styles.actionBtnLabel}
              >
                {isApproved ? 'Complete Profile to Apply' : 'Verification Required to Apply'}
              </Button>
              <Text
                style={[styles.applyHint, { color: theme.colors.onSurfaceVariant }]}
                variant="bodySmall"
              >
                {isApproved
                  ? 'Finish your profile so you can apply for this job.'
                  : 'You can view this job, but applying requires admin verification.'}
              </Text>
            </View>
          )
        )}

        {/* Primary status transition (only for hired cleaner) */}
        {isAssignedToMe && transition && (
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

        {/* Chat */}
        {canChat && (
          <Button
            mode="contained"
            icon="chat"
            onPress={() => router.push(`/(cleaner)/jobs/${booking.id}/chat` as never)}
            buttonColor={theme.colors.secondary}
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
            textColor={theme.colors.primary}
            style={styles.actionBtn}
          >
            Upload Photos
          </Button>
        )}

        {/* Cancel Booking */}
        {canCancel && (
          <Button
            mode="outlined"
            icon="close-circle"
            onPress={() => setShowCancelDialog(true)}
            textColor={theme.colors.error}
            style={[styles.actionBtn, { borderColor: theme.colors.error }]}
          >
            Cancel Booking
          </Button>
        )}
      </View>

      <Portal>
        <Dialog visible={showCancelDialog} onDismiss={() => setShowCancelDialog(false)} style={{ backgroundColor: theme.colors.surfaceVariant }}>
          <Dialog.Title style={{ color: theme.colors.onSurface }}>Cancel Booking</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }} variant="bodyMedium">
              Please select a reason for cancelling this booking:
            </Text>
            {['Illness', 'Emergency', 'Safety Concern', 'Transportation Issue', 'Other'].map((reason) => (
              <View key={reason} style={styles.dialogRadioRow}>
                <RadioButton
                  value={reason}
                  status={cancelReason === reason ? 'checked' : 'unchecked'}
                  onPress={() => setCancelReason(reason)}
                  color={theme.colors.primary}
                  uncheckedColor={theme.colors.onSurfaceVariant}
                />
                <Text style={{ color: theme.colors.onSurface, marginLeft: 8 }}>{reason}</Text>
              </View>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCancelDialog(false)} textColor={theme.colors.onSurfaceVariant}>
              Go Back
            </Button>
            <Button onPress={handleCancelJob} textColor={theme.colors.error} loading={updating} disabled={updating}>
              Confirm Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const theme = useTheme();
  return (
    <View style={detailStyles.row}>
      <Text style={[detailStyles.label, { color: theme.colors.onSurfaceVariant }]} variant="bodySmall">{label}</Text>
      <Text style={[detailStyles.value, { color: theme.colors.onSurface }, highlight && { color: theme.colors.primary }]} variant="bodyMedium">{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: {},
  value: { fontWeight: '600', flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  statusRow: { alignItems: 'flex-start' },
  card: { borderRadius: borderRadius.lg, borderWidth: 1 },
  serviceName: { fontWeight: '700', marginBottom: spacing.xs },
  subTitle: { marginBottom: spacing.xs },
  divider: { marginVertical: spacing.sm },
  clientName: { fontWeight: '700' },
  actions: { gap: spacing.md },
  actionBtn: { borderRadius: 12 },
  actionBtnContent: { paddingVertical: 6 },
  applyHint: { textAlign: 'center', marginTop: spacing.xs },
  actionBtnLabel: { fontSize: 16, fontWeight: '700' },
  dialogRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
});
