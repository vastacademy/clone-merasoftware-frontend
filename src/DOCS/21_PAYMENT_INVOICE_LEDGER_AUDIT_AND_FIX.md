# Payment & Invoice Ledger: Root-Cause Audit, Admin "Record Payment" Fix, Backfill, and the Still-Broken Customer Invoice/Payment System

**Session date**: 2026-07-25
**Scope**: Admin `AdminClientWorkspace.js` -> `Payment & Invoices` tab duplicate-record root cause; admin `AdminPaymentRecordDetail.js` "Mark as Paid" renamed to "Record Payment" with a new admin-only internal note; one-time backfill of 7 orphaned paid invoices; full audit (not yet fixed) of the customer-facing invoice/payment system, which is confirmed broken/missing end-to-end.
**Read this before touching**: `AdminClientWorkspace.js` (`PaymentInvoicesPanel`), `AdminPaymentRecordDetail.js`, `monthlyInvoiceController.js`, `invoiceLifecycle.js`, `transactionModel.js`, `monthlyInvoiceModel.js`, `UserInvoices.js`, `PlanDetails.js`, `UserUpdateDashboard.js`, `backend/scripts/auditPaymentInvoiceLedger.js`.

## 1. The problem as reported

Admin panel -> client detail -> `Payment & Invoices` tab showed **2 separate records for what should be 1 sale/payment** on some plans — a "Payment" row and an "Invoice" row, unlinked, instead of one merged row.

## 2. Root cause — confirmed via live read-only DB audit, not assumption

`AdminClientWorkspace.js`'s `PaymentInvoicesPanel` (~line 1084-1123) already de-duplicates correctly *when the link exists*: it builds the ledger from all `transactions`, then adds an `invoices` entry only if that invoice's `_id` is not already referenced by some transaction's `invoiceId`. The bug was never in this merge logic — it was that some `transactionModel` documents were saved with `invoiceId: null` even though they were payments against a real invoice, so the dedupe `Set` could never match them.

**Live DB audit result (before any fix), via `backend/scripts/auditPaymentInvoiceLedger.js`, read-only dry-run**:
- Total monthly invoices: 14. Paid: 12.
- **7 of the 12 paid invoices had zero linked completed transaction** (all belonging to one customer, `singhsandeep178@gmail.com`).
- All 7 had `paymentMethod: "cash"` and a placeholder `transactionReference: "sa"` — evidence these were marked paid through some earlier/side path that bypassed the transaction-creation helper, not through today's `markInvoiceAsPaid` flow (which always creates the linked transaction).

**Why this can happen at all — by design, two independent write paths exist for invoices vs. transactions**:
- `backend/cron/autoRenewalCron.js` creates a `monthlyInvoiceModel` document standalone (`status: 'unpaid'`) with **no transaction created at invoice-creation time** — correct by design, since the customer hasn't paid yet.
- The only code path that pairs a transaction with an invoice safely is `backend/helpers/invoiceLifecycle.js`'s `ensureCompletedInvoiceTransaction()` / `markInvoicePaidAndResumePlan()`, called from admin's "Mark as Paid" (`monthlyInvoiceController.js`) and from `transactionApprovalController.js`'s `approveTransaction()` (when a transaction already carries an `invoiceId`).
- `backend/controller/user/verifyPaymentController.js` (customer-submitted payment verification) *does* support an `invoiceId` field in its request body and will link it correctly if passed — but **no frontend page currently sends it** (confirmed by grep: `AdminClientWorkspace.js` is the only frontend file that references `invoiceId` at all, and only for display, never for submission).

## 3. Fix applied this session

### 3a. Admin-only internal note field (new)

**Requirement from user**: when admin manually records a payment (cash/offline collection), admin should be able to write a comment/note. This must **never** be shown to the customer.

**Why a new field was required instead of reusing `monthlyInvoiceModel.notes`**: `notes` already exists on the schema and is already rendered directly to the customer on `UserInvoices.js` (line ~213-217, `invoice.notes`). Reusing it for admin's internal comment would have leaked internal admin remarks to the customer — flagged and avoided.

**Changed**:
- `backend/models/monthlyInvoiceModel.js` — new field `internalNote: { type: String, default: null }`, explicitly commented as admin-only, never exposed to the customer.
- `backend/helpers/invoiceLifecycle.js` — `markInvoicePaidAndResumePlan({ ..., internalNote })` now accepts and saves it onto the invoice (only when the caller passes the key at all, so other callers that omit it are unaffected).
- `backend/controller/invoice/monthlyInvoiceController.js` — `markInvoiceAsPaid` now reads `internalNote` from `req.body` and passes it through.
- `frontend/src/pages/AdminPaymentRecordDetail.js` — new textarea "Admin note (internal only, not shown to customer)" in the mark-paid form; submits `internalNote` alongside `paymentMethod`/`transactionReference`; also displays the saved `internalNote` in the Invoice detail info-grid so admin can see a previously-written note.

**No customer-facing API returns `internalNote`** — confirmed: the customer invoice list endpoint the frontend calls (`/api/my-invoices`) does not exist in the backend at all (see Section 4), so there is currently no way for this field to leak to the customer even accidentally.

### 3b. Button relabeled

`AdminPaymentRecordDetail.js` — "Mark Invoice Paid" button renamed to **"Record Payment"**, matching the user's distinction between two conceptually different admin actions on the same detail page:
- **"Accept Payment" / "Reject Payment"** (pre-existing, unchanged) — used when a *customer* already submitted a transaction (`transaction.status === 'pending'`); admin verifies and approves/rejects it.
- **"Record Payment"** (renamed this session) — used when *admin* is recording a payment the customer made outside the app (cash, offline UPI) directly against an `unpaid`/`overdue` invoice.

Both actions were already conditionally rendered correctly by pre-existing `canApproveReject`/`canMarkPaid` booleans (~line 78-79) — this session did not change which action shows when, only the label and the new note field on the "Record Payment" path.

### 3c. Backfill of the 7 orphaned paid invoices — applied

Ran `backend/scripts/auditPaymentInvoiceLedger.js --apply` (pre-existing script, not written this session) against the live database. It created one `transactionModel` document per orphaned paid invoice: `status: 'completed'`, `invoiceId` set to the real invoice, `transactionId` pattern `BACKFILL-<invoiceNumber>`, `paymentMethod: 'cash'` (copied from the invoice), `upiTransactionId` copied from the invoice's `transactionReference`.

**Verified after running**: read-only re-query confirmed 0 of 12 paid invoices remain without a linked completed transaction (was 7). All 7 will now render as a single merged ledger row in `AdminClientWorkspace.js` instead of two unlinked rows.

**Not touched by the backfill**: the other 22 `completed` transactions with `invoiceId: null` on this same customer are unrelated wallet/order/installment payments (correctly `invoiceId: null` — they were never supposed to link to an invoice) — the audit script only targets the `paidInvoicesMissingTransaction` mismatch class, nothing else.

## 4. Confirmed broken/missing: the entire customer-facing monthly-invoice payment system

This was raised by the user as a direct question ("client ko invoice/payment overdue kaise pata chale?") and investigated read-only. **Nothing in this section was fixed — it is documented so a future session/AI does not have to re-derive it from scratch.**

### 4a. `/my-invoices` (`UserInvoices.js`) — routed, but calls a backend endpoint that does not exist

- `frontend/src/routes/customerRoutes.js` actively routes `/my-invoices` -> `UserInvoices.js`.
- `UserInvoices.js` calls `SummaryApi.invoices.getUserInvoices` -> `GET /api/my-invoices`.
- **Confirmed via grep across the entire `backend/` tree: no route, controller, or handler for `/api/my-invoices` (or any "getUserInvoices"-named function) exists.** This page will fail its fetch and never show the customer any invoice the moment it's opened.
- Independently of the missing endpoint, `UserInvoices.js`'s "Pay Now" button (line ~189-192) is a dead stub:
  ```js
  onClick={() => toast.info('Payment feature will be available soon!')}
  ```
  Even if the missing endpoint existed, there is no payment submission wired to an invoice anywhere in the customer portal.

### 4b. `PlanDetails.js` — a status badge exists, but no way to see or act on the actual invoice

`getPlanVisualStatus()` (~line 42-91) already detects the paused/overdue state correctly (`isRecurring && plan.autoRenewalStatus === 'paused'` -> `{ badge: 'Payment overdue' }`), and the page renders:
```jsx
{status.tone === 'paused' && (
  <p ...>Payment overdue — clear invoice to continue.</p>
)}
```
This is **text only** — no link, no button, no amount, no due date, no invoice number. The customer learns "something is overdue" but cannot see which invoice, how much, or pay it from here.

`UserUpdateDashboard.js`'s equivalent paused-state notice (Section 3b of `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md`) links to `/my-invoices` — but that destination is itself broken per 4a above, so the link is a dead end today.

### 4c. What does NOT exist anywhere in the customer portal, confirmed by grep, not assumed

- No customer-facing list of monthly invoices grouped/filterable by plan or month.
- No per-invoice amount/due-date/status detail visible to the customer.
- No working "pay this invoice" submission flow (UPI or otherwise) tied to a specific `invoiceId` from the customer side. The only invoice-aware payment-recording path in the whole app is the **admin** "Record Payment"/"Verify Payment" flow described in Section 3.
- The yearly-renewable-plan renewal flow (`RenewalModal.js` / `createRenewalOrder.js` / `/create-renewal`) is a **separate, non-overlapping system** from the monthly-invoice cron (`autoRenewalCron.js`) — it creates transactions linked by `orderId`, never creates or links to a `monthlyInvoiceModel` document at all. Live DB check this session: `renewalTxns: 0` — this flow has never actually been used in production data yet.

### 4d. User's stated intent (recorded verbatim in scope, for a future implementation session)

User confirmed this customer-facing system is genuinely wanted and incomplete, not out-of-scope: customers should be able to see, per plan, which invoice/month's payment is unpaid and is the reason their plan isn't active, and be able to pay it. **No implementation has started on this. A future session must**:
1. Build the missing `GET /api/my-invoices` backend endpoint (customer-scoped, likely mirroring the `monthlyInvoiceModel.find({ userId })` shape already used in `getAdminUserWorkspace.js`).
2. Wire `UserInvoices.js`'s "Pay Now" to a real submission flow that calls `verifyPaymentController` **with `invoiceId` set** (the backend already supports this field; only the frontend caller is missing) — reusing the existing UPI-submission UI pattern already used elsewhere (`DirectPayment.js`/`InstallmentPayment.js`).
3. Fix the `/my-invoices` dead-end link from `PlanDetails.js`/`UserUpdateDashboard.js`'s paused notices once the destination page actually works, and ideally deep-link to the specific overdue invoice rather than the general list.

## 5. Files touched this session (complete list)

- `backend/models/monthlyInvoiceModel.js` — new `internalNote` field.
- `backend/helpers/invoiceLifecycle.js` — `markInvoicePaidAndResumePlan()` accepts/saves `internalNote`.
- `backend/controller/invoice/monthlyInvoiceController.js` — `markInvoiceAsPaid` reads `internalNote` from request body.
- `frontend/src/pages/AdminPaymentRecordDetail.js` — new note textarea + display field; button relabeled "Mark Invoice Paid" -> "Record Payment".
- **Data change (not code)**: 7 `transactionModel` documents created in the live database via `backend/scripts/auditPaymentInvoiceLedger.js --apply` (pre-existing script, not modified) — see Section 3c for exact effect.
- **Not touched, confirmed broken/missing on purpose, deferred to a future session**: `UserInvoices.js`, the missing `/api/my-invoices` backend route, `PlanDetails.js`'s and `UserUpdateDashboard.js`'s dead-end "Payment overdue" notices, `RenewalModal.js`/`createRenewalOrder.js` (separate unused system, left as-is).

## 6. Working-style note for whoever picks this up next (recorded per explicit user instruction)

This session's collaboration pattern, to replicate:
1. Read relevant docs + actual code first. Never assume — every claim above was verified either by reading the file directly or by running a **read-only** Node script against the live database (`backend/scripts/auditPaymentInvoiceLedger.js`, run without `--apply` first).
2. Present findings and a plan; wait for explicit approval before writing any code.
3. Scope every fix narrowly to what was asked — this session deliberately did not touch the customer-facing invoice system even after finding it broken, because fixing it was not yet approved.
4. After coding, verify the DB-level effect with another read-only query (Section 3c) rather than assuming the write succeeded.
5. `npm run build` / deploy was not run — left for the user to trigger explicitly.
