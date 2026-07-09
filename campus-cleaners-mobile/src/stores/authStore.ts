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
  profileLoading: boolean; // Track profile loading separately
  pendingDocuments: Record<string, string | null> | null;
  pendingProfilePhoto: string | null;

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setCleanerProfile: (cleanerProfile: CleanerProfile | null) => void;
  fetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  setPendingUploads: (docs: Record<string, string | null>, photo: string | null) => void;
  clearPendingUploads: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  cleanerProfile: null,
  role: null,
  isLoading: true,
  isInitialized: false,
  profileLoading: false,
  pendingDocuments: null,
  pendingProfilePhoto: null,

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

  setPendingUploads: (docs, photo) => {
    set({ pendingDocuments: docs, pendingProfilePhoto: photo });
  },

  clearPendingUploads: () => {
    set({ pendingDocuments: null, pendingProfilePhoto: null });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) {
      console.log('[AuthStore] fetchProfile: No user found');
      return;
    }

    console.log('[AuthStore] fetchProfile: Fetching profile for user:', user.id);
    set({ profileLoading: true });
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[AuthStore] fetchProfile: Error fetching profile:', error.message);
        set({ profileLoading: false });
        return;
      }

      console.log('[AuthStore] fetchProfile: Profile loaded:', profile);
      set({ profile, role: profile?.role ?? null, profileLoading: false });

      // If cleaner, fetch cleaner profile too
      if (profile?.role === 'cleaner') {
        const { data: cleanerProfile } = await supabase
          .from('cleaner_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
        set({ cleanerProfile });
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      set({ profileLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    try {
      const { resetAnalytics } = await import('@/lib/analytics');
      resetAnalytics();
    } catch (err) {
      console.error('Error resetting analytics:', err);
    }
    set({
      session: null,
      user: null,
      profile: null,
      cleanerProfile: null,
      role: null,
      profileLoading: false,
    });
  },

  initialize: async () => {
    if (get().isInitialized) return;
    try {
      set({ isLoading: true });

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({
          session,
          user: session.user,
        });
        try {
          await get().fetchProfile();
        } finally {
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false, profileLoading: false });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        // Only wipe state if the user explicitly signs out
        if (event === 'SIGNED_OUT') {
          set({
            session: null,
            user: null,
            profile: null,
            cleanerProfile: null,
            role: null,
            isLoading: false,
            profileLoading: false,
          });
          return;
        }

        const currentSession = get().session;
        const isLoggingIn = session?.user && (!currentSession || currentSession.user.id !== session.user.id);

        set({
          session,
          user: session?.user ?? null,
          ...(isLoggingIn ? { isLoading: true, profileLoading: true } : {}),
        });

        if (session?.user && isLoggingIn) {
          await get().fetchProfile();
          set({ isLoading: false });
        }
      });
    } catch (err) {
      console.error('Error initializing auth:', err);
      set({ isLoading: false, profileLoading: false });
    } finally {
      set({ isInitialized: true });
    }
  },
}));
