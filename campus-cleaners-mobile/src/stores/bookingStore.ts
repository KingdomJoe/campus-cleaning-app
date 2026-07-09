import { create } from 'zustand';
import type { Booking, BookingStatus, LaundryItem } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { fetchBookingPayment, refundPayment } from '@/lib/api/payments';
import { sendPushNotification } from '@/lib/notifications';

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
  rejectCleaner: (appId: string) => Promise<boolean>;
  
  // Realtime subscriptions
  subscribeToAvailableJobs: () => () => void;
  subscribeToClientBookings: (clientId: string) => () => void;
  subscribeToCleanerJobs: (cleanerId: string) => () => void;
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
    console.log('[BookingStore] createBooking called with:', { clientId, totalPrice, form });
    try {
      // Validate required fields before attempting insert
      if (!form.serviceTypeId) {
        const err = new Error('Service type is required');
        console.error('[BookingStore] Validation failed:', err.message);
        throw err;
      }
      if (!form.location?.trim()) {
        const err = new Error('Location is required');
        console.error('[BookingStore] Validation failed:', err.message);
        throw err;
      }
      if (!form.scheduledDate) {
        const err = new Error('Scheduled date is required');
        console.error('[BookingStore] Validation failed:', err.message);
        throw err;
      }
      if (!form.scheduledTime) {
        const err = new Error('Scheduled time is required');
        console.error('[BookingStore] Validation failed:', err.message);
        throw err;
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

      console.log('[BookingStore] Inserting booking data:', insertData);

      const { data, error } = await supabase
        .from('bookings')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[BookingStore] Supabase insert error:', error);
        throw error;
      }

      console.log('[BookingStore] Booking created successfully:', data);
      try {
        const { data: cleaners } = await supabase
          .from('profiles')
          .select('id, push_token')
          .eq('role', 'cleaner')
          .eq('status', 'active');

        if (cleaners && cleaners.length > 0) {
          const notificationInserts = cleaners.map((cleaner) => ({
            user_id: cleaner.id,
            title: 'New Job Available! 🧹',
            body: `A new ${form.serviceCategory === 'cleaning' ? 'Cleaning' : 'Laundry'} booking is available at ${form.location}.`,
            data: { bookingId: data.id, role: 'cleaner' },
            read: false,
          }));
          await supabase.from('notifications').insert(notificationInserts);

          // Dispatch push notifications to each cleaner's device asynchronously to avoid blocking the UI
          for (const cleaner of cleaners) {
            if (cleaner.push_token) {
              sendPushNotification(
                cleaner.push_token,
                'New Job Available! 🧹',
                `A new ${form.serviceCategory === 'cleaning' ? 'Cleaning' : 'Laundry'} booking is available at ${form.location}.`,
                { bookingId: data.id, role: 'cleaner' }
              ).catch((err) => console.error('[Push] Async send failed:', err));
            }
          }
        }
      } catch (err) {
        console.error('Error notifying cleaners of new job:', err);
      }

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
      throw err;
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

      // Notify client of the booking in database and via push
      try {
        const { data: booking } = await supabase
          .from('bookings')
          .select('client_id, location, service_type:service_types(name)')
          .eq('id', bookingId)
          .single();

        const { data: cleaner } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', cleanerId)
          .single();

        if (booking && cleaner) {
          // @ts-expect-error - handle dynamic json typing or property access
          const serviceName = booking.service_type?.name || 'your booking';
          const title = 'New offer for your booking! 🧹';
          const body = `${cleaner.full_name || 'A cleaner'} has applied for ${serviceName} at ${booking.location}.`;

          await supabase.from('notifications').insert({
            user_id: booking.client_id,
            title,
            body,
            data: { bookingId, role: 'client' },
            read: false,
          });

          // Fetch client's push token and send push notification
          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('push_token')
            .eq('id', booking.client_id)
            .single();

          if (clientProfile?.push_token) {
            await sendPushNotification(clientProfile.push_token, title, body, { bookingId, role: 'client' });
          }
        }
      } catch (err) {
        console.error('Error notifying client of application:', err);
      }

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

      // Notify the hired cleaner in database and via push
      try {
        const { data: booking } = await supabase
          .from('bookings')
          .select('location, client_id, service_type:service_types(name)')
          .eq('id', bookingId)
          .single();

        if (booking) {
          const { data: client } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', booking.client_id)
            .single();

          // @ts-expect-error - handle dynamic json typing or property access
          const serviceName = booking.service_type?.name || 'the job';
          const title = 'You have been hired! 🎉';
          const body = `${client?.full_name || 'A client'} has hired you for ${serviceName} at ${booking.location}.`;

          await supabase.from('notifications').insert({
            user_id: cleanerId,
            title,
            body,
            data: { bookingId, role: 'cleaner' },
            read: false,
          });

          // Fetch cleaner's push token and send push notification
          const { data: cleanerProfile } = await supabase
            .from('profiles')
            .select('push_token')
            .eq('id', cleanerId)
            .single();

          if (cleanerProfile?.push_token) {
            await sendPushNotification(cleanerProfile.push_token, title, body, { bookingId, role: 'cleaner' });
          }
        }
      } catch (err) {
        console.error('Error notifying cleaner of hiring:', err);
      }

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

  rejectCleaner: async (appId) => {
    try {
      const { error } = await supabase
        .from('booking_applications')
        .update({ status: 'declined' })
        .eq('id', appId);
      return !error;
    } catch {
      return false;
    }
  },

  subscribeToAvailableJobs: () => {
    const channel = supabase
      .channel('available-jobs-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          get().fetchAvailableJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToClientBookings: (clientId) => {
    const channel = supabase
      .channel(`client-bookings-${clientId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `client_id=eq.${clientId}` },
        () => {
          get().fetchClientBookings(clientId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToCleanerJobs: (cleanerId) => {
    const channel = supabase
      .channel(`cleaner-jobs-${cleanerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `cleaner_id=eq.${cleanerId}` },
        () => {
          get().fetchCleanerJobs(cleanerId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
