# Customize-Project Page + Full-Page Glass "Documentation" Layout System

## Purpose

Three individually-approved, **UI-only (no backend wiring)** changes this session:

1. Re-routed the three remaining customer-portal empty-state "Start New Project"/"Browse Services" CTAs from the old public site (`/home`) to the portal entry (`/start-new-project`).
2. `StartNewWebsiteBuild.js` now derives the primary project category from the flow's `ownership` answer and passes it into the customize route via `location.state`.
3. Rebuilt `StartNewWebsiteCustomize.js` from a "coming soon" placeholder into a real, form-style **Customize Your Project** page — whose final layout became the **full-page glass "documentation" layout system** (Section 4), now the user-declared default for customer-portal full-page form/detail pages.

Read this before touching `StartNewWebsiteCustomize.js`, `StartNewWebsiteBuild.js`'s customize navigation, the three empty-state CTAs, or before building any new full-page form/detail page.

---

## 1. Empty-state CTAs: `/home` → `/start-new-project`

### Why
A portal-wide scan (`pages/` + `components/`, backups excluded) found exactly five `/home` references. Two groups:
- **Group A — action CTAs (wrong):** three conditional empty-state buttons still sent users to the old public site instead of the portal's Start-New-Project entry.
- **Group B — branding/nav/system (correct, left untouched):** `SharedHeader.js` public-nav "Home" link (line 16), logout redirect (line 102), brand-logo link (line 118); `RoleBasedHome.js` root `/` → `/home` redirect (line 4). None are "Start New Project" buttons.

No dynamically-mapped CTA pointed at `/home` — all three are single conditionally-rendered buttons in empty-state blocks.

### Before → After (navigation target only; markup/text unchanged)

**`frontend/src/pages/CustomerDashboard.js:328`** — empty-state (`dashboardItems.length === 0`) "Start New Project" `<Link>`:
```diff
- <Link to="/home" ...>          <PlusCircle .../> Start New Project </Link>
+ <Link to="/start-new-project" ...> <PlusCircle .../> Start New Project </Link>
```

**`frontend/src/pages/ProjectsAndPlans.js:195`** — "No items found" empty-state "Start New Project" `<Link>`:
```diff
- <Link to="/home" ...> Start New Project </Link>
+ <Link to="/start-new-project" ...> Start New Project </Link>
```

**`frontend/src/pages/OrderPage.js:376`** — empty-state "Browse Services" `<button>`:
```diff
- onClick={() => navigate('/home')}
+ onClick={() => navigate('/start-new-project')}
```
(Button text "Browse Services" deliberately left unchanged — narrow scope.)

**Prior behavior:** clicking any of these left the customer portal and loaded the old public marketing site at `/home`. **New behavior:** they land on the portal's `/start-new-project` intake page (`startproject.js`).

---

## 2. Flow derives primary category, passes it to customize

### Context
`StartNewWebsiteBuild.js` is the Typeform-style New Website flow. The customize path is only reachable in the **5k-30k budget branch** (`flowKeys = ['budget','ownership','path']`, line ~178-181). The 30k+ branch asks `websiteType` and goes straight to the confirmation screen — it never reaches customize (see "Phased scope").

### Before → After — `frontend/src/pages/StartNewWebsiteBuild.js`, `handleSelect()`, `path === 'customize'` branch (~line 202-217)

**Before** (passed budget + ownership only, no category):
```js
if (value === 'customize') {
  setTimeout(() => {
    navigate('/start-new-project/build/new_website/customize', {
      state: { budget: nextAnswers.budget, ownership: nextAnswers.ownership },
    });
  }, 220);
  return;
}
```

**After** (line 206-215 — derives `projectCategory` and passes it):
```js
if (value === 'customize') {
  const projectCategory =
    nextAnswers.ownership === 'self_managed' ? 'dynamic_websites' : 'standard_websites';
  setTimeout(() => {
    navigate('/start-new-project/build/new_website/customize', {
      state: { budget: nextAnswers.budget, ownership: nextAnswers.ownership, projectCategory },
    });
  }, 220);
  return;
}
```

**Decision rule (confirmed with user):** `self_managed` ("I'll manage content myself") ⇒ `dynamic_websites`; `we_maintain` ("MeraSoftware will maintain it") ⇒ `standard_websites`. Only this one navigate block changed; the rest of the flow is untouched.

---

## 3. `StartNewWebsiteCustomize.js` — Customize Your Project page

**Before:** a static "Customize flow — coming soon" placeholder that only displayed `budget`/`ownership` from `location.state`.

**After:** a real, editable, form-style page. **Scope is strictly UI + read-only DB fetch — no backend wiring.**

### 3a. Component structure (file map)
- `SelectDropdown` (line 47) — single-select glass dropdown; closes on outside-click (`useEffect` line 51).
- `MultiSelectDropdown` (line 105) — multi-select glass dropdown with checkbox list + removable chips; outside-click close (line 109).
- `StartNewWebsiteCustomize` (line 195) — page component.
- **`react-select` was deliberately not used** — it exists in the repo but only on admin/upload light-themed pages; its default styling fights the dark glass theme. Two small in-file components were written instead (no new dependency).

### 3b. State (prefilled from flow, all user-editable)
```js
const [projectCategory, setProjectCategory] = useState(state.projectCategory || 'dynamic_websites');
const [budget, setBudget]                   = useState(state.budget || '');
const [ownership, setOwnership]             = useState(state.ownership || '');
const [paymentOption, setPaymentOption]     = useState('full');
const [couponCode, setCouponCode]          = useState('');
const [allFeatures, setAllFeatures]        = useState([]);
const [selectedFeatureIds, setSelectedFeatureIds] = useState([]);
```

### 3c. Feature fetch + filter + live refresh — `useEffect` (line 214), keyed on `[projectCategory]`
```js
const response = await fetch(SummaryApi.allProduct.url);      // GET /api/get-product  (line 219)
const products = dataResponse?.data || [];
const features = products.filter((p) =>
  p.category === 'feature_upgrades' &&
  !p.isHidden &&
  Array.isArray(p.compatibleWith) &&
  p.compatibleWith.includes(projectCategory)                  // (line 227)
);
setAllFeatures(features);
setSelectedFeatureIds([]);   // reset selection on project change (line 231)
```
- **No per-feature prices are rendered** (explicit user instruction — pricing appears only as an estimate summary).
- Changing **Primary project** re-fetches, re-filters, and **clears** the previous feature selection.

### 3d. Derived values
- `estimateTotal` (`useMemo`) = sum of selected features' `sellingPrice`. Shown with a permanent amber disclaimer *"This is an estimate… not the final price."* Base project price is **not** included yet (Phase 1 UI-only).

### 3e. Stubbed (no backend) — must be wired later
- Coupon **Apply** button — `onClick={() => {}}`. No `validateCoupon` call.
- Submit button — now `onClick={handleSubmit}` (see Section 5); label is **"Create Project"** when `paymentOption === 'decide_later'`, else **"Proceed to Payment"**. Still creates no order and runs no payment — it only opens a UI popup / success modal.

### 3f. DB evidence (read-only audit this session)
A temporary read-only script (created in `backend/scripts/`, run, then deleted) confirmed **8 real `feature_upgrades` products**. `compatibleWith` is a `[String]` array; distinct values found: `dynamic_websites`, `standard_websites`, `cloud_software_development`, `app_development`, plus two legacy/inconsistent values `web_applications`, `mobile_apps` (not in the category enum — irrelevant to Phase 1). The filter returns real features for both `dynamic_websites` (4) and `standard_websites` (5). The old `ProductDetails.js` used the same `compatibleWith` field for its "Customize Your Plan" filter (`feature.compatibleWith.includes(productData.category)`), so this is the established pattern, not a new invention.

### 3g. Phased scope (explicitly deferred)
- Only the **5k-30k branch** (dynamic/static via `ownership`) reaches customize today. **30k+ budget** (⇒ dynamic per the user) does not reach customize yet.
- Cloud Software / Mobile App are selectable in the dropdown and filter features correctly, but the flow never routes to them yet (those are the "Coming Soon" cards on `startproject.js`).
- No backend: coupon validation, order creation, payment are all stubs.

### 3h. Website pages — +/- counter on the "Add New Page" feature (added later)

**Requirement:** website pages get an increase/decrease counter inside the capabilities dropdown, not a checkbox; the option shows the current page count.

**DB evidence (read-only audit this session):** the `Add New Page` product (`_id 67ab511c7bc4940983e09ac9`, `sellingPrice 1999`, `upgradeType 'component'`, `compatibleWith: ['standard_websites']`) is the pages feature. Website products each carry their own `totalPages` (Portfolio 7, Restaurant 5, Educational 12, College 21, most dynamic sites 4). The customize page is **category-based, not product-based**, so there is no single base `totalPages` to read — a fixed min/max was chosen with the user instead.

**Implementation** (`StartNewWebsiteCustomize.js`):
- `MIN_PAGES = 4`, `MAX_PAGES = 99` (line 37-38); `isPagesFeature(f)` matches `serviceName` containing "add new page" (line 39).
- New `pageCount` state, default `MIN_PAGES` (line 277); reset to `MIN_PAGES` on every project-category change (inside the fetch `useEffect`).
- `MultiSelectDropdown` special-cases the pages feature: instead of a checkbox it renders an **always-visible** "Website Pages" row with a `−  [count]  +` control (`Minus`/`Plus` icons, `−` disabled at `MIN_PAGES`, `+` disabled at `MAX_PAGES`, `e.stopPropagation()` so stepping doesn't close the dropdown). A live "`{pageCount}` Pages" chip is always shown.
- The pages feature is **always counted** (min pages are implicitly included), so the trigger summary count and `selectedCount` add `1` when the pages feature exists for the current project.

**Estimate rule (user choice: "saare pages charge"):** `estimateTotal` (line ~328) now = `pagesFeature.sellingPrice × pageCount` (always) + each checkbox-selected regular feature's `sellingPrice` once. Keyed on `[allFeatures, selectedFeatureIds, pageCount]`.

**Category note (not a bug):** because `Add New Page.compatibleWith = ['standard_websites']` only, the pages counter appears **only for Static Website**. Dynamic/Cloud/Mobile won't show it until that product's `compatibleWith` is widened by an admin — this is DB-driven, not hardcoded.

### 3i. "Proceed to Payment" popup + success modal (UI-only, backend-aligned)

**Audit first (done before building):** a portal-wide payment-system scan confirmed a **fully working payment engine already exists** — `DirectPayment.js` (`/direct-payment`: wallet + UPI/QR via `qrcode.react` + partial/installments, creates the order via `SummaryApi.createOrder` → backend `createOrder.js`) and `InstallmentPayment.js` (`/installment-payment/:orderId/:installmentNumber`). It is triggered by `navigate('/direct-payment', { state: { paymentData } })` and **requires a real `paymentData.product._id`** (backend does `productModel.findById(productId)`). **Blocker:** the customize flow is a *custom, product-less* requirement — there is no pre-created product `_id` or base project price — so `DirectPayment.js` cannot be reused directly yet. (Known adjacent gap from `23_...`/`40_...`: `DirectPayment.js` also ignores the `invoicePayment` state — new-`invoiceModel` online-pay is still unbuilt.) Decision: **build the popup UI-only now, structure-aligned, wire later** (a customer-side custom-project-order endpoint, à la `adminCreateProjectOrder.js`, is the future path).

**Behaviour (Option B — logically-correct split, user-confirmed):**
- **Full / Partial** → button "Proceed to Payment" → `handleSubmit()` opens the payment confirm popup (`setShowPaymentModal(true)`).
- **Decide-later** → button "Create Project" → `handleSubmit()` skips payment and shows the success modal directly (`setShowSuccess(true)`), because no payment happens.

**Implementation** (`StartNewWebsiteCustomize.js`):
- State: `showPaymentModal` / `showSuccess` (line 360-361). Submit button `onClick={handleSubmit}` (line ~537). `handleSubmit` (line 384), `handleConfirmPayment` (line 394).
- **Payment popup** (`{showPaymentModal && …}`, line 552): glass modal (same pattern as `startproject.js`'s "Coming Soon" modal — `bg-slate-950/70` backdrop + `bg-white/10 backdrop-blur-2xl` card), documentation-style `divide-y` summary (Project / Capabilities / Payment / Coupon / Estimated total), the amber "not the final price" note, and a "Proceed to Payment" confirm button → `handleConfirmPayment` → (UI-only) closes popup, shows success.
- **Success modal** (`{showSuccess && …}`, line 624): ✓ "Project request submitted, our team will get in touch" + "Go to Dashboard" (`navigate('/dashboard')`).
- **Backend-aligned payload**: `buildPaymentData()` (line 365) returns an object in the same shape `createOrder`/`DirectPayment` read — `selectedFeatures: [{ id, name, sellingPrice, quantity }]` (pages feature carries `quantity: pageCount`), plus `projectCategory`/`budget`/`ownership`/`paymentOption`/`couponCode`/`estimateTotal`. It is **intentionally not sent anywhere** yet — `handleConfirmPayment` calls `void buildPaymentData()` only, so wiring later (navigate to `/direct-payment` or a new endpoint) is a one-line change. Confirmed with user: **UI-only, structure aligned — no live backend call this phase.**

---

## 4. Full-page glass "documentation" layout system (REUSE THIS)

The customize page's final layout is the **user-approved standard** for future customer-portal full-page form/detail pages. Three tries, each driven by user feedback:

| Attempt | What | Result |
| --- | --- | --- |
| 1 | Multiple separate glass cards | Rejected — *"jeyada boxes unprofessional lagta hai"* |
| 2 | One bounding box + inner grid | Rejected — the box's `overflow-hidden` (for the top sheen) **clipped open dropdowns** |
| 3 | Full-page glass sheet, no box, `overflow-visible` | **Approved** — *"yeh perfect hai"* |

### The approved pattern (with exact classes / anchors)
- **Open centered header, outside any panel**: `absolute left-0` Back pill — byte-identical to the site-standard detail-page Back button (`rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-lg font-semibold text-white backdrop-blur-md transition hover:bg-white/15`, same as `ProjectDetails.js`/`PlanDetails.js`/`OrderDetailPage.js`/`InvoiceDetailPage.js`/`TicketDetail.js`) + a truly-centered `<h1>` title and subtitle.
- **One frameless full-page glass sheet** (`StartNewWebsiteCustomize.js:301`): `rounded-[2rem] bg-white/[0.06] p-6 backdrop-blur-2xl sm:p-8 lg:p-10`. Critically: **no heavy border, no shadow, and NO `overflow-hidden`** — this is what stops it reading as a hard "box" and lets absolutely-positioned dropdowns/popovers escape without being clipped.
- **Responsive documentation grid inside the sheet** (line 302): `grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14`. Desktop = two columns (main content left; sticky summary/action rail right via `lg:sticky lg:top-6`, split by `lg:border-l lg:border-white/10 lg:pl-14`). Mobile = single stacked column, top-to-bottom.
- **Sections, not sub-boxes**: each block is a plain `<section>` separated by `border-t border-white/10 pt-10`, introduced by a small emerald eyebrow label (`text-sm font-semibold uppercase tracking-wide text-emerald-300/90`). No nested cards.
- Background stays the standard `BG.png` + `bg-slate-950/40` overlay, inside `DashboardLayout`.

### When to use it
Prefer this over the older single-bounding-card layout for **any** new customer-portal full-page form/detail page, and **especially whenever the page has open dropdowns/popovers** (a bounding card's `overflow-hidden` clips them). The older `ProjectDetails.js` three-column bounding card (see `31_PROJECT_DETAILS_UI_TEMPLATE.md`) stays valid for pages without escaping popovers.

---

## Files touched (audit list)

| File | Change |
| --- | --- |
| `frontend/src/pages/StartNewWebsiteCustomize.js` | placeholder → full customize page + full-page glass layout |
| `frontend/src/pages/StartNewWebsiteBuild.js` | customize navigate now derives + passes `projectCategory` (line 206-215) |
| `frontend/src/pages/CustomerDashboard.js` | empty-state CTA `/home` → `/start-new-project` (line 328) |
| `frontend/src/pages/OrderPage.js` | empty-state CTA `/home` → `/start-new-project` (line 376) |
| `frontend/src/pages/ProjectsAndPlans.js` | empty-state CTA `/home` → `/start-new-project` (line 195) |

- **Backups**: `frontend/src/pages/backup_customize_ui_20260809/` holds the pre-session originals of `StartNewWebsiteBuild.js` and `StartNewWebsiteCustomize.js`.
- **No backend files changed.** The read-only audit script was created in `backend/scripts/` and deleted after use.
- Route registration is unchanged — `/start-new-project/build/new_website/customize` was already wired to `StartNewWebsiteCustomize.js` in `customerRoutes.js`.
