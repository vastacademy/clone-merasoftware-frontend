# Plan System — Requirement Understanding (Pre-Planning)

**Status**: Requirement-gathering only. No code changed yet. Read this before starting any plan-system implementation work.

**Read alongside**: `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md` (plan-details customer page history), `25_ORDERS_PLANS_UI_AND_ADMIN_PLAN_LISTING.md` (admin plan list/add UI history), `admin-plan.md` (admin control philosophy, Phase 3 "Plan add/remove, Date modifications" — unbuilt intent this doc supersedes/expands).

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

This document captures **requirement understanding only**. Architecture (e.g. whether this becomes one generic `planConfig` sub-schema vs. extending the existing 3-boolean pattern) is an open decision for the planning phase, not decided here. No schema, controller, or UI change has been made as part of this document.
