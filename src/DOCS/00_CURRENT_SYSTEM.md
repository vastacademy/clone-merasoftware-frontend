# Current System Snapshot

This document describes the active frontend behavior as of the current codebase.

## 1. Authentication Flow

- Login page: `src/pages/Login.js`
- OTP verification page still exists: `src/pages/OtpVerification.js`
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
- `/plan-details/:orderId` - `PlanDetails` (plan/`website_updates` orders; new page, live-wired to `GET /api/order-details/:orderId` + `GET /api/get-update-requests`; see `20_PLAN_SYSTEM_AND_PLAN_DETAILS_PAGE.md`)
- `/wallet`
- `/my-updates`
- `/my-invoices`
- `/direct-payment`
- `/support`
- `/installment-payment/:orderId/:installmentNumber`
- `/profile`
- `/support-tickets/:ticketId`
- `/complete-profile`
- `/start-new-project` - `StartNewProject` (live-wired project/plan list, `GET /api/get-product`)
- `/start-new-project/:projectId` - `StartNewProjectDetail` (project detail; "Add to Cart" adds to the customer Cart drawer — see `28_CART_SYSTEM_AND_ADD_MORE_PAGES.md`; no order/payment backend wiring yet)
- `/project-details/:orderId` now opens a timeline-driven project view where the selected checkpoint shows only its own linked textual details below, and the latest active checkpoint is selected by default
- `/project-details/:orderId` desktop layout now uses three aligned cards with shared row height, inner scroll areas, and no runtime size measuring; the main page bottom spacing is handled on the page container so the footer follows naturally after content

### Admin routes

- `/admin-panel/dashboard` - `AdminDashboard`
- `/admin-panel/leads` - `AdminLeadsPage` (Lead/CRM list; prospects before they become customers — new `leadModel`; add-lead modal, phone required. See `43_LEAD_CRM_SYSTEM_PHASE_1_TO_6A.md`)
- `/admin-panel/leads/:leadId` - `AdminLeadDetailPage` (pipeline stage, follow-up log, versioned proposal upload, Convert to Client)
- `/admin-panel/clients` - `AdminClientsPage`
- `/admin-panel/clients/:customerId` - `AdminClientWorkspace` (Projects tab now has a working "Create Project for Client" modal + live save — see `33_ADMIN_CREATE_PROJECT_FOR_CLIENT.md`)
- `/admin-panel/website-management/projects` - `AdminProjectProductsPage` (UI-only list shell; backend wiring pending)
- `/admin-panel/website-management/projects/add` - `AdminCreateProjectPage` (UI-only add form; backend wiring pending)
- `/admin-panel/project-setup/base-price` - `AdminCategoryBasePricePage` (manage fixed base price per project category; used by "Create Project for Client")
- `/admin-panel/project-setup/features` - `AdminFeatureProductsPage` (list/create/edit/delete `feature_upgrades`-category products; reuses the pre-existing generic `uploadProduct`/`updateProduct`/`deleteProduct` endpoints)

### Project product management status

- Admin project-product management now has an active UI-only list route, sidebar entry, and Add Project form route, but no product API is connected yet.
- `AllProducts`, `UploadProduct`, and `AdminEditProduct` remain legacy/unrouted product-management code.
- The active UI direction is the admin main-page `Website Management` section with a `Projects` tab for reusable project-product creation and management.
- `AdminProjectProductsPage` currently matches the Clients page list shell: compact dark header, sort and Add Project controls in the header, full-width search below the header, and a project list empty state. `AdminCreateProjectPage` provides the form with project name, starting node title, total pages (always visible, not category-conditional), base/selling prices, an Additional Features multi-select (live-wired to `GET /api/get-product` filtered to `feature_upgrades`, no category filtering), rich description/specifications, Who is it for?/What's Included (legacy fixed-dropdown `PackageSelect` + `perfectForOptions.js`/`packageOptions.js` pattern), optional project image, category, and visibility — category is selected last and is classification-only, it does not gate or filter any other field. All fields are wired to local state; it still does not fetch or save projects (no backend save API exists yet). See `17_ADD_PROJECT_FORM_AND_PERFECT_FOR_AUDIT.md`.
- `AdminClientsPage` keeps sort and refresh in the dark header while its full-width client search bar is rendered immediately below the header; this is the reference layout for the Projects list UI.
- New project products must store a mandatory Starting Node Title and must not generate predefined future nodes.
- Read `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` for the verified category/field matrix and implementation order.

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
- Primary sidebar quick links are Dashboard, Projects and Plans, Start New Project, and Wallet, with Orders/Profile/Support kept as secondary links; the `Start New Project` quick link points to `/start-new-project`
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
- Project subpages now fetch an admin-only project history bundle from the same order-details source: checkpoint progress, linked checkpoint notes, update requests, file metadata, invoices, and transactions stay in one record view for projects
- Project subpages now show a checkpoint list first, then a checkpoint detail panel with linked notes; project submission and file records are shown below for project-level history
- Customer project details now use the same checkpoint-driven pattern on the customer side and no longer show a separate Recent Updates feed
- Each project/plan row now opens a compact scan-driven delete modal first, then requires all active linked sections to be selected before deletion; missing sections are shown prechecked and disabled
- Admin delete flow uses a shared delete-plan scan helper plus a serialized delete controller so scan and delete stay on the same source of truth
- Admin project and plan subpages reuse the same order details backend with admin access
- Admin project details page now includes a history-following back button in the main header
- Overview cards are populated from orders, plans, invoices, update requests, and wallet balance

## 5. API Notes

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
- `backend/controller/order/adminCreateProjectOrder.js` (`POST /api/admin/clients/:customerId/create-project`) creates an immediately-active project order for one client directly from `AdminClientWorkspace.js`, bypassing the catalog/purchase flow entirely — it creates a small `isHidden: true` + `isCustomClientProject: true` product behind the scenes and is the first caller of `initializeProjectTimeline`. Does not reuse `createOrder.js`/`DirectPayment.js` by design (public-storefront-removal-safe). See `33_ADMIN_CREATE_PROJECT_FOR_CLIENT.md`.
- `adminCreateProjectOrder.js` no longer accepts `serviceName`/`price`/`additionalFeatures` from the client. It derives `serviceName` from category and re-fetches base price from a new `categoryBasePriceModel` collection (`GET/POST /api/admin/category-base-prices`). Selected features are still the existing `feature_upgrades`-category `productModel` products (unchanged source) — the controller now re-fetches each requested feature ID filtered to `category: 'feature_upgrades'` and re-derives its real price server-side, instead of trusting the client-submitted name/price. `productModel.js`'s new `clientProjectFeatures` field stores a name+price snapshot per selected feature (`ref: 'product'`). See `35_CATEGORY_BASE_PRICE_AND_PROJECT_FEATURES_SYSTEM.md`.
- **Lead / CRM system (new)**: `backend/models/leadModel.js` is a brand-new collection for prospects who are not yet registered customers — it is never `userModel`. Admin lead controllers live in `backend/controller/lead/` (`createLead`/`getLeads`/`getLeadDetail`/`updateLead`/`globalSearch`/`convertLead`/`uploadProposal`) behind `/api/admin/leads*`, `/api/admin/search`, plus `/api/set-new-password` (`backend/controller/user/setNewPassword.js`, the only password-change endpoint). **Convert** (`convertLead.js`) is the sole place a `userModel` customer is created from a lead — reuses `userSignUp.js`'s bcrypt hashing, sets the universal password `"1234"` + the new additive `userModel.mustResetPassword` flag, and links the lead (`convertedToUserId`, status `Won`, read-only). `userSignIn.js` returns `mustResetPassword`; `postLogin.js` routes a first-login user to `/set-new-password`. Proposals are a **versioned** `proposals[]` array on `leadModel`, uploaded via the existing `GoogleDriveService`. A lead's truth is `leadModel`; a client's is `userModel` (`roles:"customer"`, untouched — `getAdminClients.js` filters by role, so leads never appear in the Clients list). See `43_LEAD_CRM_SYSTEM_PHASE_1_TO_6A.md`. Not built: CSV bulk import, in-app quotation builder, email/WhatsApp send.
- `adminCreateProjectOrder.js` now also creates real invoice records (new `backend/models/invoiceModel.js`, separate from the recurring-only `monthlyInvoiceModel`) — one per installment for partial payment, one for the full amount for one-time payment, itemized via `lineItems` (category base price + each selected feature). `getMyPaymentWorkspace.js`/`getAdminUserWorkspace.js` merge these into their existing `invoices` array, so `OrderDetailPage.js`/`InvoiceDetailPage.js`/the admin Payment & Invoices ledger show real data for these orders instead of the `DUMMY_INVOICES` placeholder — no frontend changes were needed. See `37_NEW_INVOICE_SYSTEM_FOR_ADMIN_CREATED_PROJECTS.md`.
- `CreateProjectForClientForm` (`AdminClientWorkspace.js`) is now a 2-step flow — Project Details, then a "Payment Settings" step where admin either records the first payment immediately (`recordPayment` sent to `adminCreateProjectOrder.js`, which marks the first invoice paid via a new `markProjectInvoicePaid()` helper — not the recurring-plan-only `invoiceLifecycle.js`) or explicitly defers it ("Just Add Project, Let Client Pay the Bill"). `getOrderDetails.js` now returns `hasUnpaidInvoice`/`unpaidInvoice`; `ProjectDetails.js` (customer-side) shows a "Payment Pending" banner and disables "Request Update" while the project's invoice is unpaid. See `38_TWO_STEP_PAYMENT_SETTINGS_AND_PAYMENT_PENDING_LOCK.md`.

## 7. Local Dev Note

- Localhost may show `Cookie "user-details" has been rejected for invalid domain` if `REACT_APP_COOKIE_DOMAIN` is set for the production domain.
- In local development, cookie domain should be unset or localhost-safe so cookie writes are accepted.

## 6. What Is Legacy

Do not treat these as current source of truth:

- `AdminDashboardDummy.js`
- old docs describing `/admin-panel/dashboard` as removed
- old docs describing a customer-only system with no admin route
- **any doc describing the public marketing/storefront site, `Home.js`, product browsing (`/product/:id`, `/search`, `CategoryProduct`), the public `Header`/`SharedHeader`/`Footer`, or the old public add-to-cart (`cartProduct`) system as current** — all removed; see `44_PUBLIC_SITE_REMOVAL.md`. These references survive only in historical docs (`28_CART_SYSTEM_AND_ADD_MORE_PAGES.md`, `03_DATA_FLOW_AND_PATTERNS.md`, etc.) as history, not current state.
