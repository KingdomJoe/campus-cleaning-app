import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import MapPicker from '@/components/MapPicker';
import { spacing, borderRadius } from '@/lib/theme';

export default function CleanerLocationSettings() {
  const theme = useTheme();
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const handleMapChange = (lat: number, lng: number) => {
    setGpsCoords({ lat, lng });
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

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          location: fullLocationString,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

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
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]} variant="headlineMedium">
            📍 Location Settings
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]} variant="bodyMedium">
            Set your operational area and pin your current location to receive nearby jobs
          </Text>
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
          <Card.Content style={styles.form}>
            <TextInput
              label="Operational Address / Landmark *"
              placeholder="e.g. Volta Hall, Legon Campus"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              style={[styles.input, { backgroundColor: theme.colors.background }]}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              theme={{ colors: { onSurfaceVariant: theme.colors.onSurfaceVariant } }}
            />

            <TextInput
              label="Postal Name / GPS Code"
              placeholder="e.g. GA-183-9382"
              value={postalName}
              onChangeText={setPostalName}
              mode="outlined"
              style={[styles.input, { backgroundColor: theme.colors.background }]}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              theme={{ colors: { onSurfaceVariant: theme.colors.onSurfaceVariant } }}
            />

            <View style={styles.gpsContainer}>
              <Button
                mode="outlined"
                onPress={handleGetGPS}
                loading={isLocating}
                disabled={isLocating || isSaving}
                icon="crosshairs-gps"
                style={[styles.gpsBtn, { borderColor: theme.colors.primary }]}
                textColor={theme.colors.primary}
              >
                Pin Current GPS
              </Button>
              {gpsCoords && (
                <Text style={{ color: theme.colors.primary, fontWeight: '500' }} variant="bodySmall">
                  Lat: {gpsCoords.lat.toFixed(4)}, Lng: {gpsCoords.lng.toFixed(4)}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        <Text style={[styles.mapLabel, { color: theme.colors.onBackground }]} variant="titleSmall">
          🗺️ Pin your location on the map
        </Text>
        <MapPicker
          latitude={gpsCoords?.lat ?? null}
          longitude={gpsCoords?.lng ?? null}
          onLocationChange={handleMapChange}
        />

        {isSaving ? (
          <Button mode="contained" loading disabled style={styles.btn} buttonColor={theme.colors.primary}>
            Saving...
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={isLocating}
            style={styles.btn}
            contentStyle={styles.btnContent}
            labelStyle={styles.btnLabel}
            buttonColor={theme.colors.primary}
          >
            Save Location
          </Button>
        )}

        <Button
          mode="text"
          onPress={() => router.back()}
          textColor={theme.colors.onSurfaceVariant}
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
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  input: {},
  gpsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  gpsBtn: {
    borderRadius: 8,
  },
  mapLabel: {
    fontWeight: '600',
    marginBottom: spacing.sm,
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
});
