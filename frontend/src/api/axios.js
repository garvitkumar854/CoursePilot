import axios from "axios";
import { AUTH_TOKEN_KEY } from "../utils/constants";

// ✅ Clean baseURL logic — no fragile string matching
// In dev: VITE_API_URL=http://localhost:3000/api (set in .env.local)
// In prod: not set → defaults to /api (relative URL)
const baseURL = "/api";

const api = axios.create({
  baseURL,
  withCredentials: true,

  // ✅ Request timeout — prevents hanging requests
  timeout: 15000, // 15 seconds
});

// ✅ Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    // Read token from localStorage only
    // (cookie is sent automatically via withCredentials)
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

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