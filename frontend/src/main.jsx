import React from "react";
import ReactDOM from "react-dom/client";
import { SWRConfig } from "swr";
import App from "./App.jsx";
import "./index.css";

// ✅ Global SWR fetcher error handler
function onError(error) {
  // Only log non-401 errors (401 = expected when not logged in)
  if (error?.response?.status !== 401) {
    console.error("[SWR] Fetch error:", error?.message || error);
  }
}

// ✅ Smart retry logic — don't retry on 4xx errors
function onErrorRetry(error, key, config, revalidate, { retryCount }) {
  // Never retry on 404 or 401
  if (
    error?.response?.status === 404 ||
    error?.response?.status === 401 ||
    error?.response?.status === 403
  ) {
    return;
  }

  // Max 3 retries for server errors
  if (retryCount >= 3) return;

  // Retry after 5 seconds
  setTimeout(() => revalidate({ retryCount }), 5000);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SWRConfig
      value={{
        // ✅ Performance tuning
        revalidateOnFocus: false,        // Don't refetch when tab regains focus
        revalidateOnReconnect: true,     // DO refetch after internet reconnects
        revalidateIfStale: true,         // Revalidate stale data in background
        dedupingInterval: 5000,          // 5s dedup window (was 10s — more responsive)

        // ✅ Reliability
        errorRetryCount: 3,              // Max retry attempts
        onErrorRetry,                    // Smart retry — skip 4xx errors
        onError,                         // Global error logging

        // ✅ Background updates
        refreshInterval: 0,              // No polling by default (NotificationBell sets its own)
        focusThrottleInterval: 10000,    // Throttle focus revalidation to 10s

        // ✅ Loading states
        loadingTimeout: 5000,            // Warn if request takes > 5s
        onLoadingSlow: (key) => {
          console.warn(`[SWR] Slow request detected: ${key}`);
        },

        // ✅ Keep previous data while revalidating
        // Prevents UI flashing empty state on refetch
        keepPreviousData: true,
      }}
    >
      <App />
    </SWRConfig>
  </React.StrictMode>
);