import { create } from 'zustand';
import type { Booking, BookingStatus, LaundryItem } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { fetchBookingPayment, refundPayment } from '@/lib/api/payments';

interface BookingFormState {
  serviceCategory: 'cleaning' | 'laundry' | null;
  serviceTypeId: string | null;
  location: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  // Cleaning-specific
  roomType: string;
  roomSize: string;
  roomCount: number;
  bathroomIncluded: boolean;
  // Laundry-specific
  laundryItems: LaundryItem[];
}

interface BookingState {
  // Booking lists
  activeBookings: Booking[];
  pastBookings: Booking[];
  availableJobs: Booking[]; // For cleaners
  isLoading: boolean;

  // Booking form
  form: BookingFormState;

  // Actions — form
  updateForm: (updates: Partial<BookingFormState>) => void;
  resetForm: () => void;
  addLaundryItem: (item: LaundryItem) => void;
  removeLaundryItem: (itemType: string) => void;
  updateLaundryQuantity: (itemType: string, quantity: number) => void;

  // Actions — data fetching
  fetchClientBookings: (clientId: string) => Promise<void>;
  fetchCleanerJobs: (cleanerId: string) => Promise<void>;
  fetchAvailableJobs: () => Promise<void>;

  // Actions — booking operations
  createBooking: (clientId: string, totalPrice: number) => Promise<Booking | null>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<boolean>;
  cancelBooking: (bookingId: string, reason: string) => Promise<boolean>;

  // Actions — cleaner applications
  applyForJob: (bookingId: string, cleanerId: string) => Promise<boolean>;
  fetchBookingApplications: (bookingId: string) => Promise<any[]>;
  hireCleaner: (bookingId: string, appId: string, cleanerId: string) => Promise<boolean>;
}

const initialForm: BookingFormState = {
  serviceCategory: null,
  serviceTypeId: null,
  location: '',
  description: '',
  scheduledDate: '',
  scheduledTime: '',
  roomType: '',
  roomSize: '',
  roomCount: 1,
  bathroomIncluded: false,
  laundryItems: [],
};

export const useBookingStore = create<BookingState>((set, get) => ({
  activeBookings: [],
  pastBookings: [],
  availableJobs: [],
  isLoading: false,
  form: { ...initialForm },

  updateForm: (updates) => {
    set((state) => ({
      form: { ...state.form, ...updates },
    }));
  },

  resetForm: () => {
    set({ form: { ...initialForm } });
  },

  addLaundryItem: (item) => {
    set((state) => ({
      form: {
        ...state.form,
        laundryItems: [...state.form.laundryItems, item],
      },
    }));
  },

  removeLaundryItem: (itemType) => {
    set((state) => ({
      form: {
        ...state.form,
        laundryItems: state.form.laundryItems.filter((i) => i.item_type !== itemType),
      },
    }));
  },

  updateLaundryQuantity: (itemType, quantity) => {
    set((state) => ({
      form: {
        ...state.form,
        laundryItems: state.form.laundryItems.map((i) =>
          i.item_type === itemType ? { ...i, quantity } : i
        ),
      },
    }));
  },

  fetchClientBookings: async (clientId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service_type:service_types(*),
          cleaner:profiles!bookings_cleaner_id_fkey(*)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const active = (data ?? []).filter((b) =>
        !['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(b.status)
      );
      const past = (data ?? []).filter((b) =>
        ['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(b.status)
      );

      set({ activeBookings: active, pastBookings: past });
    } catch (err) {
      console.error('Error fetching client bookings:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCleanerJobs: async (cleanerId) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service_type:service_types(*),
          client:profiles!bookings_client_id_fkey(*)
        `)
        .eq('cleaner_id', cleanerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const active = (data ?? []).filter((b) =>
        !['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(b.status)
      );
      const past = (data ?? []).filter((b) =>
        ['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(b.status)
      );

      set({ activeBookings: active, pastBookings: past });
    } catch (err) {
      console.error('Error fetching cleaner jobs:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAvailableJobs: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service_type:service_types(*),
          client:profiles!bookings_client_id_fkey(*)
        `)
        .eq('status', 'requested')
        .is('cleaner_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ availableJobs: data ?? [] });
    } catch (err) {
      console.error('Error fetching available jobs:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createBooking: async (clientId, totalPrice) => {
    const { form } = get();
    try {
      const insertData: Record<string, unknown> = {
        client_id: clientId,
        service_type_id: form.serviceTypeId,
        location: form.location,
        description: form.description || null,
        scheduled_date: form.scheduledDate,
        scheduled_time: form.scheduledTime,
        total_price: totalPrice,
        status: 'requested',
      };

      if (form.serviceCategory === 'cleaning') {
        insertData.room_type = form.roomType;
        insertData.room_size = form.roomSize;
        insertData.room_count = form.roomCount;
        insertData.bathroom_included = form.bathroomIncluded;
      } else {
        insertData.laundry_items = form.laundryItems;
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      try {
        const { trackEvent } = await import('@/lib/analytics');
        trackEvent('booking_created', {
          bookingId: data.id,
          serviceCategory: form.serviceCategory,
          totalPrice: totalPrice,
          roomCount: form.roomCount,
          bathroomIncluded: form.bathroomIncluded,
        });
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }

      get().resetForm();
      return data;
    } catch (err) {
      console.error('Error creating booking:', err);
      return null;
    }
  },

  updateBookingStatus: async (bookingId, status) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state dynamically to avoid fetch latencies
      set((state) => {
        const updateItem = (b: Booking) => b.id === bookingId ? { ...b, status } : b;
        const allBookings = [
          ...state.activeBookings.map(updateItem),
          ...state.pastBookings.map(updateItem),
        ];

        // Filter duplicates
        const unique = allBookings.filter((b, idx, self) => self.findIndex(x => x.id === b.id) === idx);
        
        const active = unique.filter((b) =>
          !['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(b.status)
        );
        const past = unique.filter((b) =>
          ['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(b.status)
        );

        return { activeBookings: active, pastBookings: past };
      });

      return true;
    } catch (err) {
      console.error('Error updating booking status:', err);
      return false;
    }
  },

  cancelBooking: async (bookingId, reason) => {
    try {
      // Refund escrow payment if exists and is held
      try {
        const payment = await fetchBookingPayment(bookingId);
        if (payment && payment.status === 'held') {
          await refundPayment(payment.id);
        }
      } catch (err) {
        console.error('Error refunding payment during cancellation:', err);
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state dynamically to avoid fetch latencies
      set((state) => {
        const updateItem = (b: Booking) => b.id === bookingId ? { ...b, status: 'cancelled' as BookingStatus, cancellation_reason: reason } : b;
        const allBookings = [
          ...state.activeBookings.map(updateItem),
          ...state.pastBookings.map(updateItem),
        ];

        const unique = allBookings.filter((b, idx, self) => self.findIndex(x => x.id === b.id) === idx);

        const active = unique.filter((b) =>
          !['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(b.status)
        );
        const past = unique.filter((b) =>
          ['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(b.status)
        );

        return { activeBookings: active, pastBookings: past };
      });

      return true;
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return false;
    }
  },

  applyForJob: async (bookingId, cleanerId) => {
    try {
      const { error } = await supabase
        .from('booking_applications')
        .insert({
          booking_id: bookingId,
          cleaner_id: cleanerId,
          status: 'pending',
        });

      if (error) throw error;

      try {
        const { trackEvent } = await import('@/lib/analytics');
        trackEvent('bid_applied', { bookingId, cleanerId });
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }

      return true;
    } catch (err) {
      console.error('Error applying for job:', err);
      return false;
    }
  },

  fetchBookingApplications: async (bookingId) => {
    try {
      const { data, error } = await supabase
        .from('booking_applications')
        .select(`
          *,
          cleaner:profiles(
            *,
            cleaner_profile:cleaner_profiles(*)
          )
        `)
        .eq('booking_id', bookingId);

      if (error) throw error;
      return data ?? [];
    } catch (err) {
      console.error('Error fetching booking applications:', err);
      return [];
    }
  },

  hireCleaner: async (bookingId, appId, cleanerId) => {
    try {
      // 1. Assign cleaner to booking and change status to accepted
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          cleaner_id: cleanerId,
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // 2. Accept this application
      const { error: appAcceptError } = await supabase
        .from('booking_applications')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', appId);

      if (appAcceptError) throw appAcceptError;

      // 3. Decline other applications
      const { error: appDeclineError } = await supabase
        .from('booking_applications')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .neq('id', appId);

      if (appDeclineError) throw appDeclineError;

      try {
        const { trackEvent } = await import('@/lib/analytics');
        trackEvent('cleaner_hired', { bookingId, cleanerId, applicationId: appId });
      } catch (err) {
        console.error('Analytics tracking failed:', err);
      }

      // Update local state
      set((state) => {
        const updateItem = (b: Booking) => b.id === bookingId ? { ...b, status: 'accepted' as BookingStatus, cleaner_id: cleanerId } : b;
        return {
          activeBookings: state.activeBookings.map(updateItem),
          pastBookings: state.pastBookings.map(updateItem),
        };
      });

      return true;
    } catch (err) {
      console.error('Error hiring cleaner:', err);
      return false;
    }
  },
}));
