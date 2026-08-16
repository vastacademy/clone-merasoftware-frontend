# Add-on Service System — Phases 1–4 (Schema, Admin Form, Customer Entry Point, Purchase Path)

**Session date**: 2026-08-16
**Scope**: Extends the existing Service Plan system (`26_SERVICE_PLAN_SYSTEM_PHASE_1.md`, `27_SERVICE_PLAN_RENAME_AND_LEGACY_MIGRATION.md`) so a service can be bought **as an add-on attached to a specific project** — during the project or after it is completed — and so services can be scheduled on **multi-year cadences**. Also builds the first-ever **customer purchase path** for Service Plans, which previously had none.
**Read this before touching**: `productModel.js`'s `servicePlan` fields, `orderProductModel.js`'s service/linkage fields, `createServicePlan.js`, `customerCreateServicePlanOrder.js` (new), `AdminCreatePlanPage.js`, `ServicePlanDetail.js`, `StartNewProject.js`, `ProjectDetails.js`'s Add-a-Service card, `PlanDetails.js`'s status derivation, or `getOrderDetails.js`'s populate list.
**Read alongside**: `plansystem.md` (original requirement + the still-unbuilt enforcement/billing designs), `26_SERVICE_PLAN_SYSTEM_PHASE_1.md`, `27_SERVICE_PLAN_RENAME_AND_LEGACY_MIGRATION.md`, `52_INVOICE_PAYMENT_SSOT_CORRECTION_PLAN.md` (the invoice-settlement rules this session's purchase path follows).

## 1. The decision: extend, don't rebuild

The user asked whether the existing service structure should be scrapped and rebuilt for the add-on requirement. Verified against live code before answering — the existing `servicePlan{}` schema already models the requirement almost completely (service type, per-cycle allowance, limit window, files limit, validity, billing cycle, purchase-time snapshot, cycle-tracking fields). Only **three** things were genuinely missing:

1. Multi-year billing cadences (`billingCycle` topped out at `yearly`).
2. Any way to link a service order to a specific project.
3. An explicit statement of what a service *does* at runtime (previously only inferable by null-checking `portalAccessCount`).

So the approach taken was additive extension, matching this codebase's established coexist-and-extend discipline — no parallel "add-on" system was created. One catalog, one purchase path, one future enforcement engine; standalone vs. add-on differ only by a reference field.

## 2. Phase 1 — Schema (additive only)

**`backend/models/productModel.js`** (`servicePlan{}`):
- `billingCycle` enum: was `weekly, monthly, quarterly, half_yearly, yearly` → **added** `every_2_years, every_3_years, every_4_years, every_5_years`.
- **New** `serviceBehavior` enum: `portal_access_control` | `reminder_only`. Set explicitly rather than inferred, so the future enforcement engine never has to guess whether a service consumes allowance.

**`backend/models/orderProductModel.js`**:
- `servicePlanSnapshot` gained `serviceBehavior` (snapshot must stay a complete copy of the template config).
- **New** `linkedProjectOrderId` — `ObjectId ref 'order'`, default `null`. `null` = standalone plan; set = add-on attached to that project order.
- **New** `addedDuringProjectPhase` — enum `in_progress` | `after_completion`, default `null`. Kept separate from the id because the business meaning differs (extending a live project vs. servicing a delivered one).

No existing field was renamed, removed, or had its type/validator changed. Pre-existing documents are unaffected (new fields are optional, default `null`).

## 3. Phase 2 — Admin create form + server validation

**`backend/controller/product/createServicePlan.js`**:
- `BILLING_CYCLES` / `BILLING_CYCLE_MONTHS` extended with the four multi-year cadences (24/36/48/60 months) — the pre-existing "billing cycle must evenly divide validity" rule now works correctly across them (a 3-year plan does not offer `every_2_years`; a 5-year plan does offer `every_5_years`).
- **New** `serviceBehavior` whitelist field + `SERVICE_BEHAVIORS` validation.
- **Behavior-aware validation**: a `reminder_only` service *rejects* `limitScope` / `manualUnit` / `manualCount` / `portalAccessCount` / `filesLimit` rather than silently storing dead config. `portal_access_control` keeps every pre-existing rule byte-for-byte.
- `planData.servicePlan` saves `serviceBehavior`; reminder-only plans store the portal fields as `undefined`.

**`frontend/src/pages/AdminCreatePlanPage.js`**:
- `BILLING_CYCLES` extended with the same four cadences and their month values.
- **New Service Behavior dropdown** (below Plan Type, full width) with an inline hint line per option.
- The whole **Plan Power section is now conditional** — hidden for `reminder_only`. Switching to reminder-only also **clears** every Plan Power state value, so a hidden field can never submit stale data.
- Client-side validation and `submissionData` are both behavior-aware, mirroring the server.

**Not needed** (verified, not assumed): `getAdminPlanProducts.js` selects the whole `servicePlan` object, so the new field reaches the admin Plans list with no query change.

## 4. Phase 3 — Customer entry point ("Add a Service")

**`frontend/src/pages/ProjectDetails.js`** (customer view only; `isAdminView` unaffected):
- New **Add-a-Service card** rendered after the payment banners. Wording switches on `isProjectFinished` — "Add a service to this project" while running, "Ongoing servicing for this project" once complete — since the user explicitly wanted both moments supported.
- Gated behind a new `canAddService`: shown for **any confirmed sale**, excluding only `pending-approval` and `payment-rejected` orders. See §5b for why the project's own invoice state is deliberately not part of this test.
- New `isProjectFinished` derives completion with the **same test** `checkPaymentStatus` already used (`projectProgress >= 100 || currentPhase === 'completed'`), so "finished" means one thing on this page.
- New `handleAddService` navigates to `/start-new-project?tab=plans` carrying `{ attachToProjectId, attachPhase, attachProjectName }` in router state. It creates nothing.

**`frontend/src/pages/StartNewProject.js`**:
- Now reads `?tab=` (via `useSearchParams`) to open directly on the Service Plans tab, and `location.state` for the attach context.
- Attach context is **forwarded** to the detail page on row click, and shown as an emerald banner so the customer always knows which project they're buying for.

**`frontend/src/pages/ServicePlanDetail.js`**:
- Receives and displays the same attach context; Back preserves it so the customer can't silently drop out of "adding to my project".
- `BILLING_CYCLE_LABELS` extended with the four multi-year cadences (this was a Phase-2 follow-up gap found during Phase 3 verification).
- "What You Get" section is skipped entirely for a `reminder_only` service, which has no allowance to list.

## 5. Phase 4 — The purchase path (previously did not exist at all)

**Verified gap**: `createOrder.js` has no service-plan handling and `routes/index.js` had no service-plan purchase route — Service Plans could be created and browsed but **never bought**. The detail page's button only pushed a draft into the cart drawer, whose "Pay Now" is still a `() => {}` stub.

**New `backend/controller/order/customerCreateServicePlanOrder.js`** (route `POST /api/customer/service-plan-order`, `authToken`) — modelled directly on `customerCreateCustomProjectOrder.js`, reusing the same shared helpers, not reimplementing them:
- Re-reads the plan from the DB; price and config are **never** trusted from the client. Rejects non-service-plan, hidden, or unpriced products.
- **Add-on linkage is verified, not trusted**: the linked project must exist **and belong to the same customer**, so a customer can never attach a service to someone else's project. `addedDuringProjectPhase` is **re-derived server-side** from the project's real progress; the client's value is only a UI hint.
- Starts the validity window and the first service cycle: `servicePlanStartDate`/`EndDate`, `serviceCurrentCycleNumber: 1`, cycle start/end from a `BILLING_CYCLE_DAYS` map (a plan with no billing cycle bills once, so its first cycle is the whole term). Cycle end is clamped to the validity end.
- Freezes `servicePlanSnapshot` at purchase time (same rationale as the rest of the system — a later template edit must never change what a customer already bought).
- Creates the order `pending-approval` with `isWebsiteProject: false` (no timeline, no nodes, no installments — a service plan is not a project).
- **Invoice + payment SSOT**: one unpaid invoice via the shared `createProjectInvoice()`, then the wallet/UPI split is decided **server-side from the real balance**. Wallet is instant (`deductWalletInstant`) and settles the invoice through `markProjectInvoicePaid()` reusing the **same** transaction (never two transactions for one payment). Any UPI remainder becomes a pending transaction linked to that same invoice, so admin approval settles it further. Fully wallet-covered ⇒ auto-approved.

**`frontend/src/pages/ServicePlanDetail.js`** — cart draft replaced with a real in-page payment step (same proven pattern as `StartNewWebsiteCustomize.js`): a confirm modal showing the wallet/UPI split, a UPI QR step for any remainder with 12-digit reference validation, and a success modal whose wording differs for instant-activation vs. awaiting-approval. `DraftOrdersContext` is no longer used by this page.

**`frontend/src/common/index.js`**: new `createServicePlanOrder` entry.

## 5b. Gating correction — a service is not gated on the project's payment state

**Found by testing, not by review.** The card was first gated behind `!isOrderPendingApproval && !order.hasUnpaidInvoice`, copied from how the page gates its *own* actions ("Request Update"). A user screenshot of a real running project showed no card at all. A read-only audit of that exact order (`backend/scripts/readOnlyAuditOneOrderAddonGate.js`, new) proved why:

```
orderVisibility : approved       projectProgress: 2
INV-202608-0045 | paid           | 3149  | installment #1
INV-202608-0058 | partially_paid | 10496 | paid 3149
=> hasUnpaidInvoice = true  =>  card blocked
```

The project was **not** in trouble — it is on a 2-installment plan, installment #1 is paid, and installment #2 isn't even due yet (it unlocks at its `progressThreshold`, doc 53 Layer B). `partially_paid` counts as "unpaid" for the banner's purposes, which is correct for *that* banner and wrong for this card.

**User's decision, recorded verbatim in intent**: a service can be bought while the project is partially paid or still incomplete; the service itself is **always paid in full**; and it is linked to the project **at payment time** — during the build or after completion, both allowed.

**Why this is right, not just permissive**: a service is a separate purchase with its own full payment and its own invoice — the project's installment schedule has no bearing on it. A customer mid-installment-plan is in good standing and is precisely the engaged, already-paying customer most likely to buy an add-on; gating them out blocked the warmest case. It also mattered in practice: under the old gate the card rendered on almost nothing.

**Implemented**: new `canAddService` in `ProjectDetails.js` — true unless `orderVisibility` is `pending-approval` or `payment-rejected` (the two states where the project isn't a confirmed sale). The `hasUnpaidInvoice` condition was removed entirely.

**Live effect, re-measured after the change** (`readOnlyAuditServicePlanReadiness.js`): card eligibility went from **12** projects to **21** of 24 — 14 in-progress ("Add a service") + 7 completed ("Ongoing servicing"); the 3 excluded are genuinely not confirmed sales.

**No migration was needed** — this was a gating decision, not a data problem. The order in the screenshot was already fully on the current node system.

## 6. Two consumption gaps found during verification and fixed the same session

Both were found by reading the consuming code rather than assuming it worked:

1. **`backend/controller/order/getOrderDetails.js`** — its `productId` populate list did not include `isServicePlan servicePlan`, so a purchased service plan's config would never reach the frontend. Added. (Exactly the same class of bug as the one recorded in `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md` for recurring plans.)
2. **`frontend/src/pages/PlanDetails.js`** — `getPlanVisualStatus()` read only legacy plan fields, so a new service-plan order would render an empty/incorrect status. A **Service Plan branch was added first with an early return**, so none of the legacy logic (which reads fields a service plan doesn't have) ever runs for one; legacy plans fall through completely unchanged. The branch handles cancelled/expired/paused/day-exhausted/allowance-exhausted, and treats a `reminder_only` service as having no "uses left" concept.

**Confirmed not needing changes** (verified, not assumed): `helpers/orderType.js` already treats `service_plan` as a plan category, so purchased service plans appear in the customer's Projects-and-Plans list with no change; `getAdminPlanProducts.js` already selects the whole `servicePlan` object.

## 6b. Phase 5 — Modal picker, multi-select, and the wallet-only bulk path

**Two user decisions drove this**: the service picker should be a **popup, not a page**, and a customer should be able to add **one or several** services and pay by wallet, UPI, or a combination.

### Why the picker became a modal

Navigating to the catalog took the customer out of their project and required carrying attach-context through two pages (`?tab=` + router state + an "Adding to X" banner on each). A modal keeps the project visible behind it, so **all of that context-passing code was deleted, not added to** — `StartNewProject.js` and `ServicePlanDetail.js` are back to being plain standalone browsing surfaces (only the harmless `?tab=` deep-link was kept). Closing the modal returns the customer exactly where they were.

### Why bulk purchase is wallet-only (analysis before implementation)

A full-system read established a hard constraint that decided the design:

- `transactionModel.orderId` / `.invoiceId` are **single refs, not arrays**.
- `transactionApprovalController.js` (approve *and* reject) resolves exactly **one** order and **one** invoice per transaction — logic corrected with considerable care in docs 52/53.

So one UPI payment covering N new service orders would settle exactly one of them and leave **N−1 pending forever**. The options were (A) accept that, (B) give each service its own pending transaction under one UPI reference — which makes the admin approve N times for one payment and can strand the customer's money halfway, or (C) rebuild the approval engine for multi-order transactions.

**Chosen, with the user's agreement: wallet-only for bulk.** Wallet money needs no approval at all, so each service gets its own order + invoice + transaction and activates instantly — the shape the ledger, history and approval code already expect — with **zero changes to the approval engine**. A customer whose wallet can't cover the total is told to recharge or buy services one at a time; the single-service path still accepts wallet/UPI/combined. Revisit (C) only when multi-service UPI is a real, observed need.

### What was built

**New `backend/helpers/servicePlanPurchase.js`** — SSOT extracted **before** writing the second path, so the two can never drift: `resolveServicePlanPrice`, `resolveValidityInDays`, `BILLING_CYCLE_DAYS`, and `buildServicePlanOrderData()` (snapshot + validity window + first cycle, cycle end clamped to validity end). `customerCreateServicePlanOrder.js` was refactored onto it in the same pass — its duplicated inline copies of all of this were removed, not left behind.

**New `backend/controller/order/customerCreateServicePlanOrdersBulk.js`** (`POST /api/customer/service-plan-orders-bulk`):
- De-duplicates `planIds`; loads and validates **every** plan (available, priced, valid duration) **before** taking any money.
- Verifies the linked project belongs to the same customer and re-derives the phase from real progress — same rules as the single path.
- Checks the wallet covers the **whole batch** up front (the per-debit atomic guard in `deductWalletInstant` remains the race-safe authority).
- Then per service: order → invoice → instant wallet debit → settle invoice via the same shared helpers → mark approved/active.
- **All-or-nothing**: a mid-batch failure triggers a compensating rollback — refund each debit, delete its transaction, invoice and order, in that order (money first). Rollback failures are logged loudly since they need manual cleanup. Mongo transactions are deliberately not used (replica set not guaranteed); compensation is the established pattern here.

**New `frontend/src/components/AddServiceModal.js`** — checkbox multi-select list (name, price, plan type, access line, validity + billing cadence), running total, wallet balance, and a live shortfall notice that points the customer at recharging or buying individually. On success it shows what was added rather than closing blindly, and calls back so the wallet balance refreshes.

**`frontend/src/pages/ProjectDetails.js`** — `handleAddService` now opens the modal instead of navigating; wallet balance comes from the app-wide `Context` SSOT (no new fetch). Admin view never renders it.

### Verified

`node --check` on all backend files; `@babel/core` parse on all frontend files; `routes/index.js` **actually loaded** in node to prove both controllers resolve; `buildServicePlanOrderData()` executed against a representative plan (quarterly/1-year → first cycle correctly 90 days, snapshot complete, `isServicePlan: true` / `isWebsiteProject: false`); and a repo grep confirmed **zero** orphaned `attachContext` references after the page-flow removal.

## 7. What is still NOT built

- **No enforcement engine.** Nothing reads `serviceAccessUsedInCycle` against `servicePlanSnapshot.portalAccessCount` yet; `submitUpdateRequest.js` is untouched. Buying a service plan does not yet change what the customer can actually do in the portal.
- **No cycle engine.** `serviceCurrentCycleStart/End` are set once at purchase and never advanced — no cron, no lazy roll-forward, no `serviceCycleHistory` writes.
- **No recurring billing.** A multi-year or monthly cadence is stored and displayed but only the **first** payment is ever collected. Cycle 2+ invoices do not exist. See `plansystem.md` §6 for the (still unbuilt) design.
- **No reminder delivery** for `reminder_only` services — the behavior is recorded, nothing sends anything.
- **Cart "Pay Now" remains a stub** (`DraftOrderSavedDrawer.js`) — untouched this session; the service-plan page now bypasses the cart entirely.
- **Multi-service UPI / combined payment.** Bulk purchase is wallet-only by design (§6b) — buying several services at once with UPI needs the approval engine to support one transaction settling many orders, which is a deliberate future decision, not an oversight.
- **No admin UI** to view/pause/cancel a customer's live service, or to see which services are attached to a project.
- **Legacy plan system untouched**, as in every prior phase.

## 8. Verification performed

- `node --check` on every changed/added backend file; `@babel/core` parse on every changed frontend file. **No `npm run build` was run** (per standing instruction).
- Helper signatures (`createProjectInvoice`, `markProjectInvoicePaid`, `createPaymentTransaction`, `deductWalletInstant`) were read from source and matched against the new call sites before use.
- `mongoose` import and the registered model name `'order'` were confirmed in `orderProductModel.js` before adding the `ref`.
- Multi-year cadence presence cross-checked across all five files that encode it.
- `qrcode.react` confirmed installed before use.

## 9. Backups

Read-only audit scripts added this session (no writes, safe to re-run):
`backend/scripts/readOnlyAuditServicePlanReadiness.js` (is the catalog buyable, how many projects show the card),
`backend/scripts/readOnlyAuditOneOrderAddonGate.js <orderId>` (why one specific order does/doesn't show the card).

- `backend/_backup_addon_service_work1/` — `productModel.js`, `orderProductModel.js`, `createServicePlan.js`, `getOrderDetails.js`, `routes-index.js`
- `frontend/src/_backup_addon_service_work1/` — `AdminCreatePlanPage.js`, `ServicePlanDetail.js`, `ProjectDetails.js`, `StartNewProject.js`, `PlanDetails.js`, `common-index.js`

All changes are additive; reverting means restoring these files (and, if ever needed, `$unset`-ing the new order fields — no legacy field was modified).
