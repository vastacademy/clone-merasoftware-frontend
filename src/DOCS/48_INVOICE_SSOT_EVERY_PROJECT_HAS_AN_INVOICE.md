# Invoice SSOT — Every Project Order Has an Invoice + One Canonical Pay Surface + Per-Project Admin History

**Session date**: 2026-08-11
**Scope**: Ends the invoice fragmentation where some project orders had an `invoiceModel` document and some did not, so "invoice pending" state existed for only a subset of projects. Now **every** project order gets an unpaid invoice at creation (one shared helper), the customer pays only through **one canonical surface** (`/invoice-detail/:invoiceId`) with every other button just linking to it, existing orders were backfilled, and the admin now sees a project's own payment/invoice history **inside that project's detail sub-page** instead of only in the mixed client-wide ledger. Recurring-plan invoices (`monthlyInvoiceModel`) are a separate valid system and were deliberately left untouched. **No `npm run build` run** (standing instruction). Backend verified with `node --check`, frontend with `@babel/core` parse; the migration was run **dry-run first, then applied after user approval**, backup-first.

**Read this before touching**: `backend/controller/order/createOrder.js` (project invoice creation), `backend/controller/order/customerCreateCustomProjectOrder.js` (project invoice creation), `backend/controller/order/approveProjectOrder.js` (invoice fallback now legacy-only), `backend/scripts/backfillProjectInvoices.js` (new migration), `frontend/src/pages/InvoiceDetailPage.js` (canonical in-page pay), `frontend/src/pages/ProjectDetails.js` (payment links now redirect to invoice page), `frontend/src/pages/AdminClientWorkspace.js` (`WorkspaceDetailSubpage` per-order ledger).
**Read alongside**: `46_PROJECT_ORDER_APPROVAL_SYSTEM_AND_SHARED_PAYMENT_HELPER.md` (the shared `paymentRecording.js` helper this builds on — `createProjectInvoice()` / `markProjectInvoicePaid()`), `37_NEW_INVOICE_SYSTEM_FOR_ADMIN_CREATED_PROJECTS.md` (`invoiceModel`, `invoiceType: "project"`), `23_PAYMENT_SSOT_PHASE_0_TO_3.md` (`paymentLedger.js` `buildLedgerItems()` merge/dedup, `verifyPaymentController.js` invoiceId support), `42_CUSTOMIZE_FLOW_BACKEND_WIRING_AND_INPAGE_PAYMENT.md` (the in-page wallet/UPI pay pattern reused here), `39_...md` (the dry-run/backup-first migration-script precedent).

---

## 1. Why this work started

User asked (Hindi) why "invoice pending" and "project pending" felt fragmented — some projects showed a Payment Pending state, some didn't, and it wasn't clear which payment belonged to which project. Audit (read-only, this session) found the real cause: **two things were separate but only one of them was fragmented.**

- **Valid separation (kept)**: `order.orderVisibility` (project state: `pending-approval`/`approved`/`payment-rejected`) and `invoice.status` (money state: `unpaid`/`paid`) are two different questions and correctly stay two different fields. An approved project can still have an unpaid invoice (the "Approve without Payment" case from `46_...md`).
- **The actual fragmentation (fixed here)**: of the three project-order creation paths, only `adminCreateProjectOrder.js` created an `invoiceModel` document. `customerCreateCustomProjectOrder.js` (Pay Later) and `createOrder.js` (normal purchase) created **none** (`createOrder.js` only generated an invoice PDF via `emailService`, never an `invoiceModel` doc — verified). So "invoice pending" existed for admin-created projects only; a customer Pay-Later project silently had no invoice and its `ProjectDetails.js` "Payment Pending" banner (gated on `hasUnpaidInvoice`) never showed.

User decisions this session (each confirmed before coding):
- **Every project must have an invoice** — no exceptions. Bring all paths onto one shared helper.
- **Invoice is the single source of truth for payment**: canonical surface = `/invoice-detail/:invoiceId`. Payment is recorded there; every other place only opens that route via a link (`"user ek hi jageh se payment record kar payega lekin doosri jageh se woh just via link uska route hi open karega"`).
- `createOrder.js` invoices are **unpaid until payment**; the order stays `pending-approval` until paid (Q2).
- Recurring-plan `monthlyInvoiceModel` + `markInvoicePaidAndResumePlan()` (`invoiceLifecycle.js`) is a separate valid system — **not** merged.
- Admin: **only the project system** this session; a project's invoices/payments should show **inside that project's detail**, not only in the mixed client-wide ledger; the "Payment & Invoices" tab was **explicitly left in place, not deleted**.

## 2. Phase 1 — every project order creates an invoice (backend)

All three paths now call the shared `createProjectInvoice()` from `backend/helpers/paymentRecording.js` (`46_...md`), producing one invoice per installment (partial) or one full invoice (full/decide-later), all `status: "unpaid"`, `invoiceType: "project"`.

- **`customerCreateCustomProjectOrder.js`** — **Before**: created no invoice at all. **After**: after `order.save()`, creates per-installment (partial) or single (full/decide-later) unpaid invoices, `lineItems` = base + each feature.
- **`createOrder.js`** — **Before**: no `invoiceModel` doc (PDF only). **After**: after `order.save()`, **only for `isWebsiteService` project orders** (not plans/updates), creates unpaid invoice(s) — per-installment for partial, single otherwise, `lineItems` from `order.orderItems`. Wrapped in `try/catch` so an invoice failure can never hard-fail checkout (the order is already saved). Order visibility is unchanged — still `pending-approval` until paid.
- **`approveProjectOrder.js`** — **Before** (`46_...md`): the `approve_with_payment` branch created an invoice on the fly for a Pay-Later order that had none. **After**: since invoices now always exist at order time, the `findOne` normally succeeds and the create-if-missing branch is documented as a **legacy safety net** only (for pre-migration orders, until Phase 3 backfill runs). Code kept, comment updated — removing it would break approval for un-backfilled legacy orders.

## 3. Phase 2 — one canonical pay surface, everything else is a link (frontend)

- **`InvoiceDetailPage.js`** (`/invoice-detail/:invoiceId`) — **Before**: "Pay Now" did `navigate('/direct-payment', ...)`, and `DirectPayment.js` **always creates a new order** (duplicate risk). **After**: an **in-page** payment step (wallet + UPI-QR), reusing the exact pattern from `StartNewWebsiteCustomize.js` (`42_...md`). `submitVerification()` posts to `/wallet/verify-payment` with **`invoiceId` + `orderId` + `sourceType: 'invoice'`** (+ `installmentNumber` if the invoice is an installment) — never a second order. Wallet ≥ due → `/wallet/deduct` + verify; else UPI QR → verify. `verifyPaymentController.js` already accepts `invoiceId` (`23_...md` Section 2), so no backend change. New imports: `useContext`, `Context` (wallet balance + `fetchWalletBalance`), `QRCodeSVG`, `displayINRCurrency`, `toast`; a modal with confirm-summary and QR steps. All new hooks are declared before the existing loading/not-found early returns (hook-order safe).
- **`ProjectDetails.js`** — **Before**: `handleMakePayment()` navigated to `/installment-payment/:orderId/:num`, and the rejected-order "Retry Payment" button navigated to `/direct-payment` with full re-order state (duplicate risk). **After**: both now navigate to `/invoice-detail/:invoiceId` using `order.unpaidInvoice._id` (already exposed by `getOrderDetails.js`, `40_...md`), falling back to `/order-detail/:orderId` if no unpaid invoice. The Payment Pending banner already linked to the invoice page (`40_...md`), unchanged. `currentInstallment` is still used by the payment-alert component, so it was not removed. No `/direct-payment` or `/installment-payment` references remain in this file.

## 4. Phase 3 — backfill invoices for existing orders (migration)

**New `backend/scripts/backfillProjectInvoices.js`** — dry-run by default, `--apply` writes a backup snapshot first (`backend/migration-backups/orders-before-invoice-backfill-<ts>.json`), then creates invoices. Additive only — **never edits an order or any other model.** Scope: `isWebsiteProject: true` orders that currently have **zero** `invoiceModel` docs. Status derived from the order's **real** paid state: partial → one invoice per installment (`inst.paid` → `paid` with `paidDate`, else `unpaid`); full → `paymentComplete || paidAmount >= total` → `paid`, else `unpaid`.

**Run result (live DB, this session)**: 16 total project orders — 2 already had invoices, **14 needed backfill → 22 invoices created**. One ₹0 order was, per explicit user choice (option A), left to produce a `paid` invoice (its `paidAmount >= total` since total is 0). Re-running the dry-run afterward reported **need backfill: 0** — confirming completeness and idempotency. (Two script fixes were needed first: `require("../models/productModel")` for the `productId` populate, matching the reference script's `require("../models/userModel")` pattern.)

## 5. Phase 4 (same session, user-requested) — per-project admin history

User: the admin "Payment & Invoices" ledger mixes every project's and plan's records together, so it's unclear which payment belongs to which project; a project's records should live inside that project. Scope confirmed: **project system only**, **do not delete the Payment & Invoices tab**, plan side later.

- **`AdminClientWorkspace.js` → `WorkspaceDetailSubpage`** — **Before**: opening a project showed the approval bar (`46_...md`) + node/progress UI only; a project's payments/invoices were visible **only** in the separate mixed "Payment & Invoices" tab, whose rows navigate to `AdminPaymentRecordDetail` — which is broken for `invoiceModel` project invoices (its `findPaymentRecord` in `monthlyInvoiceController.js` queries `monthlyInvoiceModel` only, so project invoices return "Payment record not found"; root-caused this session, **not fixed** — bypassed instead). **After**: the projects-tab render passes `allData.invoices` + `allData.transactions` into the sub-page; the sub-page filters both down to **this order** (`String(ref?._id || ref) === String(item._id)` — handles `transaction.orderId` as a plain id and `invoice.orderId` as a populated object) and renders a read-only **"Payments & Invoices"** card via the same shared `buildLedgerItems()` merge/dedup (`paymentLedger.js`) the tab uses. Rows are display-only (approve/reject/record already live in the approval bar) and **do not navigate** anywhere, so the broken `AdminPaymentRecordDetail` route is never hit.
- **Not changed**: the "Payment & Invoices" tab and `PaymentInvoicesPanel` (kept per user), `AdminPaymentRecordDetail.js`, `monthlyInvoiceController.js`'s `monthlyInvoiceModel`-only bug (documented, deferred), and the entire plan/recurring side.

## 6. SSOT guarantees (no duplication, no fragmentation)

- Every project order → exactly one invoice set on `invoiceModel` (`invoiceType: "project"`), created by one shared helper (`createProjectInvoice`) across all three creation paths.
- Payment is recorded in exactly one place (`/invoice-detail/:invoiceId`, or the admin approval bar / record-payment, both via the shared `markProjectInvoicePaid`); every other UI surface only links to it. `DirectPayment.js`'s duplicate-order path is no longer used by these project surfaces.
- `verify-payment` is posted with `invoiceId`, so the resulting transaction links to the invoice, and `buildLedgerItems()` merges the transaction + its invoice into a single ledger row — customer-paid and admin-recorded payments look identical, never doubled.
- The admin per-project history is derived from the same already-fetched arrays and the same merge helper — no new endpoint, no parallel store.

## 7. Files touched this session

- **New**: `backend/scripts/backfillProjectInvoices.js`.
- **Changed (backend)**: `backend/controller/order/createOrder.js` (import + project invoice creation), `backend/controller/order/customerCreateCustomProjectOrder.js` (import + invoice creation), `backend/controller/order/approveProjectOrder.js` (comment: fallback is legacy-only).
- **Changed (frontend)**: `frontend/src/pages/InvoiceDetailPage.js` (in-page canonical pay), `frontend/src/pages/ProjectDetails.js` (payment links → invoice page), `frontend/src/pages/AdminClientWorkspace.js` (per-order Payments & Invoices card in `WorkspaceDetailSubpage`).
- **Backups**: `backup_invoice_ssot_20260811_180233/`, `backup_invoice_ssot_phase2_20260811_180943/`, `backup_project_invoice_history_20260811_190257/`; migration data backup under `backend/migration-backups/`.
- **Not touched**: `monthlyInvoiceModel` / `invoiceLifecycle.js` / `renewMonthlyPlan.js` (recurring plans), `DirectPayment.js` / `InstallmentPayment.js` (left intact, just no longer linked from the project surfaces), the "Payment & Invoices" tab + `PaymentInvoicesPanel` + `AdminPaymentRecordDetail.js`, `verifyPaymentController.js`. No `npm run build`.

## 8. Known-but-deferred (documented, not fixed)

- `AdminPaymentRecordDetail.js` / `monthlyInvoiceController.js`'s `findPaymentRecord()` + `resolveInvoiceForAction()` still query `monthlyInvoiceModel` only, so opening a **project** invoice from the mixed "Payment & Invoices" tab still shows "Payment record not found". This session **bypassed** it (per-project history doesn't navigate there) rather than fixing it. If the tab's row-click is ever wanted for project invoices, those two functions must also check `invoiceModel`.
- Plan/recurring invoices were intentionally left in the old system and out of the per-detail history rollout.
