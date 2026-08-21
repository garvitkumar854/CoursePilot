import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { AdminProvider } from "@/components/admin/admin-provider";
import Navbar from "@/components/layout/navbar";
import { readCourseCatalog } from "@/lib/catalog-cache";

import "./globals.css";
import { Providers } from "./providers";

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coursepilot.app";

// One optimized family for the whole product. Only the four weights the
// typography scale actually uses are downloaded (400/500/600/700).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CoursePilot — Assignment Tracker",
    template: "%s | CoursePilot",
  },
  description:
    "Track assignments across every subject with a fast, responsive and installable coursework dashboard.",
  applicationName: "CoursePilot",
  keywords: [
    "assignment tracker",
    "coursework planner",
    "student dashboard",
    "subject organizer",
    "education productivity",
  ],
  authors: [{ name: "CoursePilot" }],
  creator: "CoursePilot",
  publisher: "CoursePilot",
  category: "education",
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/branding/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/branding/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/branding/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CoursePilot",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "CoursePilot",
    title: "CoursePilot — Assignment Tracker",
    description:
      "A modern, installable dashboard for subjects, assignments and coursework.",
    images: [
      {
        url: "/branding/icon-512.png",
        width: 512,
        height: 512,
        alt: "CoursePilot",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "CoursePilot — Assignment Tracker",
    description:
      "A modern, installable dashboard for subjects, assignments and coursework.",
    images: ["/branding/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#07101f" },
  ],
};

// This executes synchronously before React and before the first paint, so the
// server HTML is displayed with the persisted theme and never flashes.
const themeScript = `
(function () {
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem('coursepilot-theme');
    var theme = saved === 'dark' ? 'dark' : 'light';
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  } catch (_) {
    root.dataset.theme = 'light';
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
})();`;

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CoursePilot",
  url: siteUrl,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  description:
    "A responsive assignment tracker for organizing subjects and coursework.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const initialSubjects = await readCourseCatalog();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <AdminProvider initialSubjects={initialSubjects}>
            <Navbar />
            <div className="relative z-10 flex-1">{children}</div>
          </AdminProvider>
        </Providers>
      </body>
    </html>
  );
}
