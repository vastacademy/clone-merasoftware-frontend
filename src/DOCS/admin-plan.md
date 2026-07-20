# Admin Plan

## Goal
Admin ko same SSOT backend/data par customer ka full read + manage access dena hai, bina separate backend system banaye.

## User Need
- Har customer ka full data aur history dekhna
- Live activity dekhna aur control karna
- Progress increase/decrease karna
- Project pause/cancel/reject karna
- Add-on plans on/off karna
- Plans add/remove karna
- Plan duration, start date, end date change karna

## Rules
- Separate admin backend nahi banega
- Separate DB nahi banega
- Token bypass nahi karna
- Same backend + same source of truth use hoga
- Admin ko higher permissions milengi
- Customer flows ko minimum touch karna hai
- Sab working step-by-step hogi, one-shot nahi

## Current Status
- Customer dashboard existing SSOT endpoints use karta hai
- Customer routes already live hain
- Admin dashboard me clients list already available hai
- `AdminClientWorkspace` page live hai
- Admin client detail/workspace page ka data flow SSOT pattern par shift ho chuka hai
- Admin workspace projects/plans ke liye compact scan-driven delete flow added hai; delete se pehle linked records scan hote hain, missing sections prechecked/disabled dikhte hain, aur sirf fully selected sections delete hote hain
- Projects aur Plans tabs ke liye in-workspace subpage flow add ho raha hai, so back returns to the respective list instead of leaving the workspace
- `Payment & Invoices` tab `AdminClientWorkspace` mein add ho chuki hai
- Payment records same workspace ke `transactions` data se display hote hain
- Invoice records same workspace ke `invoices` data se display hote hain
- `unpaid` aur `overdue` invoices admin `Mark Paid` modal se paid mark ho sakti hain
- Invoice `Mark Paid` flow existing backend route `/api/invoices/:invoiceId/mark-paid` use karta hai
- Payment approve/reject buttons abhi intentionally wire nahi hain, kyunki active backend transaction approval routes verify/complete karne hain
- New project creation is now the next implementation priority. Planned admin information architecture: `Website Management` -> `Projects`.
- The UI-only Projects list route is active at `/admin-panel/website-management/projects` and follows the Clients page compact list pattern. Its Add Project control opens the UI-only form at `/admin-panel/website-management/projects/add`; neither screen fetches or saves products.
- The Projects tab will create/manage reusable project products first; it will not create customer orders or bypass payment.
- New project products must store a mandatory Starting Node Title and must not store predefined future-node percentage templates.
- Existing project migration will follow after the new-project creation and approved-start flow is proven.

## Customer Current Access Pattern
Customer frontend backend endpoints ko token/cookie ke through access karta hai.

Main active data sources:
- user details
- orders / projects
- wallet balance / history
- invoices
- update plans
- support tickets
- renewal status

## Admin Strategy
- Same backend reuse hoga
- Admin role ko elevated permissions milengi
- Admin specific actions ke liye sirf zarurat par extra route/controller add hoga
- Common read logic shared rahega
- Common write/manage logic bhi shared service layer se aayega, duplicate system nahi
- Delete flow me shared scan helper use hoga taaki scan aur final delete same source of truth follow karein
- Payment approval aur invoice lifecycle bhi same customer backend par chalega
- Payment source of truth: `transactionModel`
- Invoice source of truth: `monthlyInvoiceModel`
- Plan/project source of truth: `orderProductModel`
- Admin panel sirf control UI hoga; woh same backend records read/update karega

## Phase 1 Plan
- Customer data flow ko final map karna
- Admin client detail page ka base decide karna
- Overview tab ke boxes finalize karna
- Read-only vs manage actions separate karna
- Existing endpoints reuse list prepare karna
- Sirf unavoidable admin mutation endpoints identify karna
- Invoice mark-paid mutation endpoint completed

## Phase 2 Plan
- Customer click par client workspace page
- Overview tab me summary boxes
- History, active, pending, completed, rejected, balance
- Admin controls for allowed actions
- Project/order delete with linked cleanup
- Project/order delete with scan + checklist confirmation + full cleanup
- Projects and Plans subpages inside workspace
- Payment & Invoices tab inside workspace
- Invoice mark-paid admin flow
- Live refresh / activity sync

## Phase 3 Plan
- Progress control
- Cancel / pause / reject
- Plan add/remove
- Date modifications
- Audit log
- Validation rules
- Edge cases and rollback behavior
- Complete and verify payment approve/reject backend routes, then wire admin payment action buttons

## New Project Creation Sequence

1. Build the admin main-page `Website Management` section.
2. Add the `Projects` tab for project product list/create/edit/manage.
3. Define category-specific project fields and validate mandatory Starting Node Title.
4. Keep customer product listing, ProductDetails, DirectPayment, and payment contracts compatible.
5. After product creation is stable, wire approval to initialize the order-owned 0% starting node.
6. Migrate existing projects later through a controlled dry-run and rollback-safe process.

## What Must Not Happen
- Duplicate customer backend
- Separate admin-only data model without reason
- Blind token bypass
- Guess-based implementation
- Unnecessary changes to customer UI or logic

## Open Decisions
- Admin action scope per tab
- Which existing endpoints can be reused exactly
- Which admin mutations are unavoidable
- Payment approve/reject route completion for `transactionModel` records
