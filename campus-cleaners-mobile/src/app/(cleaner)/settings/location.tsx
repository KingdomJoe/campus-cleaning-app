import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuthStore, BYPASS_AUTH } from '@/stores/authStore';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function CleanerLocationSettings() {
  const { profile, cleanerProfile, fetchProfile } = useAuthStore();
  const [address, setAddress] = useState(profile?.location ?? '');
  const [postalName, setPostalName] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(
    cleanerProfile?.current_lat && cleanerProfile?.current_lng
      ? { lat: cleanerProfile.current_lat, lng: cleanerProfile.current_lng }
      : null
  );

  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.location && profile.location.includes(' | Postal: ')) {
      const parts = profile.location.split(' | Postal: ');
      setAddress(parts[0]);
      setPostalName(parts[1]);
    }
  }, [profile]);

  const handleGetGPS = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setGpsCoords({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
      Alert.alert('GPS Captured', `Lat: ${location.coords.latitude.toFixed(4)}, Lng: ${location.coords.longitude.toFixed(4)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not get location';
      Alert.alert('GPS Error', message);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSave = async () => {
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Please enter your location or address');
      return;
    }

    setIsSaving(true);
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const fullLocationString = postalName.trim()
        ? `${address.trim()} | Postal: ${postalName.trim()}`
        : address.trim();

      if (BYPASS_AUTH) {
        const currentProfile = useAuthStore.getState().profile;
        if (currentProfile) {
          useAuthStore.getState().setProfile({
            ...currentProfile,
            location: fullLocationString,
          });
        }
        if (gpsCoords) {
          const currentCleanerProfile = useAuthStore.getState().cleanerProfile;
          if (currentCleanerProfile) {
            useAuthStore.getState().setCleanerProfile({
              ...currentCleanerProfile,
              current_lat: gpsCoords.lat,
              current_lng: gpsCoords.lng,
            });
          }
        }
        setIsSaving(false);
        Alert.alert('Success', 'Location settings updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      // Update profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          location: fullLocationString,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update cleaner_profiles with GPS coordinates
      if (gpsCoords) {
        const { error: cleanerError } = await supabase
          .from('cleaner_profiles')
          .update({
            current_lat: gpsCoords.lat,
            current_lng: gpsCoords.lng,
          })
          .eq('user_id', user.id);

        if (cleanerError) throw cleanerError;
      }

      await fetchProfile();
      Alert.alert('Success', 'Location settings updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed';
      Alert.alert('Save Failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title} variant="headlineMedium">
            📍 Location Settings
          </Text>
          <Text style={styles.subtitle} variant="bodyMedium">
            Update your operational location and current GPS coordinates to receive nearby jobs
          </Text>
        </View>

        <Card style={styles.card} mode="contained">
          <Card.Content style={styles.form}>
            <TextInput
              label="Operational Address / Landmark *"
              placeholder="e.g. Volta Hall, Legon Campus"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.outline}
              activeOutlineColor={colors.primary}
              textColor={colors.onSurface}
              theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
            />

            <TextInput
              label="Postal Name / GPS Code"
              placeholder="e.g. GA-183-9382"
              value={postalName}
              onChangeText={setPostalName}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.outline}
              activeOutlineColor={colors.primary}
              textColor={colors.onSurface}
              theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
            />

            <View style={styles.gpsContainer}>
              <Button
                mode="outlined"
                onPress={handleGetGPS}
                loading={isLocating}
                disabled={isLocating || isSaving}
                icon="crosshairs-gps"
                style={styles.gpsBtn}
                textColor={colors.primary}
              >
                Pin Current GPS
              </Button>
              {gpsCoords && (
                <Text style={styles.gpsText} variant="bodySmall">
                  Lat: {gpsCoords.lat.toFixed(4)}, Lng: {gpsCoords.lng.toFixed(4)}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {isSaving ? (
          <ActivityIndicator animating color={colors.primary} style={styles.loader} />
        ) : (
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={isLocating}
            style={styles.btn}
            contentStyle={styles.btnContent}
            labelStyle={styles.btnLabel}
            buttonColor={colors.primary}
          >
            Save Location
          </Button>
        )}

        <Button
          mode="text"
          onPress={() => router.back()}
          textColor={colors.onSurfaceVariant}
          style={styles.backBtn}
        >
          ← Cancel
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.white,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
  },
  gpsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  gpsBtn: {
    borderColor: colors.primary,
    borderRadius: 8,
  },
  gpsText: {
    color: colors.success,
    fontWeight: '500',
  },
  btn: {
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  btnContent: {
    paddingVertical: 8,
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: spacing.xs,
  },
  loader: {
    marginVertical: spacing.md,
  },
});
