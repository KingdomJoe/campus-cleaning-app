import { create } from 'zustand';
import type { Booking, BookingStatus, LaundryItem } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

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
      return true;
    } catch (err) {
      console.error('Error updating booking status:', err);
      return false;
    }
  },

  cancelBooking: async (bookingId, reason) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return false;
    }
  },
}));
