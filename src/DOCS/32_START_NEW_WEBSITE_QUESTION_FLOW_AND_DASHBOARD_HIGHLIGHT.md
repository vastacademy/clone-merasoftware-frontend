# New Website Question-Flow (Step 2 of the Catalog-to-Custom Pivot), `startproject.js` Card Reduction + Coming Soon Modal, Dashboard Highlight Card, and the Plan-vs-Project Routing Root-Cause Fix

**Session date**: 2026-08-01
**Scope**: UI-only for Sections 1-5 (no backend changes, no `npm run build` run, per standing instruction). Builds the first real "Step 2" screen of the pivot described in `29_STARTPROJECT_INTAKE_PAGE_AND_PORTAL_GLASSMORPHISM.md` Section 1 (customer picks intent -> Google-Forms-style multi-step form), scoped to the "New Website Project" card only. Also reduces `startproject.js` from 6 cards to 3, adds a "Coming Soon" modal for the two not-yet-built cards, highlights `CustomerDashboard.js`'s first metric card. Section 6 records a full root-cause investigation into a real plan-vs-project routing bug; Section 7 (same session, later pass, still frontend-only) **implements the agreed 3-layer fix** — read both before touching any of the files they name.
**Read this before touching**: `frontend/src/pages/startproject.js`, `frontend/src/pages/StartNewWebsiteBuild.js` (new), `frontend/src/pages/StartNewWebsiteCustomize.js` (new), `frontend/src/routes/customerRoutes.js`, `frontend/src/pages/CustomerDashboard.js`, `frontend/src/pages/PlanDetails.js`, `frontend/src/pages/ProjectDetails.js`, `frontend/src/pages/ProjectsAndPlans.js`, `frontend/src/pages/OrderPage.js`, `frontend/src/components/PaymentStatusChip.js`, `frontend/src/helpers/orderType.js` (new).
**Read alongside**: `29_STARTPROJECT_INTAKE_PAGE_AND_PORTAL_GLASSMORPHISM.md` (the plan this session's Step 2 work implements), `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md` (first recorded the `ProjectDetails.js`/`PlanDetails.js` routing split this session re-audited and found incomplete), `31_PROJECT_DETAILS_UI_TEMPLATE.md` (the shared visual template both new pages reuse), `27_SERVICE_PLAN_RENAME_AND_LEGACY_MIGRATION.md` (introduced the `service_plan` category this session found was not recognized by any `isPlanItem` check, now fixed in Section 7).

## 1. New file: `frontend/src/pages/StartNewWebsiteBuild.js`

Route: `start-new-project/build/new_website` (new, registered in `customerRoutes.js`, `CustomerProtectedRoute`-wrapped like all sibling routes). Only this one `categoryId` has a real page — the flow is explicitly not generalized to the other cards yet (see Section 2).

A Typeform/Google-Forms-style single-question-at-a-time wizard reusing `startproject.js`'s exact visual grammar (`BG.png` background, dark-glass cards, `fadeSlideUp` entrance, emerald-only action-pill CTAs, open no-wrapper layout, `ProjectDetails.js`-style absolute-left Back button per `31_PROJECT_DETAILS_UI_TEMPLATE.md`). No `framer-motion` exists anywhere in this codebase (confirmed by a background research agent) — step transitions are plain CSS keyframes (`fadeSlideUp` reused, plus two new keyframes `slideOutLeft`/`slideOutRight` for the outgoing question, driven by a short `transitioning` state + `setTimeout`, no new dependency).

### Branching flow (built after several rounds of user correction — final state only, see Section 1a for what changed)

```
Q1 Budget
 ├─ "5,000 - 30,000"      -> Q2 Ownership -> Q3 Path -> outcome
 └─ "30,000 and above"    -> Q2' Website Type -> outcome directly (Q2/Q3 skipped)
```

- **Q1 — Budget** (`budget`): two cards, `range_5k_30k` ("5,000 - 30,000") and `range_30k_plus` ("30,000 and above"). The `flowKeys` array (`['budget','ownership','path']` vs `['budget','websiteType']`) is derived from `answers.budget`, so the progress-dot count and step count differ per branch — this is intentional, not a bug.
- **Q2 — Ownership** (`ownership`, 5k-30k branch only): "I'll manage content myself" (note: "Dynamic website — build cost will be higher") vs "MeraSoftware will maintain it for me" (note: "Simpler website — build cost will be lower").
- **Q3 — Path** (`path`, 5k-30k branch only): "I want to customize my website requirements by myself" (note: "You'll get a form next where you can plan your website yourself") vs "Contact me and plan the project for me" (note: "Our team will understand your requirement and prepare a project quotation for you"). Selecting **customize** navigates to `StartNewWebsiteCustomize.js` (Section 3) carrying `{ budget, ownership }` via `location.state`. Selecting **contact me** goes straight to the confirmation screen (Section 4).
- **Q2' — Website Type** (`websiteType`, 30k+ branch only): 5 cards — Ecommerce Website, Blogging Website, Journal Website, Food Ordering Website (each with an in-card `description`, same visual slot as Q1's budget-card descriptions), plus a 5th **wide card** (`wideLastOption: true`, spans both grid columns via `sm:col-span-2` on the last option only) — "I'm not sure, contact me". Any of the 5 selections goes straight to the confirmation screen; there is no customize path in this branch (by design — the whole point of the 30k+ branch is admin-assisted planning).

### 1a. Correction history on this file (so the reasoning isn't re-derived)

- Q3's option text went through 3 rounds: first `description`-style copy ("Pick your own features..." / "Tell us your requirement...") -> user rejected, wanted a direct question format with card titles phrased as the choice itself ("I want to customize..." / "Contact me and plan...") and a note **below** each card (not inside) explaining the consequence of picking it -> implemented by moving these two options from `description` (renders inside the card) to `note` (renders below the card, `text-lg text-white` after two follow-up font-size/color corrections — was `text-sm text-slate-400`, user wanted it larger and pure white for legibility).
- Q1's ownership-question note text (`note` field on Q2's options) went through the same two font corrections (`text-sm text-slate-400` -> `text-base text-slate-300` -> **not** further escalated, this one stayed at `text-base`; only Q3's and the later Website Type step's option copy got the `text-lg text-white` treatment — check the live file if reusing this pattern, the two note styles are not identical).
- Budget card copy was momentarily changed from "5,000 - 30,000" to "30,000 and below" then reverted back to "5,000 - 30,000" per explicit user correction — final state is the original wording.
- Container width was originally `max-w-4xl` (visibly narrower than the rest of the portal) — corrected to `max-w-6xl` to match `startproject.js` exactly, in both `StartNewWebsiteBuild.js` and `StartNewWebsiteCustomize.js`.
- The Website Type step's 4 real options originally used `note` (below-card) copy; user asked it match "baki cards jaisa" (i.e. Q1's in-card `description` pattern) — moved from `note` to `description` for all 5 options, including the "not sure" card.

## 2. New file: `frontend/src/pages/StartNewWebsiteCustomize.js`

Route: `start-new-project/build/new_website/customize` (new). A minimal placeholder ("Customize flow — coming soon") styled with the same dark-glass shell, displaying the `budget`/`ownership` answers carried via `location.state` (so nothing collected so far is lost once the real customize experience is built). Explicitly **not** wired to the existing catalog `ProjectDetailView.js`/"Add More to Your Project" flow — user's explicit choice, since the whole point of this pivot is to move away from the fixed catalog (see `29_...md` Section 1); building the real customize experience is separate future work.

## 3. Final confirmation/request screen (inside `StartNewWebsiteBuild.js`, no separate route)

Reached from either the 5k-30k branch's "Contact me" path or any Website-Type selection in the 30k+ branch. Renders in-place (`submitted` state, no navigation) as a dark-glass card:

- Emerald check icon, "Your requirement is ready to submit" heading.
- An answer-summary block: Budget (always shown), Website type (shown only if `answers.websiteType` is set — 30k+ branch), Content management (shown only if `answers.ownership` is set — 5k-30k branch). The two are mutually exclusive by construction (never both set on the same run), so the summary correctly reflects whichever branch the user actually took.
- A **"Your Details" editable card** — added after the user explicitly asked that the request "feel" like it's being submitted under the customer's own identity. Fields: Full name (editable), Email address (**read-only** — deliberately matched to `Profile.js`'s existing convention, confirmed with the user before implementing, since email there is treated as account identity, not an editable field), Phone number (editable). All three prefilled from Redux (`user?.name`/`user?.email`/`user?.phone`) via a `useEffect` gated on `submitted`, held in local `contactDetails` state only — **not** wired to any save/profile-update API, per explicit user confirmation this stays local-only for this submission.
- **"Submit Request" button is a dummy stub** (`onClick={() => {}}`) — no backend call, no admin inbox exists yet. This matches `29_...md` Section 12's explicitly-deferred "no-payment submit request flow." Building the real submission endpoint + admin inbox page is separate future work, not started this session.

## 4. `startproject.js` — 6 cards reduced to 3, plus a Coming Soon modal

Per explicit user instruction, the entry screen was cut from 6 intent cards to 3:
- **New Website Project** (unchanged, real flow — Section 1).
- **New Software Project** (unchanged card, but click behavior changed — see below).
- **Features & Updates** (`id: 'feature_update'`) — replaces the 4 removed cards (Add New Feature, Maintenance & Bug Fix, Content Update, Design & UI Changes) with one consolidated card. Its own multi-step flow is not built — out of scope this session, same as "New Software Project."

Unused icon imports (`Wrench`, `FileEdit`, `Palette`) removed along with their cards.

**Coming Soon modal**: clicking "New Software Project" or "Features & Updates" no longer navigates to the (nonexistent) `/start-new-project/build/:categoryId` route — instead a `COMING_SOON_IDS = ['new_project', 'feature_update']` check opens a centered dark-glass modal (`fixed inset-0` backdrop-blur overlay, `rounded-3xl border-white/20 bg-white/10 backdrop-blur-2xl` card, `fadeSlideUp` entrance, emerald `Clock` icon, close via backdrop click / `X` button / "Got it" button). "New Website Project" is unaffected and still navigates normally into the real flow (Section 1).

## 5. `CustomerDashboard.js` — first metric card highlighted when it's a real CTA

`MetricCard` gained a new `highlight` prop (default `false`, backward-compatible — the other 3 cards are unaffected). When `true`: the card's neutral `border-white/15 bg-slate-950/60` styling is replaced with a solid-feeling emerald fill (`border-emerald-400/50 bg-emerald-500/20`, emerald glow blob instead of the tone-based one, emerald icon-badge, hover lift + stronger emerald shadow) — matching the site's established action-pill/CTA visual language rather than the neutral data-card look shared by the other 3 metrics.

Wired as `highlight={!primaryWorkItem}` on the first card only: when the customer has no active project/plan (card shows "Start New Project" as a real call-to-action), it gets the emerald highlight. When a live project/plan exists (card shows status info, not a bare CTA), it stays neutral like the other 3 cards — the distinction is deliberate, not accidental: highlight is reserved for when the card *is* an action button, not a status display.

## 6. Deep root-cause analysis: plan-vs-project routing (analysis pass — see Section 7 for the fix)

Triggered by the user asking to verify where dashboard-list vs. `ProjectsAndPlans.js`-list clicks on a plan order actually navigate. Full investigation, confirmed directly against live code (not assumed):

### 6a. Confirmed current behavior
- `ProjectsAndPlans.js`'s `openDetails()` (line ~201) is type-aware: `isPlanItem(order) ? navigate('/plan-details/:id') : navigate('/project-details/:id')`.
- `CustomerDashboard.js`'s `getItemLink()` (line 118) is **not** type-aware: `` `/project-details/${order._id}` `` unconditionally, even though `isPlanItem`/`isProjectItem` helpers already exist and are used elsewhere in the same file (line ~402, for the "Plan"/"Project" list-row label). This was already flagged as a known gap in `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md`'s "Other entry points not yet audited" note — this session confirmed it directly against current code rather than re-assuming the old note was still accurate.
- **User-visible consequence**: opening a plan order from the Dashboard's recent-items list lands on `ProjectDetails.js` (built for project checkpoint/timeline data), which has no update-limit/`canRequest` concept at all — this is why the "Request Update" button appeared to have no limit-check when reached via this path. The limit-check logic is real and correct, but lives entirely in `PlanDetails.js`, the page this path fails to route to.

### 6b. A second, independent, deeper bug found during this investigation
`isPlanItem()` is **duplicated** (not shared) across `CustomerDashboard.js`, `OrderPage.js`, `ProjectsAndPlans.js`, and `frontend/src/components/PaymentStatusChip.js`, and in every one of those copies it checks only `category === 'website_updates'`. Since `27_SERVICE_PLAN_RENAME_AND_LEGACY_MIGRATION.md`, a second plan category, `service_plan`, has existed and is customer-purchasable via `ServicePlanDetail.js` — but **no** `isPlanItem` copy anywhere in the customer-facing frontend recognizes it. Grepped for `isServicePlan`/`servicePlanSnapshot` (the new backend/order fields from that doc) and found them referenced only in `orderProductModel.js` and the admin-only `AdminPlanProductsPage.js` — zero customer-facing pages consult them.

**Practical effect**: any `service_plan`-category order is currently misclassified as a project by every one of these duplicated `isPlanItem` checks, everywhere they're used — not just in the Dashboard routing bug, but in `ProjectsAndPlans.js` too, which was otherwise believed to be the "correct, already-fixed" reference implementation.

### 6c. Root-cause conclusion (3 layers, deepest first)

1. **Type-detection layer (deepest, newly found)**: `isPlanItem`/`isProjectItem` logic is duplicated in 4+ files and is missing the `service_plan` category everywhere. This must be fixed first — fixing the layers above it without this would just make them consistently wrong instead of inconsistently wrong.
2. **Entry-point routing layer**: `CustomerDashboard.js`'s `getItemLink` doesn't consult type at all (unlike `ProjectsAndPlans.js`'s `openDetails`, which does, but with the Section 6b category gap).
3. **Destination-page safety layer**: neither `PlanDetails.js` nor `ProjectDetails.js` verifies, after fetching, that the order it received actually matches its own page type — both fully trust whichever entry point routed the user there. Confirmed via direct read of both files' fetch logic (`PlanDetails.js`'s `fetchPlanDetails`, `ProjectDetails.js`'s equivalent) — neither calls `isPlanItem`/`isProjectItem` or checks `productId.category` at all after the `orderDetails` API call resolves.

### 6d. Agreed fix order (implemented same session — see Section 7)

1. Extract a single shared helper with `isPlanItem`/`isProjectItem` checking **both** `website_updates` and `service_plan`, and update `CustomerDashboard.js`, `OrderPage.js`, `ProjectsAndPlans.js`, `PaymentStatusChip.js` to import it instead of each keeping its own duplicate.
2. Fix entry-point routing (`CustomerDashboard.js`'s `getItemLink`) to use the shared helper, matching `ProjectsAndPlans.js`'s existing branch pattern.
3. Add a defensive check inside `PlanDetails.js` and `ProjectDetails.js`: after fetching, verify the order's actual type against the shared helper and redirect to the correct sibling page on mismatch, so a future new entry point (or a hand-typed URL) can't reproduce this bug class again.

The user explicitly asked for analysis-only first ("mujhe pehle concept clear karo koi working nahi karni"), confirmed the concept in a follow-up exchange, then approved implementation ("ok start working") — see Section 7.

## 7. Implementation of the Section 6 fix (same session, later pass)

All 3 layers from Section 6d implemented, in that order, frontend-only:

### 7a. New shared helper: `frontend/src/helpers/orderType.js`
```js
export const PROJECT_CATEGORIES = new Set([
  'standard_websites', 'dynamic_websites', 'cloud_software_development',
  'app_development', 'web_applications', 'mobile_apps',
]);
export const PLAN_CATEGORIES = new Set(['website_updates', 'service_plan']);
export const isProjectItem = (order) => PROJECT_CATEGORIES.has(order?.productId?.category?.toLowerCase());
export const isPlanItem = (order) => PLAN_CATEGORIES.has(order?.productId?.category?.toLowerCase());
```
`PLAN_CATEGORIES` now includes `service_plan` (the Section 6b gap) alongside the legacy `website_updates`. `PROJECT_CATEGORIES` is exported as a named Set (not just wrapped in the function) because `OrderPage.js` was found, while implementing this, to consume the raw Set directly at line ~208 for a separate active-project filter — not just via `isProjectItem()`.

### 7b. Duplicate removal (Layer 1 of Section 6c)
`CustomerDashboard.js`, `OrderPage.js`, `ProjectsAndPlans.js`, `frontend/src/components/PaymentStatusChip.js` — each had its own local `PROJECT_CATEGORIES`/`PLAN_CATEGORY`/`isProjectItem`/`isPlanItem` block deleted, replaced with `import { isProjectItem, isPlanItem } from '../helpers/orderType'` (`PaymentStatusChip.js` only needed `isPlanItem`; `OrderPage.js` additionally imports `PROJECT_CATEGORIES` for its raw-Set usage from 7a). Confirmed via grep that all 4 pre-existing inline blocks were byte-for-byte identical before this change (except `PaymentStatusChip.js`, which only ever had the one-line `isPlanItem` version) — no behavior change beyond the `service_plan` fix itself.

### 7c. Entry-point routing fix (Layer 2)
`CustomerDashboard.js`'s `getItemLink`:
```js
const getItemLink = (order) =>
  isPlanItem(order) ? `/plan-details/${order._id}` : `/project-details/${order._id}`;
```
(was unconditionally `` `/project-details/${order._id}` ``) — now matches `ProjectsAndPlans.js`'s existing `openDetails()` branch pattern.

### 7d. Destination-page safety checks (Layer 3)
- **`PlanDetails.js`**: in `fetchPlanDetails`, immediately after a successful order fetch and before `setPlan(...)`, added `if (!isPlanItem(orderData.data)) { navigate(`/project-details/${orderId}`, { replace: true }); return; }`.
- **`ProjectDetails.js`**: in `fetchOrderDetails`, immediately after `orderData.success` and before the `pending-approval`/`payment-rejected` branches, added `if (!isAdminView && isPlanItem(order)) { navigate(`/plan-details/${orderId}`, { replace: true }); return; }`. Gated on `!isAdminView` because this component is also rendered by the admin project-detail wrapper (see `18_PROJECT_DETAIL_PAGE_AND_HEADER_REWORK.md`) via an `isAdminView` prop, and the admin path was left completely untouched, consistent with `31_PROJECT_DETAILS_UI_TEMPLATE.md`'s standing rule that `isAdminView` code paths are out of scope for customer-side reworks. `isAdminView` was added to `fetchOrderDetails`'s `useCallback` dependency array for correctness (it's a route-level prop that doesn't change at runtime in practice, so this has no observable behavior effect, but avoids a stale-closure lint issue).

Both redirects use `{ replace: true }` so the wrong-type page never lingers in browser history — back-button from the corrected page won't bounce the user back into the misrouted one.

### 7e. Net effect
Every known entry point (Dashboard, ProjectsAndPlans, and any future one) now resolves to the correct detail page regardless of which link initiated navigation, because the destination pages verify their own data instead of trusting the caller. `service_plan` orders are now correctly recognized as plans everywhere `isPlanItem`/`isProjectItem` is used, not just in the two routing pages.

## Files touched this session

- **New**: `frontend/src/pages/StartNewWebsiteBuild.js`, `frontend/src/pages/StartNewWebsiteCustomize.js`, `frontend/src/helpers/orderType.js`.
- **Changed (Sections 1-5, UI only)**: `frontend/src/routes/customerRoutes.js` (2 new route entries), `frontend/src/pages/startproject.js` (6 cards -> 3, Coming Soon modal, unused icon imports removed), `frontend/src/pages/CustomerDashboard.js` (`MetricCard`'s new `highlight` prop, wired on the first card only).
- **Changed (Section 7, routing/logic fix)**: `frontend/src/pages/CustomerDashboard.js` (also: duplicate `isPlanItem`/`isProjectItem` removed, `getItemLink` now type-aware), `frontend/src/pages/OrderPage.js`, `frontend/src/pages/ProjectsAndPlans.js`, `frontend/src/components/PaymentStatusChip.js` (duplicate helpers removed, now import from `orderType.js`), `frontend/src/pages/PlanDetails.js`, `frontend/src/pages/ProjectDetails.js` (both gained a post-fetch type-verification redirect).
- **Not touched**: any backend file; `StartNewProject.js`/`StartNewProjectDetail.js` (old catalog, still disconnected but restorable per `29_...md`); `ProjectDetails.js`'s `isAdminView` code path (Section 7d); no `npm run build` run.
