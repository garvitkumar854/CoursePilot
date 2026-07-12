import axios from "axios";
import { AUTH_TOKEN_KEY } from "../utils/constants";

const baseURL = "/api";

// ✅ Read token from localStorage OR cookie — covers mobile session-cookie edge cases
function getAuthToken() {
  // 1. Prefer localStorage (most reliable, persists across tabs)
  const lsToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (lsToken) return lsToken;

  // 2. Fallback: parse auth_token cookie (used for session-only logins)
  const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
  if (match) return decodeURIComponent(match[1]);

  return null;
}

const api = axios.create({
  baseURL,
  withCredentials: true,

  // ✅ Request timeout — prevents hanging requests
  timeout: 15000, // 15 seconds
});

// ✅ Request interceptor — attach auth token from localStorage OR cookie
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor — normalize errors globally
api.interceptors.response.use(
  // Success — pass through
  (response) => response,

  // Error — normalize and enrich
  (error) => {
    // Request timed out
    if (error.code === "ECONNABORTED") {
      console.error("[API] Request timed out:", error.config?.url);
      return Promise.reject(new Error("Request timed out. Please try again."));
    }

    // No response from server (network down)
    if (!error.response) {
      console.error("[API] Network error — no response received");
      return Promise.reject(new Error("Network error. Please check your connection."));
    }

    const { status, config } = error.response;

    // Log non-401 errors (401 = expected when not logged in)
    if (status !== 401) {
      console.error(`[API] ${status} error on ${config?.method?.toUpperCase()} ${config?.url}`);
    }

    return Promise.reject(error);
  }
);

export default api;