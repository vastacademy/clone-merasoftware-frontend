# Plan System: Dead-Code Cleanup, `/my-updates` Fix, New `PlanDetails.js` Page, and a Confirmed Admin Invoice Bug

**Session date**: 2026-07-25
**Scope**: Customer portal dead-page cleanup; `website_updates`/plan-type expiry logic audit and fix; new plan-detail subpage; one backend `populate()` fix; a confirmed (not yet fixed) admin invoice/transaction bug.
**Read this before touching**: `UserUpdateDashboard.js`, `PlanDetails.js`, `ProjectsAndPlans.js`, `getOrderDetails.js`, `invoiceLifecycle.js`, or any admin invoice/payment mark-paid flow.

## 1. Dead-code cleanup — 27 files moved, nothing deleted

**Before**: `frontend/src/pages/` had 66 files; only 39 were reachable from any of the three route files (`publicRoutes.js`, `customerRoutes.js`, `adminRoutes.js`). The other 27 were never imported by any routed page/component — confirmed via full-tree grep for each filename, not assumption.

**After**: those 27 files are moved (not deleted) to `frontend/src/pages/old-code-backup/`. Breakdown:
- ~15 were legacy standalone admin-CRUD pages already superseded by the current admin panel (`AllAds.js`, `AllCategory.js`, `AllDevelopers.js`, `AllOrder.js`, `AllProducts.js`, `AllWelcomeContent.js`, `BusinessCreated.js`, `ClientsServices.js`, `ClosePlanManagement.js`, `CustomerDetailPage.js`, `HiddenProducts.js`, `KYCVerification.js`, `PendingRenewals.js`, `WalletManagement.js`, `UserWorkspace.js`).
- ~7 were unrouted public marketing/service pages (`CodingBasedWebsitePage.js`, `FeatureUpgradesService.js`, `LocalBusinessWebsite.js`, `MobileAppDevelopmentService.js`, `StaticWebsitesPage.js`, `WebsiteDevelopmentService.js`, `WebSoftwareService.js`, plus an empty placeholder `DynamicWebistesPage.js`).
- ~5 were legacy customer/auth pages already superseded (`SignUp.js`, `OtpVerification.js`, `UserDashboard.js` — replaced by `CustomerDashboard.js` — and `FirstPurchaseList.js`).

**Not touched**: `frontend/src/pages_backup_login_20260705_193957/` (a pre-existing, separate backup snapshot) — explicitly left alone per user instruction, not part of this cleanup.

**Known remaining orphan chain (not moved, flagged only)**: `components/RoleDirectoryPage.js` and its 5 `*Management.js` siblings (`AdminManagement.js`, `CustomerManagement.js`, `DeveloperManagement.js`, `ManagerManagement.js`, `PartnerManagement.js`) are also unrouted/orphaned, but were out of scope for this pass (components, not pages). A future cleanup round can address these.

## 2. `CustomerDashboard.js` — wrong "Start New Project" route, fixed

**File**: `frontend/src/pages/CustomerDashboard.js`, `primaryAction` fallback (was line ~276).

**Before**: when a customer has no active projects/plans, the dashboard's "Start New Project" quick-action button navigated to `/home` (the public marketing homepage) — outside the customer portal entirely.

**After**: navigates to `/start-new-project` (the real, live-wired `StartNewProject.js` list page), matching what the sidebar (`DashboardLayout.js`) and `Footer.js` already correctly pointed to. This was the only line changed; sidebar/footer links were already correct and untouched.

## 3. `/my-updates` (`UserUpdateDashboard.js`) — root-caused a stale "Request Update" button, then rebuilt the card UI

### 3a. The bug that was found

**File**: `frontend/src/pages/UserUpdateDashboard.js`, `calculateRemainingDays()` (original, now replaced).

There are two structurally different plan types on `orderProductModel`:
1. **Simple plan** (`isWebsiteUpdate`, non-recurring) — tracked by `updatesUsed` / `productId.updateCount` and `createdAt` + `productId.validityPeriod`.
2. **Monthly-limited / yearly-renewable plan** (`productId.isMonthlyLimitedPlan` or `isMonthlyRenewablePlan`) — tracked by a separate field set: `currentMonthUpdatesUsed`/`currentMonthUpdatesLimit`, `currentMonthExpiryDate`, `monthlyLimitResetDate`, `totalYearlyDaysRemaining`, `autoRenewalStatus`, `planStatus`.

The old `calculateRemainingDays()` only read `productId.validityPeriod`, which is `undefined` for type 2 — so it silently returned `0` for every recurring plan, and the "Request Update" button's `disabled` condition (which depended on that `0`) never reflected the plan's real status. Backend validation (`backend/controller/user/submitUpdateRequest.js`) was already correct — it independently checks `planStatus`, `autoRenewalStatus === 'paused'`, `isActive`, monthly limits, `currentMonthExpiryDate`, `totalYearlyDaysRemaining` — but the customer only found out after clicking, filling the modal, and submitting.

**Reference pattern that already solved this correctly elsewhere**: `frontend/src/pages/ProjectsAndPlans.js`'s `getRemainingDays()`/`getStatusMeta()`/`getSummaryText()` (lines ~32-119) already branch on `isMonthlyRenewablePlan || isMonthlyLimitedPlan` and read the correct field set per type. This was the model followed for the fix below — not reinvented.

### 3b. The fix

`UserUpdateDashboard.js`'s card was rebuilt with a single `getCardVisualStatus(plan)` helper that branches once by plan type and returns a normalized status object (`badge`, `tone`, `isRecurring`, `daysLeft` for simple plans) consumed by both the card body and the button's `disabled` state — replacing the old scattered, duplicated inline conditions.

**Card states now covered** (8 total): simple-active, simple-used-up, simple-expired, recurring-active, recurring-this-month-used-up, recurring-paused (payment overdue), recurring-yearly-ended, admin-closed.

**Recurring-plan card body** (new) shows: "This Month's Updates" bar, "Resets on {date}" line (an actual date, not just a countdown), and a separate "Yearly Plan" bar — both clocks visible together. **Paused** state gets a distinct amber/rose notice with a link to `/my-invoices` (link only, click-through not deep-wired). **Closed** state gets its own distinct notice, separate from "expired."

**Status quo note**: as of this doc, `UserUpdateDashboard.js` still renders from live-fetched data via `fetchUserUpdatePlans()` (`GET /api/get-order`, filtered client-side to `category === 'website_updates' && isActive`) — this page was NOT put into a mock-data phase; only `PlanDetails.js` (below) went through a mock-data phase before live-wiring. Double-check current file state before assuming card visuals here exactly match `PlanDetails.js`'s — they share the same `getPlanVisualStatus`/`getCardVisualStatus` logic shape but are two separate function copies in two separate files (no shared helper file was extracted).

## 4. New page: `PlanDetails.js` — a plan gets its own detail subpage, `ProjectDetails.js` is untouched

### 4a. The routing problem this solves

**Before**: `ProjectsAndPlans.js`'s `openDetails(order)` sent every order — project or plan — to the same route, `/project-details/:orderId` (`ProjectDetails.js`), with no type check. `ProjectDetails.js` is a checkpoint/timeline page built for projects; opening a plan order there rendered an empty "0 stages / Timeline data is not available yet" checkpoint view with a bare, ungated "Request Update" button. Confirmed directly against a live screenshot for a "Standard Plan" order.

**User's explicit instruction, followed exactly**: `ProjectDetails.js` must not be touched. A new page must handle plans.

**After**: `ProjectsAndPlans.js`'s `openDetails()` (around line 201) now branches:
```js
const openDetails = (order) => {
  if (isPlanItem(order)) {
    navigate(`/plan-details/${order._id}`);
  } else {
    navigate(`/project-details/${order._id}`);
  }
};
```
using the file's own pre-existing `isPlanItem(order)` helper (line ~30). Project rows are unaffected — same route, same component, same behavior as before.

**New route**: `frontend/src/routes/customerRoutes.js` — `plan-details/:orderId` -> `PlanDetails`, added as a sibling entry immediately after `project-details/:orderId`, same `CustomerProtectedRoute` wrapper.

**Other entry points not yet audited**: only `ProjectsAndPlans.js` was updated. Other places that might link to `/project-details/:orderId` for a plan order (e.g. `CustomerDashboard.js`'s quick-action links, `Footer.js`) were explicitly flagged as out-of-scope follow-up — not fixed in this pass. Check `CustomerDashboard.js`'s `getItemLink`/`openItem`-style logic before assuming all entry points are type-aware.

### 4b. `PlanDetails.js` layout — deliberately copies `ProjectDetails.js`'s 3-column skeleton

Per explicit user instruction ("iss page ka ui tum project detail page se copy kar sakte ho"), `PlanDetails.js` reuses `ProjectDetails.js`'s desktop 3-column grid (`lg:grid-cols-[280px_minmax(0,1fr)_360px]`, fixed `h-[470px]` rows) and mobile-stacked-with-collapse pattern, but with plan-specific content instead of checkpoint content:

| `ProjectDetails.js` (unchanged) | `PlanDetails.js` (new) |
|---|---|
| Donut ring = completion % | Donut ring = **updates consumed of total** (e.g. "2 / 5") |
| "Request Update" button, always enabled | "Request Update" button, `disabled={!status.canRequest}` — gated by **both** updates-remaining and validity/expiry/paused/closed, independently |
| "Snapshot" card: last update / updates linked / current phase | "Plan Snapshot" card: days-left-or-resets-on / total updates granted / file limit ("Up to 20 files, 5MB each") |
| "Progress Timeline" = checkpoint list | **"Update History"** = one row per `updateRequestModel` document (date, status pill, file count, note count) |
| "Checkpoint Details" = selected checkpoint's messages | **"Request Details"** = selected update-request's instructions text **and a per-file list** (name, size, type/icon) — this was the user's specific literal ask |

The gating logic (`getPlanVisualStatus`) mirrors `UserUpdateDashboard.js`'s status derivation (same branch order: closed -> paused -> yearly-exhausted -> monthly-used-up -> simple-plan days/updates), but is its own separate copy in `PlanDetails.js` — not a shared/extracted helper. If you change the status rules, you currently must change both files.

### 4c. Build history for this file — mock-data phase, then live-wiring phase (both explicitly approved separately)

1. First approved phase: skeleton page, single hardcoded `MOCK_PLAN`, no history — UI-only, explicitly approved as UI-only.
2. Second approved phase, after user clarified the real requirement (portal accepts up to 20 files per request, plan grants N updates over a validity window, button must respect **both** gates independently, customer needs full request history with per-file detail, page needs a consumption donut): full rebuild with `MOCK_PLAN` + `MOCK_UPDATE_REQUESTS` mock array, still UI-only.
3. Third approved phase (this one, live): mock data replaced with real fetches. See below.

### 4d. Live data wiring — what's real now, and the one backend fix required to make it correct

**Backend fix — required and applied**: `backend/controller/order/getOrderDetails.js`, the `populate('productId', ...)` field-list (around line 59) was missing `isMonthlyLimitedPlan`, `isMonthlyRenewablePlan`, `monthlyUpdateLimit`, `yearlyPlanDuration`, `monthlyRenewalPrice`, `monthlyRenewalCost`. Without these, `PlanDetails.js`'s `isRecurring` check always evaluated `false` for real recurring-plan orders fetched through this endpoint, silently misrendering them as simple plans (wrong card body, wrong badge, no reset date, no yearly clock).

**Before**:
```js
.populate('productId', 'serviceName category totalPages validityPeriod updateCount isWebsiteUpdate price sellingPrice')
```
**After** (only this line changed, purely additive, no schema/model change):
```js
.populate('productId', 'serviceName category totalPages validityPeriod updateCount isWebsiteUpdate price sellingPrice isMonthlyLimitedPlan isMonthlyRenewablePlan monthlyUpdateLimit yearlyPlanDuration monthlyRenewalPrice monthlyRenewalCost')
```
This is the single backend change made in this whole session. `ProjectDetails.js` and any other caller of `getOrderDetails.js` are unaffected — they don't read these new fields, so nothing about project-order behavior changed.

**Frontend wiring — `PlanDetails.js`**:
- `useParams()` reads the real `orderId` from the route.
- On mount, `fetchPlanDetails()` runs two fetches in parallel: `GET /api/order-details/:orderId` (`SummaryApi.orderDetails`) for the order/plan itself, and `GET /api/get-update-requests` (`SummaryApi.userUpdateRequests`) for history.
- **Important, not obvious from the endpoint name alone**: `GET /api/get-update-requests` (`getUserUpdateRequests.js`) returns **all** of the logged-in user's update requests across **every** plan they own — there is no `planId`/`orderId` filter parameter on this endpoint. `PlanDetails.js` filters client-side: `requestsData.data.filter(r => r.updatePlanId?._id === orderId)`. If you add a second consumer of this endpoint, remember this filter responsibility falls on the caller, not the API.
- Loading state reuses `TriangleMazeLoader` (same pattern as `ProjectDetails.js`/`UserUpdateDashboard.js`). Not-found/no-access state mirrors `ProjectDetails.js`'s "Project Not Found" card pattern, relabeled "Plan Not Found."
- The "Request Update" button now opens the real `UpdateRequestModal.js` (same component, same props pattern as `ProjectDetails.js` uses), passing the live fetched `plan` object; `onSubmitSuccess` re-runs `fetchPlanDetails()` so the donut and history refresh immediately after a successful submit. `UpdateRequestModal.js` and `submitUpdateRequest.js` were not modified — reused exactly as they already worked for `ProjectDetails.js`.

**Not changed / explicitly out of scope, still pending if ever needed**:
- `GET /api/get-update-requests` still has no `planId` filter param — works fine at current data scale via client-side filtering, but would need a backend param if this ever becomes a performance concern.
- No admin-side "activate/close a plan" capability exists anywhere in the backend (`routes/index.js` has no such route) — confirmed absent, not merely undocumented. `admin-plan.md`'s Phase 3 ("Plan add/remove", "date modifications") remains unimplemented intent, not built.

## 5. Confirmed (not yet fixed) bug: admin "Mark as Paid" resumes a plan even if a *different*, newer invoice is still overdue

**Where**: `backend/helpers/invoiceLifecycle.js`, `resumeOrderForPaidInvoice()` (called from `markInvoicePaidAndResumePlan()`, which admin's invoice "Mark as Paid" action calls).

**What was observed**: admin marked one overdue invoice (`INV-202605-0001`, an older monthly cycle) as paid for a real customer (`slnaycollege@gmail.com`)'s recurring "Standard Plan" order. The order immediately flipped to `isActive: true`, `autoRenewalStatus: 'active'` — even though a **separate, more recent** invoice for the same order (`INV-202607-0001`, a later cycle) was still `overdue` and untouched.

**Root cause**: `resumeOrderForPaidInvoice()` only checks the specific invoice's own `currentMonthExpiryDate`/`totalYearlyDaysRemaining` against the order — it does not check whether the order has any *other* still-overdue invoice before resuming it. The function was designed around "this one invoice just got paid, so resume the plan," without checking "does this order have zero remaining overdue invoices."

**Status**: confirmed via direct read-only DB inspection (temporary read-only Node scripts run against the real database, then deleted — no permanent script files were added to the repo). **Not fixed yet** — user explicitly deferred the backend correction to a future session. The test data was manually reverted (see below) so the scenario can be re-tested.

**Also confirmed, separately**: "Mark as Paid" writes to **two** different models for one logical action — `monthlyInvoiceModel` (the invoice's own `status`/`paidDate` fields, which the schema already supports fully) **and** a brand-new `transactionModel` document (via `ensureCompletedInvoiceTransaction()` in the same file), which is why admin's "Payment & Invoices" tab shows two separate-looking rows (a "PAYMENT" row from `transactionModel`, always reads as "Paid" once created, and an "INVOICE" row from `monthlyInvoiceModel`) for what feels like one action. This is not a broken single-source-of-truth violation — `transactionModel` is a shared ledger across all payment types (wallet, installment, renewal, invoice), not invoice-specific — but the duplication of payment-proof fields between the two models (both end up storing effectively the same "when/how was this paid" facts) was flagged by the user as worth revisiting. **Deferred to a future session, not fixed.**

**Test data was manually reverted** after this was found, via temporary read-only/write Node scripts (created in `backend/`, run once, then deleted — not part of the committed codebase):
- Order `692ac68013c56107623619c9`: `isActive` back to `false`, `autoRenewalStatus` back to `'paused'`.
- Invoice `INV-202605-0001` (`_id: 6a1897b9297d5ccbe641b2fb`): `status` back to `'overdue'`, `paidDate` back to `null`.
- The `transactionModel` document created by the original "Mark as Paid" click (`_id: 6a64ac87268ca2951086427e`) was deleted entirely.

No other orders/invoices/transactions for this user were touched. This revert makes the exact original bug scenario reproducible again for whoever picks up the fix.

## 6. Files touched this session (complete list)

- 27 files moved: `frontend/src/pages/*` -> `frontend/src/pages/old-code-backup/*` (see Section 1 for names).
- `frontend/src/pages/CustomerDashboard.js` — one-line route fix (Section 2).
- `frontend/src/pages/UserUpdateDashboard.js` — card rebuilt for plan-type-aware status (Section 3).
- `frontend/src/pages/PlanDetails.js` — **new file** (Section 4).
- `frontend/src/routes/customerRoutes.js` — one new route entry for `PlanDetails`.
- `frontend/src/pages/ProjectsAndPlans.js` — `openDetails()` now type-branches (Section 4a).
- `backend/controller/order/getOrderDetails.js` — one-line `populate()` field-list extension (Section 4d).
- **Not touched, confirmed and left alone on purpose**: `ProjectDetails.js`, `UpdateRequestModal.js`, `submitUpdateRequest.js`, `getUserUpdateRequests.js`, any model/schema file, `pages_backup_login_20260705_193957/`.
- **Not fixed, confirmed and deferred on purpose**: `invoiceLifecycle.js`'s `resumeOrderForPaidInvoice()` multi-invoice bug (Section 5); the invoice/transaction dual-write pattern (Section 5); `checkRenewalStatus.js`'s pre-existing query bug and missing cron wiring (found in an earlier pass this session, documented here for continuity — this file's `'productId.isMonthlyRenewablePlan': true` query pattern cannot match through an unpopulated ObjectId reference, and `checkAndUpdateRenewalStatus()` is only reachable via a manual-trigger route, never an actual scheduled cron).
