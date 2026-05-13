import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin" | "counselor";
  plan: "free" | "family" | "navigator";
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("momplan_access_token", accessToken);
          localStorage.setItem("momplan_refresh_token", refreshToken);
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("momplan_access_token");
          localStorage.removeItem("momplan_refresh_token");
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: "momplan-auth",
      partialState: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    } as any
  )
);
