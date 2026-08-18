# Service Add-on Hybrid Payment — Parent-Child Transaction Model

**Session date**: 2026-08-18
**Scope**: The "Add a Service" popup could only be paid from the wallet. It now accepts **wallet, UPI, or a combination**, using a parent-child transaction model so one UPI payment can cover several services while the admin approves it **once**.
**Read this before touching**: `customerCreateServicePlanOrdersBulk.js`, `transactionApprovalController.js`'s approve/reject, `helpers/transactionService.js`'s `createPaymentTransaction`, `AddServiceModal.js`.
**Read alongside**: `55_ADDON_SERVICE_SYSTEM_PHASE_1_TO_4.md` §6b (which explains why this path *was* wallet-only), `56_SERVICE_SYSTEM_REQUIREMENTS_AND_HANDOFF.md`, `51_CUSTOMIZE_FLOW_ISSUE_FIXES_AND_WALLET_INSTANT_PAYMENT.md` Part B (the split model this reuses), `52`/`53` (the approval logic this deliberately does not disturb).

---

## 1. The problem

**Before**: `customerCreateServicePlanOrdersBulk.js` rejected any purchase the wallet could not fully cover:

```
if (walletBalance < totalAmount) {
  return res.status(400).json({ message: "Your wallet doesn't cover the total..." });
}
```

and `AddServiceModal.js` disabled the pay button entirely (`canPay = ... && shortfall === 0`).

**Why it was built that way** (doc 55 §6b, still accurate): `transactionModel.orderId` and `.invoiceId` are **single refs, not arrays**, and `transactionApprovalController.js` resolves exactly **one** order and **one** invoice per transaction. One UPI payment covering N service orders would settle one and leave **N-1 pending forever**.

**Owner's decision this session**: build the parent-child model — *"ek project par agar koi service add ho rahi hai to sabhi approvals uss project ke under hi aani chahiye"*.

---

## 2. The model

```
                                 |-- Child Txn 1 -> Order 1 -> Invoice 1
1 UPI payment = PARENT TXN ------|-- Child Txn 2 -> Order 2 -> Invoice 2
   (admin approves ONCE)         |-- Child Txn 3 -> Order 3 -> Invoice 3
```

- **Parent** — the money the customer actually paid. Carries **no `orderId`, no `invoiceId`**. This is the only thing the admin approves or rejects.
- **Child** — one per service, each with its own `orderId`/`invoiceId` and `parentTransactionId` = parent's id. This is the **exact single-ref shape the approval engine already handles**.

Approving the parent settles each child through the *unchanged* single-order path. Nothing about docs 52/53 logic was rewritten — it is simply called once per child.

---

## 3. Payment split (server-side, never client-sent)

Same formula as the project-start flow (doc 51 Part B):

```
walletPart = min(walletBalance, totalAmount)
upiPart    = totalAmount - walletPart
```

| Case | Outcome |
|---|---|
| Full wallet (`upiPart === 0`) | Instant debit -> every service `approved` + active immediately. No parent transaction created. |
| Full UPI | Parent pending -> every service `pending-approval` |
| Combo | Wallet debited instantly + parent pending -> services `pending-approval` |

### Wallet allocation across services
`customerCreateServicePlanOrdersBulk.js` — new `allocation` block. Wallet money is allocated **sequentially** (service 1 fully, then service 2, ...) rather than pro-rated, so every share is a whole rupee and the per-service parts always add back to the batch total exactly. Verified against 5 cases including exact-boundary and single-service.

---

## 4. Changes, before -> after

### 4.1 `backend/helpers/transactionService.js` — `createPaymentTransaction`
- **Before**: no `parentTransactionId` parameter; the field was never written by this helper.
- **After**: accepts `parentTransactionId = null` and writes it into the document. Default keeps **every pre-existing caller byte-for-byte unchanged**.

### 4.2 `backend/models/transactionModel.js`
- **Before**: indexes on `invoiceId`, `orderId`, `userId+status`, `sourceType+status`. No index on `parentTransactionId`.
- **After**: added `transactionSchema.index({ parentTransactionId: 1 })` — child lookup on approve/reject runs on every approval, so it must be indexed.

### 4.3 `backend/controller/order/customerCreateServicePlanOrdersBulk.js`
- **Before**: hard 400 if wallet < total; per service one full-price wallet debit; every order forced `approved`.
- **After**:
  - Body accepts `upiTransactionId`; required when `upiPart > 0`.
  - Server-side `walletPart`/`upiPart` split, plus sequential `allocation` per service.
  - Per service: wallet share -> `deductWalletInstant` (carries `parentTransactionId` when combined) and settles the invoice by exactly that amount; UPI share -> a **child** `createPaymentTransaction` with its own `orderId`/`invoiceId`.
  - `order.paidAmount = walletShare`; the order is only marked `approved`/active when `upiShare === 0`.
  - A **parent** transaction is created last, when `upiPart > 0`.
  - Response now returns `walletPaid`, `upiPending`, `approved`, `parentTransactionId`, and per-order `walletPaid`/`upiPending`.
  - Rollback extended: pending child transactions and the parent are deleted too.

### 4.4 `backend/controller/user/transactionApprovalController.js`
Three new helpers added **above** `rejectLinkedOrderPayment`:
- `findChildTransactions` — finds `parentTransactionId = this.transactionId`, `status: 'pending'`, `paymentMethod != 'wallet'` (the wallet debit is already completed and settled at purchase time, so it must not be re-settled).
- `settleChildTransactions` — marks each child completed and calls the **existing** `applyApprovedOrderPayment` per child.
- `rejectChildTransactions` — marks each child rejected and calls the **existing** `rejectLinkedOrderPayment` per child.

Wired in:
- `approveTransaction` — **before**: always `applyApprovedOrderPayment(transaction)`. **After**: if children exist, settle them instead; otherwise unchanged. Message becomes "Payment approved — N services activated". Response gains `childOrders`.
- `rejectTransaction` — **before**: always `rejectLinkedOrderPayment(transaction, reason)`. **After**: if children exist, reject them all; otherwise unchanged.
- **Wallet refund on reject** — **before**: `findOne` for a single wallet portion keyed on `transaction.parentTransactionId`. **After**: `find` (plural, because a batch has one wallet debit per service), keyed on `transaction.transactionId` when this *is* a parent, or `transaction.parentTransactionId` when it is a child/plain combined payment. Both shapes handled by the one query.

**A transaction with no children falls through all of this unchanged**, so every pre-existing payment behaves exactly as before.

### 4.5 `frontend/src/components/AddServiceModal.js`
- **Before**: wallet-only; `shortfall > 0` disabled the button and showed "recharge or buy individually".
- **After**: two-step flow copied from the proven `StartNewWebsiteCustomize.js` / `ServicePlanDetail.js` pattern —
  - `walletPart`/`upiPart` shown as a split breakdown (display only; the server re-derives and is the authority).
  - `upiPart === 0` -> pay instantly.
  - `upiPart > 0` -> UPI QR for the **remainder only** (`am=${upiPart}`), 12-digit UTR input (non-digits stripped, submit disabled below 12 — doc 51 Bug 3), Back button.
  - Success panel is outcome-aware: emerald + `Check` when auto-approved, amber + `Clock` + "all N services activate together once confirmed" when awaiting approval.
  - Submit button reads **"Submit Payment"** (owner's wording; it was briefly "I have paid"), with "Submitting…" while in flight.
  - `shortfall` removed entirely.

---

## 5. Two real bugs caught during verification

Both found by *executing* the logic, not by reading it.

### Bug A — the parent would have credited the customer's wallet
`createPaymentTransaction` infers `isWalletRecharge = !isInstallmentPayment && !orderId`. The parent deliberately has **no `orderId`**, so the helper derived `type: 'deposit'` — and `approveTransaction` (~line 306) does `if (transaction.type === "deposit") user.walletBalance += amount`. Approving a service batch would have **credited the customer the UPI amount instead of collecting it**.

**Fix**: the parent passes `type: "payment"`, `sourceType: "order"`, `paymentStatus: "pending-approval"` explicitly rather than relying on inference.

### Bug B — the parent would have rejected the project
The parent first carried `orderId = linkedOrder._id` (the project) so admin UI could show context. But `rejectLinkedOrderPayment` would then treat the **project itself** as the thing being rejected and could set it `payment-rejected`. The project is only the *context* these services were bought for, not the thing being paid for.

**Fix**: `orderId` removed from the parent. The project reference moved to `parentTransaction.paymentDetails` (`{ isServiceBatch, serviceCount, linkedProjectOrderId, walletPart, upiPart, childTransactionIds }`), which admin UI can read without it being mistaken for a settlement target.

---

## 6. Verification performed

- `node --check` on all 4 changed backend files; `@babel/core` parse on `AddServiceModal.js`.
- `routes/index.js` **actually loaded** in node (with a dummy `RESEND_API_KEY`, since a missing key is a pre-existing boot failure unrelated to this work) — both controllers resolve.
- **Wallet allocation executed** against 5 cases (full wallet / full UPI / combo mid-service / combo exact boundary / single service): every case's shares sum exactly to the batch total, with no rounding drift.
- **End-to-end lifecycle simulated** using the real `isInvoiceTransaction` / `isOrderPaymentTransaction` predicates, asserting for each case that: the right children are settled, the parent settles nothing itself, the parent never credits the wallet, and the reject-time wallet refund total equals `walletPart` exactly.
- Repo grep confirmed **zero** orphaned `shortfall` references.
- **No `npm run build`** (standing instruction — owner runs builds).

---

## 7. What is still NOT built

Unchanged from doc 56 — this session was payment only:
- No activation engine (dormant `after` services, `timing`/`dependency`/capability fields) — doc 56 Phases A-C.
- No upload unlock/enforcement — doc 56 Phase D.
- No project-click routing to a service timeline — doc 56 Phase E.
- No reminder delivery — doc 56 Phase F.
- No cycle engine or recurring billing — doc 56 Phase G.
- **No admin UI change**: the parent transaction is approvable through the existing screen, but nothing yet renders "3 services on <project>" from `paymentDetails.isServiceBatch`. Worth doing next so the admin sees what they are approving.

---

## 8. Backups

`backend/_backup_service_hybrid_work1/` — `customerCreateServicePlanOrdersBulk.js`, `transactionApprovalController.js`, `transactionModel.js`
`frontend/src/_backup_service_hybrid_work1/` — `AddServiceModal.js`

(`helpers/transactionService.js` was changed additively — one optional parameter with a `null` default — after the backup set was taken; reverting it means removing that parameter and its one field write.)
