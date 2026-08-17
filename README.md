# CoursePilot 2.0

CoursePilot is a responsive, installable assignment tracker built with Next.js, MongoDB and Framer Motion.

## Local development

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Create `.env.local` and configure these values in your deployment provider as secrets:

```bash
MONGODB_URI=mongodb://...
JWT_SECRET=use-a-long-random-secret
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

`MONGODB_URI` and `JWT_SECRET` are required for admin login and database changes. Without MongoDB, public pages use the bundled fallback catalog.

## Custom branding

Replace the files in `public/branding/` while keeping the same names:

| File | Purpose |
| --- | --- |
| `light_logo.svg` | Navbar logo on the fixed light theme |
| `dark_logo.svg` | Navbar logo on the dark theme |
| `icon-192.png` | PWA and browser icon, 192×192 |
| `icon-512.png` | PWA and social icon, 512×512 |
| `icon-maskable-512.png` | Maskable Android PWA icon, 512×512 with safe padding |
| `apple-touch-icon.png` | iOS home-screen icon, 180×180 |

Transparent SVG wordmarks work best in the navbar. Keep important maskable-icon artwork inside the central 80% safe area.

## PWA

The production build includes:

- a web app manifest at `/manifest.webmanifest`
- an offline fallback page
- a service worker that caches static assets and previously opened pages
- install icons, Apple web-app metadata and theme colors

The service worker registers only in production.

## Quality checks

```bash
npm run lint
npm run build
```

## Deploy to Vercel

The project deploys to Vercel with zero configuration (Next.js is auto-detected, Node 20.9+ is pinned via `engines`).

1. Push the repo to GitHub, then in [Vercel](https://vercel.com/new) choose **Import Project** and select the repository.
2. Keep the defaults — Framework: **Next.js**, Build Command: `next build`, Install Command: `npm ci`.
3. Add the environment variables (Project → Settings → Environment Variables):

   | Variable | Required | Purpose |
   | --- | --- | --- |
   | `MONGODB_URI` | For live data + admin | MongoDB connection string |
   | `JWT_SECRET` | For admin login | Long random secret signing the admin session cookie |
   | `NEXT_PUBLIC_SITE_URL` | Recommended | Absolute site URL used in metadata, sitemap and robots |

   Without `MONGODB_URI` / `JWT_SECRET` the site still builds and serves the bundled fallback catalog in read-only mode.

4. Deploy. Vercel builds with `npm run build`; the standalone/self-host bundle is skipped automatically on Vercel (`VERCEL=1`).

If you use MongoDB Atlas, allow connections from anywhere (`0.0.0.0/0`) in Network Access, because Vercel serverless functions use dynamic IPs — and pick a Vercel function region close to your Atlas cluster for low latency.

## Self-hosted production

Outside Vercel the project uses `output: "standalone"`. Deploy `.next/standalone`, `.next/static`, and `public` (the `postbuild` script already copies these), then start with:

```bash
node .next/standalone/server.js
```
