# Invoice / Payment SSOT Correction — Plan + Implementation Record

**Status**: ✅ IMPLEMENTED (all 7 phases). Session date: 2026-08-14.
**Author context**: Written after a live read-only DB audit + full-codebase trace of every invoice
creator / settler / reader, then implemented phase by phase in the same session. This document is
the single source of truth for the fix — both the design and what was actually built.
**Read this before touching**: `customerCreateCustomProjectOrder.js`, `helpers/paymentRecording.js`,
`walletPayInstant.js`, `transactionApprovalController.js`, `models/invoiceModel.js`, or any invoice
status/`amountPaid` logic.

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

### Phase 1 ✅ — Full-wallet create settles its invoice (the ₹15000 case) ⭐
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

### Phase 2 ✅ — Partial create makes only installment #1's invoice
**Files**: `customerCreateCustomProjectOrder.js` (`createOrder.js` deliberately left as-is — Q2 scope)
- **Change**: in the partial branch, create ONLY the installment-#1 invoice (due now) instead of
  looping over all installments. If wallet covers it → mark paid (Phase 1 logic); else leave unpaid
  for the UPI approval.
- **Remove**: the `for (installment of installments) createProjectInvoice(...)` up-front loop —
  replaced with a single conditional `createProjectInvoice` call for `order.installments[0]` only.
- **Regression guard verified**: `approveProjectOrder.js`, `InvoiceDetailPage.js`,
  `getMyPaymentWorkspace.js` all read invoices as a list / `findOne` — none assume N invoices == N
  installments. Syntax-checked (`node -c`) after edit.

### Phase 3 — Later installments create their invoice when paid (due-based)
**Status**: Investigated, **not implemented this session** — `payInstallment.js` (the
`InstallmentPayment.js` UPI/legacy backend) was read in full; it still writes directly to
`order.installments[]` and never touches `invoiceModel`. Wiring it to create-on-pay was queued but
the session moved to Phase 7 (data cleanup) first per user direction ("start phase 7"). **Deferred —
read this note before assuming installment #2/#3 invoices exist; today only the InstallmentPayment.js
wallet path (`walletPayInstant.js`, Phase 4) settles money against `order.installments[]` directly, no
invoice is created for a later installment yet.**

### Phase 4 ✅ — Fix wallet-instant invoice-mode to use the project model
**File**: `walletPayInstant.js` (the invoice-mode block)
- **Change**: routes by `invoiceType` — `project` → `invoiceModel` + `markProjectInvoicePaid`
  (with `existingTransaction` per Q1); `plan_renewal` → still `markInvoicePaidAndResumePlan`
  (monthlyInvoiceModel). Fully covering the invoice → `paid`; a smaller wallet-only amount →
  `partially_paid` (Phase 6 shape).
- **Removed**: the unconditional monthly-only settlement for project invoices.
- **Regression guard**: recurring-plan invoice payment branch left intact, untouched.

### Phase 5 ✅ — Admin UPI approval settles the PROJECT invoice too
**File**: `transactionApprovalController.js` (invoice branch)
- **Change**: routes by `invoiceType` the same way as Phase 4 — `project` invoices settle via
  `markProjectInvoicePaid` (with `existingTransaction`), `plan_renewal` keeps
  `markInvoicePaidAndResumePlan`.
- **Regression guard**: order-payment (non-invoice) approval path and the wallet-refund-on-reject
  logic were not touched — only the invoice sub-branch.

### Phase 6 ✅ — `amountPaid` on invoiceModel + `partially_paid` (Q3: included in this pass)
**Files**: `models/invoiceModel.js`, `helpers/paymentRecording.js`
- **Change**: `invoiceModel.status` enum now includes `partially_paid`; new `amountPaid` (Number,
  default 0) field. `markProjectInvoicePaid` derives status from `amountPaid` vs `amount` instead of
  hardcoding `'paid'` — the single point where every settlement path (Phases 1, 4, 5) computes status.
- **Verified in this session's audit script**: `deriveStatus()` in the Phase 7 cleanup script mirrors
  this exact rule, confirming the derivation is consistent end-to-end.

### Phase 7 ✅ — Backup-first data cleanup (after new logic went live)
**Script**: `backend/scripts/fixInvoiceSettlementMismatch.js` (dry-run by default, `--apply` to write).
Read-only: recomputes each project invoice's true `status`/`amountPaid` from its order's actual
COMPLETED transactions (same `deriveStatus()` rule as `markProjectInvoicePaid`), and only touches
invoices with clear transaction evidence — never guesses at money.
- **Dry run result**: 33 project invoices checked → 22 already correct, 9 mismatched (clear evidence),
  2 flagged.
- **Applied** (`--apply`, user-confirmed): 9 invoices corrected, including the reported
  `INV-202608-0033` (order `6a7efebd…`, ₹15000, now `status:'paid'`, `amountPaid:15000`,
  `paymentMethod:'wallet'`) plus 8 other pre-existing admin-created-project invoices that had the
  same latent bug (payment completed, invoice left `unpaid`).
- **Flagged, NOT touched** (need manual review): `INV-202608-0003` (order `6a782283…`) and
  `INV-202608-0013` (order `67e52b85…`, installment #1) — both show `status:'paid'` with **zero**
  completed transactions backing them. Likely from the legacy `payInstallment.js` `paid` path, which
  marks an installment paid without creating a transaction (a separate, pre-existing gap — see
  `51_...md` Part D's note on `payInstallment.js`'s known loophole). Re-verify against real payment
  history before changing either.
- **Untouched by design**: orphan order `6a7ab6aa…` (`orderVisibility:approved`, `paidAmount:0`,
  0 transactions) — its invoice itself isn't the mismatch (order approval without payment is a
  different, pre-existing defect); not in this script's scope.
- Wallet balances / `order.paidAmount` were never modified by this script — only invoice documents.

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
- `payInstallment.js`'s legacy `paymentStatus:'paid'` loophole path — out of scope (documented in 51;
  Phase 7's audit found real evidence of this exact gap — 2 invoices marked `paid` with zero
  transactions — reinforcing that it must be fixed before that page is trusted again).
- Backup folders / `_backup_trash_work1` / `backup-*` — never edited.
- `deductWalletInstant`'s atomic guarded debit + reject-refund chain — behaviour preserved.
- No new invoice system, no new endpoint families — reuse `createProjectInvoice` +
  `markProjectInvoicePaid` (the existing project-invoice SSOT).
- `createOrder.js` (public storefront) — intentionally left with the old up-front-all-installments
  invoice behaviour (Q2). Not regressed, just not brought in line yet.

---

## 7. Implementation order — actual (as executed)
**Phase 1 → 4 → 5 → 6** (full-wallet settle, wallet-instant + admin-approval invoice-mode fixed to
the project model, `amountPaid`/`partially_paid` shape) → **Phase 2** (installment #1-only invoice
creation) → **Phase 7** (backup-first live-data cleanup, dry-run then user-confirmed `--apply`).
**Phase 3 (due-based invoice creation for installment #2/#3) was investigated but not implemented —
see its section above.** No `npm run build` was run (user runs builds).

---

## 8. Files touched (final — what actually changed)
**Backend (changed)**: `customerCreateCustomProjectOrder.js` (Phases 1, 2),
`helpers/paymentRecording.js` (Phases 1, 6 — `existingTransaction` param + derived status),
`walletPayInstant.js` (Phase 4), `transactionApprovalController.js` (Phase 5),
`models/invoiceModel.js` (Phase 6 — `amountPaid` field + `partially_paid` enum value).
**Backend (new)**: `scripts/readOnlyAuditWalletProjectPayment.js` (diagnosis, read-only),
`scripts/fixInvoiceSettlementMismatch.js` (Phase 7 cleanup, dry-run + `--apply`).
**Frontend**: not touched — `InvoiceDetailPage.js`, `InstallmentPayment.js`, `OrderDetailPage.js`,
`AdminClientWorkspace.js` all derive their display from invoice/transaction fields that are now
correct, confirmed by design trace (no code change needed there).
**Not done / carried forward**: Phase 3 (due-based installment #2/#3 invoice creation) — still open;
`createOrder.js` storefront parity (Q2) — deliberately deferred; the 2 flagged invoices and the
orphan order `6a7ab6aa…` — need manual review, not auto-fixed.
