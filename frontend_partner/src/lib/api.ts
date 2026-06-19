import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

function normalizeApiBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return normalizeApiBaseUrl(
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3636"
  );
}

const API_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export type RefreshResult =
  | { status: "success"; accessToken: string; user?: PartnerUser }
  | { status: "unauthorized" }
  | { status: "error" };

let refreshPromise: Promise<RefreshResult> | null = null;

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.__momplan_partner_token__ ?? null;
}

export function setInMemoryToken(token: string) {
  if (typeof window !== "undefined") {
    window.__momplan_partner_token__ = token;
  }
}

export function clearInMemoryToken() {
  if (typeof window !== "undefined") {
    window.__momplan_partner_token__ = undefined;
  }
}

function isRefreshRequest(config?: InternalAxiosRequestConfig): boolean {
  return (config?.url ?? "").includes("/api/partner/auth/refresh");
}

function isLoginRequest(config?: InternalAxiosRequestConfig): boolean {
  const url = config?.url ?? "";
  return (
    url.includes("/api/partner/auth/login") ||
    url.includes("/api/partner/auth/register")
  );
}

async function getAuthGeneration(): Promise<number | null> {
  try {
    const { usePartnerAuthStore } = await import("@/store/auth.store");
    return usePartnerAuthStore.getState().authGeneration;
  } catch {
    return null;
  }
}

async function syncAccessToken(token: string) {
  setInMemoryToken(token);
  try {
    const { usePartnerAuthStore } = await import("@/store/auth.store");
    usePartnerAuthStore.getState().setAccessToken(token);
  } catch {}
}

export async function refreshAccessToken(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<RefreshResult> => {
    try {
      const response = await axios.post(
        `${API_URL}/api/partner/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const { accessToken, user } = response.data.data;
      await syncAccessToken(accessToken);
      return { status: "success", accessToken, user };
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403)
      ) {
        return { status: "unauthorized" };
      }
      return { status: "error" };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function revokeSession(): Promise<void> {
  clearInMemoryToken();
  try {
    await axios.post(`${API_URL}/api/partner/auth/logout`, {}, { withCredentials: true });
  } catch {}
  try {
    const { usePartnerAuthStore } = await import("@/store/auth.store");
    usePartnerAuthStore.setState((state) => ({
      user: null,
      organization: null,
      accessToken: null,
      isAuthenticated: false,
      authGeneration: state.authGeneration + 1,
    }));
  } catch {}
}

export async function ensureAccessToken(): Promise<string | null> {
  const existing = getAccessToken();
  if (existing) return existing;
  try {
    const { usePartnerAuthStore } = await import("@/store/auth.store");
    if (!usePartnerAuthStore.getState().isAuthenticated) return null;
  } catch {
    return null;
  }
  const refreshed = await refreshAccessToken();
  if (refreshed.status === "success") return refreshed.accessToken;
  return getAccessToken();
}

api.interceptors.request.use(async (config) => {
  const token = getAccessToken() ?? (await ensureAccessToken());
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!original || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (isRefreshRequest(original) || isLoginRequest(original)) {
      if (isRefreshRequest(original)) await revokeSession();
      return Promise.reject(error);
    }

    if (original._retry) return Promise.reject(error);
    original._retry = true;

    const genBefore = await getAuthGeneration();
    const refreshed = await refreshAccessToken();

    if (refreshed.status !== "success") {
      const genAfter = await getAuthGeneration();
      const shouldLogout =
        refreshed.status === "unauthorized" &&
        (genBefore === null || genAfter === genBefore);
      if (shouldLogout) await revokeSession();
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
    return api(original);
  }
);

// ---- Types ----

export interface PartnerUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "caseworker";
  org_id?: string | null;
  must_change_password?: boolean;
  avatar_url?: string | null;
  phone?: string | null;
  title?: string | null;
}

declare global {
  interface Window {
    __momplan_partner_token__?: string;
  }
}
