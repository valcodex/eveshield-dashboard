import axios from "axios";

// Cast defensively: if the ambient ImportMetaEnv augmentation in
// vite-env.d.ts isn't picked up for any reason (stale type cache, wrong
// tsconfig include, etc.), this still compiles instead of breaking the build.
export const API_BASE_URL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL ?? "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send the httpOnly refresh-token cookie
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// On a 401, try once to silently refresh the access token via the refresh
// cookie before giving up and forcing a re-login.
let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isRefreshCall = original?.url?.includes("/auth/refresh");

    // Never try to "refresh" in response to the refresh call itself failing —
    // that's not a stale-session case, it just means there's no valid
    // session yet (e.g. first visit, or after logout). Let it fail straight
    // away so the caller can show the login screen instead of hanging.
    if (error.response?.status === 401 && !original._retry && !isRefreshCall) {
      original._retry = true;
      try {
        refreshPromise ??= api.post("/auth/refresh").then((r) => {
          const token = r.data?.data?.accessToken as string;
          setAccessToken(token);
          return token;
        });
        const newToken = await refreshPromise;
        refreshPromise = null;
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        refreshPromise = null;
      }
    }
    return Promise.reject(error);
  }
);
