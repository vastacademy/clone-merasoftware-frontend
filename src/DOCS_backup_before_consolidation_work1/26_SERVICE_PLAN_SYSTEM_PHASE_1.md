# Service Plan System — Phase 1: Admin Create Form Redesign + Backend Save Wiring + Listing

**Session date**: 2026-07-28 to 2026-07-29
**Scope**: Full redesign of the admin "Add Plan" form (`AdminCreatePlanPage.js`) from a copy of the legacy 3-plan-type shape into a generic, service-agnostic plan builder; a new, additive backend schema + save endpoint for these service plans; listing support so they appear in the existing admin Plans list. Customer-facing purchase/enforcement/billing is explicitly **not** part of this phase — see `plansystem.md` for the full requirement and design history.
**Read this before touching**: `AdminCreatePlanPage.js`, `AdminPlanProductsPage.js`, `productModel.js`, `getAdminPlanProducts.js`, `createServicePlan.js` (new), or before starting customer-facing plan work (purchase, portal-access enforcement, billing).
**Read alongside**: `plansystem.md` (full requirement-gathering + two design proposals — core system and recurring-billing addendum — written before this implementation), `25_ORDERS_PLANS_UI_AND_ADMIN_PLAN_LISTING.md` (the prior session that built the original UI-only form and read-only list this session replaces/extends), `admin-plan.md`.

## 1. Why a full form redesign, not an incremental edit

The form built in `25_ORDERS_PLANS_UI_AND_ADMIN_PLAN_LISTING.md` mirrored the legacy schema exactly: a "Plan Type" selector (Simple / Monthly Renewable / Monthly Limited) that revealed different fixed fields per type. Through extended requirement-gathering (recorded in full in `plansystem.md`), the user clarified the actual business need: **the portal itself is the product** — plans exist purely to control how much of the portal (request count, file-upload count) a customer gets, over what time window, for any service type (website update, digital marketing, Google Business Setup, social media marketing, etc.) — not just the one legacy "website update" case.

This meant the old 3-fixed-shapes form could not be incrementally patched; it needed a genuinely generic structure. Verified via evidence, not assumption, before designing anything:
- `productModel.js`'s 3 legacy booleans (`isWebsiteUpdate`, `isMonthlyRenewablePlan`, `isMonthlyLimitedPlan`) each had their own hardcoded field set — no shared generic concept existed.
- The portal's actual file-upload limit (20 files/5MB) was hardcoded in two unrelated places — `backend/routes/index.js` multer config and `frontend/src/components/UpdateRequestModal.js` — with zero connection to any plan field.
- A live, read-only DB check (see `plansystem.md` §"DB Check Result") found **one real customer** with 2 active legacy plan orders, 8 completed transactions, and 5 paid invoices — this is a clone of the production DB that will eventually replace the real site, so the legacy system could not simply be deleted; a **coexist-then-migrate** strategy was agreed (new system added alongside, old system untouched, migration of existing plans deferred to an explicit future phase).

## 2. Final form shape — `AdminCreatePlanPage.js`

Rebuilt through many small, individually-approved rounds (each confirmed via `AskUserQuestion` before coding — full blow-by-blow is in the conversation, this doc records only the final state and the key decisions). Route unchanged: `/admin-panel/website-management/plans/add`.

**Fields, in final on-page order**:

1. **Plan Name** (text), **Plan Type** (dropdown: Website Update / Digital Marketing / Google Business Setup / Social Media Marketing / Other)
2. **Plan Power** section, in this exact order:
   - **Portal Access** — dropdown `1`-`9` or `Manual` (reveals a free-number "Enter Portal Access" input). Always visible (not gated by Limit Scope) per explicit user instruction — this is the number of times the customer can use the portal.
   - **Limit Scope** — dropdown: Per Day, Per Week, Per Month, Per Quarter, Per 6 Month, Per Year, Per Plan, Unlimited, Manual. Defines the window the Portal Access count applies to.
     - **Manual** reveals **Manual Unit** (Day/Week/Month only — no Year, since a yearly manual window is already covered by the "Per Year" top-level option) and, once a unit is chosen, **Manual Count** — a *bounded* dropdown whose range depends on the unit: Day → 1-31, Week → 1-8, Month → 1-12. This replaced an earlier free-text "type any number" approach per explicit user request ("behtar approach") to prevent nonsensical values (e.g. a 500-day cycle).
   - **Files Limit** — dropdown `[1,2,3,4,5,10,15,20,25]` or `Manual` (reveals free-number "Enter Files Limit"). Always required — there is deliberately no "unlimited" option for file count, per explicit user instruction ("hamesha limited hi hongi").
3. **Plan Validity** section:
   - **Validity Unit** (Days/Weeks/Months/Years, plural labels per explicit user correction) + **Validity Value** (`1`-`9` or Manual free-number) — the plan's total lifespan.
   - **Billing Cycle** — dropdown, dynamically filtered to only the cycles that evenly divide the validity duration (in months), with Weekly always offered once validity ≥ 7 days. E.g. a 4-month plan offers only Weekly/Monthly (Quarterly hidden because 4 is not divisible by 3); a 6-month plan offers Weekly/Monthly/Quarterly/Half-Yearly (not Yearly). This exact divisibility rule is mirrored server-side in `createServicePlan.js` (§4).
4. **Description** (`RichTextEditor`), **Base Price**, **Selling Price** (moved to directly after Description per explicit request), **Visibility** (Visible/Hidden).

**Explicitly removed during this session**: a "Plan Image" upload field was built, then removed entirely (state, handler, `UploadCloud` import) per user instruction once analysis showed no Cloudinary/S3/image-upload helper exists anywhere in the codebase — building one was out of scope for this phase.

**Submit behavior**: `handleFormSubmit` now performs full client-side validation (mirroring the server's rules) and calls the new `SummaryApi.createServicePlan` endpoint (§3), showing `sonner` toasts and navigating back to the Plans list on success. This replaces the prior session's stub (`event.preventDefault()` only, no API call).

## 3. New backend save path — additive, does not touch the legacy save flow

**New route**: `POST /api/admin/plans/create` — `backend/routes/index.js`, registered directly after the existing read-only `GET /api/admin/plan-products` line, same `authToken` middleware pattern.

**New controller**: `backend/controller/product/createServicePlan.js` (new file). Deliberately **not** built on top of the legacy `backend/controller/product/uploadPoduct.js`, because that controller (a) spreads `req.body` directly into `productModel` with no field whitelist, and (b) has special-case forcing logic for `isMonthlyRenewablePlan` that could be accidentally triggered. The new controller instead:
- Requires `req.userRole === "admin"` (matches `getAdminPlanProducts.js`'s pattern).
- Reads an **explicit whitelist** of fields from `req.body` — never spreads it. The legacy booleans/fields (`isWebsiteUpdate`, `isMonthlyRenewablePlan`, `isMonthlyLimitedPlan`, `validityPeriod`, `updateCount`, etc.) can never be set through this endpoint, by construction.
- Re-validates everything server-side (plan type/limit scope/billing cycle enums, manual-scope unit+bounded-count rules, portal-access/files-limit ranges, the same billing-cycle-divides-validity-evenly rule the frontend enforces) — client-side validation is not trusted alone.
- Computes `validityInDays` itself (does not trust a client-supplied value).
- Saves with `category: "service_plan"` and `isServicePlan: true` — a **new, distinct category value**, not `"website_updates"`. This matters because `productModel.js`'s existing `pre('save')` hook (lines ~269-276) auto-sets `isWebsiteUpdate = (category === 'website_updates')`; using a new category value means new service plans can never accidentally fall into that legacy auto-flagging logic.

## 4. Schema changes — additive only, `productModel.js`

New top-level field `isServicePlan: Boolean` (default `false`) and a new `servicePlan` sub-object, added after the existing `isHidden` field — **no existing field was renamed, removed, or had its type/validator changed**:

```
servicePlan: {
  planType: enum [website_updates, digital_marketing, google_business_setup, social_media_marketing, other],
  limitScope: enum [per_day, per_week, per_month, per_quarter, per_6_month, per_year, per_plan, unlimited, manual],
  manualUnit: enum [day, week, month],
  manualCount: Number (min 1),
  portalAccessCount: Number (min 1),
  filesLimit: Number (min 1),
  validityUnit: enum [day, week, month, year],
  validityValue: Number (min 1),
  validityInDays: Number (min 1) — derived, computed server-side,
  billingCycle: enum [weekly, monthly, quarterly, half_yearly, yearly]
}
```

Verified before writing this: the `pre('save')` hook's three category checks (`websiteCategories`, `cloudCategories`, `=== 'feature_upgrades'`, `=== 'website_updates'`) all fail to match `"service_plan"`, so `isWebsiteService`/`isFeatureUpgrade`/`isWebsiteUpdate` all correctly resolve to `false` for new plans — confirmed safe, not assumed.

## 5. Listing support — `getAdminPlanProducts.js`, `AdminPlanProductsPage.js`

**`getAdminPlanProducts.js`**: query widened from `find({ category: "website_updates" })` to `find({ $or: [{ category: "website_updates" }, { isServicePlan: true }] })`, and the `.select(...)` field list extended to include `isServicePlan servicePlan`. This is the one exception to "don't touch legacy files" — it's a read-only listing query with no enforcement/business-logic impact, widened so new plans are visible to admin at all (otherwise they'd save successfully but never appear anywhere).

**`AdminPlanProductsPage.js`**: `getPlanTypeLabel()` extended with an `isServicePlan` branch first (maps `servicePlan.planType` to a display label via a new `SERVICE_PLAN_TYPE_LABELS` map), falling through to the untouched legacy `isMonthlyRenewablePlan`/`isMonthlyLimitedPlan`/"Simple" logic for old plans. A new `getPlanValidityLabel()` helper does the equivalent for the "Validity" column (`servicePlan.validityInDays` vs. legacy `validityPeriod`). Per explicit user instruction, generic and legacy plans display **identically** in this list — no visual "new vs old" distinction, same columns, same row style.

**Frontend API registration**: `frontend/src/common/index.js` gained one new `createServicePlan` entry (`POST /api/admin/plans/create`), alongside the existing `adminPlanProducts` entry.

## 6. What remains explicitly out of scope for this phase

Confirmed with the user and recorded in `plansystem.md`'s two design documents — **not built, not started**:

- Any customer-facing surface: no purchase flow, no customer "Plans" tab listing for service plans, no portal-access/files-limit enforcement wired into `submitUpdateRequest.js` or anywhere else, no cycle reset/accumulate engine.
- Recurring billing/invoicing for service plans (a full addendum design exists in `plansystem.md` proposing a brand-new, separate invoice model/cron/lifecycle-helper — sibling to, not reusing, `monthlyInvoiceModel`/`invoiceLifecycle.js`/`autoRenewalCron.js` — but **zero code written** for it this phase).
- Migration of the one real customer's existing legacy plans into the new generic shape (deferred, explicit future phase, needs a dry-run + backup-first script per the user's confirmed approach — the repo's existing migration scripts, `migrateAddIsHiddenField.js`/`convertRoleToRoles.js`, have no such safeguards and were flagged as insufficient to copy as-is).
- Plan edit/delete/archive (only create + list exist).

## 7. Files touched this session (complete list)

- **New**: `backend/controller/product/createServicePlan.js`, `frontend/src/DOCS/plansystem.md` (requirement + design docs, written before/during implementation), `frontend/src/DOCS/26_SERVICE_PLAN_SYSTEM_PHASE_1.md` (this file).
- **Changed (additive only)**: `backend/models/productModel.js` (new `isServicePlan`/`servicePlan` fields), `backend/routes/index.js` (new `POST /api/admin/plans/create` route), `backend/controller/product/getAdminPlanProducts.js` (query widened), `frontend/src/common/index.js` (new `createServicePlan` entry), `frontend/src/pages/AdminCreatePlanPage.js` (full rebuild — generic fields, real submit wiring), `frontend/src/pages/AdminPlanProductsPage.js` (display helpers extended for service plans), `frontend/src/DOCS/README.md` (index entry for `plansystem.md`).
- **Explicitly not touched**: `backend/controller/product/uploadPoduct.js`, `backend/controller/product/updateProduct.js`, `backend/models/orderProductModel.js`, and every other file in the ~34-file legacy plan-type list recorded in `plansystem.md` (submit/order/renewal/invoice controllers, cron, legacy customer-facing pages) — confirmed via evidence-based research before this phase started, not touched during it.

## 8. What must happen before customer-facing work starts

1. Read `plansystem.md`'s core design proposal in full before building the purchase flow or `orderProductModel.js` snapshot-on-purchase fields.
2. Read `plansystem.md`'s billing addendum in full before building any recurring-invoice logic — it documents a hard technical constraint (multer's file-count limit is fixed at app-boot, not per-request) with a recommended solution (a hard ceiling + in-controller authoritative check) that must be followed, not re-derived.
3. The one real customer identified via live DB check (masked as `s***@gmail.com`, 2 active legacy plans) must not be affected by any future migration work without a dry-run + backup step, per the user's explicit confirmation of the coexist-then-migrate approach.
