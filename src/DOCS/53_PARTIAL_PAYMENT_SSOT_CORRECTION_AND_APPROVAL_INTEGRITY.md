# Partial-Payment SSOT Correction, Progress-Gate Threshold, and Approval Integrity

**Status**: ✅ IMPLEMENTED (Layer A + Layer B core + approval-integrity fix). Demo system remains
schema-only, not built — see Section 6.
**Session date**: 2026-08-15.
**Author context**: User-directed, evidence-first session. Every change below was preceded by
reading the actual current code (not assumption), confirmed with the user before implementing, and
syntax/parse-checked after. `npm run build` was not run (standing rule — user runs builds).
**Read this before touching**: `helpers/installmentSettlement.js` (new), `walletPayInstant.js`,
`transactionApprovalController.js`, `payInstallment.js`, `models/orderProductModel.js`'s
`installmentSchema`/`demoMode`, `helpers/projectNodeService.js`'s `appendProjectNode`,
`ProjectDetails.js`, `OrderDetailPage.js`, `AdminClientWorkspace.js`'s approval bar,
`approveProjectOrder.js`, `adminCreateProjectOrder.js`.
**Read alongside**: `52_INVOICE_PAYMENT_SSOT_CORRECTION_PLAN.md` (the invoice-settlement SSOT this
session extends), `46_PROJECT_ORDER_APPROVAL_SYSTEM_AND_SHARED_PAYMENT_HELPER.md` (the approval
chain this session tightens), `38_TWO_STEP_PAYMENT_SETTINGS_AND_PAYMENT_PENDING_LOCK.md` (the
`hasUnpaidInvoice` gate this session reuses instead of inventing a new one).

**Core principle (user-confirmed, binding)**: A project order must never reach an "approved /
working normally" state without a real payment recorded — wallet-instant, UPI-approved, or an
admin-recorded payment. There is no "approve without payment" anywhere in the system. Full payment,
wallet+UPI combined payment, and partial-payment installments all settle through the SAME shared
helpers — one settle path, not three.

---

## Layer A — Partial-installment invoice settlement SSOT (the original bug)

**The gap**: doc 52 fixed the full-wallet-payment invoice-settlement bug, but only inside
`walletPayInstant.js`. A partial-payment installment paid via UPI (or the UPI part of a
wallet+UPI combined payment) went through `transactionApprovalController.js`'s plain
order-payment branch, which marked the installment paid on the order but **never touched
`invoiceModel`** — so a UPI-paid installment's invoice stayed `unpaid` forever, the same class of
bug doc 52 had already fixed for the wallet-only case, just recurring in a spot that pass didn't
cover.

**Root cause, one line**: three different routes settle installment money (wallet-instant, UPI
admin-approval, and a legacy direct-mark path), and only one of them (wallet-instant) settled the
invoice.

**Fix — new shared helper, `backend/helpers/installmentSettlement.js`**:
`settleInstallmentInvoice({ order, installmentNumber, amount, paymentMethod, transaction,
customerId, ... })` — extracted verbatim from `walletPayInstant.js`'s due-based invoice
find-or-create + `markProjectInvoicePaid()` settle logic. Due-based: installment #1's invoice
already exists from order creation; #2/#3 get theirs created the moment they're actually paid.

- **`walletPayInstant.js`**: its inline invoice-settle block was replaced with a call to the new
  shared helper — behaviour is bit-for-bit identical, just de-duplicated.
- **`transactionApprovalController.js`**: `applyOrderMoneyForTransaction()` now also calls
  `settleInstallmentInvoice()` after marking an installment paid, gated by a new
  `settledInstallmentNumber` (only set when the installment was actually flipped from unpaid→paid
  *this* call — a duplicate/retried approval never re-settles). A new `settleInvoice` option
  (default `true`) lets the invoice-mode caller (which already settled the same invoice via
  `markProjectInvoicePaid` before calling this function) pass `settleInvoice: false` so the same
  transaction's invoice is never settled twice.
- **Zero-impact guarantees, verified**: full-payment transactions never carry `installmentNumber`,
  so `settledInstallmentNumber` stays `null` and the new code path never runs for them. Renewal
  transactions early-return before reaching any of this. Invoice-mode transactions
  (`invoiceType:'plan_renewal'`) are a separate branch, untouched.
- **`payInstallment.js`'s legacy loophole removed**: its `paymentStatus === 'paid' || isAdmin`
  branch used to mark an installment paid with **zero transaction and zero invoice touch** (the
  exact defect doc 52's Phase 7 audit found live evidence of — invoices `paid` with zero completed
  transactions behind them). Verified before removing: the only live caller,
  `InstallmentPayment.js`, never sends `paymentStatus:'paid'` (it only reaches this endpoint via
  the `pending-approval` branch, which is untouched); no admin UI calls this route. The branch now
  returns 400 "Invalid payment status" instead of silently marking money paid.

**Net result**: wallet, UPI, and wallet+UPI-combined installment payments (2nd/3rd installment,
under any 2- or 3-installment split) now settle through the identical shared path full-payment
already used — matching the user's explicit requirement that partial payment work exactly like
full payment for every payment-method combination.

---

## Layer B — Admin-configurable progress-gate thresholds (schema + enforcement)

**The model, user-confirmed**: partial payment can be split 2 or 3 ways, each with its own
**progress threshold** (not a payment percentage — the node-system `projectProgress` percentage at
which that installment becomes due):
- 2-installment default: 50% advance, remaining 50% due at 90% progress.
- 3-installment default: 30% advance, 30% due at 50% progress, 40% due at 90% progress.
- Per-project admin-editable (default only — no editing UI built yet, see Section 6).

**Schema (`orderProductModel.js`)** — both additive, `null`/`false` default so every pre-existing
order behaves exactly as before:
- `installmentSchema.progressThreshold` (Number, default `null`, min 0 max 100) — installment #1
  has no threshold (always due at creation); later installments get the default split above.
- Order-level `demoMode: { active, uploadsRemaining, enabledBy, enabledAt }` — schema only, see
  Section 6.

**Default thresholds wired** in both order-creation controllers' `buildInstallments()`
(`customerCreateCustomProjectOrder.js`, `adminCreateProjectOrder.js`): a
`DEFAULT_PROGRESS_THRESHOLDS` map (`{2: [null,90], 3: [null,50,90]}`) stamps each installment.

**Enforcement — `projectNodeService.js`'s `appendProjectNode()`**: a new
`getBlockingInstallmentThreshold(order)` finds the next unpaid installment with a configured
threshold and caps node creation there — admin cannot push `projectProgress` past that % while the
installment is unpaid. Guarded to be a strict no-op for: full-payment orders (`isPartialPayment`
falsy — no installments to check), and any installment with `progressThreshold: null` (every
pre-existing partial order, since the field didn't exist before this session).

**Customer-facing gate — `ProjectDetails.js`**: the old hardcoded `installmentNumber===2 && >=40%`
/ `===3 && >=75%` check now prefers `nextUnpaidInstallment.progressThreshold` when set, falling
back to the old hardcoded values only when it's `null` (pre-existing installments).

**Deferred, not built this session**: Phase 3 from doc 52 (due-based invoice creation for
installment #2/#3) turned out to already be implemented in `walletPayInstant.js` — doc 52's
"not implemented" note is now stale; see Layer A above, it's now also wired for the UPI-approval
route. An admin UI to edit a project's per-installment threshold after creation does not exist yet
(only the creation-time default is wired).

---

## The "Payment Processing" full-block screen — removed (regression-fixed)

**Before**: `ProjectDetails.js` had a special early-return (`order.isPendingApproval`) that replaced
the ENTIRE page with a static "Payment Processing" banner and nothing else — no timeline, no
progress, no "Upload Data" — whenever `orderVisibility === 'pending-approval'`. User explicitly
ruled this out: "aise nahi hona chahiye kisi bhi halat mein... yeh page nahi shai isse completly
remove karna hai."

**After**: the full-block early-return and its `fetchOrderDetails()` short-circuit were both
removed — a pending-approval order now loads and renders the normal project page (timeline,
progress donut, checkpoint detail all visible) exactly like an approved order. The only gating is
on the **action** (`Upload Data`), matching the existing `hasUnpaidInvoice` pattern instead of a
separate full-page state:
- New `isOrderPendingApproval` (`order.orderVisibility === 'pending-approval'`) and
  `isUploadLocked` (`hasUnpaidInvoice || isOrderPendingApproval`) derived values.
- "Upload Data" button: `disabled={isUploadLocked}`, with a "Pending" badge shown on the button
  itself when locked.
- **Regression fixed same session**: `hasUnpaidInvoice` and `isOrderPendingApproval` are true
  together on the exact same order in the common case (a `pending-approval` order's due invoice is
  always still `unpaid`/`partially_paid` — `markProjectInvoicePaid` only settles the wallet-paid
  part until the UPI remainder is admin-approved), so the two banners rendered simultaneously,
  showing two "payment pending"-shaped boxes stacked on one page. Fixed by making them mutually
  exclusive: `isOrderPendingApproval` (more specific — whole order pending) renders first; the
  `hasUnpaidInvoice` banner (order already approved, a later installment's invoice still unpaid —
  the original `38_...md` case) only renders when the order is NOT itself pending-approval.
- **Color-coded by meaning, not just banner presence**: the "already approved, one invoice still
  unpaid" banner stays amber (an action the customer needs to take). The "whole order
  pending-approval" banner — which means the customer's payment WAS already submitted and is
  awaiting admin verification, a positive/in-progress state, not a warning — was changed from
  amber to **emerald** (the app's primary accent color) and its copy changed to "Payment Submitted
  — Awaiting Approval" instead of the more alarming "Payment Pending Approval".

---

## `OrderDetailPage.js` → wrong installment-payment destination (real bug, unrelated to Layer A/B)

**Symptom reported**: clicking a "Due" 2nd/3rd installment row on `/order-detail/:orderId` showed
toast `"Payment information not found"` and bounced to the dashboard — console showed a 404 on
`checkPendingOrderTransactions` (a pre-existing, still-unregistered backend route,
`ProjectDetails.js`'s pending-transaction pre-check; silently caught, not the actual failure) and
`SyntaxError: JSON.parse` from trying to parse the resulting HTML 404 page as JSON.

**Root cause**: `OrderDetailPage.js`'s `handlePayInstallment()` navigated to `/direct-payment` with
a `{ installmentPayment, orderId, installmentNumber, installmentAmount, productName }` state shape.
`DirectPayment.js`'s `useEffect` only ever reads `location.state?.paymentData` or
`location.state?.retryPaymentId` — it never recognized the `installmentPayment` shape, so it always
hit its `else` branch: `toast.error('Payment information not found'); navigate('/')`. **Backend was
never reached** — the request never left the browser tab. This is the same class of gap doc 40
already flagged for `InvoiceDetailPage.js`'s "Pay Now" button, just a second, independent
occurrence for installment rows.

**Fix**: `handlePayInstallment()` now navigates straight to the already-correct, already-working
route `/installment-payment/:orderId/:installmentNumber` (the same route `ProjectDetails.js`'s
`PaymentAlert` button uses, which fetches its own order/installment data — no `location.state`
dependency). `handleRetryPayment()` (a different, correctly-handled `/direct-payment` case) was
left untouched.

---

## Approval integrity — "approve without payment" removed everywhere

**User's hard rule**: a project must never be approved without a real payment on record, in any
circumstance. Investigation found **three** places this could happen, not one:

1. **`approveProjectOrder.js`'s `approve_no_payment` mode`** — set `orderVisibility: 'approved'`
   directly, touching zero transactions/invoices. Removed entirely: `APPROVAL_MODES` is now only
   `["approve_with_payment", "reject"]`. `approve_with_payment` already required a valid
   `paymentMethod` (unchanged) — that stays the only way to approve a payment-less order.
2. **`AdminClientWorkspace.js`'s "Approve without Payment" button** — removed from the approval bar
   UI. Only "Record Payment" and "Reject" remain. Banner copy updated to state the rule explicitly.
3. **`adminCreateProjectOrder.js`** — a genuinely separate, third path: when admin creates a
   project for a client and picks "Just Add Project, Let Client Pay the Bill" (`38_...md`), the
   order was **unconditionally** created `orderVisibility: 'approved'` regardless of whether
   `recordPayment` was supplied — no button was even involved, it was baked into order creation
   itself. Fixed: `orderVisibility`/`status` are now `shouldRecordPayment ? "approved"/"in_progress"
   : "pending-approval"/"pending"` — a deferred-payment admin-created project now starts
   `pending-approval`, identical in shape to a customer's `decide_later` order, and later goes
   through the same `approve_with_payment` (payment-required) path to become approved.

**A second, related distinction clarified and fixed this session** — UPI-paid orders were
incorrectly being offered the "Record Payment" approval-bar UI at all:
- `AdminClientWorkspace.js`'s `isPendingApproval` (gates the Project-tab approval bar) used to be
  just `orderVisibility === 'pending-approval'`. But `approveProjectOrder.js`'s own header comment
  says it exists **only** for the payment-less gap (`decide_later`) — a customer order that already
  has a submitted UPI transaction (`status: 'pending'`) is a fundamentally different case: real
  money is already recorded as a transaction, and it must be **approved or rejected** (
  `transactionApprovalController.js`, from the Payment & Invoices tab), never re-recorded via
  "Record Payment" (which would be a second, duplicate payment write for the same money).
- Fix: `isPendingApproval` is now `orderVisibility === 'pending-approval' && !hasPendingTransaction`
  (`hasPendingTransaction = orderTransactions.some(txn => txn.status === 'pending')`). A UPI-paid
  pending order now shows a separate, neutral (sky-blue, informational) banner: "Payment submitted,
  awaiting approval — go to Payment & Invoices tab to approve or reject it" — no
  Approve/Record/Reject buttons on the Project tab for that case at all.

**Current system shape, confirmed (this is the answer if asked "what happens today"):**
| Order state | What the admin sees / can do |
|---|---|
| `pending-approval`, zero transactions (decide_later / admin-deferred) | Project tab approval bar: **Record Payment** or **Reject** only. No "Approve without Payment" anywhere. |
| `pending-approval`, has a pending UPI transaction | Project tab: neutral info banner only, no action buttons. Real action is **Approve** or **Reject** in **Payment & Invoices** tab (`transactionApprovalController.js`), unchanged, pre-existing. |
| `approved` | Normal project view; `hasUnpaidInvoice`/`isUploadLocked` still gate "Upload Data" if a later installment's invoice is unpaid. |

---

## Files touched this session

**Backend (new)**: `helpers/installmentSettlement.js`.
**Backend (changed)**: `helpers/paymentRecording.js` (no functional change, re-exported into the
new helper), `controller/user/walletPayInstant.js`, `controller/user/transactionApprovalController.js`,
`controller/user/payInstallment.js`, `models/orderProductModel.js` (`progressThreshold`,
`demoMode`), `controller/order/customerCreateCustomProjectOrder.js` (default thresholds),
`controller/order/adminCreateProjectOrder.js` (default thresholds; `orderVisibility` fix),
`helpers/projectNodeService.js` (`getBlockingInstallmentThreshold`, gate in `appendProjectNode`),
`controller/order/approveProjectOrder.js` (`approve_no_payment` mode removed).
**Frontend (changed)**: `pages/ProjectDetails.js` (threshold-driven gate, pending-approval
full-block removal, banner de-duplication + color fix), `pages/OrderDetailPage.js`
(`handlePayInstallment` destination fix), `pages/AdminClientWorkspace.js` (sort-rank fix, fixed tab
order, "Approve without Payment" button removed, `isPendingApproval` narrowed by
`hasPendingTransaction`, new info banner for UPI-paid pending orders).
**Also this session, same file (`AdminClientWorkspace.js`), unrelated to payment**: project-list
sort-rank fix (a brand-new `pending-approval` project no longer sorts below active projects — see
inline comment at `getProjectSortRank`) and fixed (non-dynamic) workspace tab order — Projects,
Plans, Payments, Documents, Access, Overview last.
**Backups**: `backup_partial_ssot_work1/` folders under `backend/helpers/`,
`backend/controller/user/`, `backend/controller/order/`, `backend/models/`,
`frontend/src/pages/`.
**Not run**: `npm run build` (standing rule).

---

## Explicit non-goals / deferred this session

- **Demo system**: schema only (`demoMode` on `orderProductModel.js`). No admin "enable demo"
  action, no customer-facing single-use "Upload Data" restricted node, no re-trigger counter logic.
  Confirmed design (user-stated, not yet built): admin-only opt-in trigger, works on ANY project
  (full or partial payment, customer- or admin-created), independent of payment state, re-triggerable
  (not a one-time lifetime cap).
- **Per-project threshold editing UI**: admin cannot yet change a project's installment
  `progressThreshold` after creation — only the creation-time default (90% / 50%+90%) is wired.
- **`createOrder.js`** (public storefront): still out of scope per doc 52 Q2 — intentionally not
  brought in line with the installment-settlement SSOT this session.
- **`checkPendingOrderTransactions`**: confirmed still a dead/unregistered backend route
  (`ProjectDetails.js` calls it, no matching route exists) — not fixed this session, its failure is
  silently caught and does not block the rest of `checkPaymentStatus()`.
