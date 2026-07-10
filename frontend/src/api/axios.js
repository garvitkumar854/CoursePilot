import axios from "axios";

import { AUTH_TOKEN_KEY } from "../utils/constants";

const isProd = import.meta.env.MODE === "production";
let baseURL = import.meta.env.VITE_API_URL || "/api";
if (
  (isProd && baseURL.includes("localhost")) ||
  (typeof window !== "undefined" && !window.location.hostname.includes("localhost") && baseURL.includes("localhost"))
) {
  baseURL = "/api";
}

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default api;