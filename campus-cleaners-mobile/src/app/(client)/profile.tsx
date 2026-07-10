import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Text as PaperText, Button, Card, Avatar, Divider, Switch, TextInput, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, borderRadius } from '@/lib/theme';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';
import { pickImage, uploadAvatar } from '@/lib/api/uploads';
import { showToast } from '@/lib/toast';

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, signOut, fetchProfile, profileLoading, session } = useAuthStore();
  const { themeMode, toggleTheme } = useThemeStore();

  // Edit mode state - MUST be before early return for hooks rules
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Sync state with store profile updates
  useEffect(() => {
    if (profile) {
      setPhone(profile.phone ?? '');
      setEmail(profile.email ?? '');
      setFullName(profile.full_name ?? '');
    }
  }, [profile]);

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <PaperText style={styles.loadingText} variant="bodyMedium">
          Loading profile...
        </PaperText>
      </View>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  const handlePickAvatar = async () => {
    if (!session?.user?.id) {
      showToast('Please log in to update photo', 'error');
      return;
    }
    try {
      const uri = await pickImage({ aspect: [1, 1] });
      if (!uri) return;

      setIsUploadingPhoto(true);
      const publicUrl = await uploadAvatar(session.user.id, uri);
      if (publicUrl) {
        await fetchProfile();
        showToast('Profile photo updated successfully!', 'success');
      } else {
        showToast('Could not upload photo. Check network and try again.', 'error');
      }
    } catch (err) {
      console.error('Photo picker error:', err);
      showToast('Failed to update profile photo.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!session?.user?.id) {
      showToast('Authentication error. Please log in again.', 'error');
      return;
    }
    if (!profile) {
      showToast('Profile not loaded. Please wait...', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const updates: { full_name?: string; phone?: string | null; email?: string | null } = {};

      if (fullName.trim() && fullName.trim() !== profile.full_name) {
        updates.full_name = fullName.trim();
      }

      // Clean, format, and validate phone if entered
      let formattedPhone = phone.trim();
      if (formattedPhone) {
        const cleaned = formattedPhone.replace(/[^\d+]/g, '');
        formattedPhone = cleaned.startsWith('+') ? cleaned : `+233${cleaned.replace(/^0/, '')}`;
        const ghanaPhoneRegex = /^\+233\d{9}$/;
        if (!ghanaPhoneRegex.test(formattedPhone)) {
          showToast('Please enter a valid Ghana mobile number (e.g. 024 123 4567).', 'error');
          setIsSaving(false);
          return;
        }
      }

      const finalPhoneValue = formattedPhone || null;
      if (finalPhoneValue !== (profile.phone ?? null)) {
        updates.phone = finalPhoneValue;
      }

      if (email.trim() !== (profile.email ?? '')) {
        updates.email = email.trim() || null;
      }

      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        showToast('No changes to save', 'info');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
        .update(updates)
        .eq('id', session.user.id);

      if (error) throw error;

      await fetchProfile();
      setIsEditing(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      showToast(message, 'error');
      Alert.alert('Save failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPhone(profile?.phone ?? '');
    setEmail(profile?.email ?? '');
    setFullName(profile?.full_name ?? '');
  };

  const firstName = profile?.full_name?.split(' ')[0] ?? 'User';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      {/* Profile Photo & Header */}
      <View style={styles.header}>
        <Pressable onPress={handlePickAvatar} disabled={isUploadingPhoto}>
          <View style={styles.avatarWrapper}>
            {profile?.avatar_url ? (
              <Avatar.Image
                size={72}
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={72}
                label={firstName.charAt(0)}
                style={styles.avatar}
                color={colors.white}
              />
            )}
            <View style={[styles.cameraBadge, { backgroundColor: theme.colors.primary }]}>
              <PaperText style={{ fontSize: 12 }}>📷</PaperText>
            </View>
          </View>
        </Pressable>

        {isUploadingPhoto && (
          <PaperText style={{ color: theme.colors.primary, marginTop: 4, fontSize: 12 }}>
            Uploading photo...
          </PaperText>
        )}

        {isEditing ? (
          <TextInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            dense
            style={[styles.nameInput, { backgroundColor: theme.colors.background }]}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />
        ) : (
          <PaperText style={[styles.name, { color: theme.colors.onBackground }]} variant="headlineSmall">
            {profile?.full_name ?? 'User'}
          </PaperText>
        )}
        <PaperText style={styles.role} variant="bodyMedium">
          {profile?.role === 'cleaner' ? '🧹 Cleaner' : '🏠 Client'}
        </PaperText>
      </View>

      {/* Profile Info Card */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
        <Card.Content>
          {/* Edit button header */}
          <View style={styles.cardHeader}>
            <PaperText style={[styles.sectionTitle, { color: theme.colors.primary }]} variant="labelLarge">
              Personal Information
            </PaperText>
            {!isEditing && (
              <Button
                mode="text"
                compact
                onPress={() => setIsEditing(true)}
                textColor={theme.colors.primary}
              >
                Edit
              </Button>
            )}
          </View>
          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

          {isEditing ? (
            /* Edit Mode */
            <View style={styles.editForm}>
              <TextInput
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                mode="outlined"
                dense
                keyboardType="phone-pad"
                placeholder="e.g. 024 123 4567"
                style={{ backgroundColor: theme.colors.background }}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
              />
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                dense
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="e.g. user@example.com"
                style={{ backgroundColor: theme.colors.background }}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                textColor={theme.colors.onSurface}
              />

              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <Pressable onPress={() => router.push('/(client)/settings/location' as any)}>
                <InfoRow icon="📍" label="Location (Tap to change)" value={profile?.location ?? 'Not set'} />
              </Pressable>

              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

              <View style={styles.editActionRow}>
                <Button
                  mode="outlined"
                  onPress={handleCancelEdit}
                  disabled={isSaving}
                  textColor={theme.colors.onSurfaceVariant}
                  style={styles.actionBtn}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveProfile}
                  loading={isSaving}
                  disabled={isSaving}
                  buttonColor={theme.colors.primary}
                  style={styles.actionBtn}
                >
                  Save
                </Button>
              </View>
            </View>
          ) : (
            /* View Mode */
            <>
              <Pressable onPress={() => setIsEditing(true)}>
                <InfoRow icon="📱" label="Phone" value={profile?.phone ?? '—'} />
              </Pressable>
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <Pressable onPress={() => setIsEditing(true)}>
                <InfoRow icon="📧" label="Email" value={profile?.email ?? '—'} />
              </Pressable>
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <Pressable onPress={() => router.push('/(client)/settings/location' as any)}>
                <InfoRow icon="📍" label="Location (Tap to change)" value={profile?.location ?? 'Not set'} />
              </Pressable>
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              <View style={infoStyles.row}>
                <PaperText style={infoStyles.icon}>🌓</PaperText>
                <View style={{ flex: 1 }}>
                  <PaperText style={[infoStyles.label, { color: theme.colors.onSurfaceVariant }]} variant="labelSmall">App Theme</PaperText>
                  <PaperText style={[infoStyles.value, { color: theme.colors.onSurface }]} variant="bodyMedium">
                    {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </PaperText>
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
      <PaperText style={infoStyles.icon}>{icon}</PaperText>
      <View style={{ flex: 1 }}>
        <PaperText style={[infoStyles.label, { color: theme.colors.onSurfaceVariant }]} variant="labelSmall">{label}</PaperText>
        <PaperText style={[infoStyles.value, { color: theme.colors.onSurface }]} variant="bodyMedium">{value}</PaperText>
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
  avatarWrapper: { position: 'relative', alignSelf: 'center' },
  avatar: { backgroundColor: colors.primaryDark, marginBottom: spacing.md },
  cameraBadge: {
    position: 'absolute',
    bottom: spacing.md,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: { fontWeight: '700' },
  nameInput: { width: '80%', marginTop: spacing.sm },
  role: { color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  card: { borderRadius: borderRadius.lg, borderWidth: 1, marginTop: spacing.lg },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontWeight: '600' },
  divider: { marginVertical: spacing.xs },
  logoutBtn: { borderRadius: 12, marginTop: spacing.xl },
  editForm: { gap: spacing.md, marginTop: spacing.xs },
  editActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionBtn: { borderRadius: 8, minWidth: 90 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { color: colors.onSurfaceVariant },
});
