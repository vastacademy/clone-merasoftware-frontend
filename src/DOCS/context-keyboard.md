# Keyboard Optimization — Pattern Reference

## The goal: behave like Windows

The owner's requirement, in one line: **the admin panel should be operable by keyboard the way
a native Windows application is.** Minor differences are fine; the working model should not be.

What that means in practice, and what it rules out:

- **One gesture, one owner.** In Windows, Tab is the tab order, arrows move within a control,
  Esc closes the current layer, Enter activates. Each gesture has exactly one meaning and one
  piece of code responsible for it. Two handlers reacting to the same keypress is always a bug,
  never a design.
- **Focus is the selection.** There is no separate "selected" state painted on top of focus. What
  is focused is what acts, and what acts is visibly focused.
- **A row is one stop.** In a Windows list view, arrow keys move between rows. They do not step
  into a row's buttons. Buttons inside a row are mouse targets; the keyboard reaches their action
  through a key on the row itself.
- **Esc closes the topmost layer** — dialog first, then the open sub-view, then nothing. It never
  skips a layer.
- **The app does not steal the OS/browser's shortcuts.** Alt+Left is browser history. Ctrl+F is
  find. If the app needs a gesture, it takes one that is free — it does not redefine one the user
  already owns.

When a keyboard question comes up, answer it by asking "what would Windows do here?" before
looking for a clever app-specific mechanism.

## Where this is implemented so far

Admin only (customer portal untouched). Converted: Add Lead modal (`AdminLeadsPage.js`), Lead
Detail's Add/Edit Follow-up forms (`AdminLeadDetailPage.js`), `AdminLayout.js` focus zones,
`AdminDashboard.js` Recent Clients, `AdminWorkspaceTabs.js` tab navigation,
`AdminClientWorkspace.js`'s two confirmation modals, its Projects/Plans list rows, and its
browser-history navigation (Alt+Left / Alt+Right).

Everything else is still mouse-only. Convert it the same way when asked.

## The keys, and why those keys

Every gesture in the admin panel, from the widest to the narrowest. The "why" matters: each key
was picked because it was **free**, never by redefining one the user already owns.

| Key | Where | What it does | Why this key |
|---|---|---|---|
| `Tab` | everywhere | Next control in tab order | The OS owns it — never overridden |
| `Alt+←` / `Alt+→` | everywhere | Browser back / forward | The browser owns it. The app makes its URL honest instead of intercepting |
| `Ctrl+←` | desktop | Jump to sidebar | `Alt+←` is the browser's, `Tab` is already tab order — `Ctrl+arrows` was free |
| `Ctrl+→` | desktop | Jump back into the page | Mirror of the above |
| `←` / `→` | tab strip | Previous / next tab, and switches to it | Standard ARIA tabs; matches Windows |
| `↓` or `Enter` | tab strip | Drop into that tab's content | Down = deeper, the way Windows treats a list below a header |
| `↑` | top of tab content | Climb back to the tab strip | Roving `tabIndex` means `Tab` cannot reach the strip |
| `↑` / `↓` | any list | Previous / next row | Windows list view |
| `Enter` | a row | Open it | Windows list view |
| `Delete` | a row | Its one action (opt-in per page) | Only where the confirm is lightweight |
| `Enter` | a form field | Next field — **never submits** | So a half-filled form cannot be sent by reflex |
| `Shift+Enter` | a textarea | New line | Keeps the native meaning; plain Enter is the chain |
| `Space` | a file input | Open the file picker | Native behaviour, deliberately left alone |
| `Esc` | modal / dropdown | Close it | Never skips a layer. **Not yet wired to an open project/plan subpage — see "Still open"** |

Inside the sidebar, `↑`/`↓` move between nav links. Ctrl+arrows are desktop-only (≥1024px) and
are skipped while typing or while a dialog is open.

## Form chains

**What it feels like to use one.** The Add Lead modal (`AdminLeadsPage.js`) is the reference —
open it and press Enter after each field, no mouse, no Tab:

```
Name ──Enter──▶ Phone ──Enter──▶ Email ──Enter──▶ Source
                                                    │  ↓ or Enter opens it
                                                    │  ↑↓ picks, Enter confirms
                                        ┌───────────┴───────────┐
                              source = "Reference"        anything else
                                        │                       │
                                  Reference search              │
                                  ↑↓ highlights                 │
                                  Enter picks                   │
                                        └───────────┬───────────┘
                                                    ▼
                                                  Notes
                                          Enter ▶ next · Shift+Enter ▶ new line
                                                    │
                                                    ▼
                                            Submit (pulses)
                                              Enter saves
```

Esc closes the modal at any point. The Lead Detail Add Follow-up form is the same chain with a
file input in it: **Space** opens the file picker (left native), **Enter** moves on.

The rules that produce this:


1. Auto-focus the first field on open (modal: on open-state; full page: once data has loaded).
2. `<input>` Enter → `preventDefault()` + focus next field ref. Never submits.
3. `<textarea>` Enter → focus next field. `Shift+Enter` → newline. Same helper, checks `shiftKey`.
4. Dropdown in a chain → `KeyboardSelect` (never native `<select>`). Its `onConfirm` moves focus
   on. Must preserve any pre-selected default.
5. Typeahead → arrows move the highlight, Enter picks. Reuse the existing pick handler.
6. File input → leave Space alone (native picker). Intercept Enter only.
7. The next step after a conditional field is computed live from form state, never hardcoded.
8. Last field → submit button gets focus + `focus:animate-pulse focus:ring-4 focus:ring-emerald-300`.
   Enter submits natively (`type="submit"` inside `<form onSubmit>`).
9. Esc closes a modal (same handler as its ✕).
10. Modal close = a single ✕ top-right, no separate Cancel button. Exception: an inline
    "Cancel edit" next to a Save button, where there is no ✕/Esc equivalent.
11. Every keyboard-navigable field carries a `KeyboardHint` (`components/KeyboardHint.js`), hidden
    until the field is focused. The field gets `peer`; `<KeyboardHint>` must be its **immediately
    following sibling** (Tailwind's `peer-focus` only matches that), both inside the same wrapper.
    For `KeyboardSelect`, pass `className="peer ..."` — it forwards `className` to its trigger.
    Wording: input → "Press Enter to go to next field" · textarea → "Enter for next field ·
    Shift+Enter for new line" · dropdown → "Press ↓ or Enter to open · ↑↓ to move · Enter to
    select" · file → "Space to browse files · Enter to continue" · submit → no hint.

    **The hint must never occupy layout height.** It shows and hides with `opacity`, from a
    zero-height (`h-0`) sibling that positions the pill `absolute` inside itself, and it is
    `pointer-events-none`.

    *Before:* the component toggled `hidden` → `peer-focus:flex`, i.e. `display: none` →
    `display: flex`. *Why that broke:* pressing the mouse on a button below a focused field
    blurred the field, the pill left the layout, everything under it jumped up, and `mouseup`
    landed off the button — the browser then emitted **no click at all**, so the first click on
    Save/Cancel did nothing and every action needed two clicks. Fixed in
    `components/KeyboardHint.js` (the only file involved; all 11 usages across
    `AdminLeadDetailPage.js` and `AdminLeadsPage.js` pick it up).

    Keep the pill's wrapper a **sibling** of the field, never nested: `peer-focus:` compiles to
    `.peer:focus ~ .peer-focus\:*`, so nesting it silently stops the hint from ever appearing.

### Build checklist

1. `useRef` per field + one for the submit button.
2. `useEffect` → focus the first ref (on open-state, or once data has loaded).
3. Shared helpers only — `focusNextField(nextRef)` for inputs, `focusNextOnEnter(nextRef)` for
   textareas. No per-field inline handlers.
4. Native `<select>` → `KeyboardSelect` + `onConfirm`.
5. Typeahead → add a `*HighlightIndex` state and arrow/Enter `onKeyDown`, reuse the pick function.
6. Submit button → ref + pulse classes. No `onKeyDown`.
7. Modal → Esc listener, drop the redundant Cancel button.
8. Every navigable field: `peer` + a following `<KeyboardHint>`. Never give the hint its own
   layout height (see rule 11) — that swallows the first mouse click on anything below it.

### Two race conditions that will recur

1. **Never move focus in the same tick as the `setState` that enables the target.** A disabled
   element silently refuses focus, so focusing a submit button right after the `setState` that
   un-disables it does nothing and looks dead. Stash the intent in a ref and do the `.focus()` in
   a `useEffect` keyed on that state.
2. **A `focusAfterX()` helper called from the handler that sets the state it reads must take the
   new value as an argument** — otherwise it reads the stale one.

Both were hit in `AdminClientWorkspace.js`'s cancel/delete modals; both fixes are in that file.

## Lists — `components/admin/AdminWorkspaceList.js`

Used by `AdminLeadsPage.js`, `AdminClientsPage.js`, `AdminPlanProductsPage.js`,
`AdminClientWorkspace.js`, `AdminTrashPage.js`, `AdminDashboard.js` (Recent Clients).
**Changing it affects all six — re-test all six.**

- **The component owns moving focus between rows** (ArrowUp/ArrowDown) and auto-focuses the first
  row once after the initial load. It does this via `React.cloneElement` on each
  `renderRow(item, index)` result. A row becomes a navigation target only if its root has
  `tabIndex={0}` or is a `<button>` — non-interactive rows (group headers, Trash's plain rows)
  are skipped automatically.
- **A `<button>` row needs no `onKeyDown` at all.** `AdminClientsPage.js` and
  `AdminDashboard.js` render each row as a `<button>`, so Enter and Space activate it natively
  and the page adds no key handling whatsoever. Reach for a handler only when the row is a
  `<div role="button" tabIndex={0}>` (because it contains its own buttons, as in
  `AdminLeadsPage.js` and `AdminClientWorkspace.js`) or when the row needs a key beyond Enter,
  such as Delete. Prefer the `<button>` row: less code, and Windows behaviour for free.
- **A `<div role="button">` row must check `e.target !== e.currentTarget` first.** A keydown on
  a button inside the row bubbles to the row handler, and `preventDefault()` there cancels the
  inner button's native click — so its action never runs. See `AdminLeadsPage.js`'s row.
- **The page owns what a row does** — Enter-to-open and Delete-to-act live in the page's own row
  `onKeyDown`, because only the page knows its functions and which rows even support them.
- **Auto-focus keys off `loading`, never `items`** — otherwise a live-filtering search box above
  the list loses focus to row 1 on every keystroke.
- **In-bounds moves call `preventDefault()` AND `stopPropagation()`; edge moves do neither.**
  This is the one-gesture-one-owner rule. `preventDefault()` alone does not stop bubbling, and
  without `stopPropagation()` an ancestor arrow handler moved focus a second time on the same
  keypress — every other row appeared to be skipped. At the first/last row the key must still
  bubble, because that is how the climb into the tab strip works.
- **Delete-to-delete is opt-in per page.** Only where the delete is a single lightweight confirm
  (Leads' "Move to Trash"). Not on `AdminPlanProductsPage.js` (its delete has an archive/hard
  toggle and a retype-the-name confirm).

## Rows that contain action buttons — `AdminClientWorkspace.js` Projects/Plans

The Windows list-view model: the row is the only keyboard stop, buttons inside it are not.

- **One action per row, chosen by state.** `orderVisibility !== "cancelled"` → Cancel only.
  `orderVisibility === "cancelled"` → Delete only. `orderVisibility` is what
  `cancelProjectOrder.js` writes, so "cancelled" means genuinely cancelled — `payment-rejected`
  is **not** cancelled. Do not reuse `isRejectedOrder()` here; it groups rejected with cancelled
  for sort ranking, which is a different question.
- **Selection is row focus.** The row carries `group`; each button is `opacity-0` +
  `group-hover:opacity-100 group-focus:opacity-100 focus:opacity-100`, plus
  `disabled:opacity-100` so an in-flight spinner stays visible if focus moves away.
- **The `Delete` key runs whichever single action the row is offering** — Cancel while running,
  the real delete once cancelled.
- **Keeping focus off the buttons needs two things, both required:** `tabIndex={-1}`, and
  `onMouseDown={(e) => e.preventDefault()}`. The first stops keyboard focus; only the second
  stops the browser's native focus-on-click.
- **`INTERACTIVE_SELECTOR` must exclude `tabindex="-1"` on the button clause too.** A selector
  list ORs its clauses, so `button:not(:disabled)` alone still matched a `tabIndex={-1}` button.
  It is now `button:not(:disabled):not([tabindex="-1"])`.
- **A wrapper row component must forward `tabIndex`.** `AdminWorkspaceList` decides navigability
  by reading `row.props.tabIndex === 0`; if the component drops the prop and hardcodes its own,
  the check passes on something that has no effect.

## Tabs — `components/admin/AdminWorkspaceTabs.js`

Standard ARIA Tabs with roving `tabIndex` (active tab `0`, rest `-1`, so Tab enters/exits the
strip as one stop). Used by `AdminClientWorkspace.js` (8 tabs) and `AdminPlanProductsPage.js` (2).

- **ArrowRight/ArrowLeft** move focus + selection, wrapping at the ends. One delegated handler on
  the `tablist`, not per-tab handlers.
- **Selecting a tab moves focus and switches `activeTab` in the same keystroke** (ARIA automatic
  activation), matching what click already does.
- **ArrowDown/Enter on a tab jumps into its content** via `onEnterContent`, wired to
  `focusFirstInteractiveElement(contentRef.current)`.
- **A tab with no interactive content** (Overview) needs one manual `tabIndex={0}` inside it so
  the handoff lands somewhere.
- **ArrowUp/ArrowDown inside a tab's content** walks one flat, DOM-ordered sequence of every
  interactive element (`getInteractiveElements`), and at index 0 focuses the tab strip. The tab
  strip is reachable only this way or by mouse — roving `tabIndex` means Tab cannot get there.
- **Deliberate exception:** an open project/plan's checkpoint list (`WorkspaceDetailSubpage`) runs
  its own checkbox multi-select with Shift-range-select and **clamps** Up/Down at its edges
  instead of bubbling, so an in-progress range-select never loses focus. ArrowUp from inside it
  does not climb to the tab strip — back out first. Do not "fix" this.

**Not yet wired:** `AdminPlanProductsPage.js` — see "Still open" at the end.

## Focus zones — `AdminLayout.js` (`hooks/useSidebarFocusZones.js`)

Implements the Ctrl+arrow rows in the key map. Ctrl+← goes to the active route's link (else the
first); Ctrl+→ returns to `<main>` (`tabIndex={-1}`).

- Desktop-only (`min-width: 1024px`, matching the sidebar's own breakpoint).
- Skipped while typing (input/textarea/contenteditable) and while a `[role="dialog"]` is open.
- `sidebarContent` renders into both the desktop `<aside>` and the mobile drawer, so nav refs
  are filtered to `offsetParent !== null` before use.

## Non-form pages

A page with no fields still needs the same rigor: its list goes through `AdminWorkspaceList`, and
standalone buttons get a focus ring (`focus:ring-4 focus:ring-emerald-100`, or
`focus:ring-emerald-400/30` on dark sections). Ctrl+Left/Right works everywhere for free.

## `KeyboardSelect` — `components/KeyboardSelect.js`

Use instead of native `<select>` in any chain. Not `PackageSelect.js` (different contract).

Props: `value`, `onChange(value)`, `options: [{value,label}]`, `placeholder`, `onConfirm()`,
`className` (appended). Closed: Enter/Space/ArrowDown opens. Open: arrows move the highlight,
Enter/Space confirms, Esc/click-outside closes unchanged, Tab closes and moves on. Forwards its
trigger `<button>` via `ref` — `.focus()` it like any field ref.

## Examples to copy

- Modal + branching chain + typeahead → Add Lead modal.
- Full-page form + file input + pre-selected dropdown → Lead Detail Add Follow-up.
- Inline edit form with a kept Cancel button → Lead Detail Edit Follow-up.
- List rows with per-row actions → `AdminClientWorkspace.js` Projects/Plans.

## Applying this to another page

### Does this page need URL sub-state?

Two questions, both must be yes:

1. **Does the page show something the user would call "a different screen" without changing the
   URL?** An opened record, a tab, a detail panel replacing a list.
2. **Would the user expect Back, refresh, or a shared link to land there?** If no — a dropdown
   being open, a hovered row, a half-typed field, a confirmation modal — it is component state.
   Leave it in `useState`.

**Already checked, so you do not have to:**

- `AdminPlanProductsPage.js` — **needs it.** `activeTab` is `useState("active")` (line 72)
  driving an Active/Retired tab strip. The only admin page left with a real sub-view in
  component state. Convert when asked.
- `AdminLeadDetailPage.js`, `AdminTrashPage.js`, `AdminPaymentRecordDetail.js` — **correct as
  they are.** Their `useState(null)` values are modals, inline edit forms and fetched records,
  not screens. A high `useState` count is not the signal; what the state *does* is.

### The steps

1. **List every piece of state that answers "which screen am I on".** The ones that reset each
   other are one decision, not several — here it was four (`activeTab`, `activeProjectId`,
   `activePlanId`, `activePaymentGroupId`).
2. **Read them from `searchParams`, not `useState`.** Fetched objects stay in state — they are
   data, not navigation.
3. **One helper writes the params**, always the complete set, carrying `location.state` forward.
4. **Opening pushes. Closing uses `navigate(-1)`. Tab switches and cleanup replace.**
5. **Check that every value the subpage renders has exactly one writer** before testing
   navigation. Here that meant: the URL owns which record is open, the fetch effect owns its
   data (clearing it both before a load and when the id goes away), and nothing else touches
   either. Two owners makes a subpage blink or show stale data, and it looks like a navigation
   bug when it is not.
6. **Test it in the browser.** A URL-only model will pass while the page is visibly broken,
   because that kind of fault lives in React effect re-runs, not in the URL.

## Browser navigation — Alt+Left / Alt+Right (`AdminClientWorkspace.js`)

Inside an open project, plan or payment group: **Alt+Left** closes it and lands on the tab it
was opened from. **Alt+Right** reopens it. The header's ← button does the same as Alt+Left.
Refreshing or sharing a subpage URL works.

Neither key is intercepted. They are browser history gestures, and they work because the page
keeps "which screen am I on" in the URL instead of in `useState`:

```
/admin-panel/clients/<id>?tab=projects
/admin-panel/clients/<id>?tab=projects&project=<pid>
/admin-panel/clients/<id>?tab=plans&plan=<pid>
/admin-panel/clients/<id>?tab=payments&group=<key>
/admin-panel/clients/<id>?tab=deleted-projects&group=<key>
```

- `activeTab`, `activeProjectId`, `activePlanId`, `activePaymentGroupId` are read from
  `searchParams`. `setWorkspaceParams()` is the only thing that writes them, always writing the
  complete set and carrying `location.state` forward (it holds the return target Back needs).
- **Opening pushes** a history entry. **Switching tabs replaces** — one entry per tab visited
  would make Alt+Left walk back through all of them.
- **The Back button calls `navigate(-1)`**, guarded by `window.history.state.idx` so a direct
  load or refresh (nothing behind it) drops the param instead of leaving the app.
- **A payment group opens from two tabs** (Payments and Deleted Projects), so the open handler
  keeps the current tab rather than assuming Payments.
- **Deleting is not navigating.** `closeDeletedProject` / `closeDeletedPlan` use `replace`, so
  no history entry is left pointing at a deleted record.

**Two things that silently break this — both were hit here:**

1. **Do not close a layer by writing the "closed" URL.** It looks the same on screen but adds a
   third history entry instead of stepping back: Alt+Right dies, and Alt+Left reopens the
   project just closed. Use `navigate(-1)`.
2. **Do not count your own pushes in a ref** to decide whether Back can step back. Alt+Left
   closes a subpage without running any handler, so the count drifts. Read
   `window.history.state.idx`.

## Still open

- **Esc → `handleBack`.** Esc already means "close the topmost layer" (rule #9) and an open
  project subpage is exactly that. `handleBack` already walks the layers correctly. Must be
  guarded so an open modal consumes Esc first. The workspace's two existing `Escape` listeners
  (the cancel and delete modals) are the precedent.
- **`AdminPlanProductsPage.js` tab content.** It renders `AdminWorkspaceTabs` but passes no
  `onEnterContent` and has no content-level arrow handler, so ArrowDown/Enter cannot enter a
  tab's content. Follow `AdminClientWorkspace.js`.

## Verification

ESLint clean on changed files. No `npm run build` unless asked. No automated tests — Tab, Enter,
Esc and arrows in-browser before calling anything done.

**For list-row work:** test Projects **and** Plans (they share a component but differ in whether
a `headerAction` exists, which shifts every index in the flat sequence), and re-test the other
five pages that use `AdminWorkspaceList`.

**If the console references code you cannot find in the repo, it is a stale bundle.** Restart the
dev server and hard-reload before reasoning about any observed behaviour.

**Tailwind:** `package.json` declares v4, but compilation goes through `react-scripts`' nested
v3.4.17. `group-focus:`/`group-hover:` exist in v3, so the reveal pattern is safe — but check
which version is actually compiling before blaming a variant.
