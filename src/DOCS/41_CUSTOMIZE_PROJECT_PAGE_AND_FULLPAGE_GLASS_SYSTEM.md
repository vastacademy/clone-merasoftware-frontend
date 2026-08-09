# Customize-Project Page + Full-Page Glass "Documentation" Layout System

## Purpose

This doc records three individually-approved changes made this session, all UI-only (no backend wiring):

1. **Empty-state "Start New Project" buttons re-routed** from the old public site (`/home`) to the portal's `/start-new-project` entry.
2. **`StartNewWebsiteBuild.js` now passes a derived primary-project category** into the customize route.
3. **`StartNewWebsiteCustomize.js` rebuilt** from a "coming soon" placeholder into a real, form-style **Customize Your Project** page — and, through several rounds, its layout became the new **full-page glass "documentation" layout system** the user explicitly wants reused on future pages.

Read this before touching `StartNewWebsiteCustomize.js`, `StartNewWebsiteBuild.js`'s customize navigation, `CustomerDashboard.js`/`OrderPage.js`/`ProjectsAndPlans.js`'s empty-state CTAs, or before building any new customer-portal full-page form/detail page (use the layout system in Section 4).

---

## 1. Empty-state "Start New Project" buttons → `/start-new-project`

**Problem (evidence)**: a portal-wide scan found exactly three customer-portal buttons still pointing at the old public site `/home` — all conditional empty-state CTAs (not dynamically mapped, just conditionally rendered single buttons). Everything else (sidebar `DashboardLayout.js`, `Footer.js`, dashboard `primaryAction`, mobile bottom-nav) already pointed at `/start-new-project` correctly.

**Before → After** (navigation target only; markup/text unchanged):

| File | Line | Before | After |
| --- | --- | --- | --- |
| `CustomerDashboard.js` | empty-state "Start New Project" | `to="/home"` | `to="/start-new-project"` |
| `ProjectsAndPlans.js` | "No items found" → "Start New Project" | `to="/home"` | `to="/start-new-project"` |
| `OrderPage.js` | empty-state "Browse Services" | `navigate('/home')` | `navigate('/start-new-project')` |

**Left untouched by design** (branding/nav/system `/home` — must stay): `SharedHeader.js`'s public-nav "Home" link, its logout redirect, its brand-logo link; and `RoleBasedHome.js`'s root `/` → `/home` redirect. These are not "Start New Project" buttons.

---

## 2. Flow derives the primary project category and passes it to customize

`StartNewWebsiteBuild.js` — the Typeform-style New Website flow — only reaches the customize path in the **5k-30k budget branch** (`['budget','ownership','path']`). When the user picks the `path === 'customize'` option, the navigation now derives the primary project category from the `ownership` answer and passes it in `location.state`:

```js
const projectCategory =
  nextAnswers.ownership === 'self_managed' ? 'dynamic_websites' : 'standard_websites';
navigate('/start-new-project/build/new_website/customize', {
  state: { budget: nextAnswers.budget, ownership: nextAnswers.ownership, projectCategory },
});
```

**Decision rule (confirmed with the user):** in the New Website flow, `self_managed` ("I'll manage content myself") ⇒ **dynamic website**; `we_maintain` ("MeraSoftware will maintain it") ⇒ **static website**. (30k+ ⇒ dynamic per the user, but that branch does not reach customize yet — see "Phased scope" below.) Only this one navigate block changed; the rest of the flow is untouched.

---

## 3. `StartNewWebsiteCustomize.js` — the Customize Your Project page

Placeholder replaced with a real, editable, form-style page. **Scope is strictly UI + read-only DB fetch — no backend wiring.**

### What it does

- **Editable requirement form** — four glass single-select dropdowns, all prefilled from `location.state` but freely changeable by the user:
  - **Primary project** (Static / Dynamic / Cloud / Mobile App — the four real category enum values `standard_websites` / `dynamic_websites` / `cloud_software_development` / `app_development`)
  - **Budget range**, **Content management**, **Payment option**
- **Capabilities (features) multi-select** — a glass multi-select dropdown (checkbox list + removable chips), populated from the DB:
  - Fetch: `SummaryApi.allProduct` (`GET /api/get-product`), `dataResponse.data`.
  - Filter: `category === 'feature_upgrades'` && `!isHidden` && `Array.isArray(compatibleWith)` && `compatibleWith.includes(projectCategory)`.
  - **No prices are shown on features** (by explicit user instruction — pricing is only an estimate summary, never per-feature).
- **Live refresh**: changing **Primary project** re-runs the fetch/filter and **clears the previous feature selection** (a `useEffect` keyed on `projectCategory`).
- **Estimated total** — sum of selected features' `sellingPrice`, shown with a permanent amber disclaimer: *"This is an estimate… not the final price."* (Base project price is not included yet — Phase 1 UI-only.)
- **Coupon / promo code** — input + Apply (UI-only stub; no `validateCoupon` call).
- **Submit** — one button labelled **"Create Project"** when payment option is `decide_later`, else **"Proceed to Payment"** — a dummy `onClick={() => {}}` stub. No order is created, no payment runs.

### DB evidence (read-only audit, this session)

A temporary read-only script confirmed **8 real `feature_upgrades` products** exist. `compatibleWith` is a `[String]` array; distinct values found: `dynamic_websites`, `standard_websites`, `cloud_software_development`, `app_development`, plus two legacy/inconsistent values `web_applications`, `mobile_apps` (not in the category enum — irrelevant to Phase 1). The `compatibleWith.includes(projectCategory)` filter returns real features for both `dynamic_websites` (4) and `standard_websites` (5), so Phase 1 has live data. The old `ProductDetails.js` used the same `compatibleWith` field for its "Customize Your Plan" filter, so this is the established pattern.

### Custom glass dropdowns (not react-select)

`react-select` exists in the repo but only on admin/upload (light-themed) pages; its default styling fights the dark glass theme. Two small in-file components were written instead — `SelectDropdown` (single) and `MultiSelectDropdown` (multi, with chips) — both close on outside-click and are styled to match the portal glass theme. No new dependency.

### Phased scope (explicitly deferred)

- Only the **5k-30k branch** (dynamic/static via `ownership`) reaches customize today. **30k+ budget** (⇒ dynamic) does not reach customize yet — deferred, to be wired in a later session.
- Cloud Software / Mobile App are selectable in the customize dropdown (and filter features correctly) but the flow itself never routes to them yet (those are the "Coming Soon" cards on `startproject.js`).
- No backend: coupon validation, order creation, and payment are all stubs.

---

## 4. Full-page glass "documentation" layout system (REUSE THIS)

The customize page's final layout is the **user-approved standard for future customer-portal full-page form/detail pages**. It went through three tries; the user's own words guided each step:

1. Multiple separate glass cards → *"jeyada boxes unprofessional lagta hai"* → rejected.
2. One bounding box with an inner grid → clean, but the box's `overflow-hidden` (needed for the top glass sheen) **clipped the open dropdowns** → rejected.
3. **Full-page glass sheet, no bounding box, `overflow-visible`** → approved (*"yeh perfect hai"*).

### The approved pattern

- **Open, centered header outside any panel**: an `absolute left-0` Back button (the site-standard detail-page Back pill — `rounded-2xl border-white/15 bg-white/10 px-5 py-3 text-lg font-semibold text-white backdrop-blur-md`, byte-identical to `ProjectDetails.js`/`PlanDetails.js`/`OrderDetailPage.js`/`InvoiceDetailPage.js`/`TicketDetail.js`) and a truly-centered `<h1>` title + subtitle.
- **One full-page soft glass sheet behind all content**: `rounded-[2rem] bg-white/[0.06] p-6 backdrop-blur-2xl sm:p-8 lg:p-10`. Crucially: **no heavy border, no shadow, and NO `overflow-hidden`** — this is what keeps it from reading as a hard "box" and lets absolutely-positioned dropdowns/popovers escape without being clipped.
- **Responsive documentation grid inside the sheet**: `grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14`. Desktop = two columns (main content left, a sticky summary/action rail right, `lg:sticky lg:top-6`), split by a light `lg:border-l lg:border-white/10 lg:pl-14` divider. Mobile = single column, everything stacks top-to-bottom.
- **Sections, not sub-boxes**: each block is a plain `<section>` separated by `border-t border-white/10 pt-10` dividers, introduced by a small emerald eyebrow label (`text-sm font-semibold uppercase tracking-wide text-emerald-300/90`). This gives the "documentation" feel without nested cards.
- Background stays the standard `BG.png` with a `bg-slate-950/40` overlay, inside `DashboardLayout`.

**When to use it:** any new customer-portal page that is a full-page form or detail view. Prefer this over the older single-bounding-card pattern whenever the page contains open dropdowns/popovers (which the card's `overflow-hidden` would clip) or whenever the user asks for the clean "documentation" look. The older dark-glass bounding-card (`ProjectDetails.js`'s three-column card) remains valid for pages without escaping popovers, but this frameless full-page-glass sheet is the new default for form-style pages.

### Rejected alternatives (kept as reference, not in code)

- **Option A** (single frameless glass panel) — not tried after C was approved.
- **Option B** (per-column glass zones instead of one full sheet) — implemented, then superseded by C at the user's request; C was preferred. No B/A backups were kept (only the pre-session originals remain).

---

## Files touched

- **Changed**: `frontend/src/pages/StartNewWebsiteCustomize.js` (placeholder → full customize page + full-page glass layout), `frontend/src/pages/StartNewWebsiteBuild.js` (customize navigate now passes `projectCategory`), `frontend/src/pages/CustomerDashboard.js` / `frontend/src/pages/OrderPage.js` / `frontend/src/pages/ProjectsAndPlans.js` (empty-state CTA target `/home` → `/start-new-project`).
- **Backups**: `frontend/src/pages/backup_customize_ui_20260809/` holds the pre-session originals of `StartNewWebsiteBuild.js` and `StartNewWebsiteCustomize.js`.
- **No backend files changed.** A temporary read-only audit script was created in `backend/scripts/` and deleted after use.
