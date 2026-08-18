import withPWAInit from "@ducanh2912/next-pwa";

const isDevelopment = process.env.NODE_ENV === "development";
const isVercel = Boolean(process.env.VERCEL);

const withPWA = withPWAInit({
  dest: "public",
  sw: "sw.js",
  scope: "/",
  register: true,
  disable: isDevelopment,
  cacheStartUrl: true,
  dynamicStartUrl: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  fallbacks: {
    document: "/offline.html",
  },
  workboxOptions: {
    clientsClaim: true,
    skipWaiting: true,
    cleanupOutdatedCaches: true,
    navigationPreload: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "google-font-stylesheets",
          cacheableResponse: { statuses: [0, 200] },
          expiration: { maxEntries: 8, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-font-files",
          cacheableResponse: { statuses: [0, 200] },
          expiration: { maxEntries: 16, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static-chunks",
          cacheableResponse: { statuses: [0, 200] },
          expiration: { maxEntries: 128, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/_next\/image\?url=.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-optimized-images",
          cacheableResponse: { statuses: [0, 200] },
          expiration: { maxEntries: 96, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:avif|webp|png|jpe?g|gif|svg|ico|woff2?|ttf|otf|css|js)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
          cacheableResponse: { statuses: [0, 200] },
          expiration: { maxEntries: 160, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "document-pages",
          cacheableResponse: { statuses: [200] },
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  ...(isVercel ? {} : { output: "standalone" }),
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
