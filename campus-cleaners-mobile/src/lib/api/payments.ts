import { supabase } from '@/lib/supabase';
import type { Payment, PaymentStatus } from '@/lib/database.types';

const PLATFORM_FEE_PERCENT = 0.20; // 20% platform commission

/**
 * Create a mock escrow payment for a booking.
 * In production, this would initiate a Paystack charge.
 */
export async function initiatePayment(params: {
  bookingId: string;
  clientId: string;
  cleanerId: string;
  amount: number;
}): Promise<Payment | null> {
  const platformFee = Math.round(params.amount * PLATFORM_FEE_PERCENT * 100) / 100;
  const cleanerPayout = params.amount - platformFee;

  const { data, error } = await supabase
    .from('payments')
    .insert({
      booking_id: params.bookingId,
      client_id: params.clientId,
      cleaner_id: params.cleanerId,
      amount: params.amount,
      platform_fee: platformFee,
      cleaner_payout: cleanerPayout,
      payment_method: 'mock_mobile_money',
      payment_reference: `MOCK_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'held', // Escrow — held until work is verified
    })
    .select()
    .single();

  if (error) {
    console.error('Error initiating payment:', error.message);
    return null;
  }

  return data;
}

/**
 * Release escrow payment to the cleaner after client verification.
 */
export async function releasePayment(paymentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('payments')
    .update({ status: 'released' as PaymentStatus })
    .eq('id', paymentId);

  if (error) {
    console.error('Error releasing payment:', error.message);
    return false;
  }

  return true;
}

/**
 * Refund a payment back to the client.
 */
export async function refundPayment(paymentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('payments')
    .update({ status: 'refunded' as PaymentStatus })
    .eq('id', paymentId);

  if (error) {
    console.error('Error refunding payment:', error.message);
    return false;
  }

  return true;
}

/**
 * Fetch the payment record for a specific booking.
 */
export async function fetchBookingPayment(bookingId: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Fetch cleaner earnings summary.
 */
export async function fetchCleanerEarnings(cleanerId: string) {
  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .eq('cleaner_id', cleanerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching earnings:', error.message);
    return { available: 0, pending: 0, total: 0, history: [] };
  }

  const all = payments ?? [];
  const available = all
    .filter((p) => p.status === 'released')
    .reduce((sum, p) => sum + p.cleaner_payout, 0);
  const pending = all
    .filter((p) => p.status === 'held')
    .reduce((sum, p) => sum + p.cleaner_payout, 0);
  const total = available + pending;

  return {
    available: Math.round(available * 100) / 100,
    pending: Math.round(pending * 100) / 100,
    total: Math.round(total * 100) / 100,
    history: all,
  };
}
