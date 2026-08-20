# CoursePilot Performance Audit

Evidence-based audit of the current App Router codebase (Next.js 16.3, React 19.2, MongoDB driver 7, TanStack Query 5, Framer Motion 13, Vercel/PWA). No new libraries were added as a prerequisite.

## A. Architecture

| Layer | Finding |
|---|---|
| App Router | Two routes: `/` (client page) and `/subjects/[slug]` (RSC shell → large client island). Root `layout.tsx` is `force-dynamic` and awaits the **full** subject+assignment catalog on every HTML request. |
| Client boundaries | 17 `"use client"` modules. Home, navbar, every subject card, and the subject page hydrate. Auth/upload/calendar/assignment dialogs are already `next/dynamic`. |
| Data | Native MongoDB driver with a cached serverless pool (`maxPoolSize: 10`). `getCourseCatalog()` loads **every** subject and **every** active assignment, groups in Node, and is returned from 11 API call sites after mutations. No indexes are declared. No `.lean()` (driver, not Mongoose — N/A). |
| Client state | One `AdminProvider` context around the whole tree. Catalog lives in React Query (`staleTime` 5 min, no refetch-on-focus). Search is uncontrolled + `useDeferredValue`. |
| Motion | Framer Motion is a **static import** on the subject page (`Reorder`) and in `assignment-row.js`, so public viewers download the drag runtime. No `useScroll` / `layoutId` / `whileInView` / scroll listeners remain. Accordion height animation was already replaced with CSS opacity/transform. |
| Caching | Root layout `force-dynamic` disables ISR. `GET /api/subjects` has `private, max-age=60, SWR=300`. PWA workbox caches the catalog endpoint. Mutations do not `revalidateTag`/`revalidatePath`. |
| CSS | `backdrop-blur-xl` on home panel, every subject card, subject hero, and search pill — sampled on every scroll frame on mobile. Permanent `will-change` on `.route-transition`. Fixed viewport grid on `body::before`. |

## B. Ranked bottlenecks

### Critical — scrolling / INP

1. **Framer Motion on the public assignment list.** `subject-detail-client.js` and `assignment-row.js` statically import `framer-motion`. Even with `Reorder.Item` gated behind `isReordering`, the module still parses on every subject visit. Drag hooks must not ship to normal users.
2. **Offscreen list work.** Long assignment feeds paint every row. `content-visibility: auto` belongs on **rows**, not the bordered group wrapper (that wrapper’s overflow/radius must stay intact during reorder).
3. **Per-card `backdrop-filter`.** `backdrop-blur-xl` on the dashboard grid and feed chrome forces extra compositor sampling while scrolling on low-end Android. Sticky navbar blur is small and can stay.

### High — TTFB / hydration / Mongo

4. **`force-dynamic` + full catalog in the root layout.** Every navigation waits on a two-collection Mongo scan, including the dashboard which only needs card fields.
5. **Duplicate `getSubjectDetailsBySlug`** in `generateMetadata` and the page (same request, two queries) — fix with `React.cache`.
6. **No Mongo indexes** for `{ slug }`, `{ subjectId, isActive, assignmentNumber }`, `{ createdAt: -1 }` on notifications.
7. **Mutations rebuild and serialize the entire catalog** (acceptable for a small admin-only write path; must invalidate the read cache when one is added).

### Medium

8. Permanent `will-change` on `.route-transition` keeps a layer alive forever.
9. Home page is a Client Component (needed for live admin catalog updates via context). Not converted wholesale — converting it without a session-aware RSC split would freeze the grid after “Add subject”.
10. Notification poll every 60s is already `visibilitychange`-gated and quiet. Leave it.
11. `NavbarBrand` `MutationObserver` runs only on theme changes — not a scroll cost.

### Low / not done on purpose

12. **Virtualization (`@tanstack/react-virtual`).** Grouped-by-date, expand/collapse, deep-link `#assignment-id`, and dynamic row heights make window virtualization a behavior risk. Typical course lists are tens-to-low-hundreds of rows. `content-visibility: auto` + `contain-intrinsic-size: 100px` is the correct first tool. Revisit only if a subject regularly exceeds ~400 visible rows.
13. Redux/Zustand, extra Query libraries, icon packs — not required.
14. Mongoose `.lean()` — the app uses the native driver.

## C. What this pass changes

- Lift Framer Motion behind a `next/dynamic` reorder island (admin-only, after click).
- Keep assignment 3-dot menus in a `document.body` portal (`z-50`) so overflow clipping cannot hide them.
- Pin assignment-group `overflow: hidden` + radius + border during reorder/active states.
- GPU-only micro-transitions (`transform`/`opacity`, 200ms ease-out). Compact `100dvh` form shells.
- Request-level `React.cache` + 60s `unstable_cache` for catalog reads; `revalidateTag`/`revalidatePath` after admin writes.
- Mongo indexes and field projections on catalog reads.
- Drop scroll-time `backdrop-blur` on feed cards; drop permanent `will-change`.
- Do **not** add virtualization, new state libraries, or a design rewrite.
