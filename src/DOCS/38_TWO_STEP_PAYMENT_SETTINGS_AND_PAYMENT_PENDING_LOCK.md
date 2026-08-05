# Two-Step "Create Project for Client" (Payment Settings) + Client-Side Payment Pending Lock

**Session date**: 2026-08-05
**Scope**: `37_...md` gave admin-created projects a real, itemized invoice at creation, but it was always left `unpaid` — no way to record a payment at creation time, and no client-facing indication that the project's invoice was still due. This session makes `CreateProjectForClientForm` an interactive 2-step flow (Project Details → Payment Settings) where admin can record the first payment (or explicitly defer it), and adds a "Payment Pending" lock on the customer's `ProjectDetails.js` page for projects whose invoice is still unpaid.
**Read this before touching**: `AdminClientWorkspace.js`'s `CreateProjectForClientForm`, `adminCreateProjectOrder.js`, `getOrderDetails.js`, `ProjectDetails.js`.
**Read alongside**: `37_NEW_INVOICE_SYSTEM_FOR_ADMIN_CREATED_PROJECTS.md` (the invoice records this session marks paid or leaves unpaid), `33_ADMIN_CREATE_PROJECT_FOR_CLIENT.md` (the base form this session converts to multi-step), `31_PROJECT_DETAILS_UI_TEMPLATE.md` (the dark-glass design system the new banner matches).

## 1. Why a new mark-paid path instead of reusing the existing "Record Payment" UI

Before writing any code, `AdminPaymentRecordDetail.js` (the existing admin "Record Payment" page/UI, `21_...md`) and its backend (`monthlyInvoiceController.js`'s `markInvoiceAsPaid` → `invoiceLifecycle.js`'s `markInvoicePaidAndResumePlan`) were read in full to check reuse. Confirmed not reusable as-is:
- `markInvoicePaidAndResumePlan` does `monthlyInvoiceModel.findById(invoiceId)` — hardcoded to the recurring-plan model, not our new `invoiceModel` (`37_...md`).
- It also calls `resumeOrderForPaidInvoice`, which pauses/resumes a plan's auto-renewal cycle — a concept that doesn't exist for one-time project orders.
- `getPaymentRecordDetail`/`generateMonthlyInvoicePdf`/`findPaymentRecord` (the rest of that controller family) are equally `monthlyInvoiceModel`-specific.

Forcing project invoices through this recurring-plan-shaped machinery would mean faking/ignoring fields that don't apply — the same "patch work" the user has repeatedly ruled out. **What was reused**: only the *visual pattern* of `AdminPaymentRecordDetail.js`'s "Record Payment" panel (Payment Method dropdown, Transaction Reference input, admin-only Note textarea) — copied into the new Step 2 UI, not imported as a component, since the new step's data shape and submit target are different.

**What was built new**: `markProjectInvoicePaid()`, a small local helper inside `adminCreateProjectOrder.js` — creates a `transactionModel` record (`type: 'payment'`, `sourceType: 'invoice'`, both pre-existing valid enum values, no schema change needed) and sets the target `invoiceModel` document to `status: 'paid'`. No plan-resume logic, because none applies here.

## 2. `adminCreateProjectOrder.js` — accepts an optional `recordPayment` object

New request field: `recordPayment: { paymentMethod, transactionReference, notes } | null`. If `paymentMethod` is present and one of `upi`/`bank_transfer`/`cash`/`wallet`, the controller treats this as "record payment now":

- After creating the invoice(s) (unchanged from `37_...md` — one per installment, or one for full payment), the **first** invoice in the list (the single one-time invoice, or installment #1) is passed to `markProjectInvoicePaid()`.
- Only the first invoice can ever be marked paid at creation time — this matches the UI, which only ever asks about the first-due amount (Section 3), never later installments in advance.
- The order's own payment-tracking fields are updated to match: one-time → `paidAmount = finalPrice`, `remainingAmount = 0`, `paymentComplete = true`; partial → `installments[0].paid = true` (with `paymentStatus: 'none'`, matching the exact convention `payInstallment.js`'s wallet-instant-pay branch already uses for "paid, not pending-approval" — confirmed by reading that file before choosing this value, since `'approved'` is **not** a valid enum member on `orderProductModel.installments.paymentStatus`, only `none`/`pending-approval`/`rejected`), `paidAmount`/`remainingAmount` adjusted, `currentInstallment = 2`.
- If `recordPayment` is omitted/null (admin chose "just add project, let client pay the bill"), behavior is identical to `37_...md` — invoice(s) created `unpaid`, order's payment fields stay at their zeroed defaults.

## 3. `CreateProjectForClientForm` — Project Details → Payment Settings, Next/Back, single final submit

User's explicit correction on the first two proposed designs (a same-click popup, or a second popup after creation): **"dono tarike galat hain isse interactive banao submit ki bajaye next hoga jo next payment settings par layega fir submit"** — one continuous form, "Next" instead of "Submit" on step 1, real "Submit"/"Create Project" only at the end of step 2.

**Implementation**: a `step` state (`1` | `2`) inside the same component/same `<form>`, no new modal, no second network round-trip.
- **Step 1** (unchanged fields from `35_...md`/`36_...md`: Starting Node Title, Category, Total Pages, Base Price, Category Description, Reference Total, Selling Price/Discount, Additional Features) — footer now reads "Next: Payment Settings" instead of submitting; clicking it runs the same required-field check `handleSubmit` used to do (`handleGoToPaymentStep`), then flips `step` to `2`. The Payment Type/Installments choice **stays on Step 1** (it determines what Step 2 shows, so it has to be decided first) — not moved into Step 2 itself, contrary to a literal "Payment Settings step has Payment Type" reading; only the *payment-recording* decision moved to Step 2.
- **Step 2 ("Payment Settings")**: shows "Amount Due Now" (`firstInstallmentAmount` — the full `sellingPrice` for one-time, or the first split computed by a new frontend-only `buildInstallmentPreview()` helper mirroring the backend's `buildInstallments()` split percentages, for partial), then a two-button choice:
  - **"Record Payment Now"** (default) — reveals Payment Method / Transaction Reference / internal Note fields (the copied visual pattern from Section 1).
  - **"Just Add Project, Let Client Pay the Bill"** (the exact phrase the user specified) — hides the payment fields, shows an amber notice explaining the project starts immediately but stays unpaid.
  - Footer: "Back" (returns to step 1, preserving all entered state) and "Create Project" (the real submit, sends `recordPayment: {...}` or `null` depending on the selected action).

## 4. Client-side "Payment Pending" lock — `getOrderDetails.js` + `ProjectDetails.js`

User's confirmed scope (asked and explicitly narrowed, not the more aggressive "hide the order entirely" option): the client can still see and track the project — only interactive actions are gated, with a visible reason.

- `getOrderDetails.js` (the endpoint `ProjectDetails.js` already calls, no new endpoint added) now also queries `invoiceModel.findOne({ orderId, status: { $in: ['unpaid', 'overdue'] } })`, sorted by `installmentNumber` then `invoiceDate`, and adds two new response fields: `hasUnpaidInvoice` (boolean) and `unpaidInvoice` (the earliest matching invoice's `amount`/`status`/`invoiceNumber`/`installmentNumber`, or `null`). Only checks the new `invoiceModel` (project invoices) — `monthlyInvoiceModel` (recurring plans) is not queried here since this endpoint only ever serves project orders (`isPlanItem` orders redirect to `PlanDetails.js` before this point, per `32_...md`'s routing helper).
- `ProjectDetails.js` (customer-side only, `isAdminView` branch untouched): a new amber "Payment Pending" banner renders (dark-glass-themed variant matching `31_...md`'s established amber-tone-for-pending pattern) whenever `order.hasUnpaidInvoice` is true, showing the invoice number and amount. This is a **separate, new banner** from the pre-existing `PaymentAlert` component/`shouldShowPaymentAlert` mechanism (which is a different, progress-percentage-triggered concept specific to customer-storefront installment purchases at 40%/75% completion) — the two can in principle both render for the same order, since they answer different questions ("is a later installment due because of progress" vs. "is the very first payment still outstanding").
- The "Request Update" button (the only real client-initiated action currently on this page) is `disabled` when `order.hasUnpaidInvoice` is true, with a `title` tooltip explaining why. No other buttons currently exist on this page that represent a "portal action" needing the same gate — if one is added later (e.g. file upload), it should check the same `order.hasUnpaidInvoice` field, already available on the loaded order object with no extra fetch.

## 5. Explicitly out of scope / deferred

- No UI exists yet for the client (or admin, outside the creation-time flow) to pay/mark-paid a project invoice **after** creation — an admin-created project's later installments (2nd/3rd) still have no payment-recording path once the project exists. This session only wires payment recording into the creation moment itself.
- `PaymentAlert`'s progress-triggered pause mechanism was not touched, merged, or generalized to cover the new invoice system — they remain two parallel, non-interacting gates.
- `npm run build` was not run, per standing user instruction across all sessions.
