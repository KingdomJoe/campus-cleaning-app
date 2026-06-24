import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, SegmentedButtons, Chip, Card, Button, ProgressBar, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useBookingStore } from '@/stores/bookingStore';
import BookingCard from '@/components/BookingCard';
import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function JobsListScreen() {
  const profile = useAuthStore((s) => s.profile);
  const cleanerProfile = useAuthStore((s) => s.cleanerProfile);
  const { activeBookings, pastBookings, availableJobs, isLoading, fetchCleanerJobs, fetchAvailableJobs } = useBookingStore();
  const [tab, setTab] = useState('available');
  const theme = useTheme();

  useEffect(() => {
    if (profile?.id) {
      fetchCleanerJobs(profile.id);
      fetchAvailableJobs();
    }
  }, [profile?.id]);

  if (isLoading) return <LoadingScreen message="Loading jobs..." />;

  // Calculate Profile Completion Percentage
  const hasPhoto = !!profile?.avatar_url;
  const hasBio = !!cleanerProfile?.bio?.trim();
  const hasMomo = !!cleanerProfile?.mobile_money_number?.trim();
  const hasSkills = !!(cleanerProfile?.skills && cleanerProfile.skills.length > 0);
  const hasGuarantor = !!(cleanerProfile?.guarantor_name?.trim() && cleanerProfile?.guarantor_phone?.trim());

  let completionPct = 0;
  if (hasPhoto) completionPct += 20;
  if (hasBio) completionPct += 20;
  if (hasMomo) completionPct += 20;
  if (hasSkills) completionPct += 20;
  if (hasGuarantor) completionPct += 20;

  const isProfileIncomplete = completionPct < 100;
  const verificationStatus = cleanerProfile?.verification_status ?? 'pending';
  const isApproved = verificationStatus === 'approved';

  const dataMap: Record<string, typeof availableJobs> = {
    available: availableJobs,
    active: activeBookings,
    completed: pastBookings,
  };

  const renderAvailableJobsTab = () => {
    if (isProfileIncomplete) {
      return (
        <View style={styles.blockContainer}>
          <Card style={[styles.blockCard, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
            <Card.Content style={styles.blockCardContent}>
              <Text style={styles.blockIcon}>⚠️</Text>
              <Text style={[styles.blockTitle, { color: theme.colors.onSurface }]} variant="titleLarge">
                Complete Your Profile
              </Text>
              <Text style={styles.blockDesc} variant="bodyMedium">
                Before you can start accepting jobs, your cleaner profile must be 100% complete and approved by the admin team.
              </Text>

              <View style={styles.gaugeSection}>
                <View style={styles.gaugeHeader}>
                  <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurfaceVariant }}>Completion Gauge</Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>{completionPct}%</Text>
                </View>
                <ProgressBar progress={completionPct / 100} color={theme.colors.secondary} style={styles.progressBar} />
              </View>

              <View style={styles.checklist}>
                <Text style={styles.checkItem} variant="bodyMedium">{hasPhoto ? '✅' : '❌'} Profile Photo</Text>
                <Text style={styles.checkItem} variant="bodyMedium">{hasBio ? '✅' : '❌'} Short Bio</Text>
                <Text style={styles.checkItem} variant="bodyMedium">{hasMomo ? '✅' : '❌'} Mobile Money Number</Text>
                <Text style={styles.checkItem} variant="bodyMedium">{hasSkills ? '✅' : '❌'} Professional Skills</Text>
                <Text style={styles.checkItem} variant="bodyMedium">{hasGuarantor ? '✅' : '❌'} Guarantor Details</Text>
              </View>

              <Button
                mode="contained"
                onPress={() => router.push('/(cleaner)/profile')}
                style={styles.blockBtn}
                buttonColor={theme.colors.primary}
              >
                Go to Profile Settings
              </Button>
            </Card.Content>
          </Card>
        </View>
      );
    }

    if (!isApproved) {
      return (
        <View style={styles.blockContainer}>
          <Card style={[styles.blockCard, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
            <Card.Content style={styles.blockCardContent}>
              <Text style={styles.blockIcon}>{verificationStatus === 'rejected' ? '❌' : '⏳'}</Text>
              <Text style={[styles.blockTitle, { color: theme.colors.onSurface }]} variant="titleLarge">
                {verificationStatus === 'rejected' ? 'Verification Rejected' : 'Awaiting Verification'}
              </Text>
              <Text style={styles.blockDesc} variant="bodyMedium">
                {verificationStatus === 'rejected'
                  ? 'Your profile verification details were rejected. Please review and update your work details in the Profile tab or contact support.'
                  : 'Your profile is 100% complete and is currently under review by our admin team. You will be able to accept jobs as soon as you are verified.'}
              </Text>
              {verificationStatus === 'rejected' && (
                <Button
                  mode="contained"
                  onPress={() => router.push('/(cleaner)/profile')}
                  style={styles.blockBtn}
                  buttonColor={theme.colors.primary}
                >
                  Edit Profile Details
                </Button>
              )}
            </Card.Content>
          </Card>
        </View>
      );
    }

    return (
      <FlatList
        data={availableJobs}
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
            icon="📭"
            title="No new jobs available"
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        buttons={[
          { value: 'available', label: `New (${isApproved && !isProfileIncomplete ? availableJobs.length : '—'})`, style: styles.segBtn },
          { value: 'active', label: `Active (${activeBookings.length})`, style: styles.segBtn },
          { value: 'completed', label: `Done (${pastBookings.length})`, style: styles.segBtn },
        ]}
        style={styles.segment}
        theme={{ colors: { secondaryContainer: colors.primaryContainer } }}
      />

      {tab === 'available' ? (
        renderAvailableJobsTab()
      ) : (
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
              icon={tab === 'active' ? '🔧' : '✅'}
              title={tab === 'active' ? 'No active jobs' : 'No completed jobs yet'}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  segment: { marginHorizontal: spacing.lg, marginVertical: spacing.md },
  segBtn: { borderColor: colors.outline },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  
  // Blocker Overlay
  blockContainer: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  blockCard: { width: '100%', borderRadius: borderRadius.lg, borderWidth: 1 },
  blockCardContent: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  blockIcon: { fontSize: 48, marginBottom: spacing.xs },
  blockTitle: { fontWeight: '700', textAlign: 'center' },
  blockDesc: { color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.xs },
  gaugeSection: { width: '100%', marginTop: spacing.md, gap: spacing.xs },
  gaugeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressBar: { height: 8, borderRadius: 4 },
  checklist: { width: '100%', gap: spacing.xs, marginVertical: spacing.md, paddingLeft: spacing.sm },
  checkItem: { color: colors.onSurfaceVariant },
  blockBtn: { width: '100%', borderRadius: 12, marginTop: spacing.sm },
});
