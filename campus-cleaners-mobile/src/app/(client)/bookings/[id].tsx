import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable, Image } from 'react-native';
import { Text, Button, Card, Divider, Avatar, useTheme, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import { initiatePayment, releasePayment, fetchBookingPayment } from '@/lib/api/payments';
import type { Booking } from '@/lib/database.types';
import StatusBadge from '@/components/StatusBadge';
import LoadingScreen from '@/components/LoadingScreen';
import StarRating from '@/components/StarRating';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function BookingDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const { updateBookingStatus, cancelBooking, fetchBookingApplications, hireCleaner } = useBookingStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);

  const loadBooking = async () => {
    if (!id) return;
    setIsLoading(true);

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
    
    if (data) {
      // Fetch booking before/after photos
      try {
        const { data: photoData } = await supabase
          .from('booking_photos')
          .select('*')
          .eq('booking_id', data.id)
          .order('uploaded_at');
        if (photoData) {
          setPhotos(photoData);
        }
      } catch (err) {
        console.error('Error fetching booking photos:', err);
      }
    }

    if (data && data.status === 'requested' && !data.cleaner_id) {
      setLoadingApps(true);
      const apps = await fetchBookingApplications(data.id);
      setApplications(apps);
      setLoadingApps(false);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Realtime: reflect cleaner applications and status changes live.
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`client-booking-detail-${id}`)
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

  if (isLoading) return <LoadingScreen />;
  if (!booking) return <LoadingScreen message="Booking not found" />;

  const canCancel = ['requested', 'accepted'].includes(booking.status);
  const canVerify = booking.status === 'completed';
  const canRate = ['verified', 'closed'].includes(booking.status);
  const canChat = !['cancelled', 'declined', 'closed'].includes(booking.status);

  const handleVerify = async () => {
    // Release escrow payment
    try {
      const payment = await fetchBookingPayment(booking.id);
      if (payment) {
        await releasePayment(payment.id);
      }
    } catch (err) {
      console.error('Error fetching/releasing payment during verification:', err);
    }

    const success = await updateBookingStatus(booking.id, 'verified');
    if (success) loadBooking();
  };

  const handleCancel = async () => {
    const success = await cancelBooking(booking.id, 'Client cancelled');
    if (success) loadBooking();
  };

  const handleHire = async (appId: string, cleanerId: string, cleanerName: string) => {
    Alert.alert(
      'Hire Cleaner',
      `Are you sure you want to hire ${cleanerName} for this booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hire',
          onPress: async () => {
            const success = await hireCleaner(booking.id, appId, cleanerId);
            if (success) {
              // Initiate escrow payment in status 'held'
              try {
                await initiatePayment({
                  bookingId: booking.id,
                  clientId: booking.client_id,
                  cleanerId: cleanerId,
                  amount: Number(booking.total_price),
                });
              } catch (err) {
                console.error('Error initiating escrow payment:', err);
              }



              Alert.alert('Success', `${cleanerName} has been assigned to your booking!`);
              loadBooking();
            } else {
              Alert.alert('Error', 'Failed to hire cleaner.');
            }
          }
        }
      ]
    );
  };

  const handleDeclineApp = async (appId: string, cleanerName: string) => {
    Alert.alert(
      'Decline Application',
      `Are you sure you want to decline ${cleanerName}'s offer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          onPress: async () => {
            const { error } = await supabase
              .from('booking_applications')
              .update({ status: 'declined', updated_at: new Date().toISOString() })
              .eq('id', appId);

            if (!error) {
              // Notify cleaner of application decline
              const app = applications.find((a) => a.id === appId);
              if (app?.cleaner_id) {
                try {
                  const { createNotification } = await import('@/lib/notifications');
                  await createNotification({
                    userId: app.cleaner_id,
                    title: 'Offer Declined ⚠️',
                    body: `Your offer for the booking at ${booking.location} was declined.`,
                    data: { bookingId: booking.id, role: 'cleaner' },
                  });
                } catch (err) {
                  console.error('Error notifying cleaner of decline:', err);
                }
              }

              Alert.alert('Success', 'Application declined.');
              loadBooking();
            } else {
              Alert.alert('Error', 'Failed to decline application.');
            }
          }
        }
      ]
    );
  };

  const activeApps = applications.filter((app) => app.status === 'pending');

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.statusRow}>
        <StatusBadge status={booking.status} />
      </View>

      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
        <Card.Content>
          <Text style={[styles.serviceName, { color: theme.colors.onSurface }]} variant="titleLarge">
            {booking.service_type?.name ?? 'Service'}
          </Text>
          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          <DetailRow label="Location" value={booking.location} />
          <DetailRow label="Date" value={booking.scheduled_date} />
          <DetailRow label="Time" value={booking.scheduled_time} />
          <DetailRow label="Price" value={`GH₵ ${booking.total_price?.toFixed(2)}`} highlight />
          {booking.description && <DetailRow label="Notes" value={booking.description} />}
        </Card.Content>
      </Card>

      {booking.cleaner && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]} variant="titleSmall">Assigned Cleaner</Text>
            <Text style={[styles.cleanerName, { color: theme.colors.onSurface }]} variant="titleMedium">
              {(booking.cleaner as { full_name: string }).full_name}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Before/After Photos Card */}
      {photos.length > 0 && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]} variant="titleSmall">Job Verification Photos</Text>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
            
            {photos.filter((p) => p.photo_type === 'before').length > 0 && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ color: theme.colors.onSurface, fontWeight: '600', marginBottom: spacing.xs }} variant="bodyMedium">📸 Before Cleaning</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                  {photos.filter((p) => p.photo_type === 'before').map((photo) => (
                    <Image key={photo.id} source={{ uri: photo.file_url }} style={styles.verificationPhoto} />
                  ))}
                </ScrollView>
              </View>
            )}

            {photos.filter((p) => p.photo_type === 'after').length > 0 && (
              <View>
                <Text style={{ color: theme.colors.onSurface, fontWeight: '600', marginBottom: spacing.xs }} variant="bodyMedium">✅ After Cleaning</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                  {photos.filter((p) => p.photo_type === 'after').map((photo) => (
                    <Image key={photo.id} source={{ uri: photo.file_url }} style={styles.verificationPhoto} />
                  ))}
                </ScrollView>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Applications section */}
      {booking.status === 'requested' && !booking.cleaner_id && (
        <View style={styles.appsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]} variant="titleMedium">
            Cleaner Offers ({activeApps.length})
          </Text>

          {loadingApps ? (
            <ActivityIndicator animating color={theme.colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : activeApps.length === 0 ? (
            <Text style={[styles.noAppsText, { color: theme.colors.onSurfaceVariant }]} variant="bodyMedium">
              Waiting for verified cleaners to apply for this job...
            </Text>
          ) : (
            activeApps.map((app) => {
              const cleanerInfo = app.cleaner;
              const cleanerProfileInfo = cleanerInfo?.cleaner_profile?.[0] || app.cleaner_profile;
              const name = cleanerInfo?.full_name ?? 'Cleaner';
              const rating = cleanerProfileInfo?.avg_rating ?? 0;
              const jobs = cleanerProfileInfo?.total_jobs ?? 0;
              const bio = cleanerProfileInfo?.bio ?? 'No bio provided.';
              const skills = cleanerProfileInfo?.skills ?? [];

              return (
                <Card key={app.id} style={[styles.appCard, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="outlined">
                  <Card.Content style={styles.appCardContent}>
                    <View style={styles.appCardHeader}>
                      {cleanerInfo?.avatar_url ? (
                        <Avatar.Image size={40} source={{ uri: cleanerInfo.avatar_url }} />
                      ) : (
                        <Avatar.Text size={40} label={name.charAt(0)} color={colors.white} style={{ backgroundColor: theme.colors.primary }} />
                      )}
                      <View style={styles.appCardDetails}>
                        <Text style={[styles.appCleanerName, { color: theme.colors.onSurface }]} variant="titleMedium">
                          {name}
                        </Text>
                        <View style={styles.ratingRow}>
                          <StarRating rating={rating} size={14} />
                          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, marginLeft: 4 }}>
                            ({jobs} job{jobs !== 1 ? 's' : ''})
                          </Text>
                        </View>
                      </View>
                    </View>

                    {bio ? (
                      <Text style={[styles.appBioText, { color: theme.colors.onSurfaceVariant }]} variant="bodyMedium">
                        {bio}
                      </Text>
                    ) : null}

                    {skills && skills.length > 0 ? (
                      <View style={styles.skillsRow}>
                        {skills.map((skill: string) => (
                          <View key={skill} style={[styles.skillTag, { backgroundColor: theme.colors.primaryContainer }]}>
                            <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '600' }}>
                              {skill}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View style={styles.appActions}>
                      <Button
                        mode="outlined"
                        onPress={() => handleDeclineApp(app.id, name)}
                        textColor={theme.colors.error}
                        style={[styles.appBtn, { borderColor: theme.colors.error }]}
                        compact
                      >
                        Decline
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => handleHire(app.id, app.cleaner_id, name)}
                        buttonColor={theme.colors.primary}
                        style={styles.appBtn}
                        compact
                      >
                        Hire Cleaner
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {canChat && booking.cleaner_id && (
          <Button
            mode="contained"
            icon="chat"
            onPress={() => router.push(`/(client)/bookings/${booking.id}/chat` as never)}
            buttonColor={theme.colors.secondary}
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
            buttonColor={theme.colors.primary}
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
            textColor={theme.colors.primary}
            style={[styles.actionBtn, { borderColor: theme.colors.primary }]}
          >
            Rate Cleaner
          </Button>
        )}

        {canCancel && (
          <Button
            mode="outlined"
            icon="close-circle"
            onPress={handleCancel}
            textColor={theme.colors.error}
            style={[styles.actionBtn, { borderColor: theme.colors.error }]}
          >
            Cancel Booking
          </Button>
        )}
      </View>
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
  divider: { marginVertical: spacing.sm },
  sectionTitle: { marginBottom: spacing.xs, fontWeight: '700' },
  cleanerName: { fontWeight: '700' },
  actions: { gap: spacing.md },
  actionBtn: { borderRadius: 12 },
  
  // Cleaner Apps Section
  appsSection: { marginTop: spacing.xs, gap: spacing.sm },
  noAppsText: { textAlign: 'center', marginVertical: spacing.md, fontStyle: 'italic' },
  appCard: { borderRadius: borderRadius.md, borderWidth: 1 },
  appCardContent: { gap: spacing.sm },
  appCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  appCardDetails: { flex: 1 },
  appCleanerName: { fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  appBioText: { fontSize: 13, lineHeight: 18, marginTop: spacing.xs },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  skillTag: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  appActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.sm },
  appBtn: { borderRadius: 8, minWidth: 90 },
  verificationPhoto: {
    width: 120,
    height: 90,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.outline,
  },
});
