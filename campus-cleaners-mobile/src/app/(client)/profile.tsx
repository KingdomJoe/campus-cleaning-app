import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, Card, Avatar, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar.Text
          size={72}
          label={profile?.full_name?.charAt(0) ?? '?'}
          style={styles.avatar}
          color={colors.white}
        />
        <Text style={styles.name} variant="headlineSmall">
          {profile?.full_name ?? 'User'}
        </Text>
        <Text style={styles.role} variant="bodyMedium">
          {profile?.role === 'cleaner' ? '🧹 Cleaner' : '🏠 Client'}
        </Text>
      </View>

      <Card style={styles.card} mode="contained">
        <Card.Content>
          <InfoRow icon="📱" label="Phone" value={profile?.phone ?? '—'} />
          <Divider style={styles.divider} />
          <InfoRow icon="📧" label="Email" value={profile?.email ?? '—'} />
          <Divider style={styles.divider} />
          <Pressable onPress={() => router.push('/(client)/settings/location' as any)}>
            <InfoRow icon="📍" label="Location (Tap to change)" value={profile?.location ?? 'Not set'} />
          </Pressable>
          {profile?.room_number && (
            <>
              <Divider style={styles.divider} />
              <InfoRow icon="🚪" label="Room Number" value={profile.room_number} />
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
  card: { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outline, marginTop: spacing.lg },
  divider: { backgroundColor: colors.outline },
  logoutBtn: { borderColor: colors.error, borderRadius: 12, marginTop: spacing.xl },
});
