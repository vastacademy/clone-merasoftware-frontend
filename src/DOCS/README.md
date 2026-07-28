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

### `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md`
Records the 27-file dead-page cleanup (moved to `pages/old-code-backup/`, nothing deleted), the `CustomerDashboard.js` "Start New Project" route fix, the plan-type-aware rebuild of `UserUpdateDashboard.js` (root-caused why the "Request Update" button stayed enabled on expired/recurring plans), the new `PlanDetails.js` subpage (plans now route to `/plan-details/:orderId` instead of `ProjectDetails.js`, which was explicitly left untouched), the one required `getOrderDetails.js` populate-field fix that makes recurring-plan detection work, and a confirmed-but-not-yet-fixed admin bug where marking one overdue invoice as paid resumes the whole plan even if a different, newer invoice on the same order is still overdue. Read this before touching `UserUpdateDashboard.js`, `PlanDetails.js`, `ProjectsAndPlans.js`'s `openDetails()`, `getOrderDetails.js`, or `invoiceLifecycle.js`.

### `21_PAYMENT_INVOICE_LEDGER_AUDIT_AND_FIX.md`
Root-causes the admin `Payment & Invoices` tab showing 2 unlinked records for one sale (7 paid invoices had no linked transaction — confirmed via live read-only DB audit, not assumption), fixes it going forward (new admin-only `monthlyInvoiceModel.internalNote` field, never shown to the customer; `AdminPaymentRecordDetail.js`'s "Mark Invoice Paid" renamed to "Record Payment" with a note field, distinct from the pre-existing customer-payment "Accept/Reject" verification action), and backfills the 7 existing orphaned records via the pre-existing `backend/scripts/auditPaymentInvoiceLedger.js --apply`. Also fully documents — but does **not** fix — that the entire customer-facing monthly-invoice payment system is broken/missing: `/my-invoices` (`UserInvoices.js`) calls a backend endpoint (`/api/my-invoices`) that does not exist anywhere in the codebase, its "Pay Now" button is a dead stub, and `PlanDetails.js`'s/`UserUpdateDashboard.js`'s "Payment overdue" notices show text only with no working link to the actual invoice. Read this before touching `AdminClientWorkspace.js`'s `PaymentInvoicesPanel`, `AdminPaymentRecordDetail.js`, `monthlyInvoiceController.js`, `invoiceLifecycle.js`, or before starting the still-pending customer invoice/payment feature.

### `22_MOBILE_SIDEBAR_DRAWER_AND_CHESS_SOCKET_AUDIT.md`
Two independent audits. (1) **Fixed**: `DashboardLayout.js`'s and `AdminLayout.js`'s full sidebars (`hidden ... lg:flex`) had no mobile equivalent at all — mobile users only got `SharedHeader.js`'s much shorter generic hamburger list. Fixed via a new shared `frontend/src/components/MobileSidebarDrawer.js` (presentation-only slide-in overlay) wired into both layouts, reusing the exact same `sidebarContent` markup/links as desktop — no duplicated nav data, `SharedHeader.js` untouched. (2) **Audited, not fixed**: chess (`frontend/src/chess/*`, `backend/chess/*`, previously undocumented anywhere) is the only feature using a live WebSocket instead of HTTP; on iPhone, buttons appear dead because Safari's ITP blocks the cross-site `sameSite:'None'` session cookie during the socket handshake (`backend/chess/chessSocket.js` auth relies solely on that cookie), and the UI never surfaces the resulting `connected`/`errorMessage` state to the user. Three candidate fixes were evaluated (client-exposed token fallback — rejected, weakens sitewide `httpOnly` protection; same-site reverse proxy — needs unverified hosting-level changes; separate chess-scoped low-privilege token — safest, but paused at user's request). Read this before touching either the two layout files or anything under `chess/`.

### `23_PAYMENT_SSOT_PHASE_0_TO_3.md`
Broad customer+admin payment/order ecosystem audit, then a user-approved phased plan to build a single source of truth, reusing the admin's existing correct ledger-merge logic rather than inventing a new system. **Implemented and tested this session**: Phase 0 (extracted `PaymentInvoicesPanel`'s merge/dedup logic out of `AdminClientWorkspace.js` into a new shared `frontend/src/helpers/paymentLedger.js`, zero behavior change, verified by re-reading the panel); Phase 1 (new customer-scoped `GET /api/my-payment-workspace` endpoint, `backend/controller/user/getMyPaymentWorkspace.js`, adapted from the admin-only `getAdminUserWorkspace.js`, tested against the live DB with real generated test JWTs — correct per-customer scoping confirmed, no cross-customer leakage); Phase 2 (`getWalletHistory.js` query narrowed with a `$or` filter so Wallet page only shows true wallet-balance transactions — live-data check found zero `deposit`/`refund`-type transactions exist yet in production, so wallet history is now correctly empty until a real recharge happens, confirmed with the user before proceeding); Phase 3 (new `frontend/src/components/PaymentStatusChip.js` on `OrderPage.js`, derives Paid/Partial/Pending/Overdue purely from the order object `OrderPage.js` already fetches — no new API call — verified against 10 real sampled orders' actual field values). **Phase 5 (a new global cross-customer admin page) was explicitly rejected by the user** — the existing per-customer Admin → Client Detail → Payment & Invoices view stays the only admin view. **Phase 4 (retire `UserInvoices.js`, add an Orders-page side panel with installment/invoice detail + Pay Now) is approved in concept but NOT implemented** — mid-session discovery that `InstallmentPayment.js` is a full standalone routed page, not an embeddable widget, means the panel's "Pay Now" approach (navigate to existing page vs. rewrite the QR/wallet flow inline) is still an open decision the user must make before any Phase 4 code is written. Read this before touching `AdminClientWorkspace.js`, `OrderPage.js`, `WalletDetails.js`, `getWalletHistory.js`, or before starting Phase 4.

### `24_ORDER_DETAIL_INVOICE_UI_REWORK.md`
UI-only rework (no backend changes) of the customer `/order-detail/:orderId` page (`OrderDetailPage.js`) across multiple user-corrected rounds: removed the status badge, Download Invoice button, Track Project button, and Order Progress tracker; removed the Payment Summary card entirely; simplified `Plan Snapshot` to Start Date/End Date/Payment Due Date/Payment Cycle (no order ID); made the Invoice History card render for **any** order with invoice records regardless of category (was previously, incorrectly, gated to `website_updates` only); restyled invoice/installment rows to match a user-provided real-invoice-row screenshot; added a new `frontend/src/pages/InvoiceDetailPage.js` (route `/invoice-detail/:invoiceId`) for per-invoice detail + Download/Pay Now. Also root-causes (but explicitly does **not** fix, per user instruction) a real backend gap: `monthlyInvoiceModel` documents are only ever created for monthly-recurring-plan orders — one-time-purchase and installment orders never get an invoice record at all, confirmed via a live read-only DB query on a real affected order. A temporary, clearly-commented dummy-invoice fallback (`DUMMY_INVOICES` in both new/changed files) was added so row-styling could keep being iterated on without that backend feature existing yet — **must be removed once real invoices exist for every order type**. Read this before touching `OrderDetailPage.js`, `InvoiceDetailPage.js`, `customerRoutes.js`, or before starting the deferred backend invoice-generation work.

### `25_ORDERS_PLANS_UI_AND_ADMIN_PLAN_LISTING.md`
Sequence of small, individually-approved UI-only changes: `OrderDetailPage.js`/`InvoiceDetailPage.js` width fixed to `max-w-7xl` (site-standard); `OrderPage.js` header rebuilt to match `ProjectsAndPlans.js`'s dark-gradient-banner pattern (eyebrow badge, white heading, `Total: {orders.length}` chip, banner-styled Refresh); `OrderDetailPage.js`'s Back button moved from a plain link above the banner into a `PlanDetails.js`-style pill inside the banner, and the emerald "Plan"/"Order" badge below it was removed. New **admin Plans list** (`AdminPlanProductsPage.js`, structural copy of `AdminProjectProductsPage.js`, backed by a new read-only `GET /api/admin/plan-products` -> `getAdminPlanProducts.js`, filtered to `category: 'website_updates'`) plus a new sidebar entry under Website Management, directly below Projects. New **UI-only** admin `AdminCreatePlanPage.js` ("Add Plan") — form fields scoped to what's actually plan-relevant after live-DB verification that `totalPages`/`packageIncludes`/`perfectFor` are dead weight for `website_updates` products (`ProductDetails.js`'s `shouldShowSection()` hides two of them for plans outright); submit only calls `preventDefault()`, no save wiring exists yet. Customer-side: `StartNewProject.js` gained a "Plans" tab (`website_updates` no longer excluded) and had its "Who is it for?" list column removed — **an earlier over-broad attempt that changed both in one pass was explicitly rejected by the user and fully reverted**, then re-done as two separately-approved steps; read Section 6 before repeating that mistake. `ProjectDetailView.js` (the shared customer/admin project detail component) had its section order changed from Description/What You Get/Features/Who Is This For to Description/Who Is This For/What You Get/Features — pure reorder, no markup or data changes. Read this before touching `OrderPage.js`, `OrderDetailPage.js`, `InvoiceDetailPage.js`, `AdminPlanProductsPage.js`, `AdminCreatePlanPage.js`, `AdminLayout.js`'s sidebar config, `StartNewProject.js`, or `ProjectDetailView.js`.

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
- Admin plan-product UI route: `/admin-panel/website-management/plans` (`AdminPlanProductsPage`, read-only list, `GET /api/admin/plan-products`) and `/admin-panel/website-management/plans/add` (`AdminCreatePlanPage`, UI-only form, no save wiring). Sidebar entry sits directly under Projects inside "Website Management". Read `25_ORDERS_PLANS_UI_AND_ADMIN_PLAN_LISTING.md` before extending either.

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
- `ProjectsAndPlans.js`'s `openDetails()` now routes plan orders to a new page, `PlanDetails.js`, at `/plan-details/:orderId` — project orders still go to `ProjectDetails.js` at `/project-details/:orderId` unchanged. `PlanDetails.js` copies `ProjectDetails.js`'s 3-column layout skeleton but shows plan-specific content: a donut of updates-consumed-of-total, a plan snapshot (days left/resets-on, total updates, file limit), an update-request history list, and a per-file request-detail panel. Live-wired to `GET /api/order-details/:orderId` and `GET /api/get-update-requests` (client-side filtered by `updatePlanId._id`). `27_ADD_PROJECT...`-style dead-page cleanup, the `UserUpdateDashboard.js` plan-type bug fix, the one required `getOrderDetails.js` populate fix, and a confirmed-unfixed admin invoice/resume bug are all recorded in `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md` — read it before touching any of these files.
- Admin `Payment & Invoices` tab: the 2-unlinked-records-per-sale bug is root-caused and fixed for new records (admin's "Record Payment" action, renamed from "Mark Invoice Paid", now supports an admin-only `internalNote` never shown to the customer) and backfilled for the 7 pre-existing orphaned paid invoices. The customer-facing invoice/payment system itself (`/my-invoices`, `PlanDetails.js`'s/`UserUpdateDashboard.js`'s "Payment overdue" notices) is confirmed broken/missing end-to-end and still needs to be built. See `21_PAYMENT_INVOICE_LEDGER_AUDIT_AND_FIX.md` before touching any admin payment/invoice file or before starting the customer invoice feature.
- `OrderDetailPage.js` (`/order-detail/:orderId`) was reworked UI-only: no more status badge/Download Invoice/Track Project/Order Progress/Payment Summary; shows a simplified `Plan Snapshot` (Start/End/Due Date/Cycle, no order ID) side-by-side with a clickable `Invoice History` (any order with invoice records, not just recurring plans) or `Installments` card. New `InvoiceDetailPage.js` (`/invoice-detail/:invoiceId`) added for per-invoice detail/Download/Pay Now. **Contains a temporary, clearly-commented `DUMMY_INVOICES` fallback** shown only when an order has zero real invoices — most one-time-purchase and installment orders currently have zero real invoices because no backend code path creates a `monthlyInvoiceModel` document for them (confirmed via live DB query; only the monthly-recurring-plan cron creates invoices today). That backend gap is documented but explicitly not fixed yet. See `24_ORDER_DETAIL_INVOICE_UI_REWORK.md` before touching `OrderDetailPage.js`, `InvoiceDetailPage.js`, or before starting that backend work.
- `OrderDetailPage.js`/`InvoiceDetailPage.js` content width now matches the site standard `max-w-7xl` (was `max-w-6xl`/`max-w-3xl`). `OrderDetailPage.js`'s Back button now lives inside the dark header banner as a translucent pill (`PlanDetails.js` pattern), and the emerald "Plan"/"Order" eyebrow badge that used to sit below it has been removed. `OrderPage.js`'s header now matches `ProjectsAndPlans.js`'s dark-gradient-banner style (eyebrow badge, white heading, `Total: {orders.length}` chip, banner-styled Refresh). See `25_ORDERS_PLANS_UI_AND_ADMIN_PLAN_LISTING.md`.
- `StartNewProject.js` now has a 4th tab, "Plans" (`website_updates` category, previously excluded), and no longer shows a "Who is it for?" column in its list (description is still shown; only the perfectFor tag row was removed). `StartNewProjectDetail.js`/`ProjectDetailView.js` were explicitly not touched by that change. Separately, `ProjectDetailView.js`'s section order changed to Description -> Who Is This For? -> What You Get -> Add More to Your Project (was Description -> What You Get -> Add More to Your Project -> Who Is This For?) — pure reorder. See `25_ORDERS_PLANS_UI_AND_ADMIN_PLAN_LISTING.md`, including Section 6's record of a rejected/reverted over-broad attempt at the tab+column change.
