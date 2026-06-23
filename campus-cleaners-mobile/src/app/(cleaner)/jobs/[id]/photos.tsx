import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore, BYPASS_AUTH } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { takePhoto, pickImage, uploadBookingPhoto } from '@/lib/api/uploads';
import type { BookingPhoto } from '@/lib/database.types';
import { colors, spacing, borderRadius } from '@/lib/theme';

// Local cache for photos in mock mode
const mockPhotosCache: Record<string, BookingPhoto[]> = {};

export default function PhotosScreen() {
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();
  const [photos, setPhotos] = useState<BookingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [bookingId]);

  const loadPhotos = async () => {
    if (!bookingId) return;
    if (BYPASS_AUTH) {
      if (!mockPhotosCache[bookingId]) {
        mockPhotosCache[bookingId] = [];
      }
      setPhotos([...mockPhotosCache[bookingId]]);
      return;
    }
    const { data } = await supabase
      .from('booking_photos')
      .select('*')
      .eq('booking_id', bookingId)
      .order('uploaded_at');
    // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
    if (data) setPhotos(data);
  };

  const handleUpload = async (type: 'before' | 'after', source: 'camera' | 'gallery') => {
    if (!bookingId) return;
    setUploading(true);

    const uri =
      source === 'camera'
        ? await takePhoto({ aspect: [4, 3], quality: 0.8 })
        : await pickImage({ aspect: [4, 3], quality: 0.8 });

    if (uri) {
      if (BYPASS_AUTH) {
        if (!mockPhotosCache[bookingId]) {
          mockPhotosCache[bookingId] = [];
        }
        const newPhoto: BookingPhoto = {
          id: 'photo-id-' + Math.random().toString(36).substr(2, 9),
          booking_id: bookingId,
          photo_type: type,
          file_url: uri,
          uploaded_at: new Date().toISOString(),
        };
        mockPhotosCache[bookingId].push(newPhoto);
        await loadPhotos();
      } else {
        await uploadBookingPhoto(bookingId, type, uri);
        await loadPhotos();
      }
    }

    setUploading(false);
  };

  const beforePhotos = photos.filter((p) => p.photo_type === 'before');
  const afterPhotos = photos.filter((p) => p.photo_type === 'after');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Before Photos */}
      <Text style={styles.sectionTitle} variant="titleMedium">📸 Before Photos</Text>
      <Text style={styles.hint} variant="bodySmall">
        Take photos before you start cleaning to document the initial state.
      </Text>

      <View style={styles.photoGrid}>
        {beforePhotos.map((photo) => (
          <Image key={photo.id} source={{ uri: photo.file_url }} style={styles.photo} />
        ))}
      </View>

      <View style={styles.uploadRow}>
        <Button
          mode="contained"
          icon="camera"
          onPress={() => handleUpload('before', 'camera')}
          loading={uploading}
          disabled={uploading}
          buttonColor={colors.secondary}
          textColor={colors.white}
          style={styles.uploadBtn}
          compact
        >
          Camera
        </Button>
        <Button
          mode="outlined"
          icon="image"
          onPress={() => handleUpload('before', 'gallery')}
          disabled={uploading}
          textColor={colors.primary}
          style={styles.uploadBtn}
          compact
        >
          Gallery
        </Button>
      </View>

      {/* After Photos */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]} variant="titleMedium">
        ✅ After Photos
      </Text>
      <Text style={styles.hint} variant="bodySmall">
        Take photos after cleaning is complete. Required before payment is released.
      </Text>

      <View style={styles.photoGrid}>
        {afterPhotos.map((photo) => (
          <Image key={photo.id} source={{ uri: photo.file_url }} style={styles.photo} />
        ))}
      </View>

      <View style={styles.uploadRow}>
        <Button
          mode="contained"
          icon="camera"
          onPress={() => handleUpload('after', 'camera')}
          loading={uploading}
          disabled={uploading}
          buttonColor={colors.success}
          textColor={colors.white}
          style={styles.uploadBtn}
          compact
        >
          Camera
        </Button>
        <Button
          mode="outlined"
          icon="image"
          onPress={() => handleUpload('after', 'gallery')}
          disabled={uploading}
          textColor={colors.primary}
          style={styles.uploadBtn}
          compact
        >
          Gallery
        </Button>
      </View>

      {/* Summary */}
      <Card style={styles.summaryCard} mode="contained">
        <Card.Content style={styles.summaryContent}>
          <Text style={styles.summaryText} variant="bodySmall">
            📷 {beforePhotos.length} before photo{beforePhotos.length !== 1 ? 's' : ''} •{' '}
            {afterPhotos.length} after photo{afterPhotos.length !== 1 ? 's' : ''}
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { color: colors.white, fontWeight: '700', marginBottom: spacing.xs },
  hint: { color: colors.onSurfaceVariant, marginBottom: spacing.md },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  photo: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  uploadRow: { flexDirection: 'row', gap: spacing.md },
  uploadBtn: { flex: 1, borderRadius: 10 },
  summaryCard: { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md, marginTop: spacing.xl },
  summaryContent: { alignItems: 'center' },
  summaryText: { color: colors.onSurfaceVariant },
});
