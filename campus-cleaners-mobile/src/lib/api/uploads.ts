import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

type BucketName = 'avatars' | 'documents' | 'booking-photos';

/**
 * Pick an image from the device gallery.
 */
export async function pickImage(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    console.warn('Media library permission not granted');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect ?? [1, 1],
    quality: options?.quality ?? 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

/**
 * Take a photo using the device camera.
 */
export async function takePhoto(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    console.warn('Camera permission not granted');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect ?? [4, 3],
    quality: options?.quality ?? 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

/**
 * Upload a local image URI to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadImage(
  localUri: string,
  bucket: BucketName,
  filePath: string
): Promise<string | null> {
  try {
    // Read the file as a blob
    const response = await fetch(localUri);
    const blob = await response.blob();

    // Determine the content type
    const extension = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const contentType =
      extension === 'png' ? 'image/png' : 'image/jpeg';

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error.message);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Error uploading image:', err);
    return null;
  }
}

/**
 * Upload a profile avatar and update the profile.
 */
export async function uploadAvatar(
  userId: string,
  localUri: string
): Promise<string | null> {
  const filePath = `${userId}/avatar.jpg`;
  const publicUrl = await uploadImage(localUri, 'avatars', filePath);

  if (publicUrl) {
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);
  }

  return publicUrl;
}

/**
 * Upload a cleaner verification document.
 */
export async function uploadDocument(
  cleanerId: string,
  documentType: string,
  localUri: string
): Promise<string | null> {
  const timestamp = Date.now();
  const filePath = `${cleanerId}/${documentType}_${timestamp}.jpg`;
  const publicUrl = await uploadImage(localUri, 'documents', filePath);

  if (publicUrl) {
    await supabase.from('cleaner_documents').insert({
      cleaner_id: cleanerId,
      document_type: documentType,
      file_url: publicUrl,
    });
  }

  return publicUrl;
}

/**
 * Upload a booking before/after photo.
 */
export async function uploadBookingPhoto(
  bookingId: string,
  photoType: 'before' | 'after',
  localUri: string
): Promise<string | null> {
  const timestamp = Date.now();
  const filePath = `${bookingId}/${photoType}_${timestamp}.jpg`;
  const publicUrl = await uploadImage(localUri, 'booking-photos', filePath);

  if (publicUrl) {
    await supabase.from('booking_photos').insert({
      booking_id: bookingId,
      photo_type: photoType,
      file_url: publicUrl,
    });
  }

  return publicUrl;
}
