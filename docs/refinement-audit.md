# CoursePilot refinement audit (2026-08)

## Current architecture (as inspected)

| Area | Where | Notes |
| --- | --- | --- |
| Data access | `src/lib/course-db.js` | Mongo `subjects` + `assignments`; `buildSubjectRecord()` groups assignments into `dateGroups`. |
| Caching | `src/lib/catalog-cache.js` | `unstable_cache` (tag `course-catalog`, 60s) + React `cache()`. Writes call `catalogJsonResponse()` → revalidate + fresh payload. |
| Client state | `src/components/admin/admin-provider.js` | TanStack Query key `["coursepilot","subjects"]`, seeded from the RSC layout, mutated in place by writes (no refetch waterfall). |
| Subject page | `src/app/subjects/[slug]/page.js` → `subject-detail-client.js` | RSC fetch, client renders groups. |
| Modals | 4 separate implementations: `ModalShell` (admin-provider), `Shell` (assignment-dialogs), `auth-modal`, `delete-subject-dialog`, `upload-assignments-modal` | Different z-index, radius, padding, no portal. |
| Navbar | `layout/navbar.js` | `sticky top-0 z-40`. |
| Fonts | `layout.tsx` | Inter (body) + Poppins (headings, 4 weights). |

## Defects found

1. **Assignment numbering was positional.** `AssignmentRow` rendered `index + 1` inside each group, so numbering restarted per group and followed display order.
2. **Group order was fixed** (`right.sortKey - left.sortKey`) server-side with no toggle, and within a group assignments sorted by stored `order`, not by chronological sequence.
3. **`Last updated` was pre-rendered on the server** (`"N days ago"`) inside a 60s ISR cache → stale/incorrect relative values, and no minute/hour granularity.
4. **Navbar not blurred by the delete dialog.** Real cause: `layout.tsx` wraps page content in `<div className="relative z-10">`, which creates a *stacking context*. `DeleteSubjectDialog` renders inside a subject card inside that div, so its `z-[70]` is clamped under the navbar's `z-40`. Increasing z-index cannot fix it — the fix is to portal every modal to `document.body`.
5. **Duplicate calendar controls** in Add Assignment: a native `<input type="date">` *plus* a full-width "Choose from calendar" toggle that expanded a second large calendar block.
6. **`createdBy` was never written** — only `updatedBy`, and it was not projected/serialised, so Assignment Info could not show audit data.
7. **Multiline descriptions collapsed** because they were rendered without `white-space: pre-line`.
8. **Radius drift**: `rounded-lg/xl/2xl/3xl/[22px]/[24px]/[28px]/[34px]/full` used ad hoc.
9. **Total Assignments capsule missing** on the dashboard.
10. Assignment Info modal showed DB-ish rows (Subject/Position) instead of useful audit info.

## Fixes applied

* Chronological numbering pipeline in `course-db.js` (`number` is derived, never stored anew) + `sortKey` per group; display order is a client toggle.
* Portal-based shared `Modal` (`src/components/ui/modal.tsx`) with one backdrop, scroll lock, Escape, centering and radius token.
* `--radius-card` token + `.rounded-card` / `.rounded-control` utilities.
* Client `RelativeTime` component (hydration-safe: server label first, exact relative value after mount).
* `createdBy`/`updatedBy` written from the trusted server session on create/edit/import.

## Change log

### Ordering & numbering
* `src/lib/assignment-order.js` (new, pure/testable): chronological sort → permanent `number` 1..N → day grouping with numeric `sortKey`. Tie-breaks: stored `order` → `createdAt` → `_id`. Sorting always uses real `Date` values, never formatted strings.
* `course-db.js` consumes it; groups are serialised oldest → newest.
* `subject-detail-client.js` owns display order (`useState("desc")`, default newest → oldest) and a sort toggle button. Numbers come from the payload, never from a render index (`assignment-row.js`, `assignment-reorder-list.js` no longer take `index`).
* Copy-to-clipboard on both the card and the subject page now emits chronological numbers.
* Reordering forces the chronological view so a saved drag order is unambiguous.

### Data / audit
* `createdBy` written on create + bulk import, backfilled (never overwritten) on edit, always from `adminDisplayName(session)` — verified JWT payload only (`src/lib/admin-identity.js`).
* `createdAt/updatedAt/createdBy/updatedBy` projected and serialised for the Assignment Information modal.
* Subject `assignmentCount` is now the live count of active assignments.
* `lastUpdatedAt` (ISO) added to every subject record.

### Modals
* `src/components/ui/modal.tsx`: portal to `document.body`, one backdrop (`--modal-backdrop` + blur), flex centering, reference-counted scroll lock, Escape, `dialog`/`alertdialog` roles, `sm|md|lg` widths, card radius, compact mobile padding.
* Adopted by: login, add/edit subject, add assignment, edit assignment, assignment info, delete assignment, permanent delete subject. Upload modal shares the same backdrop/radius tokens.
* No z-index inflation: the navbar keeps `z-40`; the fix is escaping the page's `relative z-10` stacking context.

### Forms
* `src/components/ui/date-field.tsx`: single compact calendar trigger (formatted value + icon) replacing the duplicated native date input & oversized "Choose from calendar" button. Inline calendar itself is ~25% smaller.
* Login/add/edit forms: `min-h-11` controls (accessible touch targets) with reduced padding, gaps and heading sizes.

### Typography & tokens
* Inter only, weights 400/500/600/700, via `next/font`. Poppins removed; `.font-poppins` now resolves to Inter for legacy markup.
* Removed the `h1,h2,h3 { font-weight: 700 !important }` override in favour of an intentional hierarchy.
* `--radius-card` / `--radius-control` / `--radius-pill` + `.rounded-card` / `.rounded-control` utilities; navbar keeps its own shape.

### Performance
* `readSubjectBySlug` is served from the already-cached catalog the root layout loads → opening a subject costs **zero** extra database round-trips (previously a sequential `findOne` + `find`).
* Expand/collapse is local state with a single 160ms compositor-only animation on the group container (`.group-panel`) — rows are not animated individually, so a 500-row group behaves like a 5-row one; `content-visibility: auto` on rows keeps offscreen work at zero (virtualization measured as unnecessary).
* No new runtime dependencies.

### Tests
* `tests/unit/assignment-ordering.test.ts` — the exact spec dataset (A–E), both sort directions, tie-breaks, inactive rows.
* `tests/unit/relative-time.test.ts` — every documented label + future/missing timestamps.
* `tests/unit/modal.test.tsx` — portal escape, scroll lock, Escape, delete dialog shape.
* `tests/e2e/mobile-ui.spec.ts` — new assertion that a dialog backdrop is the topmost element over the navbar.

## Known environment note
`next/font/google` fetches Inter at build time. That host is unreachable from this offline sandbox, so the build was verified with a temporary local stub; everything else compiles and the real Inter import is what is committed.
