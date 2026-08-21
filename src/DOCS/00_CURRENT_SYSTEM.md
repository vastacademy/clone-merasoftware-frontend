# Current System Snapshot

This document describes the active frontend behavior as of the current codebase.

## 1. Authentication Flow

- Login page: `src/pages/Login.js` — the **only** auth screen. `routes/publicRoutes.js` registers exactly three public routes: `""` (RoleBasedHome), `login`, `unauthorized`.
- **There is no signup page and no signup route**, and `Login.js` has no signup link. `POST /api/signup` and `SummaryApi.signUP` still exist but are unreachable from the UI; customers are created by lead conversion (`convertLead.js`) and admin client management. See `61_SIGNUP_SYSTEM_AUDIT_AND_REQUIREMENTS.md`.
- **There is no OTP verification page** (an earlier `src/pages/OtpVerification.js` no longer exists) and **no forgot-password page** (`ForgotPassword.js` survives only under `backup-publicremoval-phase4A/`). The OTP *backend* is still live — `/verify-otp`, `/resend-otp`, `helpers/otpUtils.js`, `models/otpModel.js` — but nothing in the app calls it, and `userSignUp.js` never issues the first OTP.
- Current direct-login path uses `postLogin()` from `src/helpers/postLogin.js`
- After successful login, the app redirects to the role's **portal home** via `getPortalHome(role)` (`src/helpers/portalHome.js`): admin → `/admin-panel/dashboard`, customer → `/dashboard`. The public site is gone — there is no `/home`. See `44_PUBLIC_SITE_REMOVAL.md`.
- `postLogin()` stores user data in Redux, cookies, and local storage

### Current behavior

- Customer login lands on `/dashboard`; admin login lands on `/admin-panel/dashboard`
- Root `/` (`RoleBasedHome`) redirects: logged-out → `/login`, logged-in → the role's portal home
- The active route decision is handled by protected routes and `RoleBasedHome`, not by a separate dashboard redirect in login

## 2. Route Map

### Entry routes (the only non-portal routes — public site removed)

- `/` - `RoleBasedHome` (redirects to `/login` or the role's portal home)
- `/login` - `Login`
- `/unauthorized` - wrong-role fallback (used by `ProtectedRoute.js`)

The public marketing/storefront site (`/home`, `/product/:id`, `/search`, `/contact-us`, `/service-card`, `/forgot-password`, `/demo`, `/practice`, and all policy pages) has been **removed**. See `44_PUBLIC_SITE_REMOVAL.md`.

### Customer routes

- `/dashboard` - `CustomerDashboard`
- `/order` - `OrderPage`
- `/order-detail/:orderId` - `OrderDetailPage`
- `/project-details/:orderId` - `ProjectDetails` (project orders only)
- `/project-details/:projectOrderId/services/:serviceOrderId` - project-contained service detail; Back returns to that project's workspace
- `/plan-details/:orderId` - `PlanDetails` (plan/`website_updates` orders; new page, live-wired to `GET /api/order-details/:orderId` + `GET /api/get-update-requests`; see `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md`)
- `/wallet`
- `/my-updates`
- `/my-invoices`
- `/documents` - `CustomerDocuments` (new; one newest-first timeline of every admin-sent document — lead-stage `proposals[]`/`followUps[].attachment` + client-stage `userModel.documents[]` — via `GET /api/my-documents`; read-only, admin-sent files only. See `50_CLIENT_DOCUMENTS_SYSTEM.md`)
- `/direct-payment`
- `/support`
- `/installment-payment/:orderId/:installmentNumber`
- `/profile`
- `/support-tickets/:ticketId`
- `/complete-profile`
- `/start-new-project` - `StartProject` intake page
- `/start-new-project/services?tab=services` - `StartNewProject` standalone service catalog (live-wired to `GET /api/get-product`)
- `/start-new-project/build/new_website` - restored interactive customer website/project question flow (`StartNewWebsiteBuild`)
- `/start-new-project/build/new_website/customize` - restored customer customization and payment flow (`StartNewWebsiteCustomize`)
- The standalone service flow uses the portal glass system end-to-end: the service catalog, service detail, wallet/UPI confirmation, QR/reference step, and success state all use the dark glass surface and emerald action-pill treatment. The project AddServiceModal already uses the same system.
- The active `/start-new-project` intake surface is `startproject.js`: it offers `Create a Custom Project` and `Start a Service or Add-ons`. The custom-project choice opens the restored interactive flow; services continue through the existing service/add-on flow. Customer navigation labels use `Explore Services` while route IDs remain unchanged.
- `/start-new-project/:projectId` - legacy plan detail used by existing `website_updates` products; it is not a project-catalogue route.
- `/project-details/:orderId` now opens a timeline-driven project view where the selected checkpoint shows only its own linked textual details below, and the latest active checkpoint is selected by default
- A project with one or more add-on service orders now opens a project-contained workspace instead of separating those services into the global Plans area. It lists linked services first and the original project last; selecting the project opens its normal timeline, while selecting a service opens its existing detail surface under a project-scoped route. `linkedProjectOrderId` remains the only linkage source.
- `/project-details/:orderId` desktop layout now uses three aligned cards with shared row height, inner scroll areas, and no runtime size measuring; the main page bottom spacing is handled on the page container so the footer follows naturally after content

### Admin routes

- `/admin-panel/dashboard` - `AdminDashboard`
- `/admin-panel/leads` - `AdminLeadsPage` (Lead/CRM list; prospects before they become customers — new `leadModel`; add-lead modal, phone required. See `43_LEAD_CRM_SYSTEM_PHASE_1_TO_6A.md`)
- `/admin-panel/leads/:leadId` - `AdminLeadDetailPage` (pipeline stage, follow-up log, versioned proposal upload, Convert to Client)
- `/admin-panel/clients` - `AdminClientsPage`
- `/admin-panel/clients/:customerId` - `AdminClientWorkspace` (Projects tab now has a working "Create Project for Client" modal + live save — see `33_ADMIN_CREATE_PROJECT_FOR_CLIENT.md`)
- `/admin-panel/project-setup/base-price` - `AdminCategoryBasePricePage` (manage fixed base price per project category; used by "Create Project for Client")
- `/admin-panel/project-setup/features` - `AdminFeatureProductsPage` (list/create/edit/delete `feature_upgrades`-category products; reuses the pre-existing generic `uploadProduct`/`updateProduct`/`deleteProduct` endpoints)
- `/admin-panel/trash` - `AdminTrashPage` (soft-deleted leads + clients; restore within 30 days or delete forever; expired items auto-purged lazily when the page opens. See `49_TRASH_SYSTEM_SOFT_DELETE.md`)

### Client project model

- Projects have no catalogue/listing system. Admin creates a private project from the selected client's workspace; the customer custom-project flow also creates a private order directly after its own interaction/payment flow.
- One `orderProductModel` record is the project SSOT: it owns the client reference, frozen `projectSnapshot`, timeline, pricing, payment and invoices. `isWebsiteProject` enables project workflows; it is not a Website Management visibility flag.
- `categoryBasePriceModel` and `feature_upgrades` remain internal admin configuration for the client-project form, not project catalogue entries.

## 3. Active Layouts

- The old global `Header`/`SharedHeader`/`Footer` were **removed** with the public site (Phase 2 of `44_PUBLIC_SITE_REMOVAL.md`). Portals now rely entirely on their own shells (`DashboardLayout`/`AdminLayout`) — `AppContent` renders only `<Outlet/>` (plus the `Context.Provider` and `ScrollToTop`).
- `DashboardLayout` is the active customer dashboard shell (and now hosts the customer cart: `DraftOrderSavedDrawer` + `FloatingCartButton`)
- `DashboardLayout` owns the sidebar page badge; `/projects-and-plans` resolves to `Projects and Plans`
- `DashboardLayout` resolves customer badges for wallet, orders, projects, support, updates, invoices, payments, and profile-completion routes
- `OrderPage` keeps its header, filters, counts, and order list inside one shared card, matching the Projects and Plans single-box layout
- `OrderPage` active filters use the same emerald selection color as `ProjectsAndPlans`
- `CustomerDashboard` is the active customer dashboard launchpad page
- `UserDashboard` remains in the codebase as a legacy reference and is no longer the active dashboard route
- `ProjectsAndPlans` is the active customer project/plan list page
- `OrderPage` is the active customer purchase-history list page
- `OrderDetailPage` remains unchanged and is the order detail surface for a single record
- `AdminDashboard` is the active admin dashboard page
- `AdminLayout` is the shared admin shell used by dashboard, clients, and client detail pages
- `AppContent` keeps the app outlet content flow natural instead of forcing a viewport min-height
- `DashboardLayout` and `AdminLayout` sidebars are `sticky` (not `fixed`) inside a `flex items-stretch` row with the content column; this lets the sidebar's background visually extend to match content height instead of being viewport-locked

## 4. Dashboard Behavior

### Customer dashboard

- Main content now lives in `CustomerDashboard`
- Left panel UI comes from `DashboardLayout`
- The dashboard is a launchpad for key customer information and next actions, not a workflow-heavy control panel
- Primary sidebar quick links are Dashboard, Projects and Plans, Explore Services, and Wallet, with Orders/Profile/Support kept as secondary links; the `Explore Services` quick link points to `/start-new-project`
- Wallet balance is treated as a single source of truth from `current_user` / `userDetails`; `AppContent` reads that value and the dashboard does not own a separate wallet fetch
- Dashboard recent items use a row-based list layout with status and progress-only-at-the-far-right presentation

### Projects and Plans

- `ProjectsAndPlans` list tabs are `All`, `Projects`, `Plans` only; the earlier `Active` and `Completed` tabs and their filter branches/memo were removed
- For project rows, the Status column now shows the real order lifecycle derived only from existing fields (`orderVisibility`, `projectProgress`, `currentPhase`) instead of a static "In progress" label:
  - `orderVisibility === 'payment-rejected'` -> `Payment Rejected`
  - `orderVisibility === 'pending-approval'` -> `Booked`
  - `projectProgress >= 100` or `currentPhase === 'completed'` -> `Completed`
  - approved and `projectProgress === 0` -> `Developer Assigned` (static label; no real developer-assignment backend exists yet, see `14_CODEBASE_AUDIT_INDEX.md`)
  - approved and `0 < projectProgress < 100` -> `{progress}% Complete`
- The percentage/developer text that used to sit separately in the "Updated" column and the far-right row slot for project rows was removed; that information now lives only inside the Status badge. Plan rows are unchanged and still show `days left` / `updates left` in those slots.
- `WalletDetails` page content container now uses `max-w-7xl` (previously `max-w-6xl`) to match the width used by `ProjectsAndPlans` and `StartNewProject`
- Clicking a row in `ProjectsAndPlans` now routes by type (`openDetails()`, using the file's own `isPlanItem(order)` helper): project rows still open `/project-details/:orderId` (`ProjectDetails`, unchanged); plan rows now open `/plan-details/:orderId` (`PlanDetails`, new page) instead of also going to `ProjectDetails`. `PlanDetails` copies `ProjectDetails`'s 3-column layout skeleton but shows a donut of updates-consumed-of-total, a plan snapshot (days left or resets-on date, total updates granted, file limit), an update-request history list, and a selected-request detail panel with per-file name/size/type — live-wired to `GET /api/order-details/:orderId` and `GET /api/get-update-requests` (the latter returns all of a user's requests across all plans; `PlanDetails` filters client-side by `updatePlanId._id`). See `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md`.
- `getOrderDetails.js`'s `productId` populate field-list was extended to include `isMonthlyLimitedPlan`, `isMonthlyRenewablePlan`, `monthlyUpdateLimit`, `yearlyPlanDuration`, `monthlyRenewalPrice`, `monthlyRenewalCost` — without these, recurring-plan detection silently failed for any order fetched through this endpoint. See `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md`.
- `UserUpdateDashboard` (`/my-updates`) card status logic was rebuilt to branch by plan type; the previous version only read simple-plan fields and could show a live-looking "Request Update" button on an already-expired recurring plan. See `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md`.
- Confirmed, not-yet-fixed: admin marking one overdue invoice "paid" (`invoiceLifecycle.js`'s `resumeOrderForPaidInvoice()`) resumes the whole order/plan without checking whether the same order has a different, still-overdue invoice. Also confirmed: no admin capability exists anywhere to activate/close a customer's plan directly (absent from `backend/routes/index.js`, not merely undocumented). See `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md` Section 5.

### Admin dashboard

- `AdminDashboard` now shows dashboard summary content only
- `AdminClientsPage` shows the client list as its own route
- It has:
  - sticky desktop sidebar (via `AdminLayout`); mobile navigation comes from `AdminLayout`'s own `MobileSidebarDrawer`
  - landscape orientation button on mobile
  - dashboard refresh actions

### Admin clients

- `AdminClientsPage` shows the searchable client table
- The default client-list order is latest verified working-related activity; the backend returns `latestActivityAt` and `latestActivitySource` from the existing admin clients endpoint
- Activity candidates are customer creation fallback, order/project updates, checkpoint completion when persisted, project messages, update requests, payments, invoices, renewals, and support tickets
- Customer profile `updatedAt` is intentionally not treated as business activity because it is not a reliable working-event source in the current data
- The old `SummaryApi.updateProjectProgress`/`/api/update-project-progress` path remains legacy and is not the new node contract.
- The canonical dynamic node schema/service and migrated-timeline-gated admin node APIs now exist; existing orders remain on legacy timeline version `0` until migration.
- Clicking a client opens `/admin-panel/clients/:customerId`
- Browser history now keeps `dashboard -> clients -> client detail`
- `AdminClientWorkspace` loads customer overview data from the existing customer SSOT APIs
- `AdminClientWorkspace` has `Overview`, `Projects`, `Plans`, and `Payment & Invoices` tabs
- The `Projects` tab now opens a project subpage inside the same workspace, and back returns to the projects list
- The `Plans` tab now opens a plan subpage inside the same workspace, and back returns to the plans list
- The `Payment & Invoices` tab uses existing workspace `transactions` and `invoices` arrays; it does not create a new admin payment source
- The `Payment & Invoices` tab shows payment records as display-only until transaction approve/reject backend routes are verified/completed
- The `Payment & Invoices` tab lets admin mark `unpaid` and `overdue` invoices as paid through `/api/invoices/:invoiceId/mark-paid`
- `AdminClientWorkspace` now has an **`Account & Access`** tab: admin can **view** a client's password (plaintext), **reset** it, and **ban/enable** login (`isActive`). Password viewing needs a plaintext copy because bcrypt is one-way; this is flag-gated (`STORE_PLAIN_PASSWORD`) and reversible. See `47_ADMIN_USER_ACCESS_CONTROL_PASSWORD_AND_LOGIN_BAN.md`.
- `AdminClientWorkspace` now also has a **`Documents`** tab (`ClientDocumentsPanel`, between Payment & Invoices and Account & Access): admin uploads an agreement/document (Google Drive, `.pdf/.doc/.docx`) that lands on `userModel.documents[]` — **works even when the client has no running project** (demo client). The tab also shows the merged newest-first timeline (agreements + the client's converted-lead proposals and follow-up attachments), lazy-loaded via `GET /api/admin/clients/:customerId/documents` when the tab opens. See `50_CLIENT_DOCUMENTS_SYSTEM.md`.
- Project subpages now fetch an admin-only project history bundle from the same order-details source: checkpoint progress, linked checkpoint notes, update requests, file metadata, invoices, and transactions stay in one record view for projects
- Project subpages now show a checkpoint list first, then a checkpoint detail panel with linked notes; project submission and file records are shown below for project-level history
- Customer project details now use the same checkpoint-driven pattern on the customer side and no longer show a separate Recent Updates feed
- Each project/plan row now opens a compact scan-driven delete modal first, then requires all active linked sections to be selected before deletion; missing sections are shown prechecked and disabled
- Admin delete flow uses a shared delete-plan scan helper plus a serialized delete controller so scan and delete stay on the same source of truth
- Admin project and plan subpages reuse the same order details backend with admin access
- Admin project details page now includes a history-following back button in the main header
- Overview cards are populated from orders, plans, invoices, update requests, and wallet balance

## 5. API Notes

- **Admin user access control (new)**: `userModel` now has additive `plainPassword` (display-only, gated by `backend/config/accessControlConfig.STORE_PLAIN_PASSWORD`) and `isActive` (login gate, default `true`). Plaintext is written at signup/convert/self-reset and **backfilled on successful login** for pre-existing users; `userSignIn.js` blocks login when `isActive === false` (checked only after the password matches). Three admin-only endpoints under `/admin/clients/:customerId/*` — `credentials` (view), `reset-password` (hash + plaintext), `account-status` (ban/enable, with self- and admin-account guards) — power the `Account & Access` tab. Login always authenticates against the bcrypt hash; plaintext is never used for auth and is stripped from the login response. Disable later via the flag + `backend/scripts/removePlainPasswords.js`. DB-leak risk of plaintext was an accepted owner decision. See `47_ADMIN_USER_ACCESS_CONTROL_PASSWORD_AND_LOGIN_BAN.md`.
- Login uses the sign-in endpoint from `SummaryApi`
- Customer dashboard reads orders and wallet data from existing API calls
- `OrderPage` reads the full order list from `SummaryApi.ordersList` and renders a purchase-history list with price, purchase date, type, and status
- Wallet balance is not fetched from a separate `/api/wallet/balance` endpoint in the current clean flow
- Wallet transaction history is read from the authenticated `/api/wallet/history` endpoint backed by `transactionModel`; balance remains owned by `userDetails.walletBalance`
- `WalletDetails` uses the full-width customer wallet workspace: balance header, Available Balance/Total Added/Total Spent/Transactions metrics, Wallet Summary, Recent Activity, and full transaction history
- Wallet Summary exposes current balance, credit, debit, and pending amount; transaction history supports All/Credit/Debit/Pending filters, search, and pagination
- Wallet recharge is progressively disclosed through an in-page right-side drawer opened by `Add Money`; the existing UPI QR and verification flow remains inside that drawer
- Admin dashboard fetches clients from `SummaryApi.adminClients`
- `backend/controller/user/getAdminClients.js` powers the admin client list endpoint
- `backend/controller/order/scanDeleteOrder.js` is called by `/api/admin/delete-order/:orderId/scan` for the delete scan step
- `backend/controller/order/scanDeleteOrder.js` handles the admin delete scan response
- `backend/controller/order/deleteOrder.js` handles admin-only project deletion with linked cleanup after checklist confirmation
- `backend/controller/user/getAdminUserWorkspace.js` returns customer orders, transactions, invoices, update requests, plans, and summary data for `AdminClientWorkspace`
- `backend/controller/invoice/monthlyInvoiceController.js` owns admin invoice lifecycle actions for overdue processing and marking invoices paid
- `backend/helpers/invoiceLifecycle.js` is the shared backend helper that pauses plans on overdue invoices and resumes eligible plans on paid invoices
- Payment/invoice admin UI must use existing backend models: `transactionModel`, `monthlyInvoiceModel`, and `orderProductModel`. Do not add a separate admin payment backend.
- Client sorting is read from the same customer backend/database; no separate activity endpoint, activity store, or admin database exists.
- `backend/controller/order/adminCreateProjectOrder.js` (`POST /api/admin/clients/:customerId/create-project`) creates one client-specific project order directly from `AdminClientWorkspace.js`, without creating a catalogue product. Its `projectSnapshot` freezes the category, name, starting node, page count, prices and selected feature details; it then initializes the project's dynamic timeline. See `33_ADMIN_CREATE_PROJECT_FOR_CLIENT.md`.
- Both admin-created and customer-created custom projects use the same `orderProductModel.projectSnapshot` SSOT. Category base price and selected `feature_upgrades` are always re-derived server-side; their name+price are frozen in the order snapshot and `orderItems`, so client work never depends on a hidden duplicate product row.
- **Lead / CRM system (new)**: `backend/models/leadModel.js` is a brand-new collection for prospects who are not yet registered customers — it is never `userModel`. Admin lead controllers live in `backend/controller/lead/` (`createLead`/`getLeads`/`getLeadDetail`/`updateLead`/`globalSearch`/`convertLead`/`uploadProposal`) behind `/api/admin/leads*`, `/api/admin/search`, plus `/api/set-new-password` (`backend/controller/user/setNewPassword.js`, the only password-change endpoint). **Convert** (`convertLead.js`) is the sole place a `userModel` customer is created from a lead — reuses `userSignUp.js`'s bcrypt hashing, sets the universal password `"1234"` + the new additive `userModel.mustResetPassword` flag, and links the lead (`convertedToUserId`, status `Won`, read-only). `userSignIn.js` returns `mustResetPassword`; `postLogin.js` routes a first-login user to `/set-new-password`. Proposals are a **versioned** `proposals[]` array on `leadModel`, uploaded via the existing `GoogleDriveService`. A lead's truth is `leadModel`; a client's is `userModel` (`roles:"customer"`, untouched — `getAdminClients.js` filters by role, so leads never appear in the Clients list). See `43_LEAD_CRM_SYSTEM_PHASE_1_TO_6A.md`. Not built: CSV bulk import, in-app quotation builder, email/WhatsApp send.
- `adminCreateProjectOrder.js` now also creates real invoice records (new `backend/models/invoiceModel.js`, separate from the recurring-only `monthlyInvoiceModel`) — one per installment for partial payment, one for the full amount for one-time payment, itemized via `lineItems` (category base price + each selected feature). `getMyPaymentWorkspace.js`/`getAdminUserWorkspace.js` merge these into their existing `invoices` array, so `OrderDetailPage.js`/`InvoiceDetailPage.js`/the admin Payment & Invoices ledger show real data for these orders instead of the `DUMMY_INVOICES` placeholder — no frontend changes were needed. See `37_NEW_INVOICE_SYSTEM_FOR_ADMIN_CREATED_PROJECTS.md`.
- `CreateProjectForClientForm` (`AdminClientWorkspace.js`) is now a 2-step flow — Project Details, then a "Payment Settings" step where admin either records the first payment immediately (`recordPayment` sent to `adminCreateProjectOrder.js`, which marks the first invoice paid via a new `markProjectInvoicePaid()` helper — not the recurring-plan-only `invoiceLifecycle.js`) or explicitly defers it ("Just Add Project, Let Client Pay the Bill"). `getOrderDetails.js` now returns `hasUnpaidInvoice`/`unpaidInvoice`; `ProjectDetails.js` (customer-side) shows a "Payment Pending" banner and disables "Request Update" while the project's invoice is unpaid. See `38_TWO_STEP_PAYMENT_SETTINGS_AND_PAYMENT_PENDING_LOCK.md`.
- **Client documents (new)**: `userModel` gained an additive `documents[]` array (`clientDocumentSchema` — same Google Drive shape as lead files, plus `source` enum `agreement|general` and optional `orderId`/`nodeId` back-links). The document lives on the **client**, not on an order/node, so a demo client with no running project still has one place to receive an agreement. Three new controllers under `backend/controller/user/`: `uploadClientDocument.js` (`POST /api/admin/clients/:customerId/documents`, admin, `upload.any()` → Drive `ClientDocuments` folder, reuses `GoogleDriveService` exactly like `uploadProposal.js`), `getClientDocuments.js` (`GET /api/my-documents`, customer), `getAdminClientDocuments.js` (`GET /api/admin/clients/:customerId/documents`, admin, lazy tab load). Both read controllers call the shared `backend/helpers/clientDocumentsTimeline.js`, which merges `userModel.documents[]` + the converted lead's proposals and follow-up attachments (linked by `convertedToUserId`) into one **newest-first** timeline — two owners, one view, never duplicated in the DB. All additive; `getAdminUserWorkspace.js`/`convertLead.js`/`uploadProposal.js` untouched. Phase 5 (attach a document during a project-node update) is deferred — schema/controller already accept `nodeId`/`orderId`, but the node UI/controller don't upload files yet. See `50_CLIENT_DOCUMENTS_SYSTEM.md`.
- **Service add-on hybrid payment (new)**: buying one or several add-on services from a project's **Add a Service** modal now accepts **wallet, UPI, or a combination** — it was previously wallet-only, because `transactionModel.orderId`/`.invoiceId` are single refs and `transactionApprovalController.js` settles exactly one order+invoice per transaction, so one UPI payment covering N services would strand N-1 pending. Solved with a **parent-child transaction model**: one **parent** transaction holds the money the admin approves (carrying **no `orderId` and no `invoiceId`**), and one **child** per service carries its own `orderId`/`invoiceId` plus `parentTransactionId` — the exact single-ref shape the approval engine already handles. Approving the parent settles every child through the **unchanged** `applyApprovedOrderPayment` path; a transaction with no children falls through untouched, so all pre-existing payments behave identically. The split is decided **server-side** (`walletPart = min(balance, total)`), with wallet money allocated **sequentially** across services so every share is a whole rupee. Fully wallet-covered ⇒ all services active instantly (no parent created); any UPI remainder ⇒ all services `pending-approval` together, and rejection rejects the whole batch and refunds **every** wallet portion. `createPaymentTransaction` gained an additive `parentTransactionId` param; `transactionModel` gained an index on it. See `58_SERVICE_HYBRID_PAYMENT_PARENT_CHILD.md`.

- **Plan retire / delete lifecycle (new)**: `productModel` gained additive `retiredAt`/`retiredBy` and `archivedAt`/`archivedBy` (all default null). Admin "Remove" on a plan (`retireOrDeletePlan.js`, `DELETE /api/admin/plans/:planId`) counts real orders **server-side** and decides: **0 purchases → hard delete**, **1+ → retire**. Retiring is deliberately **not** the Trash system (which purges after 30 days and would destroy the record a month later) — a retired plan is kept forever. **Remove *is* the disable and Restore *is* the enable**: there is no separate availability switch on the plans page any more, so `isHidden` is driven only by this lifecycle (`reactivatePlan.js` always sets `isHidden = false`; `hideProduct.js`/`unhideProduct.js` reject a retired or archived plan). The Plans page has two tabs — **Active Plans** (status `Active`, action Remove) and **Retired Plans** (status `Disabled`, actions Restore / Delete Forever) — with per-tab filtering, since `?includeRetired=true` returns both sets. **Delete Forever** (`purgePlan.js`, `POST /api/admin/plans/:planId/purge`) is gated on the plan already being retired and has two modes: `archive` (default — sets `archivedAt`, row kept so orders/invoices stay whole, gone from every list) and `hard` (privileged — real `findByIdAndDelete`, additionally requiring the plan's exact name to be retyped). `retiredAt`/`archivedAt` filters were added to `getProduct.js`, `getAllProducts.js` and `getAdminPlanProducts.js`, and the **pre-existing unguarded `DELETE /api/delete-product`** (which did `findByIdAndDelete` with no check at all) now refuses anything with purchases — protecting **all** products, not just plans. **Prerequisite that made this safe**: `orderProductModel.servicePlanSnapshot` gained `serviceName`, and a new shared `getOrderDisplayName()` (`helpers/orderPresentation.js`) reads product → snapshot → `orderItems` → fallback, so an order no longer depends on its catalogue row existing just to render its own name. `backend/scripts/backfillServicePlanSnapshotName.js` filled old orders **from the invoice line, not the product**. See `59_PLAN_RETIRE_SYSTEM_AND_ORDER_SELF_SUFFICIENCY.md`.

- **Signup (audit only — nothing built)**: there is **no customer-facing signup** in the running app. `POST /api/signup` and `SummaryApi.signUP` exist, but there is no signup page, no signup route in `publicRoutes.js`, and no link from `Login.js`; customers are really created by **lead conversion** (`convertLead.js`) and admin client management. The **OTP system exists but is not wired to signup** — `otpUtils.js`, `otpModel.js`, `/verify-otp` (which issues a 365-day cookie) and `/resend-otp` are all present, but `userSignUp.js` contains no OTP code, so nothing ever sends the first one. `userModel` has no `isVerified` field. Also note `userSignUp.js` takes `role` from `req.body`. Whether self-signup is wanted at all is an open business decision. See `61_SIGNUP_SYSTEM_AUDIT_AND_REQUIREMENTS.md`.

- **Trash / soft-delete (new)**: `userModel` and `leadModel` both gained additive `deletedAt` (Date, default null) + `deletedBy` fields. `deletedAt: null` = active/visible exactly as before; a date = the record is in Trash. Deleting a lead (`deleteLead.js`, `DELETE /api/admin/leads/:leadId`) or a client (`trashClient.js`, `POST /api/admin/clients/:customerId/trash`) now soft-deletes instead of removing permanently; a trashed client also has `isActive: false` (login blocked). All lead/client list reads filter `deletedAt: null` (`getLeads.js`, `getAdminClients.js`, both branches of `globalSearch.js`) so trashed records are hidden everywhere. New `backend/controller/trash/` controllers: `getTrash.js` (`GET /api/admin/trash` — **lazy-purges** anything past the 30-day retention when opened, then lists remaining trashed leads+clients badge-tagged with `daysLeft`), `restoreTrash.js` (`POST /api/admin/trash/:type/:id/restore` — clears `deletedAt`, re-enables client login), `purgeTrash.js` (`DELETE /api/admin/trash/:type/:id` — permanent "Delete Forever"). There is **no cron**; permanent deletion is manual + lazy-on-open. Order/project deletion is a separate system and untouched. See `49_TRASH_SYSTEM_SOFT_DELETE.md`.

## 7. Local Dev Note

- Localhost may show `Cookie "user-details" has been rejected for invalid domain` if `REACT_APP_COOKIE_DOMAIN` is set for the production domain.
- In local development, cookie domain should be unset or localhost-safe so cookie writes are accepted.

## 6. What Is Legacy

Do not treat these as current source of truth:

- `AdminDashboardDummy.js`
- old docs describing `/admin-panel/dashboard` as removed
- old docs describing a customer-only system with no admin route
- **any doc describing the public marketing/storefront site, `Home.js`, product browsing (`/product/:id`, `/search`, `CategoryProduct`), the public `Header`/`SharedHeader`/`Footer`, or the old public add-to-cart (`cartProduct`) system as current** — all removed; see `44_PUBLIC_SITE_REMOVAL.md`. These references survive only in historical docs (`28_CART_SYSTEM_AND_ADD_MORE_PAGES.md`, `03_DATA_FLOW_AND_PATTERNS.md`, etc.) as history, not current state.
