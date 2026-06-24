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
    if (!user) return;

    try {
      set({ isLoading: true });
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
        set({ isLoading: false });
        return;
      }

      // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
      set({ profile, role: profile?.role ?? null });

      // If cleaner, fetch cleaner profile too
      // @ts-expect-error - workaround for TS6 + supabase-js generic constraint
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
    } finally {
      set({ isLoading: false });
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
      } else {
        set({ isLoading: false });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        const currentSession = get().session;
        const isLoggingIn = session?.user && (!currentSession || currentSession.user.id !== session.user.id);

        set({
          session,
          user: session?.user ?? null,
          ...(isLoggingIn ? { isLoading: true } : {}),
        });

        if (session?.user) {
          await get().fetchProfile();
        } else {
          set({
            profile: null,
            cleanerProfile: null,
            role: null,
            isLoading: false,
          });
        }
      });
    } catch (err) {
      console.error('Error initializing auth:', err);
      set({ isLoading: false });
    } finally {
      set({ isInitialized: true });
    }
  },
}));
