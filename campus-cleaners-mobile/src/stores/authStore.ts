import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile, CleanerProfile, UserRole } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  cleanerProfile: CleanerProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setCleanerProfile: (cleanerProfile: CleanerProfile | null) => void;
  fetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  cleanerProfile: null,
  role: null,
  isLoading: true,
  isInitialized: false,

  setSession: (session) => {
    set({
      session,
      user: session?.user ?? null,
    });
  },

  setProfile: (profile) => {
    set({
      profile,
      role: profile?.role ?? null,
    });
  },

  setCleanerProfile: (cleanerProfile) => {
    set({ cleanerProfile });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        return;
      }

      set({ profile, role: profile?.role ?? null });

      // If cleaner, fetch cleaner profile too
      if (profile?.role === 'cleaner') {
        const { data: cleanerProfile } = await supabase
          .from('cleaner_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        set({ cleanerProfile });
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      profile: null,
      cleanerProfile: null,
      role: null,
    });
  },

  initialize: async () => {
    try {
      set({ isLoading: true });

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({
          session,
          user: session.user,
        });
        await get().fetchProfile();
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });

        if (session?.user) {
          await get().fetchProfile();
        } else {
          set({
            profile: null,
            cleanerProfile: null,
            role: null,
          });
        }
      });
    } catch (err) {
      console.error('Error initializing auth:', err);
    } finally {
      set({ isLoading: true, isInitialized: true });
      // Small delay to allow profile fetch to complete
      setTimeout(() => set({ isLoading: false }), 100);
    }
  },
}));
