import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Avatar, Divider, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import StarRating from '@/components/StarRating';
import { colors, spacing, borderRadius } from '@/lib/theme';

const verificationStatusConfig = {
  pending: { label: 'Pending Verification', color: colors.warning, icon: '⏳' },
  approved: { label: 'Verified', color: colors.success, icon: '✅' },
  rejected: { label: 'Rejected', color: colors.error, icon: '❌' },
};

export default function CleanerProfileScreen() {
  const { profile, cleanerProfile, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  const verificationStatus =
    verificationStatusConfig[cleanerProfile?.verification_status ?? 'pending'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={profile?.full_name?.charAt(0) ?? '?'}
          style={styles.avatar}
          color={colors.white}
        />
        <Text style={styles.name} variant="headlineSmall">
          {profile?.full_name ?? 'Cleaner'}
        </Text>
        <Text style={styles.role} variant="bodyMedium">🧹 Cleaner</Text>

        {/* Verification Badge */}
        <Chip
          icon={() => <Text>{verificationStatus.icon}</Text>}
          style={[styles.verificationChip, { borderColor: verificationStatus.color }]}
          textStyle={{ color: verificationStatus.color, fontWeight: '600', fontSize: 12 }}
          mode="outlined"
        >
          {verificationStatus.label}
        </Chip>

        {/* Rating */}
        {cleanerProfile && cleanerProfile.avg_rating !== null && cleanerProfile.avg_rating > 0 && (
          <View style={styles.ratingRow}>
            <StarRating rating={cleanerProfile.avg_rating} showValue size={20} />
            <Text style={styles.jobCount} variant="bodySmall">
              ({cleanerProfile.total_jobs} job{cleanerProfile.total_jobs !== 1 ? 's' : ''})
            </Text>
          </View>
        )}
      </View>

      {/* Personal Info */}
      <Card style={styles.card} mode="contained">
        <Card.Content>
          <Text style={styles.sectionTitle} variant="labelLarge">Personal Information</Text>
          <Divider style={styles.divider} />
          <InfoRow icon="📱" label="Phone" value={profile?.phone ?? '—'} />
          <InfoRow icon="📧" label="Email" value={profile?.email ?? '—'} />
          <InfoRow icon="📍" label="Location" value={profile?.location ?? 'Not set'} />
        </Card.Content>
      </Card>

      {/* Cleaner Details */}
      <Card style={styles.card} mode="contained">
        <Card.Content>
          <Text style={styles.sectionTitle} variant="labelLarge">Work Details</Text>
          <Divider style={styles.divider} />
          <InfoRow icon="💰" label="MoMo Number" value={cleanerProfile?.mobile_money_number ?? '—'} />
          <InfoRow icon="👤" label="Guarantor" value={cleanerProfile?.guarantor_name ?? '—'} />
          <InfoRow
            icon="🟢"
            label="Availability"
            value={cleanerProfile?.availability ?? 'offline'}
          />

          {cleanerProfile?.bio && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.bioLabel} variant="labelSmall">Bio</Text>
              <Text style={styles.bioText} variant="bodyMedium">
                {cleanerProfile.bio}
              </Text>
            </>
          )}

          {cleanerProfile?.skills && cleanerProfile.skills.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.bioLabel} variant="labelSmall">Skills</Text>
              <View style={styles.skillsRow}>
                {cleanerProfile.skills.map((skill) => (
                  <Chip
                    key={skill}
                    style={styles.skillChip}
                    textStyle={styles.skillText}
                    compact
                  >
                    {skill}
                  </Chip>
                ))}
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        icon="logout"
        onPress={handleSignOut}
        textColor={colors.error}
        style={styles.logoutBtn}
      >
        Sign Out
      </Button>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.icon}>{icon}</Text>
      <View>
        <Text style={infoStyles.label} variant="labelSmall">{label}</Text>
        <Text style={infoStyles.value} variant="bodyMedium">{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  icon: { fontSize: 20, width: 28, textAlign: 'center' },
  label: { color: colors.onSurfaceVariant },
  value: { color: colors.white, fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: { backgroundColor: colors.primaryDark, marginBottom: spacing.md },
  name: { color: colors.white, fontWeight: '700' },
  role: { color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  verificationChip: { marginTop: spacing.md, backgroundColor: 'transparent' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  jobCount: { color: colors.onSurfaceVariant },
  card: { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outline, marginBottom: spacing.lg },
  sectionTitle: { color: colors.primary, fontWeight: '600' },
  divider: { backgroundColor: colors.outline, marginVertical: spacing.sm },
  bioLabel: { color: colors.onSurfaceVariant, marginBottom: 4 },
  bioText: { color: colors.onSurface },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  skillChip: { backgroundColor: colors.primaryContainer },
  skillText: { color: colors.primary, fontSize: 12 },
  logoutBtn: { borderColor: colors.error, borderRadius: 12, marginTop: spacing.md },
});
