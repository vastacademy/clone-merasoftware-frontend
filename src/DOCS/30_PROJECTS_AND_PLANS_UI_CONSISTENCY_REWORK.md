# Customer Portal UI Consistency — Wrapper Removal + TicketsList-Style Banding (ProjectsAndPlans, then Dashboard)

**Session date**: 2026-07-31
**Scope**: UI-only rework of `frontend/src/pages/ProjectsAndPlans.js` and `frontend/src/pages/CustomerDashboard.js`, a backward-compatible addition to the shared `frontend/src/components/CustomerWorkspaceTabs.js`, a sidebar nav-order swap in `frontend/src/components/DashboardLayout.js`, and one dead-code/white-flash fix on `CustomerDashboard.js`. No backend/data/API change anywhere in this session.
**Read this before touching**: `frontend/src/pages/ProjectsAndPlans.js`, `frontend/src/pages/CustomerDashboard.js`, `frontend/src/components/CustomerWorkspaceTabs.js` (also used by `OrderPage.js`, `StartNewProject.js`, `UserInvoices.js` — see the `variant` prop note below), `frontend/src/components/DashboardLayout.js`.

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

## 6. `CustomerDashboard.js` — same pattern applied (this session, after `ProjectsAndPlans.js`)

**File**: `frontend/src/pages/CustomerDashboard.js`.

### 6.1 Before
Three separate boxed `<section>`s inside `mx-auto max-w-7xl`: (1) a dark-glass banner `<section>` with an eyebrow badge ("Live overview"), `<h1>What is active now</h1>`, subtext, two duplicate mini-stat cards ("Current work", "Wallet" — showing the same data as cards in section 2), a primary-action button (`Track Project` / `Start New Project` / etc., from the pre-existing `primaryAction` logic) and a Refresh button; (2) a `<section>` grid of 4 `MetricCard`s (Live project / Wallet balance / Completed items / Open alerts); (3) a light-glass table `<section>` ("Recent projects & plans", `bg-white/55`, black text, `index % 2` alternating row shading, its own "View all orders" link).

### 6.2 Changes (each step user-approved before coding)
1. **Open heading block** (matching `ProjectsAndPlans.js`'s Section 3.2 pattern): eyebrow badge removed, `<h1>` text changed from "What is active now" to **"Dashboard"** (explicit user request), only heading + subtext remain, no bounding card.
2. **Duplicate mini-cards removed**: the banner's "Current work"/"Wallet" mini-cards were dropped entirely (user-confirmed, not assumed) since they duplicated the "Live project"/"Wallet balance" `MetricCard`s below — content/data scope change, not purely visual.
3. **4 `MetricCard`s ungrouped**: their wrapping `<section>` removed, now sit in an open `grid` directly on the page background (no bounding card), matching the "MetricCards float free" decision made for this page specifically (`ProjectsAndPlans.js` has no equivalent grid, so this was a new decision, confirmed via `AskUserQuestion` before coding).
4. **Table converted to the `TicketsList.js`-style single dark-glass card**, identical structure to `ProjectsAndPlans.js`'s Section 3.3: header row (`Layers3` icon + "Recent projects & plans" title, `border-b border-white/15`), table-header row `bg-white/5`, body/empty-state recolored white/slate.
5. **"Live project" `MetricCard` made dynamic/clickable** (user: make it behave like the old "Start New Project" button — if there's an active project/plan, clicking it should navigate there; if not, it should become "Start New Project"). Implemented by adding an optional `to` prop to the shared `MetricCard` component (`CustomerDashboard.js`'s internal component, not the shared `frontend/src/components/` one) — when `to` is passed the card renders as a `<Link>` (whole card clickable, trailing icon becomes `ArrowRight` instead of the metric's icon) reusing the pre-existing `primaryAction` value (`primaryAction.to`/`primaryAction.label`, unchanged logic — already correctly branched between "Track Project" / "Request Website Update" / "N Active Services" / "Start New Project"). The other 3 `MetricCard`s don't pass `to`, so they render exactly as before (plain `<div>`).
6. **Standalone action button + Refresh removed from the heading block** (superseded by #5's dynamic card and by #7 below) — the heading block now only has `<h1>` + subtext, nothing else.
7. **Refresh moved into the table-card's header row**, alongside "View all orders" (both wrapped in the same row, `flex-wrap`), same placement pattern as `ProjectsAndPlans.js`'s Total/Active/Refresh row.
8. **Row alternating shading restored on both pages** (`CustomerDashboard.js` and `ProjectsAndPlans.js`): the dark-glass conversion had dropped the earlier `index % 2` alternating-background classes on table rows, leaving all rows visually identical except on hover (user flagged this with a screenshot showing `TicketsList.js`'s hover-lighter-row as the desired look, but without hover). Re-added `index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.06]'` to both files' row buttons so alternating rows are visible without needing hover; hover state itself brightened slightly (`hover:bg-white/[0.06]` → `hover:bg-white/[0.1]`) so it still reads as an extra state above the shaded rows.
9. **Sidebar nav swap** (`frontend/src/components/DashboardLayout.js`, shared, affects entire customer portal): `Wallet` moved from the primary `quickLinks` group into the `secondaryLinks` ("More") group; `Orders` moved from `secondaryLinks` into `quickLinks` in Wallet's old slot. Final `quickLinks` order: Dashboard, Projects and Plans, Start New Project, Orders. Final `secondaryLinks` order: Wallet, Games, Profile, Support.

### 6.3 White-screen-on-load root cause (found and fixed)
User reported a white/light flash specifically on `/dashboard` (not on `/projects-and-plans` or other pages) before content appears. Root-caused by direct comparison, not assumed: `CustomerDashboard.js` had its own **page-level `if (loading) return (...)`** early-return (separate from `DashboardLayout.js`'s shared `!currentUser` auth-loading fallback, which affects all pages equally). That dashboard-only block rendered a **hardcoded light-theme skeleton** — `bg-[radial-gradient(...#f8fafc...#eef2ff...)]` page background plus `bg-white/80` pulse blocks — left over from before the portal-wide dark-glass redesign (`29_STARTPROJECT_INTAKE_PAGE_AND_PORTAL_GLASSMORPHISM.md`) and never updated. `ProjectsAndPlans.js` has no equivalent page-level loading branch — its `loading` flag only swaps a small inline text string inside the already-dark table card — which is why the flash was Dashboard-specific.

**Fix** (explicit user instruction: "hata do", after being told the tradeoff — removing it entirely is crash-safe since `orders` initializes as `[]` so all derived `useMemo` values degrade gracefully to empty/zero, but the real page will briefly show genuine empty-state values like "0" / "No active project running" until the fetch resolves, rather than a generic skeleton): the entire `if (loading) {...}` block was deleted, and the now-unused `loading`/`setLoading` state (and its `setLoading(true/false)` calls inside `fetchDashboardData`) were also removed as dead code. Confirmed working by the user ("ab perfect hai koi speed issue nahi hai") — the underlying fetch time didn't change, only the now-consistent dark-theme rendering while data loads.

## 7. Explicitly not done / out of scope this session

- `OrderPage.js` still uses its older contained/boxed-section structure — user's next request is to bring it to the same `ProjectsAndPlans.js`/`CustomerDashboard.js` pattern (see the entry after this one in `README.md`, once written).
- No backend/data/API change anywhere in this doc's scope.
- `npm run build` not run, per standing user instruction.
