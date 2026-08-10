# Customize-Project Flow — Backend Wiring + In-Page Approval Payment

**Session date**: 2026-08-10
**Scope**: Wires the previously UI-only Customize page (`41_CUSTOMIZE_PROJECT_PAGE_AND_FULLPAGE_GLASS_SYSTEM.md`) to a real backend up to proceed-to-payment. Approval-based payment model (matches the existing customer flow). **No `npm run build` run** (standing instruction).

**Read this before touching**: `backend/controller/order/customerCreateCustomProjectOrder.js` (new), `backend/routes/index.js` (custom-project route), `frontend/src/common/index.js` (`createCustomProjectOrder` endpoint), `frontend/src/pages/StartNewWebsiteCustomize.js` (submit/payment wiring).
**Read alongside**: `41_...md` (the UI this session wires — its `buildPaymentData()` stub is now replaced), `33_ADMIN_CREATE_PROJECT_FOR_CLIENT.md` (`adminCreateProjectOrder.js`, the exact blueprint this session's customer endpoint mirrors), `35_CATEGORY_BASE_PRICE_AND_PROJECT_FEATURES_SYSTEM.md` (`categoryBasePriceModel`, the server-side base price source), `37_NEW_INVOICE_SYSTEM_FOR_ADMIN_CREATED_PROJECTS.md` (`invoiceModel`), `23_PAYMENT_SSOT_PHASE_0_TO_3.md` (`/wallet/verify-payment` approval chain).

---

## Why the existing engines couldn't be reused directly (audit first)

The customize flow is a **product-less** custom requirement — there is no pre-created product `_id` and no base price on the request. Confirmed directly against live code:

- **`createOrder.js`** does `productModel.findById(productId)` (line 35) and 404s without a real product — cannot serve a product-less order.
- **`DirectPayment.js`** hard-depends on `paymentData.product._id` and **always creates a new order** via `SummaryApi.createOrder` inside its own `createOrder()` (line 401). Handing it a pre-created order would create a **duplicate** order — it has no "existing order" path.
- **`InstallmentPayment.js`** is the opposite and the right model: it pays an **already-created** order fetched by `orderId` and calls `/wallet/verify-payment` **with `orderId`** (never creating a second order). This session reuses that pattern.
- **`adminCreateProjectOrder.js`** already does exactly the product-less create (builds a hidden product on the fly, re-derives price server-side, creates order + timeline). This session's customer endpoint is its customer-side twin.

**Decisions taken with the user** (each confirmed before coding): approval-based payment (not instant); partial split **customer-chosen 2 (50/50) or 3 (30/30/40)**; first installment charged **immediately after order create** (existing customer flow); payment step is an **in-page** wallet/UPI UI (not `DirectPayment.js`) so no duplicate order and zero regression to the shared payment pages.

---

## 1. New backend controller: `customerCreateCustomProjectOrder.js`

Customer-side twin of `adminCreateProjectOrder.js`. Route (new, in `routes/index.js`):
```js
router.post("/customer/custom-project-order", authToken, customerCreateCustomProjectOrder)
```
Frontend endpoint (new, `common/index.js`):
```js
createCustomProjectOrder : { url: `${backendDomain}/api/customer/custom-project-order`, method: "post" }
```

**Request body**: `{ category, pageCount, featureIds[], budget, ownership, paymentType, installmentCount?, couponCode }`. **No price is sent or trusted.**

**What it does** (all server-side):
1. Auth via `req.userId` (no admin guard — the difference from the admin blueprint).
2. Validates `category` against `PROJECT_CATEGORIES` and `paymentType` against `['full','partial','decide_later']`.
3. **Re-derives price**: `basePrice` from `categoryBasePriceModel.findOne({ category })` + feature prices from `productModel` (only `feature_upgrades`, `!isHidden`, `compatibleWith: category` — mirrors the client filter). The `Add New Page` feature is priced `sellingPrice × clampedPageCount` (clamp `MIN_PAGES=4`…`MAX_PAGES=99`, same as the UI); every other feature counts once. `finalPrice = basePrice + featuresTotal`.
4. Builds a **hidden product** (`isCustomClientProject: true`, `clientProjectFeatures[]`, `totalPages = clampedPageCount`), exactly like the admin path.
5. Creates the order with **`orderVisibility: 'pending-approval'`** (vs the admin path's `'approved'` — because the customer initiated it), `isWebsiteProject: true`, `paidAmount: 0`, `remainingAmount: finalPrice`, and an `orderItems[]` (base + each feature).
6. Partial → `buildInstallments(finalPrice, installmentCount)` (2 ⇒ 50/50, 3 ⇒ 30/30/40; `dueDate` staggered 30 days), `currentInstallment: 1`.
7. `initializeProjectTimeline({ order, startingNodeTitle, actorId: userId })` — 0% node (same as both existing creation paths).
8. Returns `{ orderId, finalPrice, paymentType, installments, firstInstallmentAmount }`.

**`buildInstallments` here is byte-aligned with the admin one AND the frontend `INSTALLMENT_OPTIONS`** — the three must stay in sync (2 ⇒ 50/50, 3 ⇒ 30/30/40).

---

## 2. Frontend wiring — `StartNewWebsiteCustomize.js`

### Before → After (the core change)
**Before** (41): `handleConfirmPayment` was a UI-only stub — `void buildPaymentData(); setShowSuccess(true);`. No order, no payment.
**After**: real order create + in-page approval payment. `buildPaymentData()` is **removed**.

### 2a. Partial installment chooser (new UI)
Added top-level `INSTALLMENT_OPTIONS` (`2 → [50,50]`, `3 → [30,30,40]`) + `splitsFor(count)`. New `installmentCount` state (default `2`). When `paymentOption === 'partial'`, a new block under the form renders the 2-vs-3 chooser plus an `installmentBreakdown` (`useMemo` off `estimateTotal` — display only) with a "Pay now" badge on installment 1 and an amber "amounts are estimates" note.

### 2b. `handleSubmit` — three wired paths
- `decide_later` → `createProjectOrder()` (order only, unpaid) → success modal.
- `full` / `partial` → `createProjectOrder()` → store `createdOrder` → open payment popup. **If `createdOrder` already exists** (popup reopened without changes) it reuses it instead of creating a duplicate.

`createProjectOrder()` POSTs to `SummaryApi.createCustomProjectOrder` with the selection (no price). `chosenFeatureIds` = the pages feature (always) + checkbox-selected features.

### 2c. Stale-order guard (new `useEffect`)
```js
useEffect(() => { setCreatedOrder(null); },
  [projectCategory, chosenFeatureIds, pageCount, paymentOption, installmentCount, couponCode]);
```
Any change to what would be ordered invalidates a previously created order, so the next "Proceed" creates a fresh one rather than paying a stale order.

### 2d. In-page payment step (reuses `InstallmentPayment.js` pattern)
New imports: `useContext`/`Context` (wallet balance + `fetchWalletBalance`), `QRCodeSVG`, `displayINRCurrency`, `toast`. `amountDueNow` = `firstInstallmentAmount` (partial) or `finalPrice` (full).
- **`handleConfirmPayment`**: wallet `>= amountDueNow` → `POST /wallet/deduct` then `submitVerification(method:'wallet')`, refresh wallet, success. Else → build a UPI QR for `amountDueNow`, show the QR step.
- **`handleVerifyUpi`** (QR path): `submitVerification(method:'upi', upiRef)` then success.
- **`submitVerification`** posts to `/wallet/verify-payment` with **`orderId`** (never a new order), `isInstallmentPayment: paymentOption === 'partial'`, `installmentNumber: 1` for partial. An "already submitted" response is treated as success (same as `InstallmentPayment.js`).

The payment popup now has two internal steps (`showQR` false → confirm summary + wallet balance + pay button; `showQR` true → QR + UPI-txn input + submit). Success-modal copy is now payment-aware ("Payment submitted for approval" vs the decide-later "Project request submitted").

---

## 3. End-to-end flow (live after this session)

```
Customize form → Proceed/Create
  → POST /customer/custom-project-order   (backend re-derives price)
  → order created (pending-approval, 0% node)
      ├─ decide_later → success modal (unpaid; admin handles payment later)
      └─ full/partial → payment popup
            ├─ wallet ≥ due → /wallet/deduct + /wallet/verify-payment(orderId)
            └─ wallet <  due → UPI QR → /wallet/verify-payment(orderId)
      → transaction pending → admin approves (existing system) → project live
      → partial: installments #2/#3 stay pending; paid later via /installment-payment/:orderId/:num
```

---

## 4. Explicitly still stubbed / out of scope

- **Coupon "Apply"** button remains `onClick={() => {}}` (no `validateCoupon`). `couponCode` is sent to the backend and stored as `couponApplied` but **not validated or discounted** yet — same deferral as `41_...md`.
- **No invoice** is created by the customer endpoint (unlike `adminCreateProjectOrder.js`). Approval-based payment runs through `/wallet/verify-payment` (transaction-based), consistent with `createOrder.js`, which also creates no invoice. Invoice generation for customer custom projects is future work if needed.
- The estimate shown on the page and in the installment breakdown is still **client-side and display-only**; the backend `finalPrice` is authoritative and is what the confirm popup shows once the order exists.

---

## Files touched this session

- **New**: `backend/controller/order/customerCreateCustomProjectOrder.js`.
- **Changed (backend)**: `backend/routes/index.js` (import + `POST /api/customer/custom-project-order`).
- **Changed (frontend)**: `frontend/src/common/index.js` (`createCustomProjectOrder` endpoint), `frontend/src/pages/StartNewWebsiteCustomize.js` (installment chooser, submit wiring, in-page payment step, stale-order guard, payment-aware success copy; `buildPaymentData()` removed).
- **Backups**: `frontend/src/pages/backup_customize_wire_20260809/` holds pre-session `StartNewWebsiteCustomize.js`, `common/index.js`, and `backend/routes/index.js`.
- **Not touched**: `DirectPayment.js`, `InstallmentPayment.js`, `createOrder.js`, `adminCreateProjectOrder.js` (all left intact — the customer endpoint is additive); no `npm run build` run.
