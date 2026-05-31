import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin" | "counselor";
  plan: "free" | "family" | "navigator";
  phone?: string;
  state?: string;
  zip_code?: string;
  profile_picture?: string;
  family_profile?: {
    household_size: number;
    num_children: number;
    monthly_income: number;
    employment_status: string;
    housing_status: string;
    has_disability: boolean;
    is_pregnant: boolean;
    children_ages?: number[];

    // New fields
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    email?: string | null;
    street_address?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    children_dobs?: string[];
    ssn_last_four?: string | null;
    date_of_birth?: string | null;
    preferred_language?: string;
    monthly_rent?: number;
    eviction_risk?: boolean;
    needs_childcare?: boolean;
    monthly_childcare_cost?: number | null;
    health_insurance?: string;
    chronic_illness?: boolean;
    immigration_status?: string;
    domestic_violence?: boolean;
    marital_status?: string;
    other_adults?: boolean;
    income_sources?: string[];
    savings_assets?: string;
    legal_issues?: string[];
    urgency?: string;
  };
}

interface AuthState {
  user: AuthUser | null;
  // accessToken is kept in memory only — NOT persisted to localStorage
  // The refresh token lives in an httpOnly cookie managed by the server
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      /**
       * Called after a successful login/register API response.
       * Stores the access token in memory (Zustand state), NOT in localStorage.
       * The refresh token is in an httpOnly cookie set by the server.
       */
      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true });
      },

      /** Called by the API interceptor after a silent token refresh */
      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      logout: () => {
        // No localStorage to clean up — tokens were never stored there.
        // The server will clear the httpOnly refresh cookie via the logout endpoint.
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: "momplan-user",
      // SECURITY: Only persist non-sensitive user metadata.
      // accessToken is NEVER persisted — it lives in memory only.
      // refreshToken lives in an httpOnly server cookie (not accessible here).
      partialize: (state: AuthState) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // accessToken intentionally excluded
      }),
    } as any
  )
);
