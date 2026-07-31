# Plan System — Requirement Understanding + Design Proposals

**Status**: Sections 1-4 below are the original requirement-gathering (pre-planning, no code). Sections 5-6 are two design proposals written after that requirement-gathering, before `26_SERVICE_PLAN_SYSTEM_PHASE_1.md` implemented Phase 1 (admin create form + additive schema + save endpoint + listing only). Sections 5-6 describe the **full intended system** (including customer-facing purchase/enforcement/billing) — most of it is still **design only, not implemented**; read `26_SERVICE_PLAN_SYSTEM_PHASE_1.md` for what has actually been built so far.

**Read alongside**: `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md` (plan-details customer page history), `25_ORDERS_PLANS_UI_AND_ADMIN_PLAN_LISTING.md` (admin plan list/add UI history), `26_SERVICE_PLAN_SYSTEM_PHASE_1.md` (what was actually implemented from this design), `admin-plan.md` (admin control philosophy, Phase 3 "Plan add/remove, Date modifications" — unbuilt intent this doc supersedes/expands).

## 1. The core concept: the portal is the product, plans control access to it

The customer-facing thing being sold is **one portal**: a system where the customer uploads data/files for ongoing work (currently framed as "website updates" but the user's stated intent is broader — any service delivered through this same portal, e.g. digital marketing data uploads, social media content uploads, GBP setup material uploads, etc.).

**Plans do not each need their own separate system.** A plan is a bundle of settings that controls **how a given customer may use the one portal**:
- How much access (unlimited vs limited, and if limited, how much per cycle)
- How many files can be uploaded per submission/window (unlimited vs a fixed count)
- What service type this access is for (admin-selectable, not hardcoded)
- Tenure and billing terms
- What happens to unused allowance at cycle boundaries

Every "benefit" the admin can grant is meant to be a configurable knob inside plan creation, not a hardcoded plan-type branch in code.

## 2. Current system — verified, not assumed

### 2.1 Plan-type is hardcoded to 3 fixed shapes

`backend/models/productModel.js` defines exactly three mutually-exclusive plan types via booleans, each with its own fixed field set:

| Boolean | Fields it validates/uses |
|---|---|
| `isWebsiteUpdate` (simple) | `validityPeriod` (days, 1-365), `updateCount` |
| `isMonthlyRenewablePlan` | `yearlyPlanDuration` (days), `monthlyRenewalCost` |
| `isMonthlyLimitedPlan` | `yearlyPlanDuration` (days), `monthlyUpdateLimit`, `monthlyRenewalPrice` |
| `isUnlimitedUpdates` | boolean only — governs update-request **count**, nothing else |

`category` is a free-form string with no dropdown/enum source found anywhere in the codebase — every category value (`website_updates`, `standard_websites`, `feature_upgrades`, etc.) is a string literal duplicated across files, not a managed list.

### 2.2 `AdminCreatePlanPage.js` — UI-only, mirrors the 3 hardcoded types

`frontend/src/pages/AdminCreatePlanPage.js`: has a `PLAN_TYPES` array hardcoded to exactly `simple` / `monthlyRenewable` / `monthlyLimited`, with a form section per type. **Not wired to any save API** — `handleFormSubmit` only calls `event.preventDefault()`. No service-type dropdown exists (no digital marketing / GBP / social media options anywhere).

### 2.3 Order-level tracking (`orderProductModel.js`) is equally hardcoded

The live per-customer plan instance tracks cycle state via fixed fields: `currentMonthUpdatesUsed`, `currentMonthUpdatesLimit`, `monthlyLimitResetDate`, `totalYearlyDaysRemaining`, `autoRenewalStatus` (`active`/`paused`/`expired`), `monthlyRenewalHistory[]`. These only make sense for the update-count use case — there's no generic "entitlement unit" concept.

### 2.4 File-upload limit (the portal's actual access-control surface) — hardcoded in 3 unrelated places, not plan-driven at all

Verified via direct code search:

- **Backend multer config** — `backend/routes/index.js:117-122`: `limits: { fileSize: 5 * 1024 * 1024, files: 20 }`
- **Frontend modal** — `frontend/src/components/UpdateRequestModal.js:22-23`: local constants `maxFileSize`, `maxFileCount = 20`, plus the literal `20` repeated 5+ more times in UI copy/disabled-state logic in the same file
- `UpdateRequestModal.js` **receives the `plan` prop but never reads it for file limits** — `plan` is only used for update-count/status checks elsewhere in the same file
- `backend/models/updateRequestModel.js` (the submitted-request document) has **no file-count/size field at all**
- `backend/controller/user/submitUpdateRequest.js` reads only `adminSettings.fileExpirationDays` from global `AdminSettings` — no per-plan/product file-limit config is read anywhere

**Conclusion**: every plan today, regardless of type, gets the identical fixed 20-files/5MB cap. This is the single biggest gap versus the stated requirement — the portal's actual access control (file count) isn't connected to the plan system at all right now.

### 2.5 No admin plan-edit/upgrade capability exists

Confirmed absent from `backend/routes/index.js` — no route lets admin change a live customer's plan (billing cycle, per-cycle allowance, etc.) after purchase. `admin-plan.md`'s Phase 3 ("Plan add/remove", "Date modifications") is documented intent only, never implemented.

## 3. What the user needs (confirmed requirement, in the user's own priority order)

1. **Service type is admin-selectable**, not hardcoded — dropdown covering website update, digital marketing, GBP setup, social media marketing, and any future service delivered through the same portal.
2. **Tenure**: one-time or yearly.
3. **Billing cycle**: independent of tenure — e.g. a yearly-tenure plan can still be billed monthly or quarterly. Admin sets this explicitly, it's not derived.
4. **Per-cycle entitlement, generic unit**: "N units per cycle" where the unit's meaning depends on service type (website updates for one plan, data-upload windows for a digital-marketing plan) — not two separately hardcoded field names as today.
5. **Cycle behavior is a choice**: reset each cycle (unused allowance lost) vs accumulate/carry-forward across cycles.
6. **Portal file-upload access is itself a plan benefit, not a global constant**:
   - Unlimited, or
   - Limited to an admin-set file count per upload/request (replacing the hardcoded 20 wherever it currently lives)
7. **Price** (base + selling) and **description** stay admin-managed, as today.
8. **Admin has full runtime power over a live customer's plan** — not just at creation:
   - Change billing cycle after the fact (e.g. every-3-months -> monthly or yearly)
   - Change per-cycle allowance after the fact
   - When a cycle-length change happens, admin controls how already-accumulated-but-unused entitlement converts — the user's own example: a plan with 2 updates/month, billed every 3 months, that resets monthly — if admin changes it so unused allowance carries forward instead of resetting, the customer should end up with all 6 updates (2 × 3 months) available at once, and admin decides whether that conversion happens, not an automatic silent rule.
9. **Design goal stated explicitly**: the plan-create/edit system must be broad enough that *any* combination of the above is achievable through configuration — adding a new service type in the future should not require adding a new hardcoded boolean + matching field set + matching UI branch, the way `isWebsiteUpdate`/`isMonthlyRenewablePlan`/`isMonthlyLimitedPlan` work today.

## 4. Scope note

Sections 1-3 above capture **requirement understanding only**, as originally written. The architecture question they leave open was resolved in Section 5 below: an **additive/coexist** approach (new generic fields alongside the legacy 3-boolean pattern, not replacing it) — chosen specifically because a live, read-only DB check (see Section 5's "Coexist vs delete" note) found one real customer with active legacy plans, ruling out a straight delete-and-replace.

## 5. Design Proposal — Core Service Plan System (plan creation + full customer-facing enforcement)

**Status when written**: design only, for stakeholder approval, no code. **What was actually implemented from this**: only the "New schema fields" (§5.1) and "New admin write path" (§5.2) portions — as Phase 1, see `26_SERVICE_PLAN_SYSTEM_PHASE_1.md`. Everything about customer-facing enforcement, cycle engine, and purchase-flow wiring below is **still design only, not built**.

### Coexist vs delete — why migration was ruled out for now

Before this design was written, a read-only check of the actual configured database (a clone that will eventually replace the real production site) found: **1 real customer**, 2 currently-active legacy plan orders, 8 completed payment transactions, 5 paid invoices. This is not test data. Given that, deleting the legacy plan-type system outright (without migrating this customer's data) was rejected — the agreed approach is **coexist now, migrate later via an explicit, separate, dry-run-and-backup-first script**, once one exists. The repo's existing migration scripts (`backend/scripts/migrateAddIsHiddenField.js`, `convertRoleToRoles.js`) have no dry-run/backup safeguards and should not be copied as-is for this migration.

### 5.1 New schema fields (IMPLEMENTED in Phase 1)

`productModel.js` (the plan template): additive `isServicePlan: Boolean` + a nested `servicePlan` object — `planType`, `limitScope` (`per_day`/`per_week`/`per_month`/`per_plan`/`unlimited`/`manual`, later extended to also include `per_quarter`/`per_6_month`/`per_year` — see `26_SERVICE_PLAN_SYSTEM_PHASE_1.md`), `manualUnit`/`manualCount` for the manual-scope case, `portalAccessCount`, `filesLimit`, `validityUnit`/`validityValue`/`validityInDays`, `billingCycle`. New plans get `category: "service_plan"` (not `"website_updates"`) specifically so `productModel.js`'s existing `pre('save')` hook — which auto-sets `isWebsiteUpdate = (category === 'website_updates')` — can never accidentally flag a new service plan as a legacy one.

`orderProductModel.js` (the live per-customer purchase instance) — **proposed, not yet implemented**: additive `isServicePlan`, a `servicePlanSnapshot` (a frozen copy of the plan's `servicePlan` config *at purchase time* — critical so a future admin edit to the plan template never silently changes what an existing paying customer already bought), `servicePlanStartDate`/`servicePlanEndDate`, `serviceCurrentCycleNumber`/`serviceCurrentCycleStart`/`serviceCurrentCycleEnd`, `serviceAccessUsedInCycle`/`serviceAccessUsedTotal`, `serviceCycleHistory[]`, `servicePlanStatus`.

### 5.2 New admin write path (IMPLEMENTED in Phase 1)

New route `POST /api/admin/plans/create` -> new controller `backend/controller/product/createServicePlan.js` — deliberately **not** built on the legacy `uploadPoduct.js` (which spreads `req.body` with no whitelist and has special-case forcing logic for `isMonthlyRenewablePlan`). The new controller uses an explicit field whitelist, re-validates everything server-side (never trusts the client), and can never set any legacy boolean/field. See `26_SERVICE_PLAN_SYSTEM_PHASE_1.md` for the exact implementation.

### 5.3 Customer-facing enforcement — NOT IMPLEMENTED, design only

**Portal-access-count enforcement**: proposed additive branch in `submitUpdateRequest.js` (inserted before the existing legacy checks, which stay completely untouched for legacy plans) via a new shared helper file, `backend/helpers/servicePlanEngine.js` (not yet created). Two real correctness issues were flagged for whoever implements this: (a) a double-spend/race-condition risk if the access-count check and increment aren't atomic — recommend consuming the slot via a single conditional `updateOne` before the Google Drive upload starts, releasing it if the upload fails; (b) today's legacy code counts a request as "used" even if all its files fail to upload — the new path should refund the slot in that case instead of repeating the bug.

**Files-limit enforcement — the hardest real technical constraint**: multer's file-count limit is configured once at server boot (`backend/routes/index.js` ~line 117-122), not per-request, so it cannot read a per-plan value directly. Three options were evaluated; **recommended: Option 1** — set multer's limit to a fixed hard ceiling (e.g. 30 files, covering the worst case any plan could need) as a safety cap, then do the *actual* per-plan check authoritatively inside the controller once the plan is loaded from the DB, before the Drive upload starts. This means the admin form's Files Limit field must never be allowed to exceed whatever ceiling is chosen — `createServicePlan.js`'s `MAX_FILES_LIMIT` constant (currently 100) and this ceiling need to be reconciled/kept in sync when this phase is built. Options 2 (dynamic per-request multer middleware) and 3 (fully separate route + duplicated Drive-upload code) were both rejected as more complex/riskier for a first cut.

**Cycle reset vs accumulate**: recommend **reset** (unused allowance lost each cycle boundary) as the default, matching today's legacy `autoRenewalCron.js` behavior, computed via **lazy roll-forward** (checked/advanced whenever the customer takes an action, not solely via a cron) plus a secondary nightly cron for hygiene/reminders. A calendar-vs-fixed-days question for `per_month` cycles was flagged: recommend fixed 30-day windows (matching how `validityInDays` is already derived), not calendar months, to avoid drift/edge cases (e.g. 31 Jan + "1 month").

**Billing Cycle's actual runtime meaning** — see Section 6, this was revised after the stakeholder clarified real recurring payment is required, not just a display label.

### 5.4 Explicit non-goals restated

No changes to the ~34-file legacy plan-type system (models/controllers/helpers/cron/frontend pages listed in Sections 2.1-2.4 above and re-verified via live code search before this design was written). No migration of the one real customer's existing plans in this phase. No image upload (field was removed from the form entirely — see `26_SERVICE_PLAN_SYSTEM_PHASE_1.md`).

## 6. Addendum — Recurring Billing for Service Plans (NOT IMPLEMENTED, design only)

**Status when written**: design only, no code. Written after the stakeholder explicitly confirmed that "Billing Cycle" is not just a label — if a plan's billing cycle is `monthly`, the customer must actually be charged again every month, and this requires **a brand-new, fully separate invoicing/payment-tracking system for service plans** — explicitly **not** an extension of the legacy `monthlyInvoiceModel`/`invoiceLifecycle.js`/`autoRenewalCron.js` pipeline (that reuse option was directly rejected).

### 6.1 What changes for the customer (concrete scenario)

Example: a ₹12,000 / 6-month / monthly-billed Digital Marketing plan. Recommended reading (flagged as **Open Question N**, needs stakeholder confirmation): ₹12,000 is the *total* plan price, so each monthly installment is ₹2,000 — not ₹12,000 charged every month. First installment is charged at purchase time. Each subsequent cycle, a new invoice is generated ahead of/at the due date; if unpaid past a grace period (recommended: 3 days, since legacy has none and admin's manual payment-verification step needs time to avoid falsely penalizing a customer who paid on time), the plan is **paused** (portal access + file upload blocked; plan dashboard, history, and payment itself all stay accessible) — never auto-cancelled. Recommended: 2 consecutive missed cycles triggers an admin alert, but only a human admin decides to actually cancel/refund.

### 6.2 New schema (design only)

A new sibling model, `servicePlanInvoiceModel.js` — deliberately not reusing `monthlyInvoiceModel.js`, because that model's own field naming (`renewalMonth`, commented "1-12") is hardcoded to a 12-month yearly cadence and cannot correctly represent weekly/quarterly/half-yearly cycles. The new model reuses the same `status` enum values (`unpaid`/`paid`/`overdue`/`cancelled`, plus a new `waived`) specifically so the existing admin Payment & Invoices UI (`AdminClientWorkspace.js`, which filters by `status` string values, not by model/collection) can display both invoice types with no UI changes. New fields include `cycleNumber`/`totalCycles` (uncapped, unlike legacy's 1-12), `billingCycle` (snapshotted per invoice), `graceEndsAt` (new — legacy has no grace period at all), and pause-duration tracking (`causedPause`, `pausedAt`/`resumedAt`) to support "give back days lost to a pause" (recommended, **Open Question P**).

`orderProductModel`'s proposed `servicePlan` section (§5.1) additionally needs: `billingEnabled`, `amountPerCycle`, `totalCycles`, `cyclesBilled`/`cyclesPaid`, `nextInvoiceDate`/`nextDueDate`, `currentInvoiceId`, a new `billingStatus` enum (deliberately separate from legacy's `autoRenewalStatus`), `consecutiveMissedCycles`, and pause tracking (`pausedForNonPayment`, `pausedAt`, `totalPausedDays`).

### 6.3 New invoice generation + payment collection (design only)

A new, separate cron (`backend/cron/servicePlanBillingCron.js`, proposed schedule: 2:00 AM IST — one hour after the legacy `autoRenewalCron.js`'s 1:00 AM, for clean log/load separation) would generate upcoming invoices, mark overdue/pause plans (respecting the new grace period, unlike legacy), and send reminders — with an explicit double-safety filter (`isServicePlan: true` AND NOT any legacy plan-type boolean) so it can never process a legacy order, mirroring (not modifying) `autoRenewalCron.js`'s own existing safety-filter pattern.

**Payment collection mechanism is mostly reusable**: tracing the actual customer payment flow (`DirectPayment.js` -> `verifyPaymentController.js` -> admin approval -> `transactionApprovalController.js`) found that the UPI/wallet/admin-verification UI and `transactionModel` need no changes — only two additive touch-points: `verifyPaymentController.js` needs a new optional `serviceInvoiceId` field alongside its existing `invoiceId`, and `transactionApprovalController.js` needs one new branch checking for it, both alongside (not replacing) the existing legacy-invoice logic. A **pre-existing bug, unrelated to this proposal**, was flagged for whoever implements this: `InvoiceDetailPage.js` sends an `invoicePayment`/`invoiceId` navigation-state payload that `DirectPayment.js` never actually reads — meaning legacy invoice "Pay Now" may not correctly link payments to invoices today. This should be verified/fixed before generic-plan invoices reuse the same route, or the new system will inherit the same defect.

### 6.4 Overdue handling integration point

The `canConsumeAccess()` helper proposed in §5.3 needs one more check added at the very front: if `servicePlan.pausedForNonPayment === true`, block immediately with a message pointing at the pending invoice — checked in real time on every request, not solely relying on the once-daily cron, so access isn't wrongly granted between a missed grace-period deadline and the next cron run.

### 6.5 Revised build order (design only)

Original 5-phase plan (schema+admin-create, purchase, cycle engine, enforcement, nightly cron) gains 3 new sub-phases for billing, inserted so that billing-cron work depends on the cycle engine existing first, and enforcement (Phase 4) is pushed to also depend on the new billing/payment phase (since `canConsumeAccess()` needs both cycle state and billing status). See the addendum's full table for exact dependency ordering if resuming this work.

### 6.6 Open questions still needing stakeholder confirmation (billing-specific)

Grace period length (recommended 3 days); whether missed-cycle days are given back once paid late (recommended yes); how many missed cycles before an admin alert / whether auto-cancel should ever happen (recommended: never automatic); whether the first cycle's payment is collected at purchase time (recommended yes); whether `per_month`-style cycles use calendar months or fixed 30-day windows (recommended fixed, for consistency with §5.1's `validityInDays` derivation); how aggressive reminders should be and whether WhatsApp (an existing `whatsappService.js` helper) should be used alongside email.
