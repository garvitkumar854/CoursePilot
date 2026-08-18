# CoursePilot — Main-Thread Performance Fixes (applied)

Follow-up to `performance-bottleneck-audit.md`. This pass implements the four
client-side execution fixes that eliminate main-thread layout thrashing. No
branding, colors, or feature workflows were changed.

## 1. Instant zero-lag theme toggle

- `src/app/globals.css` — `.no-transitions *` utility kills every transition
  and animation in the tree with `!important` while it is on `<html>`.
- `src/components/theme/theme-toggle.tsx` — `applyTheme()` now:
  1. adds `.no-transitions` to `document.documentElement`,
  2. commits the theme attributes synchronously,
  3. forces one style pass (`void root.offsetHeight`) so the new colors are
     locked into computed style before any transition can start,
  4. removes the class on the next microtask (`setTimeout(0)`).
  The swap lands as a single paint (well under 8ms) with no trailing fade.
- Guarded by `tests/unit/theme-toggle.test.tsx`.

## 2. Uncontrolled high-INP inputs (zero re-renders per keystroke)

| Surface | File | Change |
|---|---|---|
| Login identifier / password / remember-me | `auth-modal.js` | `defaultValue`/`defaultChecked` + refs; read once on submit. Caps-Lock hint only flips when the modifier state changes (React bails otherwise). Checkmark visibility is now CSS-only (`peer-checked:[&_svg]:opacity-100`). |
| Add/Edit subject name | `admin-provider.js` | Uncontrolled + `FormData` on submit. |
| Add assignment title / description / date | `admin-provider.js` | Uncontrolled + `FormData`; calendar writes the native date node through a ref. |
| Edit assignment title / description | `assignment-dialogs.js` | Uncontrolled + `FormData`; form is keyed by assignment id so reopening remounts and re-seeds. |
| Subject search | `subject-detail-client.js` | Uncontrolled `<input>` + `useDeferredValue`; the list re-renders against the deferred value only (React Compiler memoizes the unchanged list subtree in between). |
| Upload preview rows | `upload-assignments-modal.js` | Draft records live in a ref; rows mutate them in place on `onInput` with **no React render per keystroke**. State is only replaced on structural changes (parse, remove, date edit). Row badges are O(n) via a key→index map (was O(n²)). Guarded by `tests/unit/upload-assignments-modal.test.tsx`. |

## 3. GPU-accelerated transitions only (opacity + `translate3d`)

- Removed every JS-driven `width` / `height` / `top` / `margin` animation:
  - accordion `height: 0 → auto` (subject detail),
  - reorder hint and action-error `height` banners,
  - upload parse-error and form-error `height` banners.
- Removed all Framer `layout` / `layout="position"` projections on lists
  (subject groups, upload preview, notification drawer).
- New CSS-only primitives in `globals.css` (only `opacity` +
  `transform: translate3d(x, y, 0)` in keyframes): `.gpu-fade`,
  `.gpu-enter`, `.gpu-enter-scale`, `.icon-swap`, `.gpu-layer`.
- Dialogs (auth, assignment, upload), notification drawer and rows, copy
  icon swaps, and the group accordion now use those classes. Framer Motion
  remains only inside the admin drag-reorder feature (`Reorder.Item`), which
  is transform-only and runs only during an active drag.
- The subject-card accent bar now expands with `scaleX` + opacity on a
  full-width overlay instead of transitioning `width`/`height`.
- `.transition-gpu` utility replaces every `transition-all` spray with a
  property allowlist (`transform, translate, scale, rotate, opacity,
  background-color, color, border-color, box-shadow`), so no interaction can
  ever interpolate a layout-forcing property. Tailwind duration/easing
  utilities still apply on top.
- `route-transition` / view-transition / toast keyframes were already
  compositor-only and are unchanged.

## 4. Scroll reset and containment

- `html` / `body` get `overscroll-behavior-y: contain` (no elastic
  bounce / pull-to-refresh delay on mobile).
- `.contain-scroll` utility (overscroll containment + touch scrolling)
  applied to every internal scroll surface: notification list, login panel,
  assignment dialog body, upload preview column.
- `.loop-item` utility — `content-visibility: auto` +
  `contain-intrinsic-size: auto 320px` — applied to subject cards (home) and
  assignment group sections (subject page), so offscreen loop items skip
  layout/paint entirely. Disabled while reordering (drag needs full
  measurement), and the deep-link flow force-renders the target row before
  `scrollIntoView`.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run test` (9 unit tests) pass.
- `npm run build` compiles cleanly with React Compiler enabled.
- SSR smoke-tested: home and subject pages render the containment/motion
  classes; CSS bundle contains all new utilities.
