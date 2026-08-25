# Project-Order Approval System + Shared Payment-Recording Helper (SSOT)

**Session date**: 2026-08-11
**Scope**: Closes the one open gap in the customer project-approval flow — a customer-initiated **"Pay Later" (decide-later)** project order that is created `pending-approval` with **no transaction and no invoice**, which the existing transaction-based approval engine had nothing to act on. Adds an admin approval bar (approve without payment / record payment & approve / reject) inside the existing per-customer client workspace, and extracts the payment-recording logic into a shared helper so both the create-project flow and the new approval flow write **one** transaction + **one** invoice (single source of truth, no duplicate records). **No `npm run build` run** (standing instruction). All files verified with `node --check` (backend) and `@babel/core` parse (frontend).

**Read this before touching**: `backend/helpers/paymentRecording.js` (new), `backend/controller/order/approveProjectOrder.js` (new), `backend/controller/order/adminCreateProjectOrder.js` (now imports the extracted helper), `backend/routes/index.js` (new approval route), `frontend/src/common/index.js` (`approveProjectOrder` endpoint), `frontend/src/pages/AdminClientWorkspace.js` (`WorkspaceDetailSubpage` approval bar).
**Read alongside**: `33_ADMIN_CREATE_PROJECT_FOR_CLIENT.md` (`adminCreateProjectOrder.js`, source of the extracted helper), `42_CUSTOMIZE_FLOW_BACKEND_WIRING_AND_INPAGE_PAYMENT.md` (`customerCreateCustomProjectOrder.js`, the Pay-Later order this approves), `38_TWO_STEP_PAYMENT_SETTINGS_AND_PAYMENT_PENDING_LOCK.md` (the original `markProjectInvoicePaid()`, customer "Payment Pending" banner), `23_PAYMENT_SSOT_PHASE_0_TO_3.md` (`transactionApprovalController` / `paymentLedger.js` merge-dedup), `37_NEW_INVOICE_SYSTEM_FOR_ADMIN_CREATED_PROJECTS.md` (`invoiceModel`).

---

## 1. Why this work started

The customer "Start New Project → Pay Later" path (`customerCreateCustomProjectOrder.js`, doc 42) creates an order with `orderVisibility: "pending-approval"`, `paidAmount: 0`, and — verified this session — **no `transactionModel` document and no `invoiceModel` document**. The existing approval engine (`transactionApprovalController.js`, `POST /api/wallet/approve-transaction`) can only approve a *transaction*, so for a Pay-Later order there was **nothing to approve** and no admin UI to do it.

User requirement (confirmed): admin must be able to approve a customer-started project in three real cases —
1. Customer paid in full → admin approves the payment.
2. Customer paid the first installment (partial) → admin approves, or rejects if the payment looks fake.
3. Customer started with no payment → admin either approves without payment, or records a payment themselves and approves.

Explicit user decisions this session:
- **Approval UI stays per-customer** (inside `AdminClientWorkspace`), **no new central inbox** page.
- For case 3, admin gets **both options** — approve without payment, or record a payment in any way, their choice.
- Reject sets the order to `payment-rejected` and is shown to the customer with a reason.
- **Everything is one SSOT** — whether the customer records the payment or the admin does, it lands on the same records. No two records for one order.

## 2. Verified pre-existing state (audit first, not assumed)

- **Case 1 & 2 were already fully working.** A customer full/installment payment posts to `/wallet/verify-payment` (`verifyPaymentController.js`) creating a `transactionModel` with `status: "pending"`, which `verifyPaymentController.js` itself makes duplicate-safe (line 33-44: `findOne({ transactionId })` returns "already submitted" instead of inserting a second row). Admin accepts/rejects it in **Payment & Invoices → row → `AdminPaymentRecordDetail.js`** via `approveTransaction`/`rejectTransaction` (`transactionApprovalController.js`), which flips **that same** transaction to `completed`/`rejected` and drives `order.orderVisibility`. **This session did not touch any of that.**
- **Case 3 was the only gap** — Pay-Later order carries no transaction/invoice, so it appeared only in the **Projects** tab (as a `pending-approval` project) with no approval action anywhere.
- `orderProductModel.orderVisibility` enum already supports `approved` / `pending-approval` / `payment-rejected` (verified) — no schema change needed.
- `markProjectInvoicePaid()` already existed **inside** `adminCreateProjectOrder.js` (doc 38) as a local function, creating a `completed`/`approved` `transactionModel` + marking the `invoiceModel` `paid`. It was **not** reusable from anywhere else.
- The admin ledger (`paymentLedger.js` → `buildLedgerItems()`) already merges a transaction and its linked invoice into a **single** row, so an admin-recorded payment cannot show as two rows.

## 3. Change 1 — Shared payment-recording helper (SSOT enforcement)

**New file `backend/helpers/paymentRecording.js`** exports two functions:
- `markProjectInvoicePaid({ invoice, customerId, paymentMethod, transactionReference, notes, actorId })` — **extracted verbatim** from `adminCreateProjectOrder.js`. Creates one `transactionModel` (`status: "completed"`, `paymentStatus: "approved"`, `type: "payment"`, `sourceType: "invoice"`, `verifiedBy: actorId`) and marks the passed `invoiceModel` `paid`. Only cosmetic change vs. the original: the transaction `description` was generalized from "Payment recorded at project creation for invoice X" to "Payment recorded for invoice X" (it is now used at approval-time too, not only create-time) — behavior identical.
- `createProjectInvoice({ customerId, orderId, amount, lineItems, installmentNumber?, invoiceDate?, dueDate? })` — builds one `invoiceModel` (`invoiceType: "project"`, `status: "unpaid"`) via the existing `generateInvoiceNumber()`. Same shape the create-flow already used inline; extracted so the approval flow can create an invoice for a Pay-Later order that has none.

**Before → After — `backend/controller/order/adminCreateProjectOrder.js`**:
- **Before**: defined its own local `markProjectInvoicePaid()` (~30 lines) and imported `transactionModel` directly.
- **After**: deletes the local definition, imports `markProjectInvoicePaid` from `../../helpers/paymentRecording`, and drops the now-unused `transactionModel` require (verified: zero remaining `transactionModel` references in the file). `invoiceModel` + `generateInvoiceNumber` are kept — the inline per-installment invoice-creation loop was left unchanged (this session did not route it through `createProjectInvoice`, to keep the create-flow diff minimal). No behavior change to project creation.

## 4. Change 2 — Order-level approval controller

**New file `backend/controller/order/approveProjectOrder.js`**, admin-guarded (`req.userRole === "admin"` + `roles.includes("admin")`), one handler with three `mode`s. Route (new, `routes/index.js`):
```js
router.post("/admin/projects/:orderId/approval", authToken, approveProjectOrderController)
```

Guards (both verified against live enum/field names):
- **Idempotency**: acts **only** when `order.orderVisibility === "pending-approval"` — a second call returns "already {state}", so double-approve / retry cannot re-run.
- **No-duplicate payment**: `mode === "approve_with_payment"` first does `transactionModel.findOne({ orderId, status: "completed" })` and **refuses** if one exists — an order that already has a payment (e.g. customer paid) can never get a second admin-recorded one.

Modes:
- **`approve_no_payment`** → `orderVisibility = "approved"`, `status = "in_progress"` (if pending), `rejectionReason = null`. Invoice/payment untouched (customer pays later — the existing amber "Payment Pending" banner from doc 38/40 covers this on the customer side).
- **`approve_with_payment`** → find the order's first unpaid invoice; if none exists (the Pay-Later case), create one via `createProjectInvoice()` (`lineItems` derived from `order.orderItems[]` — base + each feature; amount = first installment for partial, else full total). Then `markProjectInvoicePaid()` → update `paidAmount`/`remainingAmount`/installment[0].paid (same math as the create path) → approve.
- **`reject`** → requires a reason; `orderVisibility = "payment-rejected"`, `rejectionReason = reason`.

## 5. Change 3 — Admin approval bar (frontend)

**`frontend/src/common/index.js`**: new `approveProjectOrder: { url: `${backendDomain}/api/admin/projects`, method: "post" }` (component appends `/${orderId}/approval`, mirroring the existing node-endpoint pattern).

**`frontend/src/pages/AdminClientWorkspace.js` → `WorkspaceDetailSubpage`**:
- **Before**: opening a project (Projects tab → row click) showed only the node/progress management UI; a `pending-approval` project had no approval action anywhere.
- **After**: a conditional **approval bar** renders at the **top of the detail body**, shown only when `detailLabel === "Project"` **and** `item.orderVisibility === "pending-approval"`. Amber card, three buttons:
  - **Approve without Payment** → `submitApproval("approve_no_payment")`.
  - **Record Payment** → toggles an inline form reusing the **exact existing** Payment Method (`PAYMENT_METHOD_OPTIONS`) / Transaction Reference / Note fields + `projectFormLabelClassName`/`projectFormInputClassName` styles from `CreateProjectForClientForm` (doc 38) → "Record Payment & Approve" → `submitApproval("approve_with_payment")`.
  - **Reject** → toggles an inline reason input → "Confirm Reject" (disabled until reason typed) → `submitApproval("reject")`.
- New local state (`approvalMode`/`approvalMethod`/`approvalReference`/`approvalNotes`/`approvalRejectReason`/`approvalSubmitting`), all reset in the existing `useEffect([item?._id])`. On success: `toast` + the existing `onSoftRefresh?.()` (already wired from the Projects-tab render) re-fetches the order so the bar disappears once approved/rejected. No other part of the sub-page changed.

## 6. SSOT — how duplication is prevented (the user's explicit concern)

One order = **one** transaction = **one** invoice = **one** ledger row, always:
- Admin "Record Payment" and customer QR/wallet payment both write the **same `transactionModel`** with the same field shape — one collection, not a parallel "admin payment" store.
- Both mark the **same `invoiceModel`** paid — one invoice model (`invoiceType: "project"`), reused, not duplicated.
- Approval state lives **only** in `orderVisibility` — no second `isApproved` flag was added.
- `buildLedgerItems()` collapses a transaction + its linked invoice into one row, so the admin-recorded payment shows once in **Payment & Invoices**, identical to a customer-paid one.
- The controller's `findOne({ orderId, status: "completed" })` guard blocks the only path that could create two payments for one order.

## 7. Where the admin acts (final UI map)

| Case | Admin location | Action |
|---|---|---|
| Customer paid full / installment | Client → **Payment & Invoices** tab → payment row → `AdminPaymentRecordDetail` | Accept / Reject (existing, unchanged) |
| Customer "Pay Later" (no payment) | Client → **Projects** tab → open the pending project → approval bar at top | Approve without Payment / Record Payment & Approve / Reject (new) |

## 8. Explicitly not changed / out of scope

- `verifyPaymentController.js`, `transactionApprovalController.js`, `AdminPaymentRecordDetail.js` — the customer-paid (case 1 & 2) flow is untouched.
- The customer-side `ProjectDetails.js` "Payment Pending" banner (doc 38/40) already covers the approve-without-payment case — no change needed.
- No coupon/discount handling, no email/notification on approve/reject.
- The create-flow's inline invoice loop in `adminCreateProjectOrder.js` was **not** re-routed through `createProjectInvoice()` (kept minimal); only `markProjectInvoicePaid` was shared.

## 9. Files touched this session

- **New**: `backend/helpers/paymentRecording.js`, `backend/controller/order/approveProjectOrder.js`.
- **Changed (backend)**: `backend/controller/order/adminCreateProjectOrder.js` (import extracted helper, drop local copy + unused `transactionModel` import), `backend/routes/index.js` (import + `POST /api/admin/projects/:orderId/approval`).
- **Changed (frontend)**: `frontend/src/common/index.js` (`approveProjectOrder` entry), `frontend/src/pages/AdminClientWorkspace.js` (`WorkspaceDetailSubpage` approval bar + state).
- **Backup**: `backup_approval_system_20260811_171018/` (pre-session copies of the 4 pre-existing changed files).
- **Not touched**: `verifyPaymentController.js`, `transactionApprovalController.js`, `customerCreateCustomProjectOrder.js`, `AdminPaymentRecordDetail.js`, `paymentLedger.js`. No `npm run build` run.
