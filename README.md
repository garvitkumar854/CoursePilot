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

## Production

The project uses `output: "standalone"`. Deploy `.next/standalone`, `.next/static`, and `public`, then start with:

```bash
node .next/standalone/server.js
```
