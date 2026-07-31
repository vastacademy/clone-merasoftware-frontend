# Service Plan System — "Generic" Rename, Customer-Facing Tab/Detail Page, and Legacy Order Migration (Additive)

**Session date**: 2026-07-29
**Scope**: (1) Renamed every "Generic Plan" occurrence (fields, files, docs) to "Service Plan" across the whole codebase. (2) Made Service Plan products visible to customers for the first time — widened the `StartNewProject.js` "Plans" tab (renamed "Service Plans") and built a new pre-purchase preview page, `ServicePlanDetail.js`. (3) Verified, via live read-only DB checks, that admin can no longer create legacy-type plans through any UI path. (4) Designed and ran a **dry-run-first, backup-first, additive-only** migration that gives the one real live customer's 3 existing legacy plan orders new Service Plan tracking fields, without touching or removing any legacy field/logic.
**Read this before touching**: `productModel.js`, `orderProductModel.js`, `createServicePlan.js`, `getAdminPlanProducts.js`, `AdminCreatePlanPage.js`, `AdminPlanProductsPage.js`, `StartNewProject.js`, `ServicePlanDetail.js` (new), `customerRoutes.js`, or before running/adapting `backend/scripts/migrateLegacyPlansToServicePlan.js`.
**Read alongside**: `plansystem.md` (full requirement + design history — this session implements a small additive slice of §5.1's "proposed" `orderProductModel.js` fields, nothing else from the design), `26_SERVICE_PLAN_SYSTEM_PHASE_1.md` (Phase 1 — admin create form + schema + listing, done in the prior session, called "Generic Plan" at the time).

## 1. Rename: "Generic Plan" → "Service Plan", everywhere

The user decided `26_SERVICE_PLAN_SYSTEM_PHASE_1.md`'s naming ("Generic Plan System") was not a professional-sounding name and asked for a full rename with **zero** remaining occurrences of "generic" anywhere in the plan-system code, schema, or docs.

**Renamed** (backend): `productModel.js`'s `isGenericPlan` → `isServicePlan`, `genericPlan{}` → `servicePlan{}`; `createGenericPlan.js` → **file renamed** to `createServicePlan.js` (function `createGenericPlanController` → `createServicePlanController`, `category: "generic_plan"` → `"service_plan"`); `routes/index.js`'s import/route wiring updated; `getAdminPlanProducts.js`'s query/select fields updated.

**Renamed** (frontend): `frontend/src/common/index.js`'s `SummaryApi.createGenericPlan` → `createServicePlan`; `AdminCreatePlanPage.js`'s fetch call updated; `AdminPlanProductsPage.js`'s `GENERIC_PLAN_TYPE_LABELS` → `SERVICE_PLAN_TYPE_LABELS` and all `plan.isGenericPlan`/`plan.genericPlan` reads → `isServicePlan`/`servicePlan`.

**Renamed** (docs): `plansystem.md`, `README.md` — bulk text replace of every naming occurrence (`isGenericPlan`, `genericPlan`, `generic_plan`, `createGenericPlan`, `GENERIC_PLAN_TYPE_LABELS`, "Generic Plan System", "Generic Plan") to their Service Plan equivalents. `26_GENERIC_PLAN_SYSTEM_PHASE_1.md` → **file renamed** to `26_SERVICE_PLAN_SYSTEM_PHASE_1.md`. Plain-English uses of the word "generic" as a normal adjective (e.g. "a generic, service-agnostic plan builder", unrelated docs like `12_CLIENT_ACTIVITY_SORT_AUDIT.md`'s "generic customer `updatedAt` value") were deliberately left alone — only naming/identifier occurrences were renamed.

Verified via `grep` across the full repo after the rename: zero remaining `GenericPlan`/`isGenericPlan`/`createGenericPlan`/`GENERIC_PLAN_TYPE` matches outside a local backup folder (`_rename_backup_work1/`, created for this session, not part of the app).

## 2. Customer-facing: Service Plans now show in `StartNewProject.js`

Before this session, Service Plan products (`category: "service_plan"`) were saved and listable in the **admin** Plans list (`26_SERVICE_PLAN_SYSTEM_PHASE_1.md`), but were invisible to customers — `StartNewProject.js`'s "Plans" tab only included the legacy `website_updates` category.

**Changed**, `frontend/src/pages/StartNewProject.js`:
- Tab label: `'Plans'` → `'Service Plans'`.
- `TAB_CATEGORIES.plans`: `['website_updates']` → `['website_updates', 'service_plan']` — legacy and new plans now list together in the same tab, side by side, with no visual distinction (matching the admin list's existing behavior and the user's explicit instruction: "plan tab mein hi sare new created plan dikhenge to thik hai").
- `CATEGORY_STYLE`: added a `service_plan` entry (same icon/color as `website_updates`, for visual consistency).
- List-row click routing: rows with `category === 'service_plan'` now navigate to `/service-plan-detail/:id` (new); everything else still navigates to the unchanged `/start-new-project/:projectId`.

**Confirmed not needed for this step** (verified by reading the row markup): the list row itself only renders `serviceName`, `category` (for the icon), and `description` — no price/validity/update-count field is shown at this level, so no row-level markup change was required for Service Plan compatibility.

## 3. New page: `ServicePlanDetail.js` — pre-purchase preview, not the purchased-plan view

The user initially asked to reuse the existing `PlanDetails.js` for this. Investigation (confirmed via `customerRoutes.js` and `ProjectsAndPlans.js`) showed `PlanDetails.js` is a **different, already-live** page — it shows a customer's **already-purchased** plan (usage donut, days left, request history), reached only from `ProjectsAndPlans.js` clicking an owned order. It is not reachable from a public/browse context and was ruled out as the wrong target.

**New file**: `frontend/src/pages/ServicePlanDetail.js`, route `/service-plan-detail/:planId` (added to `customerRoutes.js`, inside the existing `CustomerProtectedRoute` wrapper, same pattern as `plan-details/:orderId`). Fetches via the **existing** `POST /api/product-details` (`SummaryApi.productDetails`) — no new backend endpoint was needed, since `servicePlan{}` is already returned by that endpoint (schema field added in Phase 1).

**Section order** (chosen deliberately as a step-by-step "what is it → what do I get → how long → price → decide" reading flow, not the admin's data-entry order):
1. Header (Back button, plan name, plan-type label)
2. Description
3. **What You Get** — Portal Access + Limit Scope combined into one readable sentence (e.g. "5 use(s) per month", not two separate label/value rows) per explicit user preference, plus Files Limit
4. **Plan Validity** — validity duration, then billing cycle label if set
5. **Price** — both Base Price (struck through) and Selling Price shown, per explicit user instruction (differs from the legacy `ProjectDetailView.js`, which shows no price at all by design)
6. **Purchase button — deliberately a dummy stub** (`onClick={() => {}}`), per explicit user instruction ("abhi purchase button dummy hoga"). Real order-creation wiring is out of scope for this session — see §5 below for why.

Not touched: `ProjectDetailView.js`, `StartNewProjectDetail.js`, `PlanDetails.js` — all remain exactly as they were; `ServicePlanDetail.js` is a new, separate file with its own inline markup (does not reuse `ProjectDetailView.js`, since that component's fields — `perfectFor`, `packageIncludes`, `additionalFeatures` — are legacy-project-specific and don't apply to a Service Plan).

## 4. Verified: admin can no longer create a legacy-type plan through any UI path

Before deciding to migrate/retire the legacy plan-type system, the user asked to confirm whether admin can still create an old-style (Simple/Monthly Renewable/Monthly Limited) plan today. Verified via direct route-file inspection, not assumption:

- `frontend/src/routes/adminRoutes.js` has exactly two plan-related routes: `/admin-panel/website-management/plans/add` → `AdminCreatePlanPage` (the new Service Plan form) and `/admin-panel/website-management/plans` → `AdminPlanProductsPage` (listing).
- `UploadProduct.js` (the component containing the legacy 3-type creation form/logic: `isMonthlyRenewablePlan`/`isMonthlyLimitedPlan` radio branches) and `AllProducts.js` are **not registered in any route file** (`adminRoutes.js`, `customerRoutes.js`, `publicRoutes.js`) — confirmed via full-repo grep. `AllProducts.js` only exists inside `old-code-backup/` and a dated backup folder.

**Conclusion**: the legacy creation UI is unreachable dead code today — admin has no way to create a new legacy-type plan. This confirmed it was safe to proceed to planning the live customer's migration, since no new legacy plans can be created to complicate it further.

## 5. Why legacy plan code cannot simply be deleted yet

The user's stated goal was to **fully remove** the legacy plan-type system while keeping the one real live customer's existing plan(s) running without disruption. Investigation established these two goals conflict if attempted in one step: the legacy code (`autoRenewalCron.js`, `invoiceLifecycle.js`, `submitUpdateRequest.js`'s legacy branches, `createOrder.js`'s `isWebsiteUpdate`/`isMonthlyLimitedPlan` branches, etc. — the same ~20-backend-file list from `plansystem.md` §2.1) **is** the engine currently running that customer's plan. Deleting it would break the customer's plan immediately, not just remove unused code.

**Agreed path**: migrate the customer's live plan data into the new Service Plan shape first (this session), verify it, and only once a working Service Plan enforcement/cycle engine exists and has been proven equivalent, retire the legacy code. This session only completes the first step (data migration) — no legacy code was touched or removed.

## 6. Schema prerequisite: `orderProductModel.js` gained additive Service Plan tracking fields

Before migrating any order, a gap was confirmed: `orderProductModel.js` (the live per-customer order document) had **no** Service Plan fields at all — `plansystem.md` §5.1 had only ever proposed these as a design, never implemented them. Added, purely additively, after the existing "Plan closure fields" block, matching `productModel.js`'s naming:

```
isServicePlan: Boolean (default false)
servicePlanSnapshot: { planType, limitScope, manualUnit, manualCount, portalAccessCount,
                        filesLimit, validityUnit, validityValue, validityInDays, billingCycle }
servicePlanStartDate / servicePlanEndDate: Date
serviceCurrentCycleNumber: Number (default 1)
serviceCurrentCycleStart / serviceCurrentCycleEnd: Date
serviceAccessUsedInCycle / serviceAccessUsedTotal: Number (default 0)
serviceCycleHistory: [{ cycleNumber, cycleStart, cycleEnd, accessUsed }]
servicePlanStatus: enum ['active','paused','expired','cancelled'] (default 'active')
```

No existing `orderProductModel.js` field was renamed, removed, or had its type/validator changed. `servicePlanSnapshot` deliberately freezes the plan's config at purchase/migration time (same rationale as `plansystem.md` §5.1) so a later change to a plan template can never silently alter what a customer already has.

## 7. Live DB audit (read-only) — real customer/data found

New read-only script `backend/scripts/readOnlyAuditLegacyPlans.js` (no writes, `find`/`.lean()` only) was run against the live DB and found:

- **5 legacy plan products**: "Basic Update Plan" (simple, 30-day/2-update), "Support Portal - Single Update" (simple, 7-day/1-update), "Yearly Website Updates Plan - Monthly Renewable" (`isMonthlyRenewablePlan`, `isUnlimitedUpdates`, 365-day, ₹8000/month), "Standard Plan" (`isMonthlyLimitedPlan`, 2 updates/month, ₹3000/month, 365-day), "Website Single Section Addition" (simple, 2-day/1-update).
- **1 real customer** ("SLN College", masked here as `s***@gmail.com`, matching the customer already identified in `plansystem.md`) with **3 legacy plan orders**:
  1. "Standard Plan" order — `isActive: false`, `autoRenewalStatus: 'paused'`, 7 updates used historically.
  2. "Support Portal - Single Update" order — `isActive: true` in the legacy field, but its 7-day validity window (purchased 2025-09-08) had already elapsed by the time of this audit.
  3. "Website Single Section Addition" order — `isActive: true` in the legacy field, but its 2-day validity window (purchased 2026-05-01) had already elapsed by the time of this audit.

Orders #2 and #3 are a **pre-existing legacy data-quality gap**, not something introduced this session: the legacy `isActive` boolean is never flipped to `false` on expiry by any cron/logic found so far — it only reflects whether the order was ever activated, not whether it's still within its validity window. This was surfaced to the user, who confirmed (per the resolution in §8) that both should be treated as `expired` in the new system regardless of the stale legacy flag.

## 8. Migration script — dry-run default, backup-before-apply, additive-only

New script: `backend/scripts/migrateLegacyPlansToServicePlan.js`. Scope, by explicit user decision: **order-level only** — the 5 legacy product *templates* are deliberately left untouched (they may still be referenced/displayed elsewhere), only the customer's 3 order documents gain new fields.

**Safety design**:
- Default mode is dry-run — reads the DB, prints a `BEFORE` (existing legacy fields, verbatim) / `AFTER` (new fields that would be set) block per order, and writes nothing.
- `--apply` flag is required to actually write. Before any write, the script dumps the full, unmodified original order documents to `backend/migration-backups/legacy-plan-orders-before-migration-<timestamp>.json` — a complete point-in-time snapshot, not just the changed fields, so a full manual restore is possible if anything goes wrong.
- All writes are `$set`-only additive field updates (`orderProductModel.updateOne(..., { $set: newFieldsOnly })`) — no legacy field is ever read for the purpose of overwriting/removing it, only for computing the new field's value.

**Field mapping logic** (`buildSnapshotFromLegacyProduct`, mirrors `createServicePlan.js`'s field shape exactly, no new shape invented):
- `isMonthlyLimitedPlan` → `limitScope: 'per_month'`, `portalAccessCount` from `monthlyUpdateLimit`, `billingCycle: 'monthly'`, validity from `yearlyPlanDuration`.
- `isMonthlyRenewablePlan` → `limitScope: 'unlimited'`, same validity/billing mapping.
- Simple/one-time → `limitScope: 'per_plan'`, `portalAccessCount` from `updateCount`, validity from `validityPeriod` (days).
- `filesLimit` is set to `20` for every migrated order in this pass — matching today's actual hardcoded global file-upload cap (`backend/routes/index.js` multer config, `UpdateRequestModal.js`), since no per-plan file-limit ever existed for these legacy products to migrate from.
- `servicePlanStatus` resolution (added after user review of the dry-run output, see §7): `expired` if `servicePlanEndDate` (start date + validity) has already passed **regardless of the legacy `isActive` value**; else `paused` if legacy `isActive === false`; else `active`. This is why orders #2 and #3 above ended up `expired` even though their legacy `isActive` was `true`.

**Executed**: dry run reviewed and approved by the user; `--apply` run completed. Backup written to `backend/migration-backups/legacy-plan-orders-before-migration-1785338285005.json`. Post-apply read-only verification (separate ad-hoc query) confirmed all 3 orders now carry `isServicePlan: true` plus the correct `servicePlanSnapshot`/`servicePlanStatus`, and that every pre-existing legacy field (`isActive`, `updatesUsed`, `autoRenewalStatus`, etc.) is byte-for-byte unchanged.

## 9. What remains explicitly out of scope / not done this session

- **No enforcement/cycle engine exists yet.** The new `servicePlanSnapshot`/cycle fields on `orderProductModel.js` are populated but **nothing reads them yet** — no controller checks `serviceAccessUsedInCycle` against `servicePlanSnapshot.portalAccessCount`, no cron advances `serviceCurrentCycleStart/End`. The customer's actual plan behavior today is still driven **entirely** by the legacy fields/cron/controllers, unchanged. This is the necessary next step before any legacy code can be retired — see `plansystem.md` §5.3/§6 for the original (still unbuilt) design of this engine.
- **No purchase wiring for the new "Proceed to Payment" buttons.** A separate deep-dive this session (not yet acted on) traced the existing one-time/installment payment flow (`ProductDetails.js` → `DirectPayment.js` → `createOrder.js` → `verifyPaymentController.js`/`transactionApprovalController.js`, always ending in manual admin approval, never automatic) and confirmed it can be reused for both `StartNewProjectDetail.js`'s and `ServicePlanDetail.js`'s dummy buttons with no backend change required for the legacy-project case. However, `createOrder.js:47`'s hardcoded `isWebsiteUpdate = category === 'website_updates'` check means a real Service Plan purchase today would silently get no `isActive`/tracking initialization — a confirmed, not-yet-fixed gap. No button was wired this session; both remain dummy stubs by explicit user instruction.
- **Legacy plan-type system itself (~20 backend files) was not touched, migrated, or removed.** Only additive schema fields and additive order-document data were added alongside it.
- **The 5 legacy plan *product* templates were not migrated** — only the 3 customer *order* documents. Per user decision (§8), product-template migration was explicitly out of scope for this pass.
- **Revert path, if ever needed**: the new fields are additive-only, so removing them (`$unset`) or restoring from the timestamped backup JSON would fully undo this migration without affecting any legacy field, since no legacy field was ever modified.
