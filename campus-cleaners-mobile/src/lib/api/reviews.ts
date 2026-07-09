import { supabase } from '@/lib/supabase';
import type { Review } from '@/lib/database.types';

/**
 * Submit a review for a completed booking.
 */
export async function submitReview(params: {
  bookingId: string;
  clientId: string;
  cleanerId: string;
  qualityRating: number;
  punctualityRating: number;
  professionalismRating: number;
  communicationRating: number;
  comment?: string;
}): Promise<Review | null> {
  const overallRating =
    (params.qualityRating +
      params.punctualityRating +
      params.professionalismRating +
      params.communicationRating) /
    4;

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      booking_id: params.bookingId,
      client_id: params.clientId,
      cleaner_id: params.cleanerId,
      quality_rating: params.qualityRating,
      punctuality_rating: params.punctualityRating,
      professionalism_rating: params.professionalismRating,
      communication_rating: params.communicationRating,
      overall_rating: Math.round(overallRating * 10) / 10,
      comment: params.comment ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting review:', error.message);
    return null;
  }

  // Update cleaner's average rating
  await updateCleanerAvgRating(params.cleanerId);

  // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
  return data;
}

/**
 * Recalculate and update a cleaner's average rating.
 */
async function updateCleanerAvgRating(cleanerId: string) {
  const { data: reviews } = await supabase
    .from('reviews')
    .select('overall_rating')
    .eq('cleaner_id', cleanerId);

  if (!reviews || reviews.length === 0) return;

  const avg =
    reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length;

  await supabase
    .from('cleaner_profiles')
    .update({
      avg_rating: Math.round(avg * 10) / 10,
      total_jobs: reviews.length,
    })
    .eq('user_id', cleanerId);
}
