# New `invoiceModel` — Real Invoices for Admin-Created Client Projects

**Session date**: 2026-08-05
**Scope**: `adminCreateProjectOrder.js` (the "Create Project for Client" flow, `33_...md`/`35_...md`/`36_...md`) created orders with zero backing invoice record — customers viewing that order's detail page saw a hardcoded `DUMMY_INVOICES` placeholder (a pre-existing, already-documented gap, `24_ORDER_DETAIL_INVOICE_UI_REWORK.md`). This session adds a new, generic `invoiceModel` collection and wires `adminCreateProjectOrder.js` to create real invoice records — one per installment (partial payment) or one for the full amount (one-time payment) — and widens the two existing workspace-read endpoints to surface them, so `OrderDetailPage.js`/`InvoiceDetailPage.js`/the admin Payment & Invoices ledger all show real data for these orders with **zero frontend code changes** (both pages already read generically from `myPaymentWorkspace`'s `invoices` array).
**Read this before touching**: `backend/models/invoiceModel.js`, `backend/helpers/generateInvoiceNumber.js`, `adminCreateProjectOrder.js`, `getMyPaymentWorkspace.js`, `getAdminUserWorkspace.js`.
**Read alongside**: `24_ORDER_DETAIL_INVOICE_UI_REWORK.md` (the `DUMMY_INVOICES` gap this session partially closes — only for admin-created projects, not customer-storefront purchases), `21_PAYMENT_INVOICE_LEDGER_AUDIT_AND_FIX.md` (the pre-existing `monthlyInvoiceModel`-only ledger this session's new invoices now merge into), `33_ADMIN_CREATE_PROJECT_FOR_CLIENT.md`/`35_...md`/`36_...md` (the flow this session's invoice creation is wired into).

## 1. Full investigation before any code — two separate, unrelated invoice-shaped systems already existed

Confirmed by reading the actual code (agent-assisted full trace, not assumption) before designing anything:

**One-time/partial-payment PROJECT purchases** had no formal invoice anywhere:
- `orderProductModel.installments[]` (schema at `orderProductModel.js:174-205`) is a payment-tracking sub-array (`installmentNumber`, `percentage`, `amount`, `paid`, `paymentStatus`, `paidDate`, `dueDate`, `transactionId`) — not a formal invoice (no `invoiceNumber`, no PDF, no standalone collection).
- `createOrder.js`'s `generateInvoicePdf` (line 394) only fires for wallet-paid orders, produces a one-time email attachment never persisted or retrievable again.
- `OrderDetailPage.js`/`InvoiceDetailPage.js` paper over the total absence of real invoice data with hardcoded `DUMMY_INVOICES`/`DUMMY_INVOICES{}` — confirmed this fires unconditionally for every project order lacking a `monthlyInvoiceModel` hit, i.e. always, for every one-time or installment project purchase, admin-created or customer-purchased alike.

**Recurring/yearly-billed-monthly PLAN renewals** had a genuine formal invoice system, but scoped narrowly:
- `monthlyInvoiceModel` (real `invoiceNumber`, `status` lifecycle, `pdfUrl`, admin fields) — but its schema has `renewalMonth`/`renewalPeriodStart`/`renewalPeriodEnd` as `required: true`, meaningful only for recurring cycles.
- Created solely by `autoRenewalCron.js` (daily cron, `0 1 * * *` IST), filtered to `product.isMonthlyLimitedPlan === true` orders only, `amount = product.monthlyRenewalPrice || 3000`.
- `UserInvoices.js` (`/my-invoices`) — the one page meant to show this data as a dedicated customer-facing list — calls `/api/my-invoices`, which **does not exist** as a registered backend route (confirmed via `backend/routes/index.js` grep). Confirmed dead page, separate from this session's scope, not fixed here.
- Wallet-paid installments leave **zero trace** anywhere (no transaction row, no invoice row) — confirmed via `payInstallment.js`'s wallet-paid branch, which only mutates `order.installments[i]`.

## 2. Design decision — new model, not a `monthlyInvoiceModel` retrofit

User explicitly confirmed: since the old system (`monthlyInvoiceModel`, its cron, and eventually the customer storefront purchase flow) is planned for future removal, a fresh, generic `invoiceModel` was built rather than forcing project invoices into `monthlyInvoiceModel`'s recurring-only schema shape (which would require faking `renewalMonth`/`renewalPeriodStart`/`renewalPeriodEnd` with meaningless placeholder values — exactly the "patch work" the user has repeatedly ruled out).

**Explicit scope boundary, confirmed with the user**: `monthlyInvoiceModel` and `autoRenewalCron.js` are left completely untouched this session (the one real live customer on that system, per `27_...md`, stays unaffected). The new `invoiceModel` is wired into **only** `adminCreateProjectOrder.js` — the customer-facing storefront (`createOrder.js`) was explicitly **not** touched this session; it still only produces the old, non-persisted PDF-email invoice. Migrating the storefront flow or retiring `monthlyInvoiceModel` are both deferred to when the user removes the old system.

## 3. `backend/models/invoiceModel.js` — new, generic schema

```js
{
  userId, orderId,           // refs, same as monthlyInvoiceModel
  invoiceNumber,              // unique, same INV-YYYYMM-NNNN format
  invoiceType: 'project' | 'plan_renewal',   // the field that makes this model usable for both purchase shapes without fake fields
  amount, status: 'unpaid'|'paid'|'overdue'|'cancelled',
  invoiceDate, dueDate, paidDate,
  installmentNumber,          // null for one-time; set for each installment invoice
  lineItems: [{ name, price }],   // itemized: category base price + each selected feature, so the invoice can show a real breakdown
  paymentMethod, transactionReference, notes, internalNote, markedPaidBy,
}
```
No `renewalMonth`/`renewalPeriodStart`/`renewalPeriodEnd` — those are recurring-only concepts and were deliberately left out; `invoiceType: 'plan_renewal'` exists as a forward-compatible slot for whenever the plan-renewal cron is eventually migrated onto this model, but nothing writes that value yet.

`backend/helpers/generateInvoiceNumber.js` — new, standalone (`autoRenewalCron.js`'s inline `generateInvoiceNumber` was **not** imported/shared — it's a local unexported function scoped to that file, and querying against the wrong model would have been a real bug; this session's version queries `invoiceModel`, not `monthlyInvoiceModel`, so both systems' sequence numbers are independent per collection).

## 4. `adminCreateProjectOrder.js` — invoice creation wired in after `order.save()`

- `lineItems` built from the same `basePrice` + `clientProjectFeatures` already computed server-side for the Reference Total (see `35_...md` Section 4) — `[{ name: "Standard Website (Base)", price: basePrice }, ...features]`. This is real base+feature-price data, not the `sellingPrice` — the invoice shows what the work is itemized at, while `amount` (what's actually billed) is the admin-set selling price/installment split, matching the existing Reference-Total-vs-Selling-Price distinction already established.
- **One-time payment**: one invoice, `amount = finalPrice` (the full selling price), `dueDate = invoiceDate` (due immediately — no advance-scheduling concept exists in this admin-approved-immediately flow).
- **Partial payment**: one invoice per installment already computed by `buildInstallments()`, `amount = installment.amount`, `installmentNumber` set, looped **sequentially** (not `Promise.all`) — `generateInvoiceNumber()` reads-then-writes the last sequence number, so concurrent calls would race and could hand out duplicate numbers; this was caught and fixed during this session before shipping, not left as a latent bug.
- `status: 'unpaid'` always — no auto-paid-on-creation path exists yet, matching the fact that `orderData.paidAmount: 0` / `paymentComplete: false` are already the order's own creation defaults.

## 5. Existing endpoints widened, not replaced — zero frontend changes needed

`getMyPaymentWorkspace.js` (customer read path, feeds `OrderDetailPage.js`/`InvoiceDetailPage.js`) and `getAdminUserWorkspace.js` (admin Payment & Invoices tab) both already queried `monthlyInvoiceModel` into an `invoices` array consumed generically downstream. Both were changed identically: added a parallel `invoiceModel.find({ userId })` query (same `.select()`/`.populate()` shape, adapted field list), then `invoices = [...monthlyInvoices, ...projectInvoices].sort(by invoiceDate desc)` before building the response — so the `invoices` array callers already receive just contains more real documents than before.

**Confirmed by reading the actual consumer code before making this choice** (not assumed): `OrderDetailPage.js`'s `fetchInvoices()` filters `data.invoices` by `orderId` and only falls back to `DUMMY_INVOICES` when the filtered result is empty (line 95) — so for any order that now has a real `invoiceModel` record, the dummy fallback stops firing automatically. `InvoiceDetailPage.js` finds by `_id` in the same array — works the same way. `frontend/src/helpers/paymentLedger.js`'s `buildLedgerItems()` (admin ledger) is fully generic over any object shaped `{_id, invoiceNumber, status, amount, paymentMethod, transactionReference, invoiceDate, orderId.productId.serviceName}` — our new invoices match every field it reads, confirmed by reading `buildLedgerItems` in full before deciding no changes were needed there.

**Confirmed NOT touched, still using dummy data**: customer-storefront-purchased orders (`createOrder.js` path) — those still have zero real invoice records of any kind, `DUMMY_INVOICES` still fires for them exactly as before. This session only closes the gap for admin-created client projects.

## 6. Explicitly deferred / known follow-up gaps

- **No "mark invoice paid" wiring for the new model**: `monthlyInvoiceController.js`'s existing "Record Payment"/mark-paid admin action (`21_...md`) only writes to `monthlyInvoiceModel` — it does not know about `invoiceModel` at all. An admin-created project's invoices currently have no UI path to be marked paid; they will sit `unpaid` indefinitely unless a future session wires `payInstallment.js` (installment payments) and/or a mark-paid action to also update the matching `invoiceModel` document's `status`/`paidDate`/`paymentMethod`. Confirmed as a real, currently-unaddressed gap, not fixed this session (was out of the explicitly agreed scope — "sirf naya admin flow abhi", i.e. invoice *creation* only).
- **`UserInvoices.js`/`/my-invoices`**: still fully dead (nonexistent backend route), untouched.
- **Customer-storefront purchases (`createOrder.js`)**: still produce zero persisted invoice record of any kind; explicitly out of scope this session per user's decision.
- `npm run build` was not run, per standing user instruction across all sessions.
