import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import type { Profile, Household, HouseholdMember } from '@/types';

interface AuthState {
  user: Profile | null;
  household: Household | null;
  members: HouseholdMember[];
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setHousehold: (household: Household | null) => void;
  fetchMembers: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      household: null,
      members: [],
      isLoading: true,
      isAuthenticated: false,

      signIn: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        await get().fetchProfile();
      },

      signUp: async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
      },

      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        set({ user: null, household: null, members: [], isAuthenticated: false });
      },

      fetchProfile: async () => {
        try {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();

          if (!authUser) {
            set({ user: null, isLoading: false, isAuthenticated: false });
            return;
          }

          // Fetch profile from backend API
          try {
            const profile = await api.get<Profile>('/api/profile');
            set({ user: profile, isLoading: false, isAuthenticated: true });

            // Fetch household data from backend
            const householdData = await api.get<{
              household: Household;
              members: HouseholdMember[];
            } | null>('/api/household');

            if (householdData?.household) {
              set({
                household: householdData.household,
                members: householdData.members || [],
              });
            }
          } catch (apiError) {
            // If API call fails (e.g., no household yet), still set user as authenticated
            // Create a basic profile from auth metadata as fallback
            const fallbackProfile: Profile = {
              id: authUser.id,
              full_name: authUser.user_metadata?.full_name || '',
              avatar_url: authUser.user_metadata?.avatar_url || '',
              created_at: authUser.created_at,
            };
            set({
              user: fallbackProfile,
              isLoading: false,
              isAuthenticated: true,
            });
          }
        } catch {
          set({ user: null, isLoading: false, isAuthenticated: false });
        }
      },

      setHousehold: (household) => {
        set({ household });
        if (household) {
          get().fetchMembers();
        }
      },

      fetchMembers: async () => {
        try {
          const householdData = await api.get<{
            household: Household;
            members: HouseholdMember[];
          } | null>('/api/household');

          if (householdData?.members) {
            set({ members: householdData.members });
          }
        } catch {
          // Silently fail - members will be empty
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ household: state.household }),
    }
  )
);
