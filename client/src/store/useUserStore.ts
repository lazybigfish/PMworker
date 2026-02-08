import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import request from '@/api/request';
import { User } from '@/types/user';

interface UserState {
  user: User | null;
  permissions: string[];
  setUser: (user: User | null) => void;
  setPermissions: (perms: string[]) => void;
  login: (userData: User) => void;
  logout: () => void;
  fetchPermissions: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      setUser: (user) => set({ user }),
      setPermissions: (perms) => set({ permissions: perms }),
      login: (userData) => {
        set({ user: userData });
        // For compatibility with legacy code/interceptors if they check 'user' key directly
        localStorage.setItem('user', JSON.stringify(userData));
      },
      logout: () => {
        set({ user: null, permissions: [] });
        localStorage.removeItem('user');
      },
      fetchPermissions: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const res = await request.get<string[]>('/user/permissions');
          set({ permissions: res.data });
        } catch (error) {
          console.error('Failed to fetch permissions', error);
        }
      },
    }),
    {
      name: 'pm-user-storage',
      partialize: (state) => ({ user: state.user, permissions: state.permissions }),
    }
  )
);
