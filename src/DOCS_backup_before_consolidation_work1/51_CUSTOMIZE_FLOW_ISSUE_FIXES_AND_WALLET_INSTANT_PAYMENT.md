# Customize-Flow Bug Fixes + Wallet Instant-Payment System (Phases 1–3)

**Session date**: 2026-08-14
**Scope**: Four reported bugs in the customer "Start New Project" → customize flow were fixed, then the payment model behind it was reworked so an order is created only when the customer actually pays, with the wallet spent instantly (the customer's own money) and only external (UPI) money going to admin approval. Also added admin-initiated wallet recharge and a shared instant-wallet-payment endpoint.
**Read this before touching**: `StartNewWebsiteBuild.js`, `StartNewWebsiteCustomize.js`, `customerCreateCustomProjectOrder.js`, `helpers/transactionService.js` (new), `transactionApprovalController.js`, `adminRechargeWallet.js` (new), `walletPayInstant.js` (new), `AdminClientWorkspace.js` (`PaymentInvoicesPanel`).
**Read alongside**: `42_CUSTOMIZE_FLOW_BACKEND_WIRING_AND_INPAGE_PAYMENT.md` (the flow this session reworks), `23_PAYMENT_SSOT_PHASE_0_TO_3.md` (wallet/transaction SSOT), `46_PROJECT_ORDER_APPROVAL_SYSTEM_AND_SHARED_PAYMENT_HELPER.md` (order approval chain).

---

## PART A — The four reported bugs (all fixed)

### Bug 1 — Back button jumped to the start (30k+ path)
**File**: `frontend/src/pages/StartNewWebsiteBuild.js`, `handleBack` (~line 227).
**Before**: `handleBack` only looked at `step`; it ignored the `submitted` state. On the 30k+ path (`flowKeys = ['budget','websiteType']`), selecting a website type set `submitted=true` (contact form) while `step` was still 1. Pressing Back ran `goToStep(step-1)` → step 0 (start), so the user was thrown back to the beginning.
**After**: `handleBack` now checks `submitted` first — if on the contact/summary screen it does `setSubmitted(false)` (back to the previous question), only then falls through to step navigation. Fixes both the 30k+ and 5k-30k summary screens.

### Bug 2 — Wrong price at "Proceed to Payment"
**File**: `frontend/src/pages/StartNewWebsiteCustomize.js`, `estimateTotal` (~line 345); new backend endpoint.
**Before**: the on-page `estimateTotal` summed only feature prices, but the backend derives `finalPrice = basePrice + featuresTotal` (`customerCreateCustomProjectOrder.js`). So the confirm popup's authoritative `finalPrice` was higher than the form estimate by exactly the category base price. User confirmed base price IS charged → the form estimate was the wrong side.
**After**: the form now fetches the category base price and includes it in the estimate, so it matches the backend `finalPrice`.
- New backend controller `backend/controller/order/getCustomerCategoryBasePrice.js` — customer-safe, single-category base price (the existing `getCategoryBasePrices.js` is admin-guarded and returns all categories; a customer can't call it). Reads the same `categoryBasePriceModel` (SSOT).
- New route `GET /api/customer/category-base-price?category=...` (authToken only), `routes/index.js`.
- New `SummaryApi.customerCategoryBasePrice`, `common/index.js`.
- `StartNewWebsiteCustomize.js`: new `basePrice` state, fetched alongside features per `projectCategory`; `estimateTotal`'s reduce now starts from `basePrice`.

### Bug 3 — UPI transaction ID had no minimum length
**File**: `frontend/src/pages/StartNewWebsiteCustomize.js`, `handleVerifyUpi` + QR input.
**Before**: `handleVerifyUpi` only checked `.trim()` non-empty. A 1–2 char id was accepted.
**After**: UPI id must be at least 12 digits (real UPI UTR is 12-digit numeric). Enforced in three places: `handleVerifyUpi` guard (`/^\d{12,}$/`), the input now strips non-digits (`replace(/\D/g,'')`, `inputMode="numeric"`), and the submit button is disabled below 12 digits.

### Bug 4 — Order reached admin BEFORE payment
**File**: `backend/controller/order/customerCreateCustomProjectOrder.js` (~line 186) — see Part B, which is the full fix.
**Root cause**: the order was created `orderVisibility: 'pending-approval'` the moment "Proceed" was pressed, before any payment, so it showed up in the admin's pending list unpaid. (An interim fix using `orderVisibility: 'hidden'` was tried and REVERTED — `hidden` isn't handled by the workspace list's bucket logic, so a hidden order fell through into "Active Orders", a worse bug. Do not reintroduce it.)

---

## PART B — Payment rework: order is created only on payment; wallet is instant

### The core principle (user-confirmed)
- **Wallet = the customer's own money.** Every rupee in it came from an admin-approved recharge, so spending it needs NO second approval — it is debited instantly.
- **UPI = new external money** — still goes through the existing admin approval chain.
- An order for full/partial payment is created **only when the customer actually pays**, so an unpaid order never reaches the admin.

### Historical context — why instant wallet debit is safe now (it wasn't before)
`renewMonthlyPlan.js` (lines ~86-112) has a commented-out "direct wallet deduction" block labelled "SECURITY ISSUE / main loophole". And `payInstallment.js`'s `paymentStatus:'paid'` path (~line 130) marks an installment paid but **never debits the wallet** and trusts a client-sent flag. That was the real loophole: money was marked paid without being debited, and the split was client-trusted. It is safe now because (a) the SERVER debits atomically, and (b) recharges are themselves admin-approved (doc 23), so wallet balance is always already-verified money.

### New shared helper — `backend/helpers/transactionService.js` (NEW FILE)
The single, param-driven place to create/settle transactions (previously each site inlined `new transactionModel`). NEW code uses it; the 3 existing inline sites (`verifyPaymentController`, `createRenewalOrder`, `invoiceLifecycle`) are intentionally left untouched (their renewal/combined/invoice shapes are nuanced and proven — they can migrate later).
- `createPaymentTransaction()` — a pending payment/deposit transaction, mirroring `verifyPaymentController`'s shape. Idempotent on `transactionId`.
- `deductWalletInstant()` — atomic guarded debit: `findOneAndUpdate({_id, walletBalance:{$gte:amount}}, {$inc:{walletBalance:-amount}})` (race-safe, can't overdraw) + a `type:'payment', status:'completed'` transaction. Returns `{ transaction, newBalance }`.
- `refundWalletInstant()` — atomic credit + `type:'refund', status:'completed'` transaction. Idempotent.
- `creditWalletInstant()` — admin recharge: atomic credit + `type:'deposit', status:'completed'` transaction (Part C).

### `customerCreateCustomProjectOrder.js` — before vs after
**Before**: created the order `pending-approval` on "Proceed", plus its invoice; no payment transaction; wallet payment relied on the dead `/wallet/deduct` route.
**After**:
- Body now accepts `paymentDetails { transactionId, upiTransactionId, paymentMethod }`. For any non-`decide_later` type, `paymentDetails.transactionId` is REQUIRED (`requiresPayment`) — an order is never created without a payment.
- The wallet/UPI split is decided **server-side** from the real balance (never client-sent — that was the loophole): `walletPart = min(walletBalance, amountDueNow)`, `upiPart = amountDueNow - walletPart`. A `upiPart>0` requires `paymentDetails.upiTransactionId`.
- `walletPart>0` → `deductWalletInstant()` (instant, `transactionId` = `${parent}-W`). `upiPart>0` → `createPaymentTransaction()` (pending, `transactionId` = parent).
- Order approval timing: fully wallet-covered (`upiPart===0`) → order set `approved` now, first installment marked paid / `paymentComplete`. Any UPI remainder → stays `pending-approval`; approving the UPI transaction later flips it (existing `transactionApprovalController`). `order.paidAmount` seeded with `walletPart` so the later UPI approval doesn't double-count.
- Response adds `walletPaid`, `upiPending`, `approved`, `transactionIds`.
- `decide_later` unchanged (order only, no transaction).

### `StartNewWebsiteCustomize.js` — before vs after
**Before**: `handleSubmit` created the order up-front (full/partial), then opened the popup; `submitVerification()` posted to `/wallet/verify-payment`; the wallet branch called the dead `/wallet/deduct`.
**After**:
- `handleSubmit` (full/partial) no longer creates the order — it just opens the popup (price shown is the client `estimateTotal`, which now matches the backend after Bug 2).
- New client-side `walletPart`/`upiPart` (from `context.walletBalance`) for display + QR amount; the backend re-derives them.
- New `createOrderWithPayment({ txnId, upiRef })` → the single atomic create call (order + invoice + wallet debit + pending UPI txn).
- `handleConfirmPayment`: `upiPart===0` → create + instant success (auto-approved); else show a UPI QR for the **remainder only** (`am=${upiPart}`).
- `handleVerifyUpi`: creates the order with the UPI id.
- `submitVerification` and the dead `/wallet/deduct` call REMOVED.
- Popup shows a wallet/UPI split breakdown; success copy is outcome-aware (`createdOrder.approved` → "project started" vs "submitted for approval"); wallet balance refreshed after debit.

### Refund-on-reject — `transactionApprovalController.js` `rejectTransaction`
**New**: when a rejected transaction has a `parentTransactionId` (a combined payment), the paired already-debited wallet portion (`parentTransactionId`, `paymentMethod:'wallet'`, `type:'payment'`, `status:'completed'`) is refunded via `refundWalletInstant()` (transaction id `${walletTxn}-REFUND`, idempotent so a retried rejection never double-refunds). Confirmed with the user: on UPI rejection the wallet part is returned.

---

## PART C — Admin wallet recharge (Phase 2)

Recharge model, both paths now exist:
- **Customer recharge** (pre-existing): UPI QR → UTR → `verify-payment` → PENDING `deposit` → admin approves → balance +=.
- **Admin self-recharge** (NEW): instant, no approval — admin is a trusted actor recording money already collected.

**New**: `backend/controller/user/adminRechargeWallet.js` (admin-guarded) — body `{ amount, paymentMethod, reference, note }`, methods `upi|cash|bank_transfer` (blank → `upi`); calls `creditWalletInstant()` → a `type:'deposit', status:'completed'` transaction + atomic balance credit, `verifiedBy = adminId`. Shows in the client's own wallet history (`getWalletHistory` includes `type:'deposit'`).
**Route**: `POST /api/admin/clients/:customerId/recharge-wallet`. **SummaryApi**: `adminRechargeWallet`.
**UI**: `AdminClientWorkspace.js` `PaymentInvoicesPanel` — a wallet-balance card + "Recharge Wallet" button opening a modal (amount / method / reference / note). On success it bumps `workspaceRefreshKey` (existing refetch mechanism) so balance + ledger update. No new page — additive to the existing Payment & Invoices tab.

---

## PART D — Shared instant wallet-payment endpoint (Phase 3 core)

**Why**: several pages (`InstallmentPayment.js`, `InvoiceDetailPage.js`, and the old customize flow) called `SummaryApi.wallet.deduct` → `/api/wallet/deduct`, which **has no backend route** (dead stub) — so wallet payment 404'd everywhere.
**New**: `backend/controller/user/walletPayInstant.js` — `POST /api/wallet/pay-instant`. For an existing order/installment owned by the caller: `deductWalletInstant()` (atomic, throws if insufficient → 400) + applies the payment to the order with the exact same math `transactionApprovalController` uses on approval (mark installment paid, advance `paidAmount`/`remainingAmount`, set `paymentComplete`/`currentInstallment`, `orderVisibility='approved'`).
**SummaryApi**: `wallet.payInstant`.

**Deliberately NOT done this session (deferred, needs live testing)**:
- Rewiring `InstallmentPayment.js` and `InvoiceDetailPage.js` from the dead `/wallet/deduct` to `/wallet/pay-instant`. Their flows are nuanced (two endpoints, order-update logic) and must be tested in a running app.
- Removing the dead `SummaryApi.wallet.deduct` / `addBalance` stubs — kept ONLY because those two pages still reference `deduct`; removing it now would crash them. Remove together with the page rewire above.
- `payInstallment.js`'s `paymentStatus:'paid'` loophole path — left as-is (out of scope; the new endpoint is the SSOT-safe replacement pages should move to).

---

## Files touched this session

**New (backend)**: `helpers/transactionService.js`, `controller/order/getCustomerCategoryBasePrice.js`, `controller/user/adminRechargeWallet.js`, `controller/user/walletPayInstant.js`.
**Changed (backend)**: `controller/order/customerCreateCustomProjectOrder.js`, `controller/user/transactionApprovalController.js`, `routes/index.js`.
**Changed (frontend)**: `pages/StartNewWebsiteBuild.js`, `pages/StartNewWebsiteCustomize.js`, `pages/AdminClientWorkspace.js`, `common/index.js`.
**Backups**: `backend/controller/order/backup_phase1_issue4_work1/`, `frontend/src/pages/backup_phase1_issue4_work1/`, `backend/controller/user/backup_phase1_issue4_work1/`, `frontend/src/pages/backup_phase2_recharge_work1/`, `frontend/src/common/backup_phase2_recharge_work1/`.
**Not run**: `npm run build` (per standing user instruction — user runs builds/tests themselves).
