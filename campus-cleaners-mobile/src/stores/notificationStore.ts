import { create } from 'zustand';
import type { AppNotification } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { BYPASS_AUTH } from './authStore';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  addNotification: (notification: AppNotification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId) => {
    set({ isLoading: true });
    try {
      if (BYPASS_AUTH) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const currentNotifs = get().notifications;
        if (currentNotifs.length === 0) {
          const mockNotifs: AppNotification[] = [
            {
              id: 'n-1',
              user_id: userId,
              title: 'Welcome to Campus Cleaners! 🎉',
              body: 'Your account is active. Start booking verified cleaners and laundry services.',
              read: false,
              data: null,
              created_at: new Date().toISOString(),
            },
            {
              id: 'n-2',
              user_id: userId,
              title: 'Job Accepted 🧹',
              body: 'Grace Osei has accepted your cleaning request for June 25th.',
              read: true,
              data: null,
              created_at: new Date(Date.now() - 3600000).toISOString(),
            }
          ];
          set({ notifications: mockNotifs, unreadCount: 1 });
        }
        set({ isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifications = data ?? [];
      // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
      const unreadCount = notifications.filter((n) => !n.read).length;
      // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
      set({ notifications, unreadCount });
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      if (BYPASS_AUTH) {
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          );
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          };
        });
        return;
      }

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        return {
          notifications,
          unreadCount: notifications.filter((n) => !n.read).length,
        };
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  },

  markAllAsRead: async (userId) => {
    try {
      if (BYPASS_AUTH) {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
        return;
      }

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    }));
  },
}));
