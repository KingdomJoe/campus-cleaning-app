/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import MapPicker from '@/components/MapPicker';
import { spacing, borderRadius } from '@/lib/theme';

export default function ClientLocationSettings() {
  const theme = useTheme();
  const { profile, fetchProfile } = useAuthStore();
  const [address, setAddress] = useState(profile?.location ?? '');
  const [roomNumber, setRoomNumber] = useState(profile?.room_number ?? '');
  const [postalName, setPostalName] = useState('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

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
        Alert.alert('Permission Denied', 'Permission to access location was denied. Please enable location services in your device settings.');
        return;
      }

      // Try high accuracy first, then fall back to balanced
      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      } catch {
        console.warn('[GPS] High accuracy failed, falling back to Balanced...');
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch {
          console.warn('[GPS] Balanced accuracy failed, trying Low...');
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
        }
      }

      // Reverse geocode the location to get a user-friendly name
      let addressName = '';
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (geocode && geocode.length > 0) {
          const item = geocode[0];
          const parts = [];
          if (item.name) parts.push(item.name);
          if (item.street) parts.push(item.street);
          if (item.district) parts.push(item.district);
          if (item.city) parts.push(item.city);
          if (item.region) parts.push(item.region);
          addressName = parts.filter(Boolean).join(', ');
        }
      } catch (geocodeErr) {
        console.warn('[GPS] Reverse geocoding failed:', geocodeErr);
      }

      setGpsCoords({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      if (addressName) {
        setAddress(addressName);
      } else {
        setAddress(`UCC Campus (${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)})`);
      }

      Alert.alert(
        'GPS Captured',
        `Lat: ${location.coords.latitude.toFixed(5)}, Lng: ${location.coords.longitude.toFixed(5)}\nAccuracy: ±${Math.round(location.coords.accuracy ?? 0)}m`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not get location';
      Alert.alert(
        'GPS Error',
        `Current location is unavailable. ${message}\n\nMake sure:\n• Location services are enabled\n• GPS/High accuracy mode is on\n• You are not indoors with no signal`,
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapChange = async (lat: number, lng: number) => {
    setGpsCoords({ lat, lng });
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const parts = [];
        if (item.name) parts.push(item.name);
        if (item.street) parts.push(item.street);
        if (item.district) parts.push(item.district);
        if (item.city) parts.push(item.city);
        if (item.region) parts.push(item.region);
        const addressName = parts.filter(Boolean).join(', ');
        if (addressName) {
          setAddress(addressName);
        }
      }
    } catch (err) {
      console.warn('[Map] Reverse geocoding failed:', err);
    }
  };

  const handleSave = async () => {
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Please enter your address or landmark');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userId = authUser?.id || profile?.id;
      if (!userId) throw new Error('User not authenticated');

      const fullLocationString = postalName.trim()
        ? `${address.trim()} | Postal: ${postalName.trim()}`
        : address.trim();

      const { error } = await supabase
        .from('profiles')
        .update({
          location: fullLocationString,
          room_number: roomNumber.trim() || null,
        })
        .eq('id', userId);

      if (error) throw error;

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
      <ScrollView 
        scrollEnabled={isScrollEnabled}
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]} variant="headlineMedium">
            📍 Location Settings
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]} variant="bodyMedium">
            Set your hostel address, room details, and pin your location on the map
          </Text>
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]} mode="contained">
          <Card.Content style={styles.form}>
            <TextInput
              label="Hostel Name / Landmark *"
              placeholder="e.g. Volta Hall, Main Campus"
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
              label="Room Number"
              placeholder="e.g. B204"
              value={roomNumber}
              onChangeText={setRoomNumber}
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
          onMapInteraction={(interacting) => setIsScrollEnabled(!interacting)}
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
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.sm,
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
