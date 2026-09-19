# Keyboard Optimization — Pattern Reference

Current-state only. Converted so far: Add Lead modal (`pages/AdminLeadsPage.js`), Lead Detail's
Add Follow-up + Edit Follow-up forms (`pages/AdminLeadDetailPage.js`), `AdminLayout.js`'s
Ctrl+Left/Right focus-zone switching, `pages/AdminDashboard.js`'s Recent Clients list + action
buttons, and `AdminWorkspaceTabs.js`'s tab navigation + tab-to-content handoff (used by
`pages/AdminClientWorkspace.js`'s 8 tabs). Everything else in the app is still mouse-only —
convert the same way when asked.

## Rules

1. Auto-focus first field on open (modal: on open-state; full page: once data has loaded).
2. `<input>` Enter → `preventDefault()` + focus next field ref. Never submits.
3. `<textarea>` Enter → focus next field. `Shift+Enter` → newline. Same helper as #2, checks `event.shiftKey`.
4. Dropdown in the chain → `KeyboardSelect` (never native `<select>`). `onConfirm` prop moves focus to next field. Must preserve any pre-selected default value.
5. Typeahead list → arrow keys move highlight, Enter picks. Reuse existing pick-handler, only add navigation.
6. File input → leave Space alone (native picker). Intercept Enter only, to move to next field.
7. Next-step after a conditional field = computed live off form state, never hardcoded order.
8. Last field → submit button gets focus + `focus:animate-pulse focus:ring-4 focus:ring-emerald-300`. Enter submits natively (`type="submit"` in `<form onSubmit>`).
9. Esc closes a modal (same handler as its ✕). Not applicable to full pages.
10. Modal close = single ✕ top-right, no separate Cancel button. Exception: inline "Cancel edit" next to a Save button (no ✕/Esc equivalent there) — keep it.
11. Every keyboard-navigable field carries a `KeyboardHint` (`components/KeyboardHint.js`) — a line of
    text showing its shortcut, hidden until the field is focused. Mechanism: the field itself gets the
    `peer` class, and `<KeyboardHint>` renders as its **next sibling** (Tailwind's `peer-focus` only
    matches an immediately-following sibling) — so both live inside the same wrapping `<div>`, hint
    last. For `KeyboardSelect`, pass `className="peer ..."` (it forwards `className` onto its trigger
    `<button>`). No hover state, no icon — nothing shows until focus, keeping an idle form clean.
    Standard wording:
    - Text `<input>` → "Press Enter to go to next field"
    - `<textarea>` → "Enter for next field · Shift+Enter for new line"
    - `KeyboardSelect` dropdown → "Press ↓ or Enter to open · ↑↓ to move · Enter to select"
    - File input → "Space to browse files · Enter to continue"
    - Submit button → no hint (the focus-pulse ring already signals it)

## List navigation — `components/admin/AdminWorkspaceList.js`

Row-to-row keyboard navigation for any list rendered through this shared component (used by
`AdminLeadsPage.js`, `AdminClientsPage.js`, `AdminPlanProductsPage.js`, `AdminClientWorkspace.js`,
`AdminTrashPage.js`). Split of ownership:

- **The component owns moving focus between rows** — ArrowDown/ArrowUp, and auto-focusing the
  first row once, right after the initial load finishes. It does this generically via
  `React.cloneElement` on each `renderRow(item, index)` result, without knowing what a row does.
  A row only gets a ref (and becomes a navigation target) if its root element has `tabIndex={0}`
  or is a `<button>` — a non-interactive row (e.g. a group-header divider, or Trash's plain
  non-clickable rows) is skipped automatically.
- **The page owns what a row does** — Enter-to-open and (where it makes sense) Delete-to-delete
  stay in each page's own row `onKeyDown`, since only the page knows its open/delete functions and
  which rows are even deletable (e.g. a converted lead has none).
- **The auto-focus effect keys off `loading`, never off `items`.** If it re-ran on every `items`
  change, a live-filtering search box above the list (`AdminLeadsPage.js` has one) would lose focus
  to row 1 on every keystroke, breaking typing. It fires once per load cycle only.
- **At the first/last row, Up/Down bubbles instead of being swallowed.** `handleContainerKeyDown`
  only calls `preventDefault()`/`.focus()` when there's an actual next/previous row; past the edge
  it does nothing, letting an ancestor handle "off the edge of this list" — see the tab-navigation
  section's ArrowUp/ArrowDown climbing mechanism, which relies on exactly this.
- **Delete-to-delete is opt-in per page, not automatic.** Only add it where the existing delete
  action is a single lightweight confirm (Leads' "Move to Trash" modal). Do **not** add it to
  `AdminClientWorkspace.js`'s project/order rows (Cancel/Delete there settle real money or run a
  scan-then-delete flow) or to `AdminPlanProductsPage.js` (its "Delete Forever" has an archive/hard
  toggle and a retype-the-name confirm) — those stay mouse/Tab-only on purpose.

## Tab navigation — `components/admin/AdminWorkspaceTabs.js`

Keyboard navigation for any workspace that uses this shared component (currently
`AdminClientWorkspace.js`'s 8 tabs — Overview/Projects/Plans/Payments/Deleted Projects/Documents/
Upload Links/Access — and `AdminPlanProductsPage.js`'s 2 tabs). Standard ARIA Tabs pattern
(`role="tablist"`/`role="tab"`, roving `tabIndex` — active tab is `0`, rest are `-1`, so Tab-key
enters/exits the strip as one stop):

- **ArrowRight/ArrowLeft** move focus + selection between tabs, wrapping at the ends (last →
  first, first → last). Held on the `tablist` container via one delegated `onKeyDown`, same shape
  as `AdminWorkspaceList`'s row `onKeyDown` — not per-tab handlers.
- **Selecting a tab moves focus to its trigger button AND switches `activeTab`** in the same
  keystroke (ARIA "automatic activation"). Matches how `onChange(tab.id)` already works on click
  (click also refocuses the clicked button), so arrow and click stay behaviorally identical.
- **ArrowDown or Enter on a focused tab jumps into that tab's content** via an `onEnterContent`
  prop (optional — callers that don't pass it just don't get the handoff, tab switching still
  works). The caller wires this to `focusFirstInteractiveElement(contentContainerRef.current)`
  (`utils/focusFirstInteractiveElement.js`, default export) — a generic "focus the first
  button/link/input/`[role=button]`/`tabIndex >= 0` element inside this container" helper. This
  is why individual tab panels never needed per-panel rewiring: `CompactWorkspaceCard`'s
  `AdminWorkspaceList` rows, `AccountAccessPanel`'s buttons, etc. are all reached by the same
  query.
- **A tab with no interactive content at all** (only `AdminClientWorkspace.js`'s Overview —
  stat cards, no buttons) needs one manual `tabIndex={0}` somewhere inside it (its first stat
  card) so the handoff always lands on something instead of silently doing nothing.
- **Why a tab-strip-arrival path exists at all**: roving `tabIndex` means only the active tab
  button is ever a Tab-stop — there's no way to *arrive* at the tab strip except via a mouse click
  or the ArrowUp handoff below. Without it, a keyboard-only user opening the workspace has no path
  into the tabs, and ArrowLeft/ArrowRight look like they "don't work" even though the tablist's
  own handler is fine.

### ArrowUp/ArrowDown climbing out of a tab's content into the tab strip

First cut of this treated "the tab's content" as a single first element and only escalated to the
tab strip from exactly that element. That broke the moment a tab had more than one interactive
thing before/around its list — e.g. Projects/Plans have a "Create Project for Client" header
button sitting *above* `CompactWorkspaceCard`'s list, so ArrowUp from the list's first row (which
isn't "the first element" of the whole tab) did nothing instead of climbing.

The corrected mechanism treats the tab's content as **one flat, ordered sequence of every
interactive element in DOM order** (header buttons, list rows, form fields — whatever appears),
via `getInteractiveElements(container)` (`utils/focusFirstInteractiveElement.js`, a second named
export alongside `getFirstInteractiveElement` and the default `focusFirstInteractiveElement` used
for the ArrowDown/Enter handoff above). On the content container's `onKeyDown`:

- **ArrowUp**: find `document.activeElement`'s index in that sequence. Index > 0 → focus the
  previous element (e.g. list row 0 → the header button above it). Index 0 (the true top) → focus
  the tab strip's active tab (`AdminWorkspaceTabs` forwards it via `ref`, same convention as
  `KeyboardSelect` — `useImperativeHandle(ref, () => tabRefs.current[activeIndex])`).
- **ArrowDown**: the mirror — index < last → focus the next element. Nothing follows tab content
  today, so at the last element it's a no-op (there's no lower zone to hand off to yet).

**Why this doesn't double-handle a nested list's own Up/Down**: `AdminWorkspaceList`'s row
navigation (`handleContainerKeyDown`) already owns in-bounds moves between its own rows and calls
`preventDefault()` for those. It now only lets the key **bubble** (no `preventDefault`, no
`.focus()` call) at its first/last row, i.e. exactly the boundary case this container-level
handler needs to see. Everything in between never reaches here.

**Deliberate, documented exception**: an open project/plan's checkpoint list
(`WorkspaceDetailSubpage`, shown once `activeProject`/`activePlan` is set — a different feature
from `CompactWorkspaceCard`'s list) runs its own per-row `onKeyDown` for a checkbox multi-select
with Shift-range-select, and **clamps** Up/Down at its own edges (`Math.min`/`Math.max`) rather
than bubbling — on purpose, so an in-progress range-select never loses focus out of the list.
ArrowUp from inside it does **not** climb to the tab strip; back out of the open item first (its
own Back control), then climb from `CompactWorkspaceCard`'s list as normal. Don't "fix" this by
making it bubble — that reopens the exact risk this exception exists to avoid.

**Also native `<select>` elements** (several panels use plain `<select>`, not `KeyboardSelect`)
are matched by `getInteractiveElements`'s selector like any other stop, so they take their normal
place in the sequence — nothing special needed, since a closed `<select>`'s own ArrowUp/Down
(cycling its options) is native browser behavior on the element itself and isn't something this
handler intercepts.

**Not yet wired**: `AdminPlanProductsPage.js` also uses `AdminWorkspaceTabs` (2 tabs) but doesn't
pass `onEnterContent` or a content-container ArrowUp/Down handler — out of scope for the client
workspace, follow the same pattern here (`getInteractiveElements` + a `tabsRef`) when asked to
convert it.

## Focus-zone switching — `AdminLayout.js` (`hooks/useSidebarFocusZones.js`)

App-wide (desktop-only) shortcut to jump between the sidebar and the page, on
top of everything above — not a replacement for it.

- **`Ctrl+ArrowLeft`** → focuses the sidebar: the currently active route's
  link (`aria-current="page"`) if there is one, otherwise the first navigable
  link.
- **`Ctrl+ArrowRight`** → focuses back into the main content `<main>`
  (`tabIndex={-1}`, so it's a valid focus target without joining the Tab
  order), handing off to whatever keyboard flow that page already has.
- Inside the sidebar, **ArrowUp/ArrowDown** move focus between nav links —
  same index-by-`document.activeElement` pattern as `AdminWorkspaceList`'s row
  navigation, just applied to sidebar links instead of list rows.
- **Desktop-only** (`window.matchMedia('(min-width: 1024px)')`, matching the
  sidebar's own `lg:flex` breakpoint) — on narrower screens the sidebar is
  hidden, so the shortcut no-ops rather than doing nothing visible.
- **Skipped while typing** (`document.activeElement` is an `input`/
  `textarea`/`contenteditable`) so it never fights native cursor movement, and
  **skipped while a `Modal` is open** (`document.querySelector('[role="dialog"]')`)
  so it never steals focus out of a dialog.
- `sidebarContent` renders into both the desktop `<aside>` and the mobile
  drawer from the same JSX, so nav refs are filtered to `offsetParent !==
  null` before use — otherwise a closed-but-mounted copy could be targeted.
- Every sidebar `Link`/button got a `focus:ring-2 focus:ring-emerald-400`
  (there was no focus-ring at all before this), and `<main>` got a
  `focus-visible:ring-2 ring-inset ring-emerald-500` — so "which zone is
  selected" is always visible, not just functional.
- Admin-only for now (not applied to `DashboardLayout.js` / customer portal).

## Non-form pages — `pages/AdminDashboard.js`

A page with no form fields at all still needs keyboard treatment: standalone action buttons and
any list get the same rigor as a form.

- **Recent Clients** converted from a hand-rolled `<div>` grid to the shared `AdminWorkspaceList`
  (same component and column-config shape as `AdminClientsPage.js`) — this is the one card of
  free row-to-row ArrowUp/ArrowDown navigation and auto-focus-first-row-on-load described above,
  not a new pattern.
- **Standalone action buttons** (Refresh, Open Clients card, View all clients) aren't part of any
  field chain — they're native `<button>`s, so Tab already reaches them. They only needed a
  `focus:ring-4 focus:ring-emerald-100` (or `focus:ring-emerald-400/30` on the dark hero section)
  added, matching `AdminClientsPage.js`'s existing focus-ring convention — nothing else to build.
- Ctrl+Left/Right (above) already works here for free — it's wired at `AdminLayout.js`, not
  per-page.

## Build checklist

1. `useRef` per field + one for submit button.
2. `useEffect` → focus first ref (open-state or data-loaded condition).
3. Shared helpers, reused everywhere — don't write per-field inline handlers:
   - `focusNextField(nextRef)` — plain inputs.
   - `focusNextOnEnter(nextRef)` — textareas (Shift+Enter-aware).
4. Native `<select>` → `KeyboardSelect`, wire `onConfirm`.
5. Existing typeahead → add `*HighlightIndex` state + arrow/Enter `onKeyDown`, reuse existing pick function.
6. Submit button → ref + pulse classes only. No `onKeyDown` needed.
7. Modal → add Esc listener, delete redundant Cancel button.
8. Give every keyboard-navigable field `peer` + a following `<KeyboardHint>` sibling — see rule 11.
9. Update this file only if the new form needs a rule not already listed above.

## `KeyboardSelect` — `components/KeyboardSelect.js`

Use instead of native `<select>` for any chained dropdown. Not `PackageSelect.js` (different
component, different styling contract).

Props: `value`, `onChange(value)`, `options: [{value,label}]`, `placeholder`, `onConfirm()`, `className` (appended — use for state-dependent styling like a status color).

Keys: closed → `Enter`/`Space`/`ArrowDown` opens (highlights current or first). Open →
`ArrowUp`/`ArrowDown` moves highlight, `Enter`/`Space` confirms, `Esc`/click-outside closes
unchanged, `Tab` closes and moves on.

Forwards its trigger `<button>` via `ref` (`forwardRef` + `useImperativeHandle`) — `.focus()` it like any field ref.

## Examples to copy

- **Modal + branching chain + typeahead** → Add Lead modal.
- **Full-page form + file input + pre-selected dropdown** → Lead Detail Add Follow-up.
- **Inline (non-modal) edit form + kept Cancel button** → Lead Detail Edit Follow-up.

## Verification

ESLint clean on all changed files. No `npm run build` (don't run unless asked). No automated
tests — manually Tab/Enter/Esc/Arrow through the form in-browser before calling it done.
