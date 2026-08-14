# Invoice / Payment SSOT Correction — Fullproof Plan (PLAN ONLY, no code yet)

**Status**: PLAN — approved-in-concept, implementation NOT started.
**Author context**: Written after a live read-only DB audit + full-codebase trace of every invoice
creator / settler / reader. This document is the single source of truth for the fix. Nothing here
has been coded yet — each phase's exact before/after code will be shown for approval before editing.

**Core principle (unchanged, user-confirmed)**: Wallet = the customer's own already-approved money
→ spent INSTANTLY, no admin approval. UPI = new external money → admin verifies/approves. One rupee
is never approved twice. **And now added**: Invoice = a *demand for money*; Payment = the *money*;
an invoice's paid-state is DERIVED from money actually received — never hardcoded, never set in two
places. One invoice model, one settle helper. No duplication, no fragmentation (SSOT).

---

## 1. The bug, proven with real data

Live read-only audit (`backend/scripts/readOnlyAuditWalletProjectPayment.js`) of the 5 most recent
`isWebsiteProject` orders showed:

- **Order `6a7efebd…` — ₹15000, full payment from wallet (the reported case):**
  - `orderVisibility: approved`, `status: in_progress`, `paidAmount: 15000`, `paymentComplete: true` ✅
  - transactions: 1 → `wallet, type:payment, status:completed` ✅ (nothing pending, admin untouched)
  - **invoice `INV-202608-0033`, amount 15000, `status: unpaid`** ❌ ← THE BUG
  - → The wallet was fully debited and the order was approved, but the invoice was left `unpaid`
    forever, because nothing marks a wallet-instant payment's invoice as paid.
- **Partial orders `6a788f23…` (3 installments) / `6a788efc…` (2 installments):**
  - **3 invoices / 2 invoices created at once, ALL `unpaid`** ❌ ← future-installment invoices are
    minted up-front even though only #1 is due now.
- **Orphan `6a7ab6aa…`:** `orderVisibility: approved` but `paidAmount: 0`, `remainingAmount: 45998`,
  **0 transactions** — approved with no payment at all (a separate pre-existing data defect).

### Root cause (one line)
Invoice creation and payment settlement live in **different places**, and the instant-wallet path
never settles the invoice. `createProjectInvoice()` always writes `status: "unpaid"`
(`helpers/paymentRecording.js:74`) on the assumption that "admin approval will mark it paid later" —
but a full-wallet payment has no admin step, so its invoice stays `unpaid`. Separately, partial
orders mint every installment's invoice at creation instead of only the due one.

---

## 2. Current system map (evidence — what exists TODAY, do not break)

### 2a. Two invoice models (this fragmentation is part of the problem)
- **`invoiceModel`** (`invoiceType: 'project' | 'plan_renewal'`) — the NEW, generic project invoice.
  Statuses: `unpaid | paid | overdue | cancelled`. **This is the SSOT model going forward.**
- **`monthlyInvoiceModel`** — the OLD recurring-plan invoice (yearly-billed-monthly). Driven by
  `cron/autoRenewalCron.js` and admin `monthlyInvoiceController.js`. Planned for eventual removal
  but STILL LIVE for real recurring-plan customers — **out of scope here, must stay untouched.**

### 2b. Who CREATES a project invoice (`createProjectInvoice` → invoiceModel)
| Caller | When | Current behaviour |
|---|---|---|
| `customerCreateCustomProjectOrder.js:268,279` | customize flow create | full → 1 unpaid; partial → ALL installment invoices unpaid ❌ |
| `createOrder.js:348,359` | public storefront checkout | same shape (full → 1; partial → ALL) ❌ |
| `adminCreateProjectOrder.js:197,213` | admin "Create Project for Client" | full → 1; partial → per-installment; then marks the FIRST paid (correct-ish, see 2c) |
| `approveProjectOrder.js:169` | admin approve a Pay-Later order | find-or-create ONE invoice, then mark paid ✅ (golden pattern) |

### 2c. Who SETTLES (marks paid) a project invoice
- **`markProjectInvoicePaid()`** (`helpers/paymentRecording.js:15`) — the CORRECT shared helper for
  `invoiceModel`. Sets `status:'paid'` + writes a `completed` transaction. Used by
  `adminCreateProjectOrder.js:231` and `approveProjectOrder.js:178`. **This is the settle-SSOT to
  reuse everywhere.**
- **`markInvoicePaidAndResumePlan()`** (`helpers/invoiceLifecycle.js:140`) — for
  `monthlyInvoiceModel` ONLY (does `.findById` on monthlyInvoiceModel + plan-resume logic). Used by
  `monthlyInvoiceController.js:58` and `transactionApprovalController.js:42`.

### 2d. Two BUGS introduced by the wallet-instant work already in the tree (must be corrected here)
- `walletPayInstant.js:107` (invoice-mode) calls `markInvoicePaidAndResumePlan` (monthlyInvoiceModel)
  — WRONG model for project invoices. A project invoice paid from InvoiceDetailPage would 404
  ("Invoice not found") or hit the wrong system.
- `transactionApprovalController.js:42` (invoice branch) also routes ALL invoice transactions through
  `markInvoicePaidAndResumePlan` — so approving a UPI payment against a PROJECT invoice never settles
  the project invoice.

### 2e. Who READS invoices (so we know what must keep working — regression surface)
- `getMyPaymentWorkspace.js` (customer) + `getAdminUserWorkspace.js` (admin) — both merge
  `monthlyInvoices` + `projectInvoices` into one `invoices[]` and select `status`. Any invoice we
  create/settle must set `status` correctly for these to stay honest.
- Frontend readers: `InvoiceDetailPage.js`, `OrderDetailPage.js`, `AdminClientWorkspace.js`
  (`PaymentInvoicesPanel` + per-order ledger via `helpers/paymentLedger.js`). These derive
  Paid/Pending/Overdue purely from invoice+transaction fields — no change needed if fields are right.

---

## 3. Target professional flow (what "correct" means)

```
ORDER ──► INVOICE(s) ──► PAYMENT(s)/TRANSACTION(s)
(what)     (how much,     (real money: wallet=instant / UPI=approve,
            when due)      completed vs pending)
```

Rules:
1. **Invoice is created only when its money is due now.** Full → 1 invoice. Partial → only
   installment #1 at creation; #2/#3 are created when that installment is actually being paid
   (due-based).
2. **An invoice's paid-state is derived from money received**, set only through the ONE shared
   `markProjectInvoicePaid()` helper — never hardcoded elsewhere, never in two places.
3. **Wallet fully covers the due amount** → that invoice is marked `paid` instantly at create/pay
   time; order approved. **No admin step.**
4. **Wallet + UPI remainder** → wallet part debited instantly (completed txn); the invoice is NOT
   yet paid; the UPI part is a pending txn. When admin APPROVES the UPI txn → the SAME invoice is
   settled to `paid` and the order approved. If admin REJECTS → wallet part auto-refunded (already
   implemented in `transactionApprovalController.rejectTransaction`).
5. **One invoice model** for projects (`invoiceModel`). `monthlyInvoiceModel` stays only for legacy
   recurring plans, untouched.

---

## 4. The plan — phase by phase (each: what to change, what to remove, regression guard)

> Golden reference for the correct shape already exists in `approveProjectOrder.js:164-186`
> (find-or-create one invoice → `markProjectInvoicePaid` → update order). Every phase reuses that
> pattern instead of inventing new logic.

### Phase 1 — Full-wallet create settles its invoice (the ₹15000 case) ⭐
**Files**: `helpers/paymentRecording.js` (Q1), `customerCreateCustomProjectOrder.js`
- **Change (paymentRecording.js)**: `markProjectInvoicePaid` accepts an optional
  `existingTransaction`. When given, it links that transaction to the invoice instead of creating a
  new one (Q1 Option A) — still exactly one shared settle path, just txn-aware.
- **Change (customerCreateCustomProjectOrder.js)**: capture the created invoice; in the
  `upiPart === 0` (fully-wallet) branch, call
  `markProjectInvoicePaid({ invoice, paymentMethod:'wallet', existingTransaction: walletTxn })` so
  the invoice becomes `paid` at the same instant the order is approved, using the ONE wallet
  transaction `deductWalletInstant` already created (no second transaction — Q1).
- **Remove**: nothing. (The `createProjectInvoice` call stays; we just settle it.)
- **Scope (Q2)**: this phase touches `customerCreateCustomProjectOrder.js` only. `createOrder.js`
  (public storefront) is left as-is — not fixed in this pass, not further broken either.

### Phase 2 — Partial create makes only installment #1's invoice
**Files**: `customerCreateCustomProjectOrder.js` (and, to keep parity, `createOrder.js`)
- **Change**: in the partial branch, create ONLY the installment-#1 invoice (due now) instead of
  looping over all installments. If wallet covers it → mark paid (Phase 1 logic); else leave unpaid
  for the UPI approval.
- **Remove**: the `for (installment of installments) createProjectInvoice(...)` up-front loop.
- **Regression guard**: `approveProjectOrder.js` and the ledger readers already tolerate
  "one due invoice at a time" (they `findOne` the unpaid/overdue invoice). Confirm no reader assumes
  N invoices == N installments (none found in trace, re-verify before coding).

### Phase 3 — Later installments create their invoice when paid (due-based)
**Files**: backend of `InstallmentPayment.js` path — `walletPayInstant.js` (wallet) and the
UPI `verifyPayment` + approval path.
- **Change**: when paying installment #k, if no invoice exists for it yet, `createProjectInvoice`
  for it (installmentNumber:k) then settle it (wallet→instant paid; UPI→paid on approval).
- **Remove**: nothing.
- **Regression guard**: must be idempotent — never create a 2nd invoice for the same installment if
  one already exists (find-first, like `approveProjectOrder.js:164`).

### Phase 4 — Fix wallet-instant invoice-mode to use the project model
**File**: `walletPayInstant.js` (the invoice-mode block I added earlier)
- **Change**: route by `invoiceType` — `project` → `invoiceModel` + `markProjectInvoicePaid`;
  `plan_renewal` → keep `markInvoicePaidAndResumePlan` (monthlyInvoiceModel). Currently it only does
  the monthly path, which is wrong for project invoices (InvoiceDetailPage).
- **Remove**: the unconditional `monthlyInvoiceModel.findOne` + `markInvoicePaidAndResumePlan` call
  for project invoices.
- **Regression guard**: recurring-plan invoice payment (if ever routed here) must still work — keep
  the monthly branch intact, only add the project branch.

### Phase 5 — Admin UPI approval settles the PROJECT invoice too
**File**: `transactionApprovalController.js` (`applyApprovedOrderPayment`, invoice branch)
- **Change**: when the approved transaction's invoice is a `project` invoice, settle it via
  `markProjectInvoicePaid` (invoiceModel); keep `markInvoicePaidAndResumePlan` for `plan_renewal`.
- **Remove**: the assumption that every invoice transaction is a monthly invoice.
- **Regression guard**: this is the shared approval path for ALL payments — must not change
  order-payment (non-invoice) behaviour, nor the wallet-refund-on-reject logic. Only the invoice
  sub-branch is touched.

### Phase 6 — `amountPaid` on invoiceModel + `partially_paid` (included in this pass — Q3)
**Files**: `models/invoiceModel.js`, `helpers/paymentRecording.js`
- **Change**: add `amountPaid: { type: Number, default: 0 }` to `invoiceModel`. `status` becomes
  derived inside `markProjectInvoicePaid` (and wherever a partial wallet-part is applied in Phases
  1–3): `amountPaid >= amount ? 'paid' : amountPaid > 0 ? 'partially_paid' : 'unpaid'`. Add
  `'partially_paid'` to the `status` enum.
- **Regression guard**: every existing reader that checks `status === 'unpaid'`/`'paid'` (ledger
  merge in `helpers/paymentLedger.js`, `getMyPaymentWorkspace.js`/`getAdminUserWorkspace.js` display,
  `InvoiceDetailPage.js`'s `INVOICE_STATUS_META`) must be checked and given a `partially_paid` case
  (falls back to existing `unpaid`-like treatment if unhandled — verify before coding, list them by
  name in the Phase 6 before/after). This is the highest-regression-risk phase — reviewed carefully
  before editing.

### Phase 7 — Backup-first data cleanup (after new logic is live)
- A read-only-then-`--apply` script (numbered backup first) to:
  - mark already-fully-wallet-paid orders' `unpaid` invoices as `paid` (e.g. `6a7efebd…`),
  - delete/cancel the up-front future-installment invoices that shouldn't exist yet,
  - flag orphan approved-but-unpaid orders (`6a7ab6aa…`) for manual review (do NOT auto-fix money).
- **Regression guard**: dry-run + backup + per-record log, exactly like existing
  `auditPaymentInvoiceLedger.js` / `migrate*` scripts.

---

## 5. Decisions (RESOLVED — user-confirmed, binding for implementation)

**Q1 — one transaction or two, on a wallet-instant invoice payment? → Option A.**
`markProjectInvoicePaid` gets an optional param (e.g. `existingTransaction`) — when the wallet txn
already exists (created by `deductWalletInstant`), the helper links THAT txn to the invoice instead
of creating a second one. One helper, no duplication. `paymentRecording.js` is the only file this
touches for Q1.

**Q2 — scope of parity fix → customer customize flow ONLY for now.**
`customerCreateCustomProjectOrder.js` gets the fix in this pass. `createOrder.js` (public storefront)
keeps its current (buggy, all-installments-up-front) behaviour for now — untouched, not regressed
further, just not fixed yet. Revisit when the storefront's future is decided.

**Q3 — Phase 6 (`amountPaid` / `partially_paid`) → YES, included now.**
Build it together with Phases 1–5 rather than as a later add-on, so `markProjectInvoicePaid` and the
new due-based creation logic are written against the final schema shape from the start (avoids a
second migration later). See Phase 6 below for the exact scope and regression guard.

---

## 6. Explicit non-goals / do-not-touch (regression firewall)
- `monthlyInvoiceModel`, `autoRenewalCron.js`, `monthlyInvoiceController.js`, `invoiceLifecycle.js`
  (recurring-plan system) — untouched except being correctly branched-away-from.
- `payInstallment.js`'s legacy `paymentStatus:'paid'` loophole path — out of scope (documented in 51).
- Backup folders / `_backup_trash_work1` / `backup-*` — never edited.
- `deductWalletInstant`'s atomic guarded debit + reject-refund chain — behaviour preserved.
- No new invoice system, no new endpoint families — reuse `createProjectInvoice` +
  `markProjectInvoicePaid` (the existing project-invoice SSOT).

---

## 7. Implementation order (§5 decisions locked in)
**Phase 1 → 4 → 5** (fixes full + invoice-detail + UPI-remainder end to end, incl. `amountPaid`
shape from Phase 6) → **Phase 6** (status derivation + reader updates, built alongside 1/4/5 per Q3)
→ **Phase 2 → 3** (installment invoice timing) → **Phase 7** data cleanup.
Each phase: show before/after → get approval → code → verify (syntax + targeted read-only re-audit).
Do NOT run `npm run build` (user runs builds).

---

## 8. Files this plan will touch (final regression checklist)
**Backend (change)**: `customerCreateCustomProjectOrder.js`, `walletPayInstant.js`,
`transactionApprovalController.js`, `helpers/paymentRecording.js` (Q1 Option A), possibly
`createOrder.js` (Q2), `models/invoiceModel.js` (Q3/Phase 6), `InstallmentPayment.js` backend path.
**Frontend (verify only, likely no change)**: `InvoiceDetailPage.js`, `InstallmentPayment.js`,
`OrderDetailPage.js`, `AdminClientWorkspace.js` — they derive status from fields we set correctly.
**Scripts (new)**: Phase 7 cleanup (backup-first, dry-run).
**Backups**: numbered `backup_invoice_ssot_workN/` per touched folder before any edit.
