import { create } from "zustand";
import { persist, type PersistOptions } from "zustand/middleware";
import {
  api,
  refreshAccessToken,
  revokeSession,
  setInMemoryToken,
  type PartnerUser,
} from "@/lib/api";
import type { Organization } from "@/types";

interface AuthState {
  user: PartnerUser | null;
  organization: Organization | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isInitializing: boolean;
  authGeneration: number;

  setAuth: (user: PartnerUser, accessToken: string, organization?: Organization) => void;
  setAccessToken: (token: string) => void;
  setOrganization: (org: Organization) => void;
  login: (email: string, password: string) => Promise<PartnerUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  ensureSession: () => Promise<boolean>;
  updateUser: (partial: Partial<PartnerUser>) => void;
  setHydrated: () => void;
  setInitializing: (value: boolean) => void;
}

type PersistedState = Pick<AuthState, "user" | "organization" | "isAuthenticated">;

const persistConfig: PersistOptions<AuthState, PersistedState> = {
  name: "momplan-partner",
  partialize: (state) => ({
    user: state.user,
    organization: state.organization,
    isAuthenticated: state.isAuthenticated,
  }),
  onRehydrateStorage: () => (state) => {
    state?.setHydrated();
  },
};

export const usePartnerAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrated: false,
      isInitializing: true,
      authGeneration: 0,

      setAuth: (user: PartnerUser, accessToken: string, organization?: Organization) => {
        setInMemoryToken(accessToken);
        set((state) => ({
          user,
          organization: organization ?? state.organization,
          accessToken,
          isAuthenticated: true,
          authGeneration: state.authGeneration + 1,
        }));
      },

      setAccessToken: (token: string) => {
        setInMemoryToken(token);
        set({ accessToken: token });
      },

      setOrganization: (org: Organization) => set({ organization: org }),

      login: async (email: string, password: string) => {
        const response = await api.post("/api/partner/auth/login", { email, password });
        const { user, accessToken, organization } = response.data.data as {
          user: PartnerUser;
          accessToken: string;
          organization?: Organization;
        };
        get().setAuth(user, accessToken, organization);
        return user;
      },

      logout: async () => {
        await revokeSession();
      },

      refreshSession: async () => {
        if (!get().isAuthenticated) return false;

        const genAtStart = get().authGeneration;
        const wasAuth = get().isAuthenticated;

        try {
          const result = await refreshAccessToken();

          if (genAtStart !== get().authGeneration) return get().isAuthenticated;

          if (result.status === "error") return wasAuth || get().isAuthenticated;

          if (result.status === "unauthorized") {
            if (get().accessToken) return get().isAuthenticated;
            await revokeSession();
            return false;
          }

          const { accessToken, user } = result;
          setInMemoryToken(accessToken);

          if (genAtStart !== get().authGeneration) return get().isAuthenticated;
          set((state) => ({
            user: (user as PartnerUser | null) ?? state.user,
            accessToken,
            isAuthenticated: true,
          }));

          return true;
        } catch {
          if (genAtStart !== get().authGeneration) return get().isAuthenticated;
          if (get().accessToken) return get().isAuthenticated;
          return get().isAuthenticated;
        }
      },

      ensureSession: async () => {
        const state = get();
        if (
          state.accessToken &&
          typeof window !== "undefined" &&
          window.__momplan_partner_token__
        ) {
          return true;
        }
        return get().refreshSession();
      },

      updateUser: (partial: Partial<PartnerUser>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setHydrated: () => set({ isHydrated: true }),
      setInitializing: (value: boolean) => set({ isInitializing: value }),
    }),
    persistConfig
  )
);
