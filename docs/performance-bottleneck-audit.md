# CoursePilot Performance Bottleneck Audit Report

**Scope:** structural scan of App Router pages, layout tree, client boundaries, Mongo/API payloads, form state, and animation CSS.  
**Constraint honored:** no code was refactored. This is a diagnosis-only report.  
**Target:** sub-50ms interaction latency (INP), zero unnecessary client JS, GPU-only motion.  
**Stack observed:** Next.js 16.3 App Router · React 19.2 · React Compiler enabled · TanStack Query 5 · Framer Motion 13 · MongoDB 7.

---

## Executive verdict

This codebase already has several *cosmetic* performance primitives (dynamic modal imports, a theme FOUC script, Query `staleTime`, compositor-friendly route/toast CSS). The **architecture underneath still fails an MNC interaction budget**.

Three facts dominate every other finding:

1. The **root layout hydrates the entire Mongo catalog (every subject + every assignment)** into a single client context that wraps the whole app.
2. The **home page is a Client Component**. The subject-detail page is an RSC shell that immediately hands *all* UI to a 530-line client island.
3. **Framer Motion is imported from the persistent navbar**, so the drag/layout runtime ships on every route. Accordions and search then animate `height: "auto"` and `layout`, which force style + layout on the main thread.

Until those three are split, React Compiler cannot get you under 50ms INP on a mid-range phone.

---

## Client-boundary map (as shipped)

```
src/app/layout.tsx                         RSC  + force-dynamic
│  await getCourseCatalog()                ← ALL subjects + ALL assignments
│  <Providers>                             CLIENT  (QueryClientProvider)
│    <AdminProvider initialSubjects>       CLIENT  (god-context)
│      <Navbar />                          CLIENT  + framer-motion
│      {children}                          ← can stay RSC, but usually does not
│
src/app/page.js                            CLIENT  ← home is fully client
│  useAdmin() → subjects.slice().sort().map()
│  <SubjectCard />                         CLIENT  + framer-motion  (per card)
│
src/app/subjects/[slug]/page.js            RSC  + force-dynamic
│  await getSubjectDetailsBySlug()         (also called again in generateMetadata)
│  <SubjectDetailClient />                 CLIENT  + framer-motion
│     <GroupCard />                        CLIENT  height:"auto" accordion
│       <AssignmentRow />                  CLIENT  Reorder.Item always-on
│
src/app/template.tsx                       RSC  (route-transition CSS only)
```

**17 files declare `"use client"`.** Only two route files exist. Both interactive surfaces are client-owned.

| File | Must stay client? | Why / why not |
|---|---|---|
| `src/app/providers.tsx` | Yes (thin) | QueryClient must live in the browser. Should wrap *only* data, not chrome. |
| `src/components/admin/admin-provider.js` | Partially | Auth + mutations need a client island. Catalog + modal orchestration do not belong in one provider around `{children}`. |
| `src/app/page.js` | **No** | Static hero + subject grid can be RSC. Only “Add Subject” needs a client button. |
| `src/components/subjects/subject-card.js` | Partially | Card chrome is static. Menu / copy / delete are islands. |
| `src/components/subjects/subject-detail-client.js` | Partially | Hero, counts, group headings can be RSC. Search, reorder, dialogs stay client. |
| `src/components/layout/navbar.js` | Partially | Brand + sticky bar can be RSC. Bell panel + admin button stay client. |
| `src/components/navbar-brand.tsx` | **No** | Logos already swap via CSS (`.brand-logo-light` / `.brand-logo-dark`). `useSyncExternalStore` + MutationObserver are dead weight. |
| `src/components/theme/theme-toggle.tsx` | Yes | Reads/writes `localStorage` + `documentElement`. |
| `src/components/auth/auth-modal.js` | Yes | Already dynamically imported. Keep it out of the dashboard graph. |
| `src/components/subjects/upload-assignments-modal.js` | Yes | Already dynamically imported. Internal form is the lag, not the boundary. |
| `src/components/subjects/assignment-dialogs.js` | Yes | Already dynamically imported. |
| `src/components/inline-calendar.tsx` | Yes | Already dynamically imported from AdminProvider. |
| `src/components/delete-subject-dialog.tsx` | Yes | Should be a single portal, not one instance per card. |
| `src/components/subjects/assignment-row.js` | Yes (thin) | Menu + drag only. Must not mount `Reorder.Item` when not reordering. |
| `src/lib/use-dismissable.js` | Yes | Hook. Fine. |
| `src/lib/client-cookie.ts` | Yes | Cookie helpers. Fine. |
| `src/components/toast-notification.tsx` | Yes | **Orphan** — never mounted. Dead client module. |

---

## 1. The `'use client'` leak check

### 1.1 Parent wrappers that poison the tree

**`src/app/layout.tsx` (RSC) → `Providers` → `AdminProvider` → `Navbar` + `{children}`**

The layout itself is a Server Component, which is correct. It then immediately wraps the *entire* document body in two client providers:

```164:182:src/app/layout.tsx
export default async function RootLayout({ children }: RootLayoutProps) {
  const initialSubjects = await getCourseCatalog();
  // ...
        <Providers>
          <AdminProvider initialSubjects={initialSubjects}>
            <Navbar />
            <div className="relative z-10 flex-1">{children}</div>
          </AdminProvider>
        </Providers>
```

`{children}` *can* remain RSC when passed through a client parent. That composition is wasted because:

- `export const dynamic = "force-dynamic"` is set on the **root layout**, so every route is dynamically rendered and waits on Mongo.
- The catalog passed into `AdminProvider` includes **nested `dateGroups` and every assignment**. The home page only needs `slug`, `name`, `order`, `assignmentCount`, `accentColor`, `tint`.
- `Navbar` is imported as a client module from a client provider, so Framer Motion becomes part of the **shared app bundle**, not a subject-page chunk.

**Convert immediately**

- Keep `layout.tsx` as RSC. Stop putting `AdminProvider` around `{children}`.
- Split context: `SessionProvider` (user/login) vs `CatalogProvider` (or just pass server-rendered props).
- Fetch a **card projection** for the dashboard, not the assignment tree.

### 1.2 Home page is an unnecessary Client Component

```1:8:src/app/page.js
"use client";

import SubjectCard from "@/components/subjects/subject-card";
import { useAdmin } from "@/components/admin/admin-provider";

export default function Home() {
  const { isAdmin, openAddSubject, subjects } = useAdmin();
```

This page’s markup is 90% static (eyebrow, H1, description, subject count). The only interactive bits are “Add Subject” (admin-only) and whatever `SubjectCard` needs.

**Convert immediately**

- `page.js` → RSC. Render the heading and grid on the server from `getCourseCatalog()` (or a slimmer `getSubjectCards()`).
- Extract `<AddSubjectButton />` as a 10-line client island.
- Extract `<SubjectCardMenu />` / `<CopyAssignmentsButton />` as islands so the card shell ships zero JS.

### 1.3 Subject route is an RSC that surrenders immediately

```40:45:src/app/subjects/[slug]/page.js
export default async function SubjectPage({ params }) {
    const { slug } = await params;
    const subject = await getSubjectDetailsBySlug(slug);
    if (!subject) notFound();
    return <SubjectDetailClient subject={subject} slug={slug} />;
}
```

`generateMetadata` calls `getSubjectDetailsBySlug` **again** on the same request. The page then hydrates a 530-line client component that re-reads the *same* subject out of the global catalog:

```152:155:src/components/subjects/subject-detail-client.js
    const serverSubject = useMemo(
        () => subjects.find((item) => item.slug === slug) ?? subject,
        [subjects, slug, subject],
    );
```

Hero, back link, title, assignment count, and “last updated” have no reason to be client-rendered.

### 1.4 Navbar brand does not need a client runtime

`src/components/navbar-brand.tsx` uses `useSyncExternalStore` + a `MutationObserver` on `documentElement[data-theme]` so it can set `data-active-theme`. The logos already toggle in `globals.css` via `.brand-logo-light` / `.brand-logo-dark`. This file can go back to RSC today.

### 1.5 What is already correct

- `src/app/template.tsx` is RSC and uses compositor-only `.route-transition`.
- Auth, upload, calendar, and assignment dialogs are `next/dynamic(..., { ssr: false })` from `AdminProvider` / `SubjectDetailClient`. Keep that.
- `src/lib/course-db.js` and `src/lib/mongodb.ts` are `server-only`. Good.

---

## 2. Main-thread blocking actions (Mongo payloads processed in the browser)

### 2.1 The catalog is built three times, then rebuilt in the browser

`getCourseCatalog()` (`src/lib/course-db.js:160`) does:

1. `subjects.find({}).toArray()`
2. `assignments.find({ isActive: { $ne: false } }).toArray()`  ← **every assignment in the database**
3. In-process `Map` grouping, date formatting, tint math, sort

That function is invoked from:

| Caller | When |
|---|---|
| `src/app/layout.tsx` | Every HTML request (`force-dynamic`) |
| `GET /api/subjects` | React Query refresh |
| `POST /api/subjects` | After create |
| `PATCH` / `DELETE /api/subjects/[slug]` | After edit/delete |
| `POST .../assignments` | After add |
| `PUT` / `PATCH` / `DELETE .../assignments/[id]` | After edit / move / delete |
| `POST .../assignments/bulk` | After import |
| `POST .../assignments/reorder` | After save order |
| `src/app/sitemap.js` | Sitemap generation |

**Eleven call sites** return the *full nested catalog* after a one-row mutation.

On the client, `AdminProvider` **normalizes it again**:

```20:36:src/components/admin/admin-provider.js
function normalizeAssignment(assignment, index, groupLabel) { /* map */ }
function normalizeSubject(subject) {
    return {
        ...subject,
        dateGroups: (subject.dateGroups ?? []).map((group) => ({
            ...group,
            assignments: (group.assignments ?? []).map((assignment, index) =>
                normalizeAssignment(assignment, index, group.label)),
        })),
    };
}
function normalizeCatalog(subjects) {
    return (subjects ?? seedSubjects).map((subject) => normalizeSubject(subject));
}
```

That mapper runs as:

- `initialData: () => normalizeCatalog(initialSubjects)`
- `queryFn` after `GET /api/subjects`
- `useEffect` whenever `initialSubjects` identity changes
- fallback `catalogQuery.data ?? normalizeCatalog(initialSubjects)`
- every `syncCatalog()` after a mutation

So a single page load does: **Mongo full scan → Node group/sort → serialize JSON → hydrate → JS map/map/map → React Query cache → render**. A mutation does it again, then `window.dispatchEvent("coursepilot:notifications-changed")` kicks the navbar into another fetch.

### 2.2 Dashboard sorts the heavy tree on every render

```41:47:src/app/page.js
          {subjects
            .slice()
            .sort((left, right) => left.order - right.order)
            .map((subject, index) => (
              <SubjectCard key={subject.slug} subject={subject} rank={index + 1} />
            ))}
```

No `useMemo`. Each `SubjectCard` receives the full `dateGroups` payload so `handleCopy` can flatten titles. Copy is a click path — it does not need to live on the hot render path. The server already sorted `{ order: 1 }` in Mongo.

`getNextAssignmentNumber()` (`admin-provider.js:38`) does `dateGroups.flatMap(...).reduce(...)` on the client when opening “Add Assignment”, even though `GET /api/subjects/[slug]/assignments` already returns `{ nextNumber }`.

### 2.3 Subject page re-filters assignments on the main thread

`GroupCard` (`subject-detail-client.js:55-60`) runs this on every parent render:

```js
const filteredAssignments =
    isReordering || !normalizedQuery
        ? group.assignments
        : group.assignments.filter((assignment) =>
            `${assignment.title} ${assignment.description ?? ""}`
                .toLowerCase().includes(normalizedQuery),
        );
```

`positionOf()` (`subject-detail-client.js:286`) `flatMap`s every group whenever a dialog opens.

Search, grouping, and rank should be:

- **Server:** `$sort` + pre-built `dateGroups` (already done in `buildSubjectRecord`).
- **Search:** either a memoized selector in a leaf island, or a URL `?q=` handled by the RSC page. Do not rebuild strings with `` `${title} ${description}` `` per keystroke per row.

### 2.4 Import preview does O(n²) work in the browser

`src/lib/assignment-import.js` (`parseAssignmentFile`, `groupAssignmentsByDate`, `validateImportAssignments`) is a client module imported by `upload-assignments-modal.js`. Parsing a file in the browser is acceptable. What is not:

- `updateAssignment` maps the **entire** array on every keystroke (`upload-assignments-modal.js:195`).
- `groups = useMemo(() => groupAssignmentsByDate(assignments), [assignments])` rebuilds every group on every keystroke.
- Each `PreviewRow` computes its badge with `assignments.findIndex(...)` inside the group map → **O(n²)**.

Move validation/grouping that is needed for persist to `POST .../assignments/bulk` (already has `validateImportAssignments`). Keep the preview as uncontrolled fields.

### 2.5 Navbar re-derives notification state on the client

`src/components/layout/navbar.js`:

- Fetches `/api/notifications` on mount, every 60s, on `visibilitychange`, and on the custom catalog event.
- Filters by `clearedAt`, builds a `Set` of read IDs, then `.filter` for `unreadCount`.
- `relativeTime()` allocates a `Date` per row per render.

`GET /api/notifications` already limits to 40 and maps documents in `notification-db.js`. The remaining client work should be a single memoized selector, not a reason to keep the whole header as a client component.

### 2.6 Duplicate server work on the subject route

`src/app/subjects/[slug]/page.js` calls `getSubjectDetailsBySlug` in **both** `generateMetadata` and the page. Two Mongo round-trips per navigation for the same slug. `force-dynamic` on this page *and* the root layout means nothing is cached at the framework layer.

---

## 3. Re-render loops and form-input lag

React Compiler (`next.config.mjs` → `reactCompiler: true`) will memoize some leaf components. It will **not** save you when the state that changes lives in the same component that renders the list, or when context `subjects` is a new nested array.

### 3.1 P0 — Subject search is a controlled input on the page root

```143:143:src/components/subjects/subject-detail-client.js
    const [query, setQuery] = useState("");
```

```360:365:src/components/subjects/subject-detail-client.js
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
```

`query` is owned by `SubjectDetailClient`, which also renders:

- the hero
- admin action bar
- `motion.section layout` wrapping **every** `GroupCard`
- every `AssignmentRow` (`Reorder.Item` + drag controls + motion value)

Every keystroke therefore:

1. Re-renders the page root.
2. Re-filters every group.
3. Triggers Framer `layout` measurements (`motion.section layout` at line 490, `GroupCard layout={!isReordering}` at line 72).
4. Rebuilds the `Reorder.Group` `values` array.

This is the textbook pattern that produces **input lag well above 50ms** once a subject has more than a few dozen assignments.

**Fix (do not implement yet):** uncontrolled `<input ref>` or a tiny `SearchField` island; keep `query` out of the list parent. Prefer `useDeferredValue` / URL state if the list must react. Never combine search state with `layout` animations.

### 3.2 P0 — Upload preview: one keystroke remounts the whole list

`PreviewRow` fields are fully controlled. `onChange` calls `setAssignments(current => current.map(...))`. Parent has `layout` on:

- the dialog panel
- the scroll column (`layout="position"`)
- each date section
- each row (`motion.div layout`)
- error banners (`height: 0` → `height: "auto"`)

Typing a title in a 40-row import will layout-animate 40 cards. That cannot hit 50ms.

**Fix:** uncontrolled inputs + read values on Import. Disable `layout` on rows. Virtualize if imports can exceed ~30 rows.

### 3.3 P1 — AdminProvider context is a render broadcast

```js
const value = {
    user, loading, isAdmin: Boolean(user), subjects: catalogSubjects,
    openLogin: () => setModal({ type: "login" }),
    // …12 more functions, none wrapped in useCallback
};
```

`useMemo` is imported and **never used** on `value`. `modal` is not in `value`, so a compiler-cached object *may* shield consumers from `setModal`. It will **not** shield them from:

- `/api/admin/me` resolving (`setUser` / `setLoading`) — flashes the entire dashboard
- any mutation’s `syncCatalog()` — new `subjects` array → Home + every SubjectCard + SubjectDetailClient + every row
- login / logout

Home, Navbar, every SubjectCard, and SubjectDetailClient all call `useAdmin()`. One cache write is a full-tree render.

**Fix:** split contexts (`session` vs `catalog` vs `modals`). Put catalog behind selectors. Stop returning the full assignment tree to dashboard consumers.

### 3.4 P1 — Other controlled forms (lower blast radius, still wrong default)

| Surface | State | Blast radius |
|---|---|---|
| `SubjectModal` name (`admin-provider.js:106`) | `useState` + `value`/`onChange` | Modal only. Convert to uncontrolled. |
| `AssignmentModal` title + description (`admin-provider.js:176-177`) | controlled textarea | Modal only, but description keystrokes re-render calendar slot. |
| `EditAssignmentDialog` (`assignment-dialogs.js:93-95`) | controlled title/description/date | Dialog only. Fine if isolated; still prefer refs. |
| `AuthModal` identifier + password + caps-lock (`auth-modal.js:68-72`) | controlled; `onKeyUp` → `setCapsLock` every key | Modal only. Password field does not need React. |
| `InlineCalendar` month (`inline-calendar.tsx:48`) | local month state | 42 day-cells re-render on month change. Acceptable. |

None of these should lift state into `AdminProvider`.

### 3.5 P2 — Accordion / reorder / copy state lives too high

`openGroups`, `isReordering`, `draftGroups`, `isCopied`, `dialog` all live on `SubjectDetailClient`. Toggling one date group re-renders every other group and trips `layout` animations. Copying the subject list re-renders the hero to swap a checkmark SVG through `AnimatePresence`.

**Fix:** `GroupCard` owns `isOpen`. Copy button owns `isCopied`. Dialog host is a sibling portal.

### 3.6 What is already acceptable

- `useDismissable` keeps the latest callback in a ref — no extra renders.
- Theme toggle writes `documentElement` directly and does not store theme in React state.
- Assignment next-number is a Query, not derived from a client flatten on every keystroke (only on modal open).

---

## 4. Animation blocks causing forced reflows

GPU-safe properties: `transform`, `opacity`, `filter` (with care).  
Layout-forcing properties: `height`, `width`, `top`, `left`, `margin`, `padding`, `border-width`, anything Framer `layout` / `height: "auto"`.

### 4.1 P0 — Accordion animates `height: "auto"`

```93:99:src/components/subjects/subject-detail-client.js
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            height: { duration: 0.34, ease: EASE },
                            opacity: { duration: 0.22, ease: "easeOut" },
                        }}
```

Framer must **measure the element every frame** to interpolate `auto`. Combined with `overflow: hidden` this is a forced reflow loop (~20 layout passes over 340ms). Same pattern on:

- reorder hint (`subject-detail-client.js:465`)
- action error (`subject-detail-client.js:477`)
- upload parse errors (`upload-assignments-modal.js:342`)
- upload form error (`upload-assignments-modal.js:433`)

**Fix:** `grid-template-rows: 0fr → 1fr`, or `transform: scaleY` + `opacity`, or skip height animation entirely. Never `height: "auto"` in JS.

### 4.2 P0 — Framer `layout` on lists

| Location | Prop | Cost |
|---|---|---|
| `GroupCard` section | `layout={!isReordering}` | Measures every group on search / toggle |
| List wrapper | `motion.section layout` | Measures the whole column |
| Upload panel / sections / rows | `layout` + `layout="position"` | Measures on every preview keystroke |
| `Reorder.Item` | always mounted | Drag runtime + sibling layout even when idle |

`AssignmentRow` creates `useDragControls()` + `useMotionValue(0)` for **every row**, including public (non-admin) views where drag is impossible.

**Fix:** render a plain `<li>` unless `isReordering`. Drop `layout` on search. Use CSS `translate3d` for enter/exit.

### 4.3 P0 — Persistent Framer import in the chrome

`src/components/layout/navbar.js` imports `AnimatePresence, motion` for the notification drawer. Because `Navbar` is in the root layout, **Framer Motion is in the global client graph**. Subject cards and the subject page import it again.

The drawer itself uses `y` / `scale` / `opacity` (GPU-safe). The problem is bundle + main-thread JS parse, not the drawer tween. Notification rows also stagger `x` with `delay: index * 0.035`.

**Fix:** CSS `@keyframes` for the panel (you already have `.premium-dialog` / `.toast-notification`). Dynamic-import Framer only inside the reorder island.

### 4.4 P1 — Subject card hover animates `width` and `height`

```93:94:src/components/subjects/subject-card.js
                className="absolute left-1/2 top-0 h-1.5 w-20 -translate-x-1/2 rounded-b-full transition-all duration-300 ease-out group-hover:w-full group-hover:rounded-none group-hover:h-2 ..."
```

`transition-all` + `w-20 → w-full` + `h-1.5 → h-2` forces layout on every card hover. The card surface already does the correct thing (`hover:-translate-y-1`).

**Fix:** a `::before` bar with `transform: scaleX(1)` (already centered with `-translate-x-1/2`). Never animate `width`/`height`.

### 4.5 P1 — `transition-all` spray

`transition-all` tells the browser to interpolate **every** changed computed property, including those that trigger layout. Present on:

- `navbar.js` bell + logout
- `subject-card.js` copy button + “Open subject”
- `subject-detail-client.js` copy / reorder / upload
- `theme-toggle.tsx` button + sun/moon (CSS already specifies transform/opacity)
- `upload-assignments-modal.js` dropzone + submit
- `auth-modal.js` submit
- `inline-calendar.tsx` month buttons + 42 day cells
- `delete-subject-dialog.tsx` confirm

Day cells with `transition-all duration-200` means changing month can start 42 simultaneous transitions.

**Fix:** `transition-transform`, `transition-colors`, or `transition-[transform,opacity]`. Ban `transition-all`.

### 4.6 P1 — Backdrop filters and full-viewport paint

`backdrop-blur-xl` / `backdrop-blur-md` appear on the home panel, every subject card, the sticky navbar, subject hero, search pill, and every modal scrim (~12 call sites). Each one creates a compositor layer that samples the page behind it.

Additional paint taxes in `src/app/globals.css`:

- `body` stacked radial gradients
- `body::before` fixed 28×28 grid + `mask-image` over the **entire viewport**
- dark-theme remap via large `:is(...)` / `[class~="..."]` lists with `!important` — a theme toggle restyles the whole DOM
- `.route-transition { will-change: opacity, transform; }` is **permanent**, so the route wrapper is always promoted
- `html { scroll-behavior: smooth; }` contends with programmatic `scrollIntoView({ behavior: "smooth" })` in `subject-detail-client.js:179`

Theme icon motion (`.theme-sun` / `.theme-moon`) is already GPU-correct (`translateY` + `rotate` + `opacity`). Route enter, toast, and dialog keyframes are also GPU-correct. Do not “improve” those — reuse them and delete the Framer duplicates.

### 4.7 What is already GPU-safe

- `.route-transition` / `@view-transition` / `.premium-dialog` / `.toast-notification` / `.upload-arrow`
- `hover:-translate-y-0.5` / `active:scale-95` on buttons
- `DeleteSubjectDialog` uses `transition-[transform,opacity]`
- `prefers-reduced-motion` kill-switch at the bottom of `globals.css`

---

## Ranked bottleneck list

Highest interaction / INP killer first. Severity assumes a populated catalog (tens of subjects, hundreds of assignments) on a mid-range mobile CPU.

| Rank | Killer | File(s) | Failure mode | Est. impact vs 50ms INP |
|---|---|---|---|---|
| **1** | God-context catalog hydration | `src/components/admin/admin-provider.js`, `src/app/layout.tsx` | Full Mongo tree in a client provider around every route. Unmemoized context value. Mutations rewrite the entire cache and re-render Home + Navbar + Subject view. | **Critical.** Hydration + any mutation measured in hundreds of ms. |
| **2** | Subject search + Framer `layout` + `height: auto` | `src/components/subjects/subject-detail-client.js` | Controlled `query` on the page root. Every keystroke filters groups and forces layout measurement. Accordion `height: "auto"` is a reflow loop. | **Critical** on the assignment page. This is the input-lag bug. |
| **3** | Always-on `Reorder.Item` per assignment | `src/components/subjects/assignment-row.js` | Drag controls + motion values mounted for every row, admin or not, reordering or not. | **Critical** list cost. Scales linearly with assignment count. |
| **4** | Home page is a Client Component that sorts the fat tree | `src/app/page.js`, `src/components/subjects/subject-card.js` | Entire dashboard JS. `slice().sort().map()` every render. Each card is a Framer island holding the full assignment payload. | **High.** Dashboard TTI / INP. |
| **5** | `getCourseCatalog()` returned from every mutation + GET | `src/lib/course-db.js`, all `src/app/api/subjects/**` routes | Node groups/sorts every assignment, then the client `normalizeCatalog`s it again. Layout is `force-dynamic`, so HTML waits on the same scan. | **High** TTFB + main-thread JSON parse. |
| **6** | Upload preview controlled list + `layout` | `src/components/subjects/upload-assignments-modal.js`, `src/lib/assignment-import.js` | Keystroke → map all rows → regroup → O(n²) `findIndex` → layout-animate every card. | **High** when importing. Zero cost when modal closed (dynamic import). |
| **7** | Framer Motion in the root navbar | `src/components/layout/navbar.js` | Puts the animation runtime in the shared bundle. Polls notifications every 60s and re-filters on the client. | **High** on every route (parse/eval), medium at runtime. |
| **8** | Card hover animates `width`/`height` + `transition-all` | `src/components/subjects/subject-card.js` | Forced reflow on the most-hovered element on the dashboard. | **Medium** (pointer INP). |
| **9** | Duplicate subject fetch + client re-find | `src/app/subjects/[slug]/page.js` | `generateMetadata` + page both hit Mongo; client then `subjects.find(slug)`. | **Medium** TTFB. |
| **10** | Backdrop-blur + full-viewport grid + dark `:is()` remap | `src/app/globals.css`, cards, navbar, modals | Extra compositor layers and a theme-toggle style recalc of the whole tree. | **Medium** paint / scroll. |
| **11** | Modal forms use controlled `useState` | `admin-provider.js` (`SubjectModal`, `AssignmentModal`), `auth-modal.js`, `assignment-dialogs.js` | Keystroke re-renders the modal tree (calendar, buttons, errors). Isolated, but the wrong default. | **Low–medium**, modal-scoped. |
| **12** | NavbarBrand client observer | `src/components/navbar-brand.tsx` | MutationObserver + extra hydration for a CSS-only logo swap. | **Low.** Convert to RSC. |
| **13** | Permanent `will-change` on `.route-transition` | `src/app/globals.css` | Keeps a compositor layer alive forever. | **Low.** |
| **14** | Dead `toast-notification.tsx` client module | `src/components/toast-notification.tsx` | Unused. Does not ship unless imported, but it is unconnected dead surface. | **None** at runtime. |

---

## Conversion / move-to-server checklist (for the next pass)

Do not treat this as implemented work. It is the shortest path to a 50ms budget.

**RSC conversions (ship zero JS)**

1. `src/app/page.js` → Server Component.
2. `src/components/navbar-brand.tsx` → Server Component.
3. Subject hero / back link / title / counts → stay in `subjects/[slug]/page.js`.
4. Navbar chrome (logo + bar geometry) → Server Component; bell + admin as islands.
5. Subject card shell → Server Component; menu/copy as islands.

**Move off the main thread / off the client**

1. Add `getSubjectCards()` that projects `{ slug, name, order, assignmentCount, accentColor, tint }` — no `dateGroups`.
2. Stop calling `getCourseCatalog()` after mutations; return the changed row or `{ ok: true }` and patch the Query cache.
3. Drop `force-dynamic` from the root layout. Cache the card catalog. Keep the subject page dynamic only if it must be.
4. Deduplicate `getSubjectDetailsBySlug` between `generateMetadata` and the page (`React.cache` or `generateMetadata` sharing).
5. Keep import *parsing* client-side; keep import *persist/validate* on `POST .../bulk` (already there). Stop regrouping on every keystroke.

**Uncontrolled / atomic state**

1. Subject search: ref or isolated island. No `layout` while typing.
2. Upload preview: uncontrolled fields, read on submit.
3. Login + subject/assignment modals: native form fields, read from `FormData`.
4. Split `AdminProvider` into session / catalog / modal hosts.

**GPU-only motion**

1. Replace every `height: "auto"` with `grid-template-rows` or no height animation.
2. Mount `Reorder.Item` only while `isReordering`.
3. Delete Framer from `navbar.js` and `subject-card.js`.
4. Replace the card accent-bar `w-20 → w-full` with `transform: scaleX`.
5. Replace `transition-all` with `transition-transform` / `transition-colors`.
6. Remove permanent `will-change` from `.route-transition`. Reserve `backdrop-blur` for the sticky header only.

---

## Already-good patterns (do not regress)

- Theme boot script in `layout.tsx` prevents a hydration flash without React.
- `ThemeToggle` does not store theme in React state.
- Modal code-splitting via `next/dynamic`.
- `server-only` on Mongo helpers; pool sized for serverless.
- Reorder is a local draft until Save — correct (the bug is mounting drag nodes before that).
- Query defaults: `staleTime` 5 min, `refetchOnWindowFocus: false`, structural sharing.
- Route/toast/dialog CSS keyframes are already compositor-only.
- `prefers-reduced-motion` is honored globally.

---

*End of audit. No application code was modified.*
