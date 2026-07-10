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
 * Read a local file URI into a Blob/ArrayBuffer.
 * Tries XMLHttpRequest (blob) first, then fetch(), then FileReader (base64),
 * to stay robust across dev and release (Hermes/minified) builds where the
 * Blob polyfill / XHR responseType can be unreliable.
 */
async function readLocalFile(localUri: string): Promise<Blob | ArrayBuffer> {
  // 1. XMLHttpRequest with blob responseType
  try {
    const blob: Blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        reject(new Error('XHR blob read failed: ' + JSON.stringify(e)));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', localUri, true);
      xhr.send(null);
    });
    if (blob && blob.size > 0) return blob;
    throw new Error('XHR returned empty blob');
  } catch (xhrErr) {
    console.warn('[uploads] XHR blob read failed, falling back:', xhrErr);
  }

  // 2. fetch() -> blob (works in React Native runtime)
  try {
    const resp = await fetch(localUri);
    const blob = await resp.blob();
    if (blob && blob.size > 0) return blob;
    throw new Error('fetch returned empty blob');
  } catch (fetchErr) {
    console.warn('[uploads] fetch blob read failed, falling back:', fetchErr);
  }

  // 3. FileReader -> base64 -> Uint8Array -> Blob (last resort)
  return await new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader failed to read local file'));
    reader.onload = () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        resolve(new Blob([bytes], { type: 'image/jpeg' }));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Failed to decode base64 file'));
      }
    };
    reader.readAsDataURL({ uri: localUri } as unknown as Blob);
  });
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
    const file = await readLocalFile(localUri);

    // Determine the content type
    const extension = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const contentType =
      extension === 'png' ? 'image/png' : 'image/jpeg';

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file as any, {
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
      // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
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
