import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Button, Card, Avatar, Divider, Switch, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { useThemeStore } from '@/stores/themeStore';

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, signOut } = useAuthStore();
  const { themeMode, toggleTheme } = useThemeStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar.Text
          size={72}
          label={profile?.full_name?.charAt(0) ?? '?'}
          style={styles.avatar}
          color={colors.white}
        />
        <Text style={[styles.name, { color: theme.colors.onBackground }]} variant="headlineSmall">
          {profile?.full_name ?? 'User'}
        </Text>
        <Text style={styles.role} variant="bodyMedium">
          {profile?.role === 'cleaner' ? '🧹 Cleaner' : '🏠 Client'}
        </Text>
      </View>

      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
        <Card.Content>
          <InfoRow icon="📱" label="Phone" value={profile?.phone ?? '—'} />
          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          <InfoRow icon="📧" label="Email" value={profile?.email ?? '—'} />
          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          <Pressable onPress={() => router.push('/(client)/settings/location' as any)}>
            <InfoRow icon="📍" label="Location (Tap to change)" value={profile?.location ?? 'Not set'} />
          </Pressable>
          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          <View style={infoStyles.row}>
            <Text style={infoStyles.icon}>🌓</Text>
            <View style={{ flex: 1 }}>
              <Text style={[infoStyles.label, { color: theme.colors.onSurfaceVariant }]} variant="labelSmall">App Theme</Text>
              <Text style={[infoStyles.value, { color: theme.colors.onSurface }]} variant="bodyMedium">
                {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
              color={theme.colors.primary}
            />
          </View>
          {profile?.room_number && (
            <>
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <InfoRow icon="🚪" label="Room Number" value={profile.room_number} />
            </>
          )}
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        icon="logout"
        onPress={handleSignOut}
        textColor={theme.colors.error}
        style={[styles.logoutBtn, { borderColor: theme.colors.error }]}
      >
        Sign Out
      </Button>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.icon}>{icon}</Text>
      <View>
        <Text style={[infoStyles.label, { color: theme.colors.onSurfaceVariant }]} variant="labelSmall">{label}</Text>
        <Text style={[infoStyles.value, { color: theme.colors.onSurface }]} variant="bodyMedium">{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  icon: { fontSize: 20, width: 28, textAlign: 'center' },
  label: { fontSize: 11 },
  value: { fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: { backgroundColor: colors.primaryDark, marginBottom: spacing.md },
  name: { fontWeight: '700' },
  role: { color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  card: { borderRadius: borderRadius.lg, borderWidth: 1, marginTop: spacing.lg },
  divider: {},
  logoutBtn: { borderRadius: 12, marginTop: spacing.xl },
});
