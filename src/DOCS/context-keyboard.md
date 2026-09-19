# Keyboard Optimization — Pattern Reference

Current-state only. Converted so far: Add Lead modal (`pages/AdminLeadsPage.js`), Lead Detail's
Add Follow-up + Edit Follow-up forms (`pages/AdminLeadDetailPage.js`), `AdminLayout.js`'s
Ctrl+Left/Right focus-zone switching, and `pages/AdminDashboard.js`'s Recent Clients list +
action buttons. Everything else in the app is still mouse-only — convert the same way when asked.

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
- **Delete-to-delete is opt-in per page, not automatic.** Only add it where the existing delete
  action is a single lightweight confirm (Leads' "Move to Trash" modal). Do **not** add it to
  `AdminClientWorkspace.js`'s project/order rows (Cancel/Delete there settle real money or run a
  scan-then-delete flow) or to `AdminPlanProductsPage.js` (its "Delete Forever" has an archive/hard
  toggle and a retype-the-name confirm) — those stay mouse/Tab-only on purpose.

## Tab navigation — `components/admin/AdminWorkspaceTabs.js`

Left/Right-arrow tab switching for any workspace that uses this shared component (currently
`AdminClientWorkspace.js`'s 8 tabs — Overview/Projects/Plans/Payments/Deleted Projects/Documents/
Upload Links/Access). Follows the standard ARIA Tabs pattern (`role="tablist"`/`role="tab"`,
already in place) rather than inventing a new one:

- **ArrowRight/ArrowLeft** move focus + selection between tabs, wrapping at the ends (last →
  first, first → last). Held on the `tablist` container via one delegated `onKeyDown`, same shape
  as `AdminWorkspaceList`'s row `onKeyDown` — not per-tab handlers.
- **Selecting a tab moves focus to its trigger button AND switches `activeTab`** in the same
  keystroke (ARIA "automatic activation" — unlike a browser tab strip where arrowing previews
  without switching). Matches how this app's `onChange(tab.id)` already works on click, so arrow
  and click stay behaviorally identical.
- **The newly active tab's first focusable/navigable item auto-focuses**, same rule as List
  navigation's "auto-focus first row on load" — but keyed off `activeTab` changing, not off a
  fresh data load. A tab whose content is an `AdminWorkspaceList` gets this for free (that
  component already auto-focuses its own first row whenever its `loading` prop cycles — switching
  tabs must trigger that same cycle, e.g. by keying the list's `loading` state or a remount on
  `activeTab`). A tab with custom (non-list) markup needs its own first-field `useEffect`, per
  rule 1.
- Down-arrow-to-select-within-a-tab is whatever that tab's own content already does (List
  navigation's rules for an `AdminWorkspaceList` tab; ordinary field rules for a form-shaped tab)
  — the tablist's own `onKeyDown` only owns ArrowLeft/ArrowRight, never Down.

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
