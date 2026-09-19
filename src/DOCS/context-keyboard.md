# Keyboard Optimization — Pattern Reference

Current-state only. Converted so far: Add Lead modal (`pages/AdminLeadsPage.js`), Lead Detail's
Add Follow-up + Edit Follow-up forms (`pages/AdminLeadDetailPage.js`). Everything else in the
app is still mouse-only — convert the same way when asked.

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
8. Update this file only if the new form needs a rule not already listed above.

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
