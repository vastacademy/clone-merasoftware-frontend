# Projects and Plans — Wrapper Removal + TicketsList-Style Banding

**Session date**: 2026-07-31
**Scope**: UI-only rework of `frontend/src/pages/ProjectsAndPlans.js` and a backward-compatible addition to the shared `frontend/src/components/CustomerWorkspaceTabs.js`. No data/logic/API change anywhere in this session.
**Read this before touching**: `frontend/src/pages/ProjectsAndPlans.js`, `frontend/src/components/CustomerWorkspaceTabs.js` (also used by `OrderPage.js`, `StartNewProject.js`, `UserInvoices.js` — see the `variant` prop note below).

## 1. Why

User asked for UI consistency work across the customer portal, starting with `ProjectsAndPlans.js`: match the "no bounding wrapper" open-layout style already used on `frontend/src/pages/ContactSupport.js`, `frontend/src/pages/Profile.js`, `frontend/src/pages/startproject.js`, and `frontend/src/chess/GamesListPage.js` (established in `29_STARTPROJECT_INTAKE_PAGE_AND_PORTAL_GLASSMORPHISM.md`), and to match `TicketsList.js`'s specific header/filter/table banding pattern for the list area.

## 2. Before

`ProjectsAndPlans.js` originally had all page content — dark-glass banner (title, eyebrow badge, Total/Active counters, Refresh button) + `CustomerWorkspaceTabs` filter strip + light-glass table — joined inside **one single outer `<section className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] ... bg-slate-950/10">`** wrapper, with the banner `rounded-t-[2rem]` and the table `rounded-b-[2rem]` (a single seamless card, banner on top, table below, no gap).

## 3. Changes made (chronological, each user-approved before coding)

### 3.1 First pass — split into free-floating cards (superseded by 3.2)
Removed the single outer bounding `<section>`; made the banner and the (tabs+table) into two independently-floating glass cards with a `mt-6` gap between them. User said this "wasn't right" and pointed to `startproject.js` as the actual reference — nothing in that page has a bounding banner card at all.

### 3.2 Full open-layout match (`startproject.js` / `GamesListPage.js` reference)
Re-verified by reading `GamesListPage.js` and `ContactSupport.js` directly (not assumed): neither page wraps its heading in a card. The heading area is just a small eyebrow pill badge + plain `<h1>` + plain `<p>`, centered, sitting directly on the page background — no border/background box around it at all. Applied the same to `ProjectsAndPlans.js`: the banner-card was removed entirely and replaced with a plain centered heading block. Outer page wrapper changed to match the `startproject.js` pattern exactly: `relative min-h-[calc(100vh-4rem)] overflow-hidden ... px-4 py-10` + a `bg-slate-950/40` overlay div, replacing the old `min-h-full px-4 py-5` wrapper.

Per explicit follow-up instruction, Tabs and Table were also separated into 3 free-floating pieces (heading block, tabs strip, table card) — this was itself later superseded by 3.3.

### 3.3 TicketsList-style 2-tier banding (current, final)
User showed a screenshot of `TicketsList.js` (the "My Support Tickets" card on `ContactSupport.js`) and asked for the same treatment: one single card containing (a) a top header row with the section title + filter control in the same row, and (b) the table below it with a visually distinct lighter shade separating it from the header row — not 3 separate floating pieces.

Implemented by merging the Tabs and Table back into **one single dark-glass card** (`rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl backdrop-saturate-150`, same pattern as `TicketsList.js`'s outer card), containing:
- A header row (`border-b border-white/15`): "Projects and Plans" title (with `Layers3` icon, matching `TicketsList.js`'s `Ticket` icon + title pattern) and the `CustomerWorkspaceTabs` filter, in the same row.
- A table-header row directly below, given `bg-white/5` so it reads as a distinct lighter band under the title row (matching the screenshot's contrast between the dark title bar and the slightly lighter table-header row).
- Table body/empty-state, all recolored from the previous light-glass (`bg-white/55`, black text) scheme to dark-glass-appropriate white/slate text, since the card is now dark (`bg-white/10`), not light.

### 3.4 Badge removed, counters/refresh moved into the card, then centered
- Removed the small eyebrow pill badge above the `<h1>` (user: "top par badge hatao") — only the plain heading and subtext remain in the open heading block above the card.
- Moved `Total: {count}`, `Active: {count}`, and the Refresh button out of the (now-removed) open heading block and into the card's header row (user confirmed "banner area" = the card's top header row, not the open heading block above it).
- Final adjustment: rather than giving Total/Active/Refresh their own extra row inside the card (which increased the card's height), they were folded into the same title+tabs row, using `flex-wrap` so they wrap and center themselves within that one row when space is tight — the card gains no extra row/height for these elements.

## 4. `CustomerWorkspaceTabs.js` — new `variant="inline"` prop (backward-compatible)

**File**: `frontend/src/components/CustomerWorkspaceTabs.js`. This component is shared by `ProjectsAndPlans.js`, `OrderPage.js`, `StartNewProject.js`, `UserInvoices.js`.

**Before**: the component always rendered its own `border-b border-white/40 bg-white/40 ... backdrop-blur-xl` wrapper div around the tab buttons, with inactive-tab text hardcoded to `text-black` (designed for the light-glass table-header context it was originally built for).

**After**: added an optional `variant` prop, default `'default'` (unchanged — the 3 other pages that don't pass this prop get byte-for-byte the same markup/classes as before). When `variant="inline"` is passed (used only by `ProjectsAndPlans.js` now), the wrapper renders with no background/border classes at all (so it sits transparently inside a parent dark-glass row) and inactive-tab text becomes `text-slate-300` (hover `text-white`) instead of `text-black`, since it now sits on a dark background instead of a light one. Active-tab styling (`border-emerald-500 text-emerald-700`) is unchanged in both variants.

**Also fixed in this file** (separate small fix, same session): the tab-scroll container (`role="tablist"`) had `overflow-x-auto` unconditionally, which reserved/showed a horizontal scrollbar even on pages where the 2-4 tab labels never actually overflow (`ProjectsAndPlans.js`, `OrderPage.js`, `StartNewProject.js`). Root-caused by checking each of the 4 consumers' actual tab counts — only `UserInvoices.js` has enough tabs (5: all/unpaid/paid/overdue/cancelled) to ever genuinely overflow on narrow screens, so removing `overflow-x-auto` outright would have been wrong. Fixed instead by keeping `overflow-x-auto` (so the scroll/swipe behavior still works when content genuinely overflows) but hiding the scrollbar track visually via `[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden`. Applies to all 4 consuming pages identically.

## 5. Current end state of `ProjectsAndPlans.js`

```
<DashboardLayout>
  <div bg-page (BG.png, min-h-[calc(100vh-4rem)], startproject.js pattern)>
    <div overlay bg-slate-950/40 />
    <div max-w-7xl>
      <div text-center>            <- plain, no card: <h1> + <p> only, no badge
      <div dark-glass card>        <- TicketsList.js pattern
        <row: title + tabs(inline) + Total/Active/Refresh, all wrapped/centered>
        <table-header row, bg-white/5>
        <table rows | loading | empty-state, all white/slate text>
      </div>
    </div>
  </div>
</DashboardLayout>
```

## 6. Explicitly not done / out of scope this session

- `CustomerDashboard.js`, `OrderPage.js` still use their older contained/boxed-section structure (separate banner card + separate metrics/table sections) — user has said Dashboard will get the same treatment next, not yet started.
- No backend/data/API change.
- `npm run build` not run, per standing user instruction.
