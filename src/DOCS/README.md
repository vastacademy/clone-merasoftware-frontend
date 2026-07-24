# MeraSoftware Documentation Index

This folder is split into two groups:

- Active reference docs for the current codebase.
- Legacy docs kept for historical context only.

If you are trying to understand the app as it works today, start with `00_CURRENT_SYSTEM.md`.

## Active Docs

### `00_CURRENT_SYSTEM.md`
Current source of truth for routes, dashboards, headers, and login flow.

### `01_ARCHITECTURE_OVERVIEW.md`
Current frontend architecture, route layout, auth flow, and active shell components.

### `02_COMPONENT_GUIDE.md`
Current component guide for the active header, dashboard, and layout components.

### `03_DATA_FLOW_AND_PATTERNS.md`
State, API, and caching patterns used by the app.

### `04_BACKEND_OVERVIEW.md`
Backend structure, routes, models, and helpers.

### `05_QUICK_REFERENCE.md`
Fast lookup for files, routes, and common development tasks.

### `12_CLIENT_ACTIVITY_SORT_AUDIT.md`
Current audit and implementation routing for admin client working-activity sorting and the pending node-update write path.

### `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md`
Verified project categories, product fields, customer purchase flow, admin `Website Management > Projects` UI scaffold, approval integration, and regression guardrails.

### `14_CODEBASE_AUDIT_INDEX.md`
Central AI handoff index containing the audited route/file/model map, real database evidence, current implementation state, pending work, and regression boundaries.

### `15_START_NEW_PROJECT_UI_HISTORY.md`
Current `/start-new-project` list-row UI (now live-wired to real product data via `/api/get-product` and `/api/product-details`), the shared `CustomerWorkspaceTabs` underline-tab component now used across the customer portal, named backup folders with restore instructions, rejected/reverted approaches, and the related sidebar/footer layout fix.

### `16_WALLET_AND_PROJECTS_STATUS_FIX.md`
Before/after record for the wallet page width fix (`max-w-6xl` -> `max-w-7xl`), the `ProjectsAndPlans` tab reduction (five tabs -> `All`/`Projects`/`Plans`), and the project-row status rewrite (`Booked` / `Developer Assigned` / `{progress}% Complete` / `Completed` / `Payment Rejected`), plus the confirmed evidence that no working developer-assignment backend exists yet.

### `17_ADD_PROJECT_FORM_AND_PERFECT_FOR_AUDIT.md`
Full history of `AdminCreateProjectPage.js` becoming a working save form: field-wiring, Additional Features dropdown (three iterations), the `products.isHidden` string-vs-boolean data bug fix, the full "Who is it for?" rebuild (keyboard-driven free-text + live text-suggestions + icon-grid, backed by the new `perfectForSuggestion` collection), the `startingNodeTitle` schema addition, Cloudinary image upload wiring, and the final `POST /api/upload-product` submit wiring. Also documents a real production incident — old products crashing after the `perfectFor` schema change, root-caused and fixed via a backup-first migration — and a separate **unfixed, documented-only** finding: the customer-facing "Customize Your Plan" section ignores a product's `additionalFeatures` selection and uses its own unrelated `compatibleWith`-category filter instead. Read this before touching `AdminCreateProjectPage.js`, `PerfectForField.js`, `perfectForIconSet.js`, `perfectForOptions.js`, `packageOptions.js`, `productModel.js`, or `ProductDetails.js`'s "Customize Your Plan" section.

### `18_PROJECT_DETAIL_PAGE_AND_HEADER_REWORK.md`
Records a rejected-then-reverted first attempt at an admin project detail page, the confirmed direction change (build/perfect the customer detail page first, reuse it for admin later via a thin wrapper page — not an `isAdminView` branch), the new shared `frontend/src/components/ProjectDetailView.js` component now used by `StartNewProjectDetail.js` (final section order: description -> what's included -> add-on features with checkboxes -> who is it for -> two proceed buttons, `?` info-tooltips for secondary detail, no price shown), its full style-iteration history (colorful cards -> rejected serif/paper look -> final site-consistent black-text/sans-serif look), and the dark-gradient-banner header now shared by `ProjectDetails.js`, `StartNewProjectDetail.js`, `ProjectsAndPlans.js`, and `StartNewProject.js`. Read this before touching any of those four files, before building the still-pending admin project detail/edit/delete page, or before wiring the two proceed buttons' real logic.

### `19_TYPOGRAPHY_STANDARDIZATION_AUDIT.md`
Full-site (not just customer dashboard) read-only audit of every text-size and text-color class across 161 `pages`/`components` files, done before any typography code changes. Records the approved 5-size type-scale (`text-2xl`/`text-xl`/`text-lg`/`text-base`/`text-sm`), the approved black/white-only text-color rule with `text-black` as canonical, the explicit exemption for status badge/pill semantic colors, the approved direct-remap approach for small badge sizes (`text-xs`/`text-[10px]`/`text-[11px]` -> `text-sm`), confirmation that `Practice.js`/`UserDemo.js` are live routed pages (`/practice`, `/demo`) and in scope, and the known risk areas (mixed body-vs-subtext use of `text-sm`, dark-background `gray-300`/`slate-300` needing `text-white` not `text-black`, one-off `text-6xl`/`text-[16px]`/`text-[17px]` values). Read this before making any font-size or text-color change anywhere in the frontend — implementation has not started yet.

## Legacy Docs

These files are historical snapshots. Read them only if you need old context:

- `06_CODE_AUDIT_FINDINGS.md`
- `07_CUSTOMER_HOMEPAGES_ANALYSIS.md`
- `08_HOMEPAGE_CLEANUP_COMPLETE.md`
- `09_MVP_CONVERSION_COMPLETE.md`
- `10_CUSTOMER_ONLY_LOGIN_SYSTEM.md`
- `11_ADMIN_LOGIN_IMPLEMENTATION.md`
- `UPDATES_SUMMARY.md`

## Current High-Level Map

- Public entry: `/` uses `RoleBasedHome`
- Customer home: `/home`
- Login: `/login`
- Customer dashboard route: `/dashboard`
- Customer purchase-history route: `/order`
- Admin dashboard route: `/admin-panel/dashboard`
- Customer header: `CustomerHeader`
- Admin header: `AdminHeader`
- Customer dashboard shell: `DashboardLayout`
- Customer dashboard page: `CustomerDashboard`
- Customer project/plan list page: `ProjectsAndPlans`
- Customer order detail page: `OrderDetailPage`
- Customer purchase-history list page: `OrderPage`
- Admin dashboard page: `AdminDashboard`
- Admin project-product UI route: `/admin-panel/website-management/projects` (`AdminProjectProductsPage`); list UI is active, API wiring is pending
- Admin client list sorting source: existing `GET /api/admin/clients` response field `latestActivityAt`
- Node update status: canonical dynamic node schema/service and migrated-timeline-gated admin APIs exist; existing orders remain legacy until migration. Read `admin-nodes.md` and `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` before extending the flow
- New project creation direction: admin `Website Management > Projects` now has the Clients-style list UI and an active Add Project form at `/admin-panel/website-management/projects/add`; the form now saves via the existing `POST /api/upload-product` endpoint. Read `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` before extending it
- `AdminCreateProjectPage.js` now saves the whole project on submit (Cloudinary image upload via the existing `helpers/uploadImage.js`, `productModel.startingNodeTitle` field added to close a real pre-existing schema gap, checkpoints deliberately left server-generated — not duplicated client-side), has a live-data Additional Features multi-select (`GET /api/get-product` filtered to `feature_upgrades`, no category filtering by design), a rebuilt "Who is it for?" field (`PerfectForField.js`: free text, live text-suggestion dropdown, keyboard-navigable, auto-applies known icons from the `perfectForSuggestion` collection, full icon-grid for new text, new suggestions synced to the dictionary on form submit only), and "What's Included" still on the legacy fixed-dropdown `PackageSelect` + `packageOptions.js` pattern (unchanged, separate future task). Read `17_ADD_PROJECT_FORM_AND_PERFECT_FOR_AUDIT.md` before touching this file
- Known unfixed disconnect: `ProductDetails.js`'s customer-facing "Customize Your Plan" section does **not** use a product's `additionalFeatures` selection at all — it independently filters all `feature_upgrades` products by their own `compatibleWith`/category match. A product can have features selected in `AdminCreateProjectPage.js` that never appear to the customer. Documented, not fixed — see `17_ADD_PROJECT_FORM_AND_PERFECT_FOR_AUDIT.md` Section 8 before touching this.
- Full audit handoff: read `14_CODEBASE_AUDIT_INDEX.md` first when resuming work in a new chat or by another AI

## Notes

- `Header` is role-based and selects the admin or customer header automatically.
- Login currently uses direct sign-in with `postLogin()` redirecting to `/home`.
- `AdminDashboardDummy.js` is no longer part of the active codebase.
- `CustomerDashboard` is the active customer dashboard page.
- `ProjectsAndPlans` is the active project and plan tracking list.
- `OrderPage` is the active purchase-history list and should not be used for progress tracking.
- The customer sidebar `Start New Project` quick link is visible and points to `/start-new-project` (`StartNewProject` list page and `StartNewProjectDetail` detail page). `StartNewProject` is live-wired to real product data (`GET /api/get-product`, filtered to project categories only); `StartNewProjectDetail` fetches a single product via `POST /api/product-details` but remains otherwise UI-only (no "Proceed to Payment" handler). See `15_START_NEW_PROJECT_UI_HISTORY.md`.
- `frontend/src/components/CustomerWorkspaceTabs.js` is a shared underline-style tab component (mirrors admin's `AdminWorkspaceTabs.js`) used by `StartNewProject`, `ProjectsAndPlans`, `OrderPage`, and `UserInvoices`, replacing the earlier pill-style tab buttons on all four pages.
- `DashboardLayout` and `AdminLayout` sidebars use `sticky` positioning inside a flex row with the content column (not `position: fixed`), so the page footer runs full-width below both the sidebar and the content instead of only following content height.
- `WalletDetails` content container uses `max-w-7xl`, matching `ProjectsAndPlans` and `StartNewProject` widths.
- `ProjectsAndPlans` has only three tabs: `All`, `Projects`, `Plans`. Project row status is now derived from real order lifecycle fields (`Booked`, `Developer Assigned`, `{progress}% Complete`, `Completed`, `Payment Rejected`) instead of a static "In progress" label; see `00_CURRENT_SYSTEM.md` for the exact condition mapping. `Developer Assigned` is a static placeholder label, not a real developer-assignment feature — no backend endpoint for assigning a developer currently exists.
- `StartNewProjectDetail.js` now renders a new shared component, `frontend/src/components/ProjectDetailView.js`, instead of its own inline detail markup. `ProjectsAndPlans.js`, `StartNewProject.js`, `StartNewProjectDetail.js` (via `ProjectDetailView.js`), and the pre-existing `ProjectDetails.js` all now share the same dark-gradient-banner header style. A first admin-panel project detail page was built, explicitly rejected, and fully reverted — no admin detail/edit/delete page exists yet. See `18_PROJECT_DETAIL_PAGE_AND_HEADER_REWORK.md`.
