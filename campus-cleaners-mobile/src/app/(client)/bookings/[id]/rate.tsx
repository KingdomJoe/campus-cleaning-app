import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { submitReview } from '@/lib/api/reviews';
import StarRating from '@/components/StarRating';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function RateScreen() {
  const { id: bookingId } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const [quality, setQuality] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const allRated = quality > 0 && punctuality > 0 && professionalism > 0 && communication > 0;

  const handleSubmit = async () => {
    if (!profile?.id || !bookingId || !allRated) return;
    setIsLoading(true);

    const review = await submitReview({
      bookingId: bookingId,
      clientId: profile.id,
      cleanerId: '', // Will be set from booking data server-side
      qualityRating: quality,
      punctualityRating: punctuality,
      professionalismRating: professionalism,
      communicationRating: communication,
      comment: comment.trim() || undefined,
    });

    setIsLoading(false);
    if (review) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle} variant="headlineSmall">
          Thank you!
        </Text>
        <Text style={styles.successText} variant="bodyLarge">
          Your review helps others find great cleaners.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          buttonColor={colors.primary}
          style={styles.btn}
        >
          Back to Bookings
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title} variant="titleLarge">Rate Your Cleaner</Text>

      <RatingRow label="Quality of Work" rating={quality} onChange={setQuality} />
      <RatingRow label="Punctuality" rating={punctuality} onChange={setPunctuality} />
      <RatingRow label="Professionalism" rating={professionalism} onChange={setProfessionalism} />
      <RatingRow label="Communication" rating={communication} onChange={setCommunication} />

      <TextInput
        label="Comments (optional)"
        value={comment}
        onChangeText={setComment}
        mode="outlined"
        multiline
        numberOfLines={4}
        placeholder="Tell us about your experience..."
        style={styles.input}
        outlineColor={colors.outline}
        activeOutlineColor={colors.primary}
        textColor={colors.onSurface}
        theme={{ colors: { onSurfaceVariant: colors.placeholder } }}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading || !allRated}
        buttonColor={colors.primary}
        style={styles.btn}
        contentStyle={{ paddingVertical: 6 }}
        labelStyle={{ fontSize: 16, fontWeight: '700' }}
      >
        Submit Review
      </Button>
    </ScrollView>
  );
}

function RatingRow({ label, rating, onChange }: { label: string; rating: number; onChange: (r: number) => void }) {
  return (
    <View style={rowStyles.container}>
      <Text style={rowStyles.label} variant="bodyLarge">{label}</Text>
      <StarRating rating={rating} editable onChange={onChange} size={30} />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  label: { color: colors.onSurface },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  title: { color: colors.white, fontWeight: '700', marginBottom: spacing.md },
  input: { backgroundColor: colors.surfaceVariant, marginTop: spacing.lg },
  btn: { borderRadius: 12, marginTop: spacing.lg },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, backgroundColor: colors.background },
  successIcon: { fontSize: 64, marginBottom: spacing.md },
  successTitle: { color: colors.white, fontWeight: '700' },
  successText: { color: colors.onSurfaceVariant, textAlign: 'center', marginVertical: spacing.md },
});
