import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * SECURITY: withCredentials=true is critical — it instructs the browser to
 * include httpOnly cookies (mp_rt, mp_at) set by the backend in every request.
 * This means the refresh token is NEVER accessible to JavaScript.
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Required for httpOnly cookie-based auth
});

/**
 * Request interceptor: attach the in-memory access token as Bearer header.
 * Falls back to nothing if not logged in — cookie flow handles refresh.
 *
 * SECURITY: We no longer read from localStorage. The access token only
 * lives in Zustand memory (cleared on tab close / page refresh unless
 * a silent refresh succeeds via the httpOnly refresh cookie).
 */
api.interceptors.request.use((config) => {
  // Dynamically import auth store to avoid circular dependencies
  if (typeof window !== "undefined") {
    try {
      // Read from Zustand in-memory store (not localStorage)
      const raw = window.__momplan_access_token__;
      if (raw) {
        config.headers.Authorization = `Bearer ${raw}`;
      }
    } catch {
      // No token available — request proceeds without auth header
    }
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // The browser automatically sends the httpOnly mp_rt cookie here.
        // No refresh token in JavaScript — it's all in the cookie.
        const refreshResponse = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = refreshResponse.data.data;
        isRefreshing = false;

        // Store new access token in memory (window global for interceptor access)
        if (typeof window !== "undefined") {
          window.__momplan_access_token__ = accessToken;
        }

        // Update auth store if available
        try {
          const { useAuthStore } = await import("@/store/auth.store");
          useAuthStore.getState().setAccessToken(accessToken);
        } catch {
          // Store not available (SSR) — continue anyway
        }

        onRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        // Refresh failed — clear auth state and redirect to login
        if (typeof window !== "undefined") {
          window.__momplan_access_token__ = undefined;
          try {
            const { useAuthStore } = await import("@/store/auth.store");
            useAuthStore.getState().logout();
          } catch {
            // Ignore
          }
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Call this after a successful login/register to store the access token
 * in the in-memory global (used by the request interceptor).
 */
export function setInMemoryToken(token: string) {
  if (typeof window !== "undefined") {
    window.__momplan_access_token__ = token;
  }
}

export function clearInMemoryToken() {
  if (typeof window !== "undefined") {
    window.__momplan_access_token__ = undefined;
  }
}

// TypeScript global augmentation
declare global {
  interface Window {
    __momplan_access_token__?: string;
  }
}
