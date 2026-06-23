import { create } from 'zustand';
import type { Booking, BookingStatus, LaundryItem } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useAuthStore, BYPASS_AUTH } from './authStore';

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

// ============================================================
// RICH STATIC MOCK DATA FOR BETA TESTING
// ============================================================

const createMockBookings = (role: 'client' | 'cleaner', userId: string): Booking[] => {
  const serviceType1 = {
    id: 'st-cleaning-1',
    category: 'cleaning',
    name: 'Express Room Cleaning',
    description: 'Quick cleaning of floor, desk, and waste bin.',
    base_price: 50.00,
    is_active: true
  };
  
  const serviceType2 = {
    id: 'st-laundry-1',
    category: 'laundry',
    name: 'Wash & Iron',
    description: 'Washing, drying, and ironing of clothes.',
    base_price: 8.00,
    is_active: true
  };

  return [
    {
      id: 'booking-id-1',
      client_id: role === 'client' ? userId : 'mock-client-id-999',
      cleaner_id: role === 'cleaner' ? userId : 'mock-cleaner-id-888',
      service_type_id: 'st-cleaning-1',
      service_type: serviceType1 as any,
      location: 'Limann Hall, Room A24',
      description: 'Please sweep and scrub the floor well. Thank you.',
      scheduled_date: '2026-06-25',
      scheduled_time: '10:00:00',
      room_type: 'single_room',
      room_size: 'medium',
      room_count: 1,
      bathroom_included: false,
      laundry_items: null,
      cancellation_reason: null,
      total_price: 50.00,
      status: 'accepted',
      client: { full_name: 'David Mensah', phone: '+233240001111' } as any,
      cleaner: { full_name: 'Grace Osei', phone: '+233240002222' } as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'booking-id-2',
      client_id: role === 'client' ? userId : 'mock-client-id-999',
      cleaner_id: role === 'cleaner' ? userId : 'mock-cleaner-id-888',
      service_type_id: 'st-laundry-1',
      service_type: serviceType2 as any,
      location: 'Sarbah Hall, Annex B',
      description: '15 shirts and 5 trousers. Please iron neatly.',
      scheduled_date: '2026-06-24',
      scheduled_time: '14:30:00',
      room_type: null,
      room_size: null,
      room_count: null,
      bathroom_included: false,
      laundry_items: [
        { item_type: 'shirt', quantity: 15, price: 8.00 },
        { item_type: 'trousers', quantity: 5, price: 8.00 }
      ] as any,
      cancellation_reason: null,
      total_price: 160.00,
      status: 'completed',
      client: { full_name: 'David Mensah', phone: '+233240001111' } as any,
      cleaner: { full_name: 'Grace Osei', phone: '+233240002222' } as any,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    }
  ];
};

const mockAvailableJobsList: Booking[] = [
  {
    id: 'job-id-101',
    client_id: 'mock-client-id-101',
    cleaner_id: null,
    service_type_id: 'st-cleaning-1',
    service_type: {
      id: 'st-cleaning-1',
      category: 'cleaning',
      name: 'Express Room Cleaning',
      description: 'Quick cleaning of floor, desk, and waste bin.',
      base_price: 50.00,
      is_active: true
    } as any,
    location: 'Volta Hall, Room C4',
    description: 'Scrub floor and organize wardrobe.',
    scheduled_date: '2026-06-26',
    scheduled_time: '09:00:00',
    room_type: 'single_room',
    room_size: 'small',
    room_count: 1,
    bathroom_included: true,
    laundry_items: null,
    cancellation_reason: null,
    total_price: 70.00,
    status: 'requested',
    client: { full_name: 'Ama Serwaa', phone: '+233241112222' } as any,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'job-id-102',
    client_id: 'mock-client-id-102',
    cleaner_id: null,
    service_type_id: 'st-laundry-1',
    service_type: {
      id: 'st-laundry-1',
      category: 'laundry',
      name: 'Wash & Fold',
      description: 'Washing, drying, and folding of clothes.',
      base_price: 5.00,
      is_active: true
    } as any,
    location: 'Commonwealth Hall, Block B',
    description: 'Just wash and dry. No ironing.',
    scheduled_date: '2026-06-25',
    scheduled_time: '11:00:00',
    room_type: null,
    room_size: null,
    room_count: null,
    bathroom_included: false,
    laundry_items: [
      { item_type: 't-shirt', quantity: 10, price: 5.00 },
      { item_type: 'bedsheet', quantity: 2, price: 10.00 }
    ] as any,
    cancellation_reason: null,
    total_price: 70.00,
    status: 'requested',
    client: { full_name: 'Kojo Antwi', phone: '+233242223333' } as any,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

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
      if (BYPASS_AUTH) {
        // Mock loading delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        const currentActive = get().activeBookings;
        const currentPast = get().pastBookings;
        
        if (currentActive.length === 0 && currentPast.length === 0) {
          const list = createMockBookings('client', clientId);
          const active = list.filter((b) => !['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(b.status));
          const past = list.filter((b) => ['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(b.status));
          set({ activeBookings: active, pastBookings: past });
        }
        set({ isLoading: false });
        return;
      }

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
      if (BYPASS_AUTH) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        const currentActive = get().activeBookings;
        const currentPast = get().pastBookings;
        
        if (currentActive.length === 0 && currentPast.length === 0) {
          const list = createMockBookings('cleaner', cleanerId);
          const active = list.filter((b) => !['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(b.status));
          const past = list.filter((b) => ['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(b.status));
          set({ activeBookings: active, pastBookings: past });
        }
        set({ isLoading: false });
        return;
      }

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
      if (BYPASS_AUTH) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const currentAvail = get().availableJobs;
        if (currentAvail.length === 0) {
          set({ availableJobs: mockAvailableJobsList });
        }
        set({ isLoading: false });
        return;
      }

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
      if (BYPASS_AUTH) {
        const serviceType = {
          id: form.serviceTypeId || 'st-cleaning-1',
          category: form.serviceCategory || 'cleaning',
          name: form.serviceCategory === 'cleaning' ? 'Express Room Cleaning' : 'Wash & Iron',
          description: 'Mock service',
          base_price: form.serviceCategory === 'cleaning' ? 50.00 : 8.00,
          is_active: true
        };

        const newBooking: Booking = {
          id: 'booking-id-' + Math.random().toString(36).substr(2, 9),
          client_id: clientId,
          cleaner_id: null,
          service_type_id: form.serviceTypeId || 'st-cleaning-1',
          service_type: serviceType as any,
          location: form.location,
          description: form.description || null,
          scheduled_date: form.scheduledDate,
          scheduled_time: form.scheduledTime,
          room_type: form.serviceCategory === 'cleaning' ? form.roomType : null,
          room_size: form.serviceCategory === 'cleaning' ? form.roomSize : null,
          room_count: form.serviceCategory === 'cleaning' ? form.roomCount : null,
          bathroom_included: form.serviceCategory === 'cleaning' ? form.bathroomIncluded : false,
          laundry_items: form.serviceCategory === 'laundry' ? (form.laundryItems as any) : null,
          cancellation_reason: null,
          total_price: totalPrice,
          status: 'requested',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          client: { full_name: useAuthStore.getState().profile?.full_name || 'David Mensah', phone: '+233240001111' } as any,
        };

        set((state) => ({
          activeBookings: [newBooking, ...state.activeBookings],
        }));
        get().resetForm();
        return newBooking;
      }

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
      if (BYPASS_AUTH) {
        set((state) => {
          const activeItem = state.activeBookings.find(b => b.id === bookingId);
          const pastItem = state.pastBookings.find(b => b.id === bookingId);
          const availItem = state.availableJobs.find(b => b.id === bookingId);

          let updatedActive = [...state.activeBookings];
          let updatedPast = [...state.pastBookings];
          let updatedAvail = [...state.availableJobs];

          let target = activeItem || pastItem || availItem;
          if (target) {
            const updatedTarget = {
              ...target,
              status,
              cleaner_id: target.cleaner_id || useAuthStore.getState().user?.id || 'mock-cleaner-id',
              cleaner: target.cleaner || { full_name: useAuthStore.getState().profile?.full_name || 'Grace Osei', phone: '+233240002222' } as any
            };

            updatedActive = updatedActive.filter(b => b.id !== bookingId);
            updatedPast = updatedPast.filter(b => b.id !== bookingId);
            updatedAvail = updatedAvail.filter(b => b.id !== bookingId);

            if (['completed', 'verified', 'closed', 'cancelled', 'declined'].includes(status)) {
              updatedPast = [updatedTarget, ...updatedPast];
            } else {
              updatedActive = [updatedTarget, ...updatedActive];
            }
          }

          return {
            activeBookings: updatedActive,
            pastBookings: updatedPast,
            availableJobs: updatedAvail
          };
        });
        return true;
      }

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
      if (BYPASS_AUTH) {
        set((state) => {
          const activeItem = state.activeBookings.find(b => b.id === bookingId);
          const pastItem = state.pastBookings.find(b => b.id === bookingId);

          let updatedActive = [...state.activeBookings];
          let updatedPast = [...state.pastBookings];

          let target = activeItem || pastItem;
          if (target) {
            const updatedTarget = {
              ...target,
              status: 'cancelled' as BookingStatus,
              cancellation_reason: reason,
              updated_at: new Date().toISOString()
            };

            updatedActive = updatedActive.filter(b => b.id !== bookingId);
            updatedPast = updatedPast.filter(b => b.id !== bookingId);
            updatedPast = [updatedTarget, ...updatedPast];
          }

          return {
            activeBookings: updatedActive,
            pastBookings: updatedPast
          };
        });
        return true;
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
      return true;
    } catch (err) {
      console.error('Error cancelling booking:', err);
      return false;
    }
  },
}));
