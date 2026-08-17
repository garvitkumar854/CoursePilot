import localFont from "next/font/local";
import { getCourseCatalog } from "@/lib/course-db";
import { AdminProvider } from "@/components/admin/admin-provider";
import Navbar from "@/components/layout/navbar";
import PwaRegister from "@/components/pwa/pwa-register";
import "./globals.css";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://coursepilot.app";

const displayFont = localFont({
  src: "./fonts/coursepilot-display.woff2",
  variable: "--font-sora",
  display: "swap",
  preload: true,
});

const bodyFont = localFont({
  src: "./fonts/coursepilot-body.woff2",
  variable: "--font-manrope",
  display: "swap",
  preload: true,
});

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CoursePilot — Assignment Tracker",
    template: "%s | CoursePilot",
  },
  description: "Track assignments across every subject with a fast, responsive and installable coursework dashboard.",
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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/branding/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/branding/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/branding/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
    description: "A modern, installable dashboard for subjects, assignments and coursework.",
    images: [{ url: "/branding/icon-512.png", width: 512, height: 512, alt: "CoursePilot" }],
  },
  twitter: {
    card: "summary",
    title: "CoursePilot — Assignment Tracker",
    description: "A modern, installable dashboard for subjects, assignments and coursework.",
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
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#07101f" },
  ],
};

const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem('coursepilot-theme');
    var theme = saved === 'dark' || saved === 'light'
      ? saved
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = 'light';
  }
})();`;

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CoursePilot",
  url: siteUrl,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  description: "A responsive assignment tracker for organizing subjects and coursework.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default async function RootLayout({ children }) {
  const initialSubjects = await getCourseCatalog();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AdminProvider initialSubjects={initialSubjects}>
          <Navbar />
          <div className="relative z-10 flex-1">{children}</div>
        </AdminProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
