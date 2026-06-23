import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile, CleanerProfile, UserRole } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

// Change to false to re-enable live Supabase Auth and Database queries
export const BYPASS_AUTH = true;

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

  // Mock-specific states
  mockTempData: any;
  mockTempRole: UserRole | null;

  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setCleanerProfile: (cleanerProfile: CleanerProfile | null) => void;
  fetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  setPendingUploads: (docs: Record<string, string | null>, photo: string | null) => void;
  clearPendingUploads: () => void;

  // Mock Actions
  setMockTempData: (data: any) => void;
  setMockTempRole: (role: UserRole | null) => void;
  mockLogin: (
    email: string,
    phone: string,
    fullName: string,
    role: UserRole,
    cleanerDetails?: any
  ) => Promise<void>;
  mockGoogleLogin: () => Promise<void>;
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

  mockTempData: null,
  mockTempRole: null,

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

  setMockTempData: (data) => {
    set({ mockTempData: data });
  },

  setMockTempRole: (role) => {
    set({ mockTempRole: role });
  },

  mockLogin: async (email, phone, fullName, role, cleanerDetails) => {
    set({ isLoading: true });

    const mockUserId = 'mock-user-id-' + Math.random().toString(36).substr(2, 9);
    
    const mockUser: User = {
      id: mockUserId,
      email: email,
      phone: phone,
      app_metadata: {},
      user_metadata: {
        full_name: fullName,
        role: role,
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const mockSession: Session = {
      access_token: 'mock-access-token-' + Math.random().toString(36).substr(2, 9),
      refresh_token: 'mock-refresh-token-' + Math.random().toString(36).substr(2, 9),
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
    };

    const mockProfile: Profile = {
      id: mockUserId,
      full_name: fullName,
      phone: phone,
      email: email,
      role: role,
      location: 'Legon Campus, Accra',
      room_number: 'Room 302',
      avatar_url: null,
      push_token: null,
      ghana_card_number: null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let mockCleanerProf: CleanerProfile | null = null;
    if (role === 'cleaner') {
      mockCleanerProf = {
        user_id: mockUserId,
        bio: cleanerDetails?.bio || 'Experienced campus cleaner.',
        skills: cleanerDetails?.skills || ['General cleaning'],
        availability: 'available',
        mobile_money_number: cleanerDetails?.mobile_money_number || '0241234567',
        guarantor_name: cleanerDetails?.guarantor_name || 'Guarantor Name',
        guarantor_phone: cleanerDetails?.guarantor_phone || '+233241234567',
        verification_status: 'approved',
        current_lat: 5.6037,
        current_lng: -0.1870,
        avg_rating: 4.8,
        total_jobs: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    set({
      session: mockSession,
      user: mockUser,
      profile: mockProfile,
      cleanerProfile: mockCleanerProf,
      role: role,
      isLoading: false,
    });
  },

  mockGoogleLogin: async () => {
    set({ isLoading: true });

    const mockUserId = 'mock-google-id-' + Math.random().toString(36).substr(2, 9);
    
    const mockUser: User = {
      id: mockUserId,
      email: 'google-tester@gmail.com',
      app_metadata: {},
      user_metadata: {
        full_name: 'Google Tester',
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const mockSession: Session = {
      access_token: 'mock-google-access-token',
      refresh_token: 'mock-google-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
    };

    set({
      session: mockSession,
      user: mockUser,
      profile: null,
      cleanerProfile: null,
      role: null,
      isLoading: false,
    });
  },

  fetchProfile: async () => {
    if (BYPASS_AUTH) return;

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
    }
  },

  signOut: async () => {
    if (!BYPASS_AUTH) {
      await supabase.auth.signOut();
    }
    set({
      session: null,
      user: null,
      profile: null,
      cleanerProfile: null,
      role: null,
      mockTempData: null,
      mockTempRole: null,
    });
  },

  initialize: async () => {
    if (BYPASS_AUTH) {
      set({ isLoading: false, isInitialized: true });
      return;
    }

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
