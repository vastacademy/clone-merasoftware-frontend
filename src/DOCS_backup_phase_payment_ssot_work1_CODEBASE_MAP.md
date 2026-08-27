# Codebase Map — Current State Reference

Single source of truth for "where is the code for X and what is the current rule." No history, no rejected attempts, no session narration — only what is true today. Verified against live code, not just old docs.

Project root: `e:\merasoftware-new` — `backend/` (Node/Express/Mongoose) + `frontend/src/` (React).

---

## 1. Architecture & Routing

- Portal-only app. No public marketing/storefront site exists. `frontend/src/routes/publicRoutes.js` has exactly 3 routes: `""` (`RoleBasedHome`), `login`, `unauthorized`.
- Boot chain: `src/index.js` → `src/App.js` (online-status context) → `src/AppContent.js` (session init, `Context.Provider`, `ScrollToTop`, renders `<Outlet/>`) → `src/routes/index.js` (assembles entry + `customerRoutes.js` + `adminRoutes.js`).
- Root `/` → `RoleBasedHome`: logged-out → `/login`; logged-in → `getPortalHome(role)` (`src/helpers/portalHome.js`) → admin: `/admin-panel/dashboard`, customer: `/dashboard`.
- Login: `src/pages/Login.js` only. **No signup page/route, no OTP-verification page, no forgot-password page** in the live UI. `POST /api/signup` + OTP backend (`backend/helpers/otpUtils.js`, `backend/models/otpModel.js`, `/verify-otp`, `/resend-otp`) exist but are unreachable from any UI. Customers are created only via lead conversion or admin client creation.
- Post-login: `src/helpers/postLogin.js` stores user in Redux/cookies/localStorage, redirects via `getPortalHome(role)`.
- Route guard: `src/components/ProtectedRoute.js` (`requireRole={['customer']}` / `['admin']`), redirects unauthorized to `/login` or `/unauthorized`.
- **Portal header — corrects stale claims in old docs**: `src/components/PortalHeader.js` (sticky `top-16`... actually `h-16 sticky top-0`) IS rendered by both `DashboardLayout.js` and `AdminLayout.js`. There is no *global* header in `AppContent.js` (that still renders only `<Outlet/>`), but each portal shell renders its own `PortalHeader` instance (logo, profile dropdown, nav links). Sidebars use `sticky top-16 h-[calc(100vh-4rem)]` — correct because this header exists.
- Mobile nav: `src/components/MobileSidebarDrawer.js` (shared, slides in from the **right**, used by both layouts) + `src/components/MobileBottomNav.js` (fixed bottom bar, `lg:hidden`). Customer tabs: Dashboard/Projects/Start/Games + More. Admin tabs: Dashboard/Leads/Clients/Projects + More.

### Project ownership model
- No project catalogue exists. `backend/models/orderProductModel.js` is the project SSOT — owns client ref, frozen `projectSnapshot`, dynamic node timeline, pricing, payments, invoices.
- `isWebsiteProject` gates project-timeline workflows (not a "Website Management visibility" flag).
- `categoryBasePriceModel` + `feature_upgrades`-category `productModel` rows are internal pricing configuration only, never catalogue/listing entries.
- Two project-creation paths, same SSOT: admin (`POST /api/admin/clients/:customerId/create-project` → `backend/controller/order/adminCreateProjectOrder.js`) and customer custom-project flow (`POST /api/customer/custom-project-order` → `backend/controller/order/customerCreateCustomProjectOrder.js`). Neither creates a visible catalogue product.

### Known live bug
- `StartNewWebsiteCustomize.js` calls `SummaryApi.customerCategoryBasePrice`, which **does not exist** in `frontend/src/common/index.js` (confirmed by grep — zero matches). This will fail at runtime wherever that page tries to build the request URL.

---

## 2. Auth & Access Control

- **Admin password/login-ban system** (`backend/config/accessControlConfig.js`, flag `STORE_PLAIN_PASSWORD`): `userModel` has additive `plainPassword` (display-only, gated by the flag) and `isActive` (login gate, default `true`). Plaintext written at signup/convert/self-reset and **backfilled on next successful login** for pre-existing users. `userSignIn.js` blocks login when `isActive === false` (checked only after password match). Login always authenticates against the bcrypt hash — plaintext is never used for auth, and is stripped from the login response.
  - Endpoints (all under `/admin/clients/:customerId/*`, admin-only): `credentials` (`getClientCredentials.js`, view), `reset-password` (`resetClientPassword.js`), `account-status` (`updateClientAccountStatus.js`, ban/enable, self-account and admin-account guarded).
  - UI: `AdminClientWorkspace.js` → **Account & Access** tab.
  - Disable later: flip the flag + run `backend/scripts/removePlainPasswords.js`.
  - **Security-sensitive, accepted risk**: plaintext password storage was an explicit owner decision (DB-leak risk accepted).
- **Signup**: `POST /api/signup` + `SummaryApi.signUP` exist but are dead — no route registered in `publicRoutes.js`, no link anywhere in `Login.js`. `userSignUp.js` takes `role` from `req.body` (never exposed via UI today, but would be a privilege-escalation risk if a signup UI is ever built without fixing this first). `userModel` has no `isVerified`/`emailVerified` field.
- **Guest login / demo system** (`backend/controller/user/guestLogin.js`, `POST /api/guest-login`, public): creates a real `userModel` account (`isGuest: true`, full portal access) + a `leadModel` record (`source: "guest"`). Identity resolution via `backend/helpers/guestIdentityMatch.js` (checks both `userModel`+`leadModel`) — 4 outcomes: real-customer match → rejected ("sign in with password"), partial match → rejected ("already in use"), full match → resumes existing guest, no match → creates new guest.
  - Demo credit: `backend/config/guestDemoConfig.js` — ₹50,000 auto-credited on signup via `transactionService.creditWalletInstant()` with `paymentMethod: "demo"`.
  - 24-hour **inactivity** cascade-delete: `backend/helpers/guestCascadeDelete.js` (activity refreshed by a guest-only fire-and-forget write in `middleware/authToken.js`), lazily triggered via `purgeExpiredGuests.js` (called from `getAdminClients.js`, same lazy-purge pattern as Trash). Deletes the guest's `userModel` + everything it created, including `invoiceModel` (a gap the older `deleteOrder.js`/Trash system doesn't close). **Never deletes the lead** — only clears `guestUserId` link.
  - Refuses to expire a guest mid-chess-game (`chessRoomManager.getActiveGamesForUser()` check) — returns `reason: "active_chess_game"`.
  - Installments hidden from guests in `StartNewWebsiteCustomize.js`'s payment dropdown (avoids `progressThreshold` gate stalling a demo project); Full Payment / Decide Later remain available.
  - `getAdminClients.js` filters `isGuest: { $ne: true }`; `getAdminUserWorkspace.js` also returns "Customer not found" for any guest `customerId` (closes an earlier admin-visibility leak).
  - Convert-to-client (`convertLead.js`) cascade-deletes the guest account first if converting a guest, then creates the real customer normally (`mustResetPassword: true`).

---

## 3. Leads / CRM System

- Collection: `backend/models/leadModel.js` — never `userModel`. A lead's truth is `leadModel`; a client's is `userModel` (`roles: "customer"`).
- Controllers: `backend/controller/lead/` — `createLead.js`, `getLeads.js`, `getLeadDetail.js`, `updateLead.js`, `globalSearch.js`, `convertLead.js`, `uploadProposal.js`, `deleteLead.js`.
- Routes: `/api/admin/leads*`, `/api/admin/search` (`globalSearch.js` — searches both `userModel` and `leadModel` in parallel, badge-tags `Client`/`Lead`, excludes converted leads).
- Pages: `AdminLeadsPage.js` (`/admin-panel/leads`, list + Add-Lead modal, phone required at create, email optional) — filter badges: source (All/Normal/Guest) + status (All/Matured/Not Matured — **"Matured" is a display-only rename of the stored `"Won"` value**, DB/enum unchanged). `AdminLeadDetailPage.js` (`/admin-panel/leads/:leadId`) — 6-stage pipeline pill (`New→Contacted→Qualified→Proposal Sent→Won→Lost`), follow-up log (separate action from status-change), versioned `proposals[]` upload via `GoogleDriveService`, Convert-to-Client button.
- **Convert mechanics** (`convertLead.js`, the only place a `userModel` customer is created from a lead): reuses `userSignUp.js`'s bcrypt hashing, sets the **universal default password `"1234"`** + additive `userModel.mustResetPassword: true`. Links lead (`convertedToUserId`, status → `Won`, becomes read-only). Requires both email **and** phone (email is the login identifier). `userSignIn.js` returns `mustResetPassword`; `postLogin.js` routes first-login user to `/set-new-password` (soft "Skip for now" allowed). `setNewPassword.js` (`POST /api/set-new-password`) is the **only** password-change endpoint in the app.
- `getAdminClients.js` filters by role so leads never leak into the Clients list.
- Not built: CSV bulk import, in-app quotation builder, email/WhatsApp send integration (everything today is manual/record-only).

---

## 4. Projects — Creation, Node/Timeline System, Pricing

### Dynamic node/timeline system (current, live — supersedes any `checkpoints[]` references)
- Legacy `checkpoints[]` field/hooks are **fully removed** from both `orderProductModel.js` and `productModel.js` (verified zero matches in code).
- Order-owned canonical fields on `orderProductModel.js`: `projectTimelineVersion` (`1` = live on node system, `0` = 4 legacy non-website orders that predate/don't support it), `projectTimelineInitialized`, `projectRuns[]`, `projectNodes[]`, `projectNodeEvents[]`.
- `projectProgress` = max `cumulativeProgress` among active nodes (shared field, read by dashboards/summaries).
- Service: `backend/helpers/projectNodeService.js` — idempotent 0% init, active-run lookup, cumulative-progress validation, create/soft-delete/restore (blocked if a later active node has equal/lower progress)/visibility/reset+new-run/in-place **edit** (`editProjectNode()` — every node except the run's starting node, which is title-only/locked at 0%; new progress must sit strictly between neighbours).
- Controller/routes: `backend/controller/order/projectNodeController.js`, all under `/api/admin/projects/:orderId/nodes...` (create, edit, delete, restore, visibility, reset) — gated to `projectTimelineVersion: 1`.
- `initializeProjectTimeline()` is called at order-creation time by `createOrder.js`, `adminCreateProjectOrder.js`, and `customerCreateCustomProjectOrder.js` — not a separate approval-time step.
- All 9 pre-existing website-project orders were migrated via `backend/scripts/migratePreExistingOrdersToNodeSystem.js` — every `isWebsiteProject: true` order is on version 1.
- Frontend: `ProjectDetails.js` reads `order.projectNodes` (no predefined future-checkpoint list exists). Admin UI: `AdminClientWorkspace.js`'s project subpage + `AdminProjectCheckpointDetail.js` (Add Node / Add Node & Send / Edit).
- Confirmed dead/legacy, do not use: `ProjectWorkspaceModal.js`, `SummaryApi.updateProjectProgress` / `POST /api/update-project-progress` (route never registered).
- **Message templates (Add Node update message) are now persisted, not local state.** Was: `AdminProjectCheckpointDetail.js` kept `templates` in a plain `useState` seeded with 3 hardcoded defaults — Save/Save As/Delete only mutated that array, so every custom template vanished on remount/refresh. Now: `backend/models/messageTemplateModel.js` (`name`, `message`, `createdBy`, shared across all admins) + `backend/controller/admin/{getMessageTemplates,createMessageTemplate,updateMessageTemplate,deleteMessageTemplate}.js`, routed at `GET/POST /admin/message-templates` + `PUT/DELETE /admin/message-templates/:templateId`. `AdminProjectCheckpointDetail.js` fetches templates on mount and calls the matching endpoint from each handler before updating local state.
- **Deleted node display fix (client + admin, `ProjectDetails.js`).** Was: a soft-deleted node (`status: 'deleted'`, see `softDeleteProjectNodes()` above) stayed in the rendered timeline (`sortedNodes`/`timelineNodes` never filtered it out) but `TimelineCheckpointItem`'s label logic only branched on `isCompleted`/`isInProgress` — a deleted node matched neither, so it fell through to the default label **"Upcoming"**, and the separately-rendered "Checkpoint Details" status badge (both desktop and mobile layout) showed "Completed" for it too. Now: a new `isDeleted` prop (`node.status === 'deleted'`) drives its own branch everywhere a node's visuals are derived — label "Deleted", muted card/badge tone, `X` icon, strikethrough title — computed at both `timelineNodes.map` call sites and passed into `TimelineCheckpointItem`; the "Checkpoint Details" status badge checks `selectedNode.status === 'deleted'` first, at both its desktop and mobile render sites. Nodes are still never filtered out of the timeline — only their display changed.

### Admin "Create Project for Client" (`AdminClientWorkspace.js` → Projects tab)
- Form component: `CreateProjectForClientForm`. 2-step flow: Project Details → Payment Settings.
- Creates a hidden catalog product (`isCustomClientProject: true` on `productModel.js`) + an order — NOT wired through the customer storefront (`createOrder.js`/`DirectPayment.js` not reused).
- Category Base Price: fixed per-category price from `backend/models/categoryBasePriceModel.js`, managed at `/admin-panel/project-setup/base-price` (`AdminCategoryBasePricePage.js`). Read-only/auto-fetched in the form — never client-submitted.
- Additional Features: existing `feature_upgrades`-category `productModel` products (NOT a separate collection — a separate `projectFeatureModel` attempt was built then removed). Managed at `/admin-panel/project-setup/features` (`AdminFeatureProductsPage.js`) — **CRUD on this page is currently stub-only** (list works; Add/Edit modal was deliberately removed in a later pass, though the underlying `uploadProduct`/`updateProduct`/`deleteProduct` endpoints still work and are callable elsewhere).
- Server-side price re-derivation is mandatory: `adminCreateProjectOrder.js` never trusts client-submitted price/feature data — re-derives base price from `categoryBasePriceModel` and feature price from `productModel` (filtered to `feature_upgrades`).
- Reference Total = Base + Features (display only); Selling Price is manual; Discount = Reference Total − Selling Price.
- `startingNodeTitle` does **not** live on `productModel.js` (an early plan, never implemented that way) — it lives on `orderProductModel.js` (order-level, copied at start) and `categoryBasePriceModel.js` (per-category default, fields: `category`, `basePrice`, `description`, `startingNodeTitle`).
- `hasUnpaidInvoice` (from `getOrderDetails.js`) is scoped to only `order.currentInstallment`'s invoice, gated on that installment's `progressThreshold` being reached — NOT "any unpaid invoice on the order" (fixed; previously over-matched).
- Per-client **"Deleted Projects" tab** in `AdminClientWorkspace.js` shows `orderDeleted`-flagged payment history separately from the main Payment & Invoices tab.

---

## 5. Service Plans / Add-on Services

### Schema & lifecycle
- `productModel.servicePlan{}` confirmed live fields: `planType`, `limitScope`, `manualUnit`, `manualCount`, `portalAccessCount`, `filesLimit`, `validityUnit`, `validityValue`, `validityInDays`, `billingCycle` (includes `every_2_years`…`every_5_years`), `serviceBehavior` enum (`portal_access_control` | `reminder_only`, legacy) — **plus, already implemented despite doc 56 calling this unbuilt**: `timing` enum (`during`|`during_and_after`|`after`), `dependency` enum (`project_required`|`standalone_or_project`|`standalone_only`), `capability` enum (`upload_data`|`send_reminders`), `purchaseType` enum (`one_time`|`recurring`), `monthlyReferencePrice`, `billingOptions[]`. Top-level `isServicePlan: Boolean` flags a catalogue row as a service.
- `orderProductModel` additive fields: `linkedProjectOrderId` (ObjectId ref order, null = standalone, set = add-on — the **only** project↔service link, no mapping model), `addedDuringProjectPhase` (`in_progress` | `after_completion`, re-derived server-side from real progress, never trusted from client), `servicePlanSnapshot{}` (frozen config at purchase, includes `serviceName` — added so a purchase survives the catalogue plan being deleted/retired later), `servicePlanStartDate/EndDate`, `serviceCurrentCycleNumber/Start/End`, `serviceAccessUsedInCycle/Total`, `serviceCycleHistory[]`, `servicePlanStatus`.
- Admin create: `createServicePlan.js`, route is **`POST /admin/services/create`** (not `/api/admin/plans/create` as older docs state — renamed during a later "Add-on Service" pass).
- **`AdminCreatePlanPage.js` is dead** — file only exists in a backup folder, not registered in `adminRoutes.js`. Admin plan/service creation now goes through `components/AddServiceModal.js` (referenced live in `ProjectDetails.js`, `ServicePlanDetail.js`, `common/index.js`), not a dedicated create-page.
- Admin catalogue list: `AdminPlanProductsPage.js` (`/admin-panel/website-management/plans`, `GET /api/admin/plan-products`) — query is `$or: [{category:'website_updates'},{isServicePlan:true}]`, `retiredAt: null` unless `?includeRetired=true`, `archivedAt: null` unconditionally (archived never resurfaces anywhere, even Retired tab).

### Purchase paths (customer)
- Standalone: `StartNewProject.js` → `ServicePlanDetail.js` (`/service-plan-detail/:planId`) → `customerCreateServicePlanOrder.js` (`POST /api/customer/service-plan-order`).
- Project add-on, single service: `ProjectDetails.js` "Add a Service" card → same detail/purchase flow, `linkedProjectOrderId` set, phase re-derived from real project progress server-side.
- Project add-on, multi-select: `components/AddServiceModal.js` (popup, not a page) → `customerCreateServicePlanOrdersBulk.js` (`POST /api/customer/service-plan-orders-bulk`) — validates every plan + whole-batch wallet cover **before** taking any money; rolls back compensatingly on mid-batch failure.
  - After either payment path (`handlePay`'s wallet-only branch, or `handleVerifyUpi`'s UPI branch) sets `purchasedSummary` and shows the in-modal success screen, a `setTimeout(() => onClose?.(), 1800)` auto-closes the modal ~1.8s later. Was: the modal stayed open on the success screen until the customer manually clicked "Done" (still present for an immediate close) — reported as feeling like the payment "didn't redirect." `onPurchased?.()` (order/wallet refetch) is unchanged and still fires immediately, before the close timer.
- Shared pricing/snapshot logic: `backend/helpers/servicePlanPurchase.js` (both single and bulk paths call this — never duplicate the price/duration/cycle/snapshot logic).
- Eligibility (`canAddService`): excludes only `pending-approval`/`payment-rejected` projects. A service is always paid in full, links to the project **at payment time**.

### Payment batches (multi-service wallet+UPI/combined) — `paymentBatchModel`
- Problem solved: `transactionModel.orderId`/`.invoiceId` are single refs; one UPI payment covering N service orders would strand N-1 pending forever.
- **A batch is an approval group, not a payment** — it lives in `backend/models/paymentBatchModel.js`, never in `transactionModel`. Fields: `batchRef` (unique), `upiTransactionId`, `totalAmount`, `walletPart`, `upiPart`, `paymentMethod` (`upi`|`combined`), `linkedProjectOrderId`, `orderIds[]`, `childTransactionIds[]`, `status` (`pending-approval`|`approved`|`rejected`) + verify/reject audit fields.
- Real money stays in **child transactions** — one per service, each with its own `orderId`/`invoiceId` and `parentTransactionId` = the batch's `batchRef`. Approving/rejecting the batch settles every child through the **unchanged** single-order path (`applyApprovedOrderPayment` / `rejectLinkedOrderPayment`).
- **Why not a transaction row** (this was the earlier design and is what it fixed): a transaction means "one payment applied to one order," and `transactionService.js` line ~53 infers `isWalletRecharge = !isInstallmentPayment && !orderId`. A batch has N orders, so as a transaction it needed `orderId: null` — which forced explicit `type`/`sourceType`/`paymentStatus` overrides to stop it being classified a wallet `deposit` (which would have **credited** the customer's wallet on approval), and still surfaced in the admin ledger as a nameless `Payment · UPI` row grouped under **"Wallet / General Payments"** (`paymentLedger.js` groups by `item.orderId`, so an `orderId`-less row lands in the wallet bucket). Moving it out of `transactionModel` restores the invariant that **every transaction row is one real payment against one order** — verified: the only `orderId: null` transactions left are genuine `type: "deposit"` wallet recharges.
- Split decided server-side: `walletPart = min(balance, total)`, wallet allocated sequentially across services (whole-rupee shares). Fully wallet-covered ⇒ instant activation, **no batch created**. Any UPI remainder ⇒ all services `pending-approval` together.
- Settlement endpoints are shared: `POST /wallet/approve-transaction` / `reject-transaction` resolve the id against `transactionModel` first, then `paymentBatchModel.batchRef`. `isBatchChild()` **blocks settling a batch child individually** (a batch is all-or-nothing) — approving one child would strand its siblings.
- Admin UI: `getAdminUserWorkspace.js` returns a `paymentBatches` array (with `orderIds`/`linkedProjectOrderId` populated for naming). `paymentLedger.js`'s `buildBatchLedgerItems()` lists only `pending-approval` batches (once settled, the children carry the outcome, so listing the batch too would duplicate the row). `AdminPaymentRecordDetail.js` renders each pending batch on **every order it paid for**, with an `actionTarget.type === "paymentBatch"` review modal; children of a pending batch are hidden from the per-order lists so no refused action is ever offered.
- **Pre-existing bug fixed alongside** (`transactionApprovalController.js`): rejecting a **combined** single-service/project payment never refunded the already-debited wallet portion. The wallet debit stores the UPI leg's id in its `parentTransactionId`, but in `customerCreateServicePlanOrder.js`/`customerCreateCustomProjectOrder.js` the UPI leg **is** the parent (that shared id is its own `transactionId`; its `parentTransactionId` is `null`) — so the refund query, which only ever checked `transaction.parentTransactionId`, matched nothing and the customer silently lost the money. Now `refundWalletPortionsFor()` (one shared helper, replacing the inline block) is called for both the transaction's own id and its parent id; it is idempotent on `transactionId`, so the double call never double-refunds. Confirmed pre-existing by re-running the regression suite against the pre-refactor file.
- Verification scripts (read-only, self-cleaning): `backend/scripts/verifyPaymentBatchFlow.js` (25 checks — batch approve/reject/combined-refund, child-guard, invariant) and `backend/scripts/verifyNonBatchPaymentRegression.js` (15 checks — single-service wallet/UPI/combined approve+reject, proves the non-batch paths are untouched).

### Project-bound service workspace
- When a project has 1+ linked service orders, `GET /api/order-details/:orderId` returns `linkedServices` and `ProjectDetails.js` renders `components/ProjectServiceWorkspace.js` instead of the plain timeline — linked services listed first (active → waiting → paused → inactive/expired), project row last.
- Routes: service detail nests under the project (`/project-details/:projectOrderId/services/:serviceOrderId`); the plain project timeline is still reachable directly via `/project-details/:orderId?view=project`.
- `linkedProjectOrderId` is the only relationship — no separate mapping model.

### Retire / delete / archive lifecycle (current — one lifecycle, no third tab)
- `productModel` additive: `retiredAt`/`retiredBy`, `archivedAt`/`archivedBy` (all default null). `hiddenBeforeRetire` was tried then **removed** — no longer exists.
- **"Remove" IS disable, "Restore" IS enable** — no separate availability toggle exists on the Plans page any more.
- Admin "Remove" (`retireOrDeletePlan.js`, `DELETE /api/admin/plans/:planId`): counts real orders server-side — **0 purchases → hard delete**, **1+ → retire** (sets `retiredAt`, `isHidden: true`).
- "Restore" (`reactivatePlan.js`, `POST /api/admin/plans/:planId/reactivate`): always sets `isHidden: false` (no remembered prior state).
- "Delete Forever" (`purgePlan.js`, `POST /api/admin/plans/:planId/purge`) — only reachable from the Retired tab. Two modes: `archive` (default, sets `archivedAt`, row kept so orders/invoices stay whole, hidden from every list including Retired) or `hard` (real `findByIdAndDelete`, requires retyping the exact plan name).
- Plans page: two tabs only — **Active Plans** (status badge "Active", action Remove) and **Retired Plans** (status badge "Disabled", actions Restore / Delete Forever).
- `retiredAt`/`archivedAt` filters applied in `getProduct.js`, `getAllProducts.js`, `getAdminPlanProducts.js` (`?includeRetired=true` opts back in).
- The pre-existing **unguarded** `DELETE /api/delete-product` now also refuses deletion of anything with purchases — protects all products, not just plans.
- `hideProduct.js`/`unhideProduct.js` reject a retired or archived plan server-side (prevents bypassing the lifecycle via the old direct routes).
- Display-name resilience: `helpers/orderPresentation.js`'s `getOrderDisplayName()` reads product → snapshot → `orderItems` → fallback, so an order can render its name even after its catalogue product is gone. `backend/scripts/backfillServicePlanSnapshotName.js` fills old orders **from the invoice line**, never from the product (avoids recreating the dependency).

### Fixed-tenure service billing (current)
- Recurring service purchases require both a billing period and a total tenure. `servicePlanPurchase.js` derives the immutable `serviceTotalCycles = tenureMonths / serviceBillingCycleMonths`; invalid/non-whole combinations are rejected server-side. The standalone purchase page and project add-service modal enforce the same required tenure rule.
- `serviceBillingSchedule.js` is the cycle-calculation SSOT. New service orders persist the cycle price, total/completed cycle counters, current cycle dates and next billing date. Legacy records with no `serviceTotalCycles` retain their old auto-renew behaviour and are not guessed/migrated by request-time code.
- `servicePlanRenewalCron.js` creates only the next due `plan_renewal` invoice. A paid cycle is settled by `serviceCycleSettlement.js`, which appends the immutable cycle history entry, advances the next billing date, and lets the final already-paid cycle remain active through its end date; the cron then marks the term expired without creating another invoice.
- Every fixed-tenure service receives one `service_statement` live billing statement via `serviceBillingStatement.js`. It aggregates the contracted total, paid total and completed-cycle count, while individual cycle invoices remain the only payment targets.
- The existing activation/enforcement gaps remain: a dormant `after` service is not automatically activated at project completion, upload/reminder allowance enforcement is not complete, and no admin UI exists to manually close a live service.

---

## 6. Payments & Invoices

### Core principle (binding, current)
- **Wallet = customer's own already-approved money → debited instantly, no approval needed.**
- **UPI = new external money → always goes to admin approval.**
- A full/partial order is created **only when the customer actually pays** (not before).
- Shared helper: `backend/helpers/transactionService.js` — `createPaymentTransaction` (pending), `deductWalletInstant` (atomic guarded debit, race-safe), `refundWalletInstant`, `creditWalletInstant` (admin deposit/credit).
- Shared instant-pay endpoint for existing orders/installments: `walletPayInstant.js` (`POST /api/wallet/pay-instant`) — supports partial (wallet+UPI combined) and settles `invoiceModel` invoices.

### Invoice SSOT
- **Every project order gets an `invoiceModel` invoice at creation** — all three creation paths (`createOrder.js` gated to `isWebsiteService`, `adminCreateProjectOrder.js`, `customerCreateCustomProjectOrder.js`) call the shared `createProjectInvoice()` in `backend/helpers/paymentRecording.js`. Only installment #1's invoice is created up front; #2/#3 are created due-based when actually paid, via `backend/helpers/installmentSettlement.js`'s `settleInstallmentInvoice()` (shared by `walletPayInstant.js` and `transactionApprovalController.js`).
- Legacy monthly plans remain on the separate `monthlyInvoiceModel`. New service-plan purchases and their fixed-tenure renewals use `invoiceModel`: initial cycle invoice (`project` for compatibility), subsequent `plan_renewal` invoices, and one non-payable `service_statement` per order.
- `invoiceModel.js` confirmed fields: `userId`, `orderId`, `invoiceNumber` (unique), `invoiceType` enum `["project", "project_final", "plan_renewal", "service_statement"]` (partial unique indexes enforce one `project_final` and one `service_statement` per order), `amount`, `amountPaid` (running total, default 0), `status` enum `["unpaid","partially_paid","paid","overdue","cancelled"]`, `invoiceDate`, `dueDate`, `paidDate`, `installmentNumber`, `serviceCycleNumber`, `lineItems[]`, `paymentMethod`, `transactionReference`, `notes`, `internalNote`, `markedPaidBy`.
- **Settlement is always derived, never hardcoded**: `markProjectInvoicePaid()` (`paymentRecording.js`) derives status from `amountPaid` vs `amount`, accepts an `existingTransaction` param so a wallet-instant payment settles through the SAME transaction (never a duplicate). `markInvoicePaidAndResumePlan()` (`invoiceLifecycle.js`) is the separate settle path for `monthlyInvoiceModel` only — both `walletPayInstant.js` and `transactionApprovalController.js` route by `invoiceType` to the correct one.
- **Project payment surfaces — three, not one (corrects the earlier "one canonical pay surface" claim).** All three post to the same two endpoints (`/wallet/pay-instant` for the wallet part, `/wallet/verify-payment` for the UPI part) but each builds its own payload, wallet/UPI split, QR step and error handling:
  - `InvoiceDetailPage.js` (`/invoice-detail/:invoiceId`) — pays a known invoice; sends `invoiceId` + `orderId` + `sourceType:'invoice'`. `ProjectDetails.js`'s "Payment Pending" banner routes here (via `order.unpaidInvoice`).
  - `InstallmentPayment.js` (`/installment-payment/:orderId/:installmentNumber`) — pays an installment with **no `invoiceId`**, only `orderId` + `installmentNumber`. This is why it still exists: `walletPayInstant.js`'s order-mode branch calls `settleInstallmentInvoice()`, which **finds or creates** that installment's invoice. Installment #2/#3 have no invoice until they are paid, so a surface that requires an `invoiceId` cannot start their payment. `OrderDetailPage.js` and `PaymentAlert.js`'s fallback route here.
  - `DirectPayment.js` (`/direct-payment`) — rejected-order retry, reads `location.state.paymentData`/`retryPaymentId`.
  - **Known duplication, not yet fixed**: the payment logic + modal markup is copied across these three (and the QR/verify UI again in `AddServiceModal.js`, `ServicePlanDetail.js`, `StartNewWebsiteCustomize.js`, `WalletDetails.js`, `WalletRecharge.js`, `RenewalModal.js` — 9 files with their own `QRCodeSVG` block). A shared payment component is the agreed direction; nothing shared exists today, so a payment-rule change must be applied in every copy.
- Partial-payment settlement for installment #2/#3 uses the same shared path via `backend/helpers/installmentSettlement.js` (`settleInstallmentInvoice()`), called by both `walletPayInstant.js` and `transactionApprovalController.js`.

### Invoice documents (PDF) — one generator, one route
- **What a document looks like is decided by `invoice.invoiceType`, never by who is asking for it.** Was: an admin-only route rendered a `project_final` invoice through `generateProjectFinalInvoicePdf.js` (totals + payment history) while the customer route rendered the **same invoice** through `generateInvoiceDocumentPdf.js` (line items, no history) — one invoice, two different papers depending on the viewer. Now: `backend/helpers/generateInvoiceDocumentPdf.js` is the only generator, branching on type — `project_final`/`service_statement` get the statement layout (carried over verbatim from the admin generator, so the admin's document is unchanged), everything else gets the invoice layout. `generateProjectFinalInvoicePdf.js` was deleted.
- **`backend/controller/invoice/invoiceDocumentController.js` is the only load path.** It exports `loadInvoiceDocument()` — resolves against `invoiceModel` then `monthlyInvoiceModel`, populates `orderId` **without a `select`** (a narrowed select blanks the project name, since `getOrderDisplayName()` reads `projectSnapshot`/`productId`/`servicePlanSnapshot`), enforces "admin, or the invoice's own user", and loads the order's completed `payment`+`renewal` transactions when the invoice is a statement.
- Routes: `GET /invoices/:invoiceId/view` and `/download` serve customer and admin alike. The admin-only `/admin/project-final-invoices/:invoiceId/download|view` pair was **retired**; only `POST /admin/project-final-invoices/:invoiceId/resend` remains (emailing is an admin action), and it builds its attachment from the same shared loader + generator.
- Frontend: `AdminClientWorkspace.js` and `AdminPaymentRecordDetail.js` call `SummaryApi.invoices.downloadDocument/viewDocument` with no per-type branching; `SummaryApi.projectFinalInvoice` is now only used for `resend`. `InvoiceDetailPage.js` was already on this route and was not changed.
- **Per-installment invoice PDFs are deliberately not offered.** A project states itself once, in its `project_final` invoice (total, every installment, what is paid) — an installment invoice is a payment target, not a document. Admin: `AdminClientWorkspace.js`'s per-record Download button is hidden when `invoice.invoiceType === "project"` (plan/service cycle invoices keep theirs). Customer: `InvoiceDetailPage.js` shows View/Download/Share only when `isStatement` (`project_final`/`service_statement`), so a paid installment renders no document buttons.
- **Still not SSOT (known, unfixed)**: `generateMonthlyInvoicePdf` (`helpers/emailService.js`) is a third live generator used by email/cron and by `downloadPaymentRecordInvoice` (`monthlyInvoiceController.js`) — that admin per-record download **looks up project invoices in `monthlyInvoiceModel`**, where they do not exist, so it always fails ("This payment record does not have a linked invoice"). It is unreachable today only because the button above is hidden. `controller/user/downloadInvoice.js` (`GET /download-invoice/:orderId`) is a fourth generator with no caller at all.

### Approval rules (binding, current)
- **A project order can never be approved without a real payment on record — no exceptions.** `approveProjectOrder.js`'s `APPROVAL_MODES` is only `["approve_with_payment", "reject"]` — the earlier `approve_no_payment` mode was removed entirely, along with `AdminClientWorkspace.js`'s "Approve without Payment" button and `adminCreateProjectOrder.js`'s payment-less-approval path.
- Customer-paid orders (transaction already submitted, full/installment/wallet+UPI): approved/rejected in **Payment & Invoices tab** → `AdminPaymentRecordDetail.js` → `transactionApprovalController.js`.
  - **Two separate components live in this one file**: `SinglePaymentRecordDetail` (deep-linked single-record page) and `AdminPaymentRecordDetail` (the ledger-list page, which already had a review modal before opening `openAction("transaction", ...)`). Was: `SinglePaymentRecordDetail`'s "Accept Payment"/"Reject Payment" buttons called `handleApproveTransaction`/`handleRejectTransaction` directly on click — no confirmation step, so a single click immediately approved/rejected real money. Now: both buttons only set a `confirmAction` state (`"approve"`/`"reject"`); a small Yes/Cancel popup renders the amount and only calls the real handler when "Yes, Confirm" is clicked. The handlers themselves are unchanged.
- Genuinely payment-less orders (customer "Pay Later" / admin-deferred): approved in **Projects tab** → open the pending project → approval bar (`POST /api/admin/projects/:orderId/approval`, `approveProjectOrder.js`) — Record Payment or Reject only.
- An order with an already-submitted pending transaction is excluded from the Projects-tab approval bar (`isPendingApproval` excludes `hasPendingTransaction`) — shows a neutral info banner instead, to prevent double-recording the same payment.
- **Progress-gate thresholds**: `installmentSchema.progressThreshold` (Number, nullable, 0-100) lets a later installment be gated by real `projectProgress` % instead of a hardcoded 40%/75%. Defaults: 2-split → `[null, 90]`; 3-split → `[null, 50, 90]`. Enforced in `projectNodeService.js`'s `appendProjectNode()` via `getBlockingInstallmentThreshold(order)` (admin can't push progress past a due, unpaid installment's threshold); `ProjectDetails.js`'s payment banner prefers `progressThreshold` over the legacy hardcoded values. No admin UI to edit thresholds after creation (creation-time default only).
- `ProjectDetails.js` gates only the upload/request-update **action**, not the whole page: `isUploadLocked = hasUnpaidInvoice || isOrderPendingApproval` — the old full-page "Payment Processing" block screen was removed.
- **List/badge `hasUnpaidInvoice` now shares the exact same due-installment rule as the detail page.** Was: `getUserOrder.js` (the `ProjectsAndPlans.js`/`CustomerDashboard.js` list feed, via `OrderListRow.js`'s `getItemStatusMeta()`) computed `hasUnpaidInvoice` as "ANY unpaid/overdue invoice exists on this order" — so an admin-created project with installment #1 paid still showed a "Payment Pending" badge because installment #2's invoice legitimately stays `unpaid` until its own `progressThreshold` is reached (this is the exact bug `getOrderDetails.js` had already been fixed for, see §6 core rule above — the list feed just never got the same fix). Now: the due-installment + `progressThreshold` logic lives in `backend/helpers/projectDuePayment.js`'s `getDueUnpaidInvoiceFilter(order)`, used by both `getOrderDetails.js` (unchanged behavior, just extracted) and `getUserOrder.js` (new — scoped to `isWebsiteProject` orders only, batched via one `$or` query to avoid N+1). `getUserOrder.js` additionally `.select()`s `installments`/`currentInstallment` on top of the shared `ORDER_SUMMARY_FIELDS` (Mongoose `.select()` calls merge, not overwrite) rather than adding those fields to `ORDER_SUMMARY_FIELDS` itself, since that constant is also read by `getAdminUserWorkspace.js`/`getMyPaymentWorkspace.js`. Plan orders are untouched (they use `monthlyInvoiceModel`, not this path).

### Admin ledger
- `AdminClientWorkspace.js` → **Payment & Invoices** tab (`PaymentInvoicesPanel`) reads existing `transactions`+`invoices` arrays via the shared `helpers/paymentLedger.js` merge/dedup logic — never a separate admin payment source.
- "Record Payment" (renamed from "Mark Invoice Paid") supports an admin-only `internalNote` (never shown to the customer) — distinct from the customer-payment Accept/Reject verification action.
- Per-project ledger: `WorkspaceDetailSubpage` also renders a read-only Payments & Invoices card scoped to just that order (same `buildLedgerItems()` helper).
- **"Deleted Projects" tab is now an intentional feature, not an accidental gap.** Was: `deleteOrder.js` cascade-deleted `updateRequestModel`/`monthlyInvoiceModel`/`transactionModel`/`partnerCommissionModel` but never touched `invoiceModel`, so an invoice survived as an unlabeled orphan (its `orderId` pointed at nothing) and the tab showed a generic "Deleted Project" string with no way to tell which project it had been. Now: `invoiceModel.js` has additive `deletedProjectName`/`deletedProjectType` fields; `deleteOrder.js` writes them onto every invoice for that order (via `invoiceModel.updateMany`) **before** deleting anything else, using `buildOrderDeletePlan()`'s already-computed `serviceName`/`orderType` — the same one shared code path handles both project and plan deletes, no separate logic needed. `transactionModel` is still hard-deleted (unchanged, deliberate — only invoices are kept for this tab). `getAdminUserWorkspace.js` selects the two new fields; `helpers/paymentLedger.js`'s `buildLedgerItems()`/`groupLedgerItemsByProject()` fall back to `deletedProjectName` (and carry `deletedProjectType` onto the group) when the live order is gone; `AdminClientWorkspace.js`'s `DeletedProjectsPanel` now shows type (Project/Plan), deleted date, and last payment method instead of just a generic name. **One-time cleanup**: `backend/scripts/purgeOrphanedDeletedProjectInvoices.js` (dry-run by default, `--apply` to write) permanently deleted 29 pre-fix orphaned invoices that had no snapshot and could never get one retroactively.
- `buildOrderDeletePlan()` (`backend/helpers/orderDeletePlan.js`)'s `serviceName`/`orderType` now match the frontend SSOTs instead of a narrower ad-hoc check. Was: `serviceName` only read `productId.serviceName` (blank/generic for a custom client project with no catalog product — see §4's "Create Project for Client" — since its name lives only in `projectSnapshot.displayName`); `orderType` only matched `productId.category === "website_updates"`, missing `service_plan` category orders entirely (add-on services bought via `AddServiceModal.js`), so a deleted add-on service would be mislabeled a "project." Now: `serviceName` follows the same priority as `helpers/orderPresentation.js`'s `getOrderDisplayName()` (`projectSnapshot.displayName` → `productId.serviceName` → `servicePlanSnapshot.serviceName` → `orderItems` → `"Project"`); `orderType` prefers the order-level `isWebsiteProject` field (set at creation, see §4) and only falls back to category-matching (now including `service_plan`, matching `helpers/orderType.js`'s `PLAN_CATEGORIES`) when that field is missing.
- Per-order payment history: `AdminClientWorkspace.js`'s `PaymentOrderHistorySubpage` (opened from a payment group row) is a **split layout** — left column keeps the title + summary table (Category/Started/Total/Paid/Remaining/Payment type/Pending records); right column starts from the same top row and holds a "Combined Invoice" section (the `project_final` statement card, if one exists) above a "Payment Records" section (one card per real payment event). No page-level `border-t` band between title and content — both columns start flush at the grid top. Email/resend actions were removed from both the combined-invoice card and per-record cards (View/Download/Share only) — `handleInvoiceResend`/`handleFinalInvoiceShare` and the `Mail` icon import were deleted as dead code, not just hidden.

- **A nameless batch payment no longer appears in the ledger at all** — superseded by §5's `paymentBatchModel`. Was: the multi-service batch parent was a `transactionModel` row with `orderId: null`, so `paymentLedger.js` (which names by `transaction.orderId` and groups by `item.orderId`) rendered it as a bare `"Payment · UPI"` under **"Wallet / General Payments"**, next to the real per-service child rows — reading as a duplicate, unnamed, wallet-style entry for a UPI plan purchase. An interim display-only fix (a `linkedProjectSnapshot` lookup in `getAdminUserWorkspace.js` + an `isServiceBatch` label branch) was built and then **removed** in favour of the structural fix: the batch is no longer a transaction, so no such row exists. `buildBatchLedgerItems()` lists pending batches from the separate `paymentBatches` array instead. Consequence to rely on: **"Wallet / General Payments" now contains only genuine wallet recharges** (`type: "deposit"`), because that bucket is exactly the set of `orderId`-less transactions and no payment can be `orderId`-less any more.

### Recurring-plan resume guard (`monthlyInvoiceModel` only)
- `invoiceLifecycle.js`'s `resumeOrderForPaidInvoice()` no longer resumes a plan order just because the invoice being settled right now is paid — it also checks `monthlyInvoiceModel.exists({orderId, status: {$in: ['unpaid','overdue']}})` first. If a *different* invoice on the same order is still unpaid/overdue, the order stays paused (`isActive: false`) until that one is settled too. Fixes the bug where paying only one of two overdue invoices resumed the plan while the other was still owed. The invoice being settled is already saved as `paid` before this check runs, so it never matches its own query. All 3 live callers (`transactionApprovalController.js`, `walletPayInstant.js`, `monthlyInvoiceController.js`'s `markInvoiceAsPaid`) get the fix automatically — none of them were touched directly.

---

## 7. Orders/Plans Classification Helpers (SSOT — use these, never duplicate)

- `frontend/src/helpers/orderType.js`:
  - `PROJECT_CATEGORIES` (Set: `standard_websites`, `dynamic_websites`, `cloud_software_development`, `app_development`, `web_applications`, `mobile_apps`) + `isProjectItem(order)` — true if `order.isWebsiteProject` or category matches.
  - `PLAN_CATEGORIES = new Set(['website_updates', 'service_plan'])` + `isPlanItem(order)`.
  - `isFinishedItem`, `sortItemsLatestFirst` (rank-based: finished items last, latest-update first).
- `frontend/src/helpers/orderPresentation.js`: `getOrderDisplayName(order, fallback)`, `getOrderCategory(order, fallback)`, `getRemainingDays(order)`, `getItemStatusMeta(order)`, `getItemSummary(order)`, `getItemTypeLabel(order)`, `getItemTypeAccent(order)`. `getOrderDisplayName` priority: `projectSnapshot.displayName` → `productId.serviceName` → `servicePlanSnapshot.serviceName` → `orderItems[].name` → fallback.
- Shared row UI: `components/OrderListRow.js` (`OrderListRow` + `OrderListHeader`) — used by both `CustomerDashboard.js` and `ProjectsAndPlans.js` so list logic/markup never drifts apart. **`ProjectsAndPlans.js`'s layout/status version is canonical** if the two ever need to differ.
- Safety net: `PlanDetails.js` and `ProjectDetails.js` each re-verify their fetched order's actual type after load and self-redirect (`{ replace: true }`) to the correct sibling page on mismatch.
- Project row status derivation (current, real fields only — no static labels): `orderVisibility === 'payment-rejected'` → `Payment Rejected`; `'pending-approval'` → `Booked`; `projectProgress >= 100` or `currentPhase === 'completed'` → `Completed`; approved + `projectProgress === 0` → `Developer Assigned` (**static label — no real developer-assignment backend exists**); approved + `0 < progress < 100` → `{progress}% Complete`.

---

## 8. Trash / Soft-Delete System

- Applies to **leads and clients only** (not orders/projects — those use a separate hard-delete+scan system, §4/§6 above).
- `userModel`/`leadModel` additive: `deletedAt` (Date, null = active) + `deletedBy`.
- **No cron** — purge is lazy: opening `getTrash.js` (`GET /api/admin/trash`) purges anything past the 30-day retention, then lists remaining trashed records badge-tagged with `daysLeft`.
- Deleting a lead (`deleteLead.js`) or client (`trashClient.js`, `POST /api/admin/clients/:customerId/trash`) now soft-deletes; a trashed client also gets `isActive: false` (login blocked via the access-control gate in §2), restored to `true` on restore.
- All lead/client list reads filter `deletedAt: null`: `getLeads.js`, `getAdminClients.js`, both branches of `globalSearch.js`.
- Controllers: `backend/controller/trash/` — `trashConstants.js` (30-day retention helpers), `trashClient.js`, `getTrash.js`, `restoreTrash.js` (`POST /api/admin/trash/:type/:id/restore`), `purgeTrash.js` (`DELETE /api/admin/trash/:type/:id`, "Delete Forever").
- UI: `AdminTrashPage.js` (`/admin-panel/trash`), `AdminClientWorkspace.js`'s Account & Access tab (Delete Client → Move to Trash card).
- Retention (30 days) is a constant — no bulk restore/purge exists.

---

## 9. Client Documents System

- Owner is the **client (`userModel`), not an order/node** — so a demo client with no running project still has one place to receive an agreement.
- `userModel.documents[]` (`clientDocumentSchema` — Google Drive shape + `source` enum `agreement|general` + optional `orderId`/`nodeId` back-links, currently unused for actual node-upload).
- Controllers (`backend/controller/user/`): `uploadClientDocument.js` (`POST /api/admin/clients/:customerId/documents`, admin, `upload.any()` → Drive via `GoogleDriveService`), `getClientDocuments.js` (`GET /api/my-documents`, customer), `getAdminClientDocuments.js` (`GET /api/admin/clients/:customerId/documents`, admin).
- Both read controllers call `backend/helpers/clientDocumentsTimeline.js`, which merges `userModel.documents[]` + the converted lead's `proposals[]`/follow-up attachments (linked via `convertedToUserId`) into one newest-first timeline — two owners, one merged view, never duplicated in the DB.
- UI: `AdminClientWorkspace.js` → **Documents** tab (`ClientDocumentsPanel`); customer-facing `/documents` route → `CustomerDocuments.js`.
- Deferred: attaching a document during a project-node update (schema/controller already accept `nodeId`/`orderId`, node UI doesn't upload files yet).

---

## 10. Chess (known behavior/bugs)

- Chess is the **only** feature using a live WebSocket (`socket.io-client`, `frontend/src/chess/useChessSocket.js`) instead of HTTP.
- Backend auth (`backend/chess/chessSocket.js`) relies solely on the `token` httpOnly cookie during the socket handshake — no fallback token path.
- **Unresolved bug**: on iPhone/Safari, buttons appear dead — iOS Safari's ITP is stricter about `SameSite=None` cookies during WebSocket handshakes than ordinary fetch/XHR, so the cookie often doesn't attach and the connection silently fails. No UI surfaces the `connected`/`errorMessage` state from `useChessSocket.js`, so a failed connection is indistinguishable from "nothing happened." Three fixes were evaluated and paused: client-exposed JWT fallback (rejected, weakens sitewide `httpOnly`), same-site reverse proxy (needs hosting changes), chess-scoped low-privilege token (safest, paused at owner's request).
- **Fixed**: `chessRoomManager.js`'s `getPlayerColor()` now correctly reads `._id` from populated player docs (previously compared a populated `{_id,name,email}` object directly against a raw ObjectId and always failed once `players.white`/`black` were populated).
- Chess now uses `DashboardLayout` (previously had no shell/sidebar at all) and a branching Typeform-style lobby flow (`ChessLobby.js`) instead of three static forms.

---

## 11. UI Design System (conventions to follow — not optional)

- **Background**: `frontend/src/assets/BG.png` (dark navy/emerald wave) + `bg-slate-950/40` overlay, portal-wide.
- **3-tier glass pattern** (established, reused across most customer-portal pages):
  1. Dark-glass card — `rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl backdrop-saturate-150` (+ hover emerald glow) — headings/action cards.
  2. Light-glass — `bg-white/55 backdrop-blur-xl`, **black text**, for dense/tabular data (never white text on dense data).
  3. Action-pill — `border-emerald-400/40 bg-emerald-500/20 text-white backdrop-blur-md` — CTAs and status pills.
  Exception: payment-input forms (wallet recharge modal, `DirectPayment.js` internals) stay solid, not glassed. **`InstallmentPayment.js` is no longer an exception** — it now follows the detail-page template (open centred header + one dark-glass card with `border-t` dividers) and confirms payment in the portal's two-step popup (wallet step → UPI-QR step, the same shape as `InvoiceDetailPage.js`'s). Its payment logic was not touched in that pass — only the render.
- **Detail-page template** (site-wide standard — `ProjectDetails.js`, `PlanDetails.js`, `OrderDetailPage.js`, `InvoiceDetailPage.js`, `UserInvoices.js`, `TicketDetail.js`): open centered header, no bounding banner card — Back button `absolute left-0`, `rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-lg backdrop-blur-md`; heading truly centered; content in ONE dark-glass card (`bg-white/10 backdrop-blur-2xl`) with internal `border-t`/`border-r` dividers instead of multiple bordered sub-cards.
- **Zero-blue color rule**: emerald = progress/completion/real action; neutral white/slate-glass = in-progress/active/selected; amber = pending/waiting; red = paused/error only. Real action buttons stay solid (`bg-emerald-600`), never glass — glass/badge styling is reserved for status pills only.
- **Full-page glass "documentation" layout** (preferred over the bounding-card template for any page with dropdowns/popovers that must escape clipping — established on `StartNewWebsiteCustomize.js`): frameless sheet `rounded-[2rem] bg-white/[0.06] p-6 backdrop-blur-2xl` — **no border, no shadow, no `overflow-hidden`**; responsive `grid-cols-[minmax(0,1fr)_360px]` (main + sticky summary rail); `border-t border-white/10` section dividers, no nested sub-cards.
- **Open-heading + single-card list pattern** (`ProjectsAndPlans.js`, `CustomerDashboard.js`): no boxed banner — plain centered `<h1>` + subtext, then one `TicketsList.js`-style dark-glass card (title + filters + counters in one header row, `bg-white/5` table-header band, alternating row shading `bg-white/[0.02]`/`bg-white/[0.06]`).
- **Typography scale** (5 sizes max — do not introduce others): H1 `text-2xl` bold, H2 `text-xl` bold, H3 `text-lg` semibold, body `text-base`, sub-text `text-sm`. Canonical near-black is `text-black` (not `text-slate-950`) on light backgrounds, `text-white` on dark. Status badges/pills are exempt from the black/white rule (keep semantic colors).

---

## 12. Wallet & List Contracts

- Wallet balance SSOT: `userModel.walletBalance`, read via `current_user`/`userDetails`, surfaced through `AppContent`'s Context + Redux. No separate dashboard-owned wallet fetch.
- Wallet transaction history: `GET /api/wallet/history` (filtered `req.userId`, reads `transactionModel`) — read-only, never used to recalculate `walletBalance`.
- List surface contracts (do not mix): `ProjectsAndPlans.js` = project/plan tracking (progress far-right only); `OrderPage.js` = purchase history (price/date/type/status, no progress); `CustomerDashboard.js` = compact preview of latest 5 project/plan records.
- **`OrderDetailPage.js` (`/order-detail/:orderId`) — installment projects render as ONE section.** Was: a two-column grid of three sub-cards — "Plan Snapshot", "Installments", and an "Invoice History" list that repeated every row of the schedule beside it (and showed the `project_final` statement as a second, larger `Due` bill the customer appeared to owe). Now: when `!isRecurringPlan && order.isPartialPayment && installments.length > 0`, the page renders a single section — a header line carrying the order's own facts (`Started {date} · Installments (n) · Total ₹x`) with a **Download Invoice** link for the `project_final` statement on the right (via the shared `/invoices/:id/download` route; absent when no statement exists), then the installment rows separated by `border-t`/`border-b` dividers, no sub-cards. Every other order shape (recurring plan, one-time full payment) keeps the original two-card layout, where `project_final` now renders with a non-payable "Full Invoice" badge instead of a `Due` one.

---

## 13. Admin Delete Flow (orders/projects)

- Scan-then-delete pattern: `GET /api/admin/delete-order/:orderId/scan` (`scanDeleteOrder.js`) returns active/missing linked sections → admin checks all active sections in a modal → `DELETE /api/admin/delete-order/:orderId` (`deleteOrder.js`) re-validates the same scan plan server-side, deletes in serialized order.
- `deleteOrder.js` still cascades (hard-deletes) `updateRequestModel`/`monthlyInvoiceModel`/`transactionModel`/`partnerCommissionModel`. `invoiceModel` is deliberately excluded — see §6's "Deleted Projects" entry for why (it now gets a name/type snapshot written onto it first, instead of being cascaded, so the admin "Deleted Projects" tab can show what was deleted).

---

## 14. Known Open Gaps (real, unfixed — verified, not speculative)

- `StartNewWebsiteCustomize.js` calls a `SummaryApi.customerCategoryBasePrice` mapping that doesn't exist (§1).
- Chess iOS Safari WebSocket cookie-auth failure (§10) — unresolved.
- `AdminFeatureProductsPage.js`/`AdminCategoryBasePricePage.js` Add/Edit UI is currently stub-only (list works, create/edit modal was removed) — the underlying endpoints (`uploadProduct`/`updateProduct`/`deleteProduct`) still work but nothing calls them from these pages.
- No admin capability exists anywhere to directly activate/close a customer's plan (no such route in `backend/routes/index.js`).
- Service system: no activation engine, no enforcement of upload/reminder allowances, no cycle/recurring billing beyond the first payment, no reminder delivery — see §5's three-axis design section for what's planned but not built.
- `UserInvoices.js` (`/my-invoices`) calls `GET /api/my-invoices`, which **does not exist** as a registered backend route (confirmed by grep of `backend/routes/index.js`) — this page has been broken across many sessions and was never fixed.
- **A multi-service payment batch cannot be approved from `AdminClientWorkspace.js`** — the panel the Payments tab actually opens today. `PaymentOrderHistorySubpage` computes `matchingBatches` but never returns or renders them, and has no `"paymentBatch"` action type; it filters batch children only out of `combinedFromUnlinkedTransactions`, while a child carries its own `invoiceId` (`customerCreateServicePlanOrdersBulk.js`) and so renders from the **invoice** branch instead — its "Review Payment" button sends the child's `transactionId` and hits `isBatchChild()`'s guard: *"This payment is part of a multi-service payment. Approve the payment itself, not one service."* The working batch UI lives in `AdminPaymentRecordDetail.js` (`openAction("paymentBatch", batch)` → sends `batchRef`), but that page is **unreachable**: its route `admin-panel/clients/:customerId/payments/:recordType/:recordId` is registered, yet the live workspace no longer navigates to it — the Payments tab was deliberately moved from per-record `navigate()` to a group-level in-page subpage (`handleOpenPaymentGroup`/`activePaymentGroupId`), and the batch UI was later built in the page that change had orphaned. Backend is fine; the fix is to port the batch card + `"paymentBatch"` action into `PaymentOrderHistorySubpage` and filter batch children out of the invoice branch too.
- **`createOrder.js` never flips `orderVisibility` to `'approved'` on a wallet-paid order**: line 65 hardcodes `orderVisibility: 'pending-approval'` at creation regardless of the destructured `orderVisibility` param; the `paymentMethod === 'wallet'` branch (line 380+) only sends email/notifications, it never re-saves the order with `orderVisibility: 'approved'` the way `adminCreateProjectOrder.js`/`customerCreateCustomProjectOrder.js`/`customerCreateServicePlanOrder.js` do. Since `getItemStatusMeta()` (`orderPresentation.js`) and `ProjectDetails.js` both read `order.orderVisibility` directly, a wallet-paid order created through this path shows "Approval Pending" forever even though wallet money needs no approval. Confirmed by code inspection, not yet fixed or backfilled for any existing affected orders.

---

## 15. Where To Look First (quick index)

| Task | Primary files |
|---|---|
| Auth/login | `pages/Login.js`, `helpers/postLogin.js`, `helpers/portalHome.js`, `backend/controller/user/userSignIn.js` |
| Admin password/ban | `backend/config/accessControlConfig.js`, `backend/controller/admin/{getClientCredentials,resetClientPassword,updateClientAccountStatus}.js` |
| Guest login | `backend/controller/user/guestLogin.js`, `backend/helpers/{guestIdentityMatch,guestCascadeDelete,purgeExpiredGuests}.js`, `backend/config/guestDemoConfig.js` |
| Leads/CRM | `backend/controller/lead/*.js`, `backend/models/leadModel.js`, `pages/AdminLeads*.js` |
| Project creation (admin) | `backend/controller/order/adminCreateProjectOrder.js`, `AdminClientWorkspace.js` |
| Project creation (customer) | `backend/controller/order/customerCreateCustomProjectOrder.js`, `pages/StartNewWebsiteCustomize.js` |
| Node/timeline system | `backend/helpers/projectNodeService.js`, `backend/controller/order/projectNodeController.js`, `pages/ProjectDetails.js` |
| Service plans | `backend/models/productModel.js` (`servicePlan{}`), `backend/helpers/servicePlanPurchase.js`, `pages/ServicePlanDetail.js`, `components/AddServiceModal.js` (admin create UI — not a dedicated page) |
| Payment batches (multi-service) | `backend/models/paymentBatchModel.js`, `backend/controller/order/customerCreateServicePlanOrdersBulk.js`, `backend/controller/user/transactionApprovalController.js`, `helpers/paymentLedger.js`, `components/AddServiceModal.js` |
| Plan retire/delete | `backend/controller/product/{retireOrDeletePlan,reactivatePlan,purgePlan}.js` |
| Payments/invoices | `backend/helpers/{paymentRecording,transactionService,installmentSettlement}.js`, `backend/models/invoiceModel.js` |
| Invoice PDF / download | `backend/helpers/generateInvoiceDocumentPdf.js` (only generator), `backend/controller/invoice/invoiceDocumentController.js` (only loader, exports `loadInvoiceDocument`) |
| Customer payment surfaces | `pages/InvoiceDetailPage.js` (invoice known), `pages/InstallmentPayment.js` (installment, no invoiceId yet), `pages/DirectPayment.js` (rejected-order retry) |
| Approval | `backend/controller/order/approveProjectOrder.js`, `backend/controller/user/transactionApprovalController.js` |
| Trash | `backend/controller/trash/*.js` |
| Client documents | `backend/helpers/clientDocumentsTimeline.js`, `backend/controller/user/{uploadClientDocument,getClientDocuments,getAdminClientDocuments}.js` |
| Project/plan classification | `helpers/orderType.js`, `helpers/orderPresentation.js`, `components/OrderListRow.js` |
| Chess | `frontend/src/chess/*`, `backend/chess/*` |
| UI design system | `assets/BG.png`, any file using `bg-white/10 backdrop-blur-2xl` |
