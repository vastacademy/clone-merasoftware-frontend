# Plan Retire System + Order Self-Sufficiency

**Session date**: 2026-08-18
**Scope**: Admin can now remove a service plan from the catalogue. The server decides what "remove" means: a plan **nobody has bought** is deleted permanently; a plan **customers have bought** is **retired** — withdrawn from the catalogue and from the admin list, but kept forever so the orders and paid invoices behind it keep their business record. Before that was safe, orders were made independent of the catalogue product they were bought from.
**Read this before touching**: `productModel.js`'s `retiredAt`/`retiredBy`, `orderProductModel.js`'s `servicePlanSnapshot`, `helpers/servicePlanPurchase.js`, `controller/product/retireOrDeletePlan.js`, `reactivatePlan.js`, `deleteProduct.js`, `getProduct.js`, `getAllProducts.js`, `getAdminPlanProducts.js`, `helpers/orderPresentation.js`, `AdminPlanProductsPage.js`.
**Read alongside**: `55_ADDON_SERVICE_SYSTEM_PHASE_1_TO_4.md` (the snapshot design this completes), `49_TRASH_SYSTEM_SOFT_DELETE.md` (a *different* mechanism — see §3), `58_SERVICE_HYBRID_PAYMENT_PARENT_CHILD.md`.

---

## 1. The question that started this

The owner asked for a way to delete an admin-created service plan **without affecting any customer using it**, and then pressed further: *"maan lo plan kisi ke paas active nahi hai, sabne use kiya lekin ab nahi kar raha — delete kar diya to customer ki purchase history se delete ho jayega?"*

Answering that required proving what actually happens, not assuming. A read-only simulation (populate against a missing product id, no deletion performed) gave the exact answer:

| | product exists | product deleted |
|---|---|---|
| order still in history | YES | **YES** |
| `paidAmount` (₹2,500) | kept | **kept** |
| `servicePlanSnapshot` | kept | **kept** |
| **display name** | `"Website Update"` | **`undefined`** |

So the order survives — but the customer sees a blank name against money they paid.

---

## 2. The root cause was a gap in the snapshot, not the delete

`servicePlanSnapshot` exists specifically so *"a later template edit must never change what a customer already bought"* (doc 55). Verified against live code:

- **0** backend sites read `productId.servicePlan` after purchase
- **0** frontend sites read `productId.servicePlan` after purchase
- config comes from `servicePlanSnapshot`; the invoice freezes its own name in `lineItems[].name`

The architecture was already snapshot-based. **Only the display name had been left behind**, read from the live product in 6 places. That single field is what made deletion destructive — a bug in the snapshot contract, not a reason to forbid deleting.

### This is not hypothetical — it has already happened

A full-DB scan found **4 of 31 orders are already orphaned** (their product row is gone), **1 of them with money paid**, and only **1** whose name was still recoverable. The damage predates this session.

---

## 3. Why retire, and why NOT the Trash system

`49_TRASH_SYSTEM_SOFT_DELETE.md` looks like the obvious fit, but reading it decided against it: Trash **permanently purges after 30 days** (`getTrash.js` `deleteMany` + `TRASH_RETENTION_DAYS = 30`). Putting a purchased plan in Trash would not solve the problem — it would delay it by a month and then destroy the record silently.

The two mechanisms mean different things:

| | Trash | Retire |
|---|---|---|
| means | "this was a mistake" | "we stopped selling this" |
| lifetime | 30 days, then **purged** | **forever** |
| suits | leads, clients created in error | a business record behind real invoices |

`isHidden` was also not enough on its own: it is *temporarily off sale* and deliberately keeps the row visible in the admin list. Retirement is permanent and hides it from the admin list too.

---

## 4. Changes, before → after

### Phase 1 — make the order self-sufficient

**`models/orderProductModel.js`** — `servicePlanSnapshot`
- **Before**: froze planType, limits, validity, billing, cycles… but **no name**.
- **After**: added `serviceName: String`, with a comment recording why.

**`helpers/servicePlanPurchase.js`** — `buildServicePlanOrderData()`
- **Before**: snapshot built without the name.
- **After**: `serviceName: plan.serviceName`. This is the SSOT both purchase paths use, so single and bulk purchases capture it identically.

**`scripts/backfillServicePlanSnapshotName.js`** (new)
- Fills the name on pre-existing orders **from `invoice.lineItems[].name`**, not from the product. Sourcing it from the product would re-create the exact dependency being removed, and fails for orders whose product is already gone. Product is a last-resort fallback only.
- Dry-run by default; `--apply` writes. Re-runnable (skips orders that already have a name).
- **Executed**: 3 of 6 filled from invoices; the other 3 are the already-orphaned orders with no invoice and no product — unrecoverable, and pre-existing damage. Re-run confirmed idempotent (0 further writes).

**`helpers/orderPresentation.js`** — new `getOrderDisplayName(order, fallback)`
- Reads `productId.serviceName` → `servicePlanSnapshot.serviceName` → `orderItems[].name` → fallback.
- Extracted as a shared helper rather than repeating the chain: `OrderListRow.js` already had a two-step version of it inline, which was replaced by this one.

**Wired into all 6 sites**: `ProjectDetails.js` (×3), `CustomerDashboard.js`, `OrderListRow.js`, `helpers/paymentLedger.js` (×2 — passing `null` as the fallback so the existing conditional title logic is unchanged).

### Phase 2 — retirement

**`models/productModel.js`**
- **Before**: `isHidden` only.
- **After**: added `retiredAt: Date (null)`, `retiredBy: ref user (null)`. Additive and default-null, so every existing product is unaffected.

**`controller/product/retireOrDeletePlan.js`** (new) — `DELETE /api/admin/plans/:planId`
- Counts real orders server-side; the client never says how many customers a plan has.
- `0` → hard delete. `1+` → set `retiredAt`/`retiredBy` **and** `isHidden = true` (so every pre-existing filter that already checks `isHidden` also excludes it).
- Returns `{ action: "deleted" | "retired", purchaseCount }` so the UI reports what actually happened.

**`controller/product/reactivatePlan.js`** (new) — `POST /api/admin/plans/:planId/reactivate`
- Clears `retiredAt`/`retiredBy`. Deliberately leaves `isHidden` set: putting a plan back on sale should be a separate, explicit act.

**`controller/product/deleteProduct.js`**
- **Before**: `findByIdAndDelete` with **no check at all** — and the route `DELETE /api/delete-product` is live, so this was reachable directly even though no admin UI exposed it.
- **After**: same purchase-count guard. Refuses with a message pointing at retirement. This protects **all** products, not only service plans.

**Read paths** (missing any one of these would let a retired plan keep selling):
- `getProduct.js` (`/api/get-product` — the customer catalogue, and what `AddServiceModal` fetches): `{ isHidden: false }` → `+ retiredAt: null`.
- `getAllProducts.js`: `find({})` → `find({ retiredAt: null })`, `?includeRetired=true` to opt in.
- `getAdminPlanProducts.js`: retired hidden by default, `?includeRetired=true` powers the UI toggle; `retiredAt` added to the projection.

**Frontend**
- `AddServiceModal.js`: also filters `!product.retiredAt` — defence in depth against a stale payload.
- `AdminPlanProductsPage.js`: a **Remove** button per row (there was none), a confirm modal that states honestly that the plan will be *retired rather than deleted* if it has purchases, a "Retired" badge, and a **Reactivate** button.
- **Retired plans live in their own tab** (owner's request). The page previously had no tabs; it now uses the existing shared `components/admin/AdminWorkspaceTabs.js` — the same component `AdminClientWorkspace.js` uses — rather than a new tab implementation. Two tabs: **Active Plans** / **Retired Plans**.
  - `activeTab` state drives everything; `showRetired = activeTab === "retired"` is derived, so the existing `fetchPlans` dependency and query-string logic were reused unchanged rather than rewritten.
  - **`visiblePlans` filters per tab.** This is required, not cosmetic: `?includeRetired=true` returns active **and** retired rows, so without narrowing, the Retired tab would list everything. The filter also guarantees a retired plan can never appear under Active even if a payload includes it.
  - Empty state is tab-aware ("No retired plans. Removing a plan customers have bought will file it here.").
  - The earlier "Show retired plans" toggle was **removed**, not left alongside the tab.
- `common/index.js`: `retireOrDeletePlan` / `reactivatePlan` (both `url` are functions taking the plan id).

---

## 5. Verification performed

- `node --check` on all 11 changed/new backend files; `@babel/core` parse on all 8 changed frontend files; `routes/index.js` **actually loaded**; `/admin/plans/:planId` confirmed not to shadow the existing `POST /admin/plans/create`.
- **Snapshot name proven end-to-end**: `buildServicePlanOrderData()` executed against a real catalogue plan and the result cast through the Mongoose schema — name present at both stages.
- **`getOrderDisplayName` executed** over 6 shapes (product alive / product deleted with snapshot / project order via `orderItems` / nothing at all / null order / ledger's `null` fallback) — 6/6 as expected.
- **Backfill run for real** (3 filled from invoices), then re-run to prove idempotency.
- **Retire tested end-to-end against the live DB and rolled back**: after retiring, the plan left the customer catalogue and the admin list, stayed findable with `includeRetired`, the hard-delete guard reported blocked, and **both orders kept their name, status and paid amount**. Original state restored and re-confirmed.
- **Tab filtering executed** over a 3-plan fixture: Active shows only non-retired, Retired shows only retired, and a retired row cannot leak into Active even if the server returns it.
- **No `npm run build`** (standing instruction).

---

## 6. Live state at the end of this session

| Plan | Purchases | What "Remove" would do |
|---|---|---|
| Website Update | 2 | **RETIRE** |
| Website single page | 0 | hard delete |
| Social Media Marketing | 0 | hard delete |

Nothing was retired or deleted for real — the test rolled itself back.

---

## 7. Known limitation

**3 orders can never recover their name.** They were orphaned before this work (product deleted, no invoice), so there is no historical source to read from. They will render the `'Untitled'` fallback. Everything created from now on carries its own name.

---

## 8. Backups

`backend/_backup_plan_retire_work1/` — `orderProductModel.js`, `productModel.js`, `servicePlanPurchase.js`, `deleteProduct.js`, `getAllProducts.js`, `getAdminPlanProducts.js`, `routes-index.js`
`frontend/src/_backup_plan_retire_work1/` — `ProjectDetails.js`, `CustomerDashboard.js`, `OrderListRow.js`, `paymentLedger.js`, `AddServiceModal.js`, `AdminPlanProductsPage.js`, `common-index.js`

`frontend/src/_backup_plan_retire_work1/AdminPlanProductsPage_pretabs.js` — the page as it stood after Phase 2 but before the Retired tab replaced the toggle.

(`getProduct.js` and `orderPresentation.js` were changed after the backup set was taken; both changes are small and described in full above.)
