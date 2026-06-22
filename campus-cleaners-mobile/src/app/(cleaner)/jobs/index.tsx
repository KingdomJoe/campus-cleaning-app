import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, SegmentedButtons, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import BookingCard from '@/components/BookingCard';
import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import { colors, spacing } from '@/lib/theme';

export default function JobsListScreen() {
  const profile = useAuthStore((s) => s.profile);
  const cleanerProfile = useAuthStore((s) => s.cleanerProfile);
  const { activeBookings, pastBookings, availableJobs, isLoading, fetchCleanerJobs, fetchAvailableJobs } = useBookingStore();
  const [tab, setTab] = useState('available');

  useEffect(() => {
    if (profile?.id) {
      fetchCleanerJobs(profile.id);
      fetchAvailableJobs();
    }
  }, [profile?.id]);

  if (isLoading) return <LoadingScreen message="Loading jobs..." />;

  const isPending = cleanerProfile?.verification_status === 'pending';

  const dataMap: Record<string, typeof availableJobs> = {
    available: availableJobs,
    active: activeBookings,
    completed: pastBookings,
  };

  return (
    <View style={styles.container}>
      {isPending && (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingText} variant="bodySmall">
            ⏳ Your account is pending verification. You'll be able to accept jobs once approved.
          </Text>
        </View>
      )}

      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        buttons={[
          { value: 'available', label: `New (${availableJobs.length})`, style: styles.segBtn },
          { value: 'active', label: `Active (${activeBookings.length})`, style: styles.segBtn },
          { value: 'completed', label: `Done (${pastBookings.length})`, style: styles.segBtn },
        ]}
        style={styles.segment}
        theme={{ colors: { secondaryContainer: colors.primaryContainer } }}
      />

      <FlatList
        data={dataMap[tab]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            userRole="cleaner"
            onPress={() => router.push(`/(cleaner)/jobs/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon={tab === 'available' ? '📭' : tab === 'active' ? '🔧' : '✅'}
            title={
              tab === 'available'
                ? 'No new jobs available'
                : tab === 'active'
                ? 'No active jobs'
                : 'No completed jobs yet'
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pendingBanner: {
    backgroundColor: colors.statusRequested + '22',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.statusRequested,
  },
  pendingText: { color: colors.statusRequested, textAlign: 'center' },
  segment: { marginHorizontal: spacing.lg, marginVertical: spacing.md },
  segBtn: { borderColor: colors.outline },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
});
