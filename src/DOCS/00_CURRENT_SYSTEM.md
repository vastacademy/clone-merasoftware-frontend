# Current System Snapshot

This document describes the active frontend behavior as of the current codebase.

## 1. Authentication Flow

- Login page: `src/pages/Login.js`
- OTP verification page still exists: `src/pages/OtpVerification.js`
- Current direct-login path uses `postLogin()` from `src/helpers/postLogin.js`
- After successful login, the app redirects to `/home`
- `postLogin()` stores user data in Redux, cookies, and local storage

### Current behavior

- Customer login stays in the customer flow and lands on `/home`
- Admin login also returns to the normal app flow after sign-in
- The active route decision is handled by `Header` and protected routes, not by a separate dashboard redirect in login

## 2. Route Map

### Public routes

- `/` - `RoleBasedHome`
- `/home` - `Home`
- `/login` - `Login`
- `/forgot-password`
- `/product/:id`
- `/search`
- policy pages such as `/terms-and-conditions`, `/privacy-policy`, `/cookies-policy`, `/delivery-policy`, `/refund-policy`, `/disclaimers`
- `/contact-us`

### Customer routes

- `/dashboard` - `CustomerDashboard`
- `/order` - `OrderPage`
- `/order-detail/:orderId` - `OrderDetailPage`
- `/project-details/:orderId` - `ProjectDetails`
- `/wallet`
- `/my-updates`
- `/my-invoices`
- `/direct-payment`
- `/support`
- `/installment-payment/:orderId/:installmentNumber`
- `/profile`
- `/support-tickets/:ticketId`
- `/complete-profile`
- `/start-new-project` - `StartNewProject` (UI-only sample project grid; no backend wiring)
- `/start-new-project/:projectId` - `StartNewProjectDetail` (UI-only project detail with a non-functional "Proceed to Payment" button; no backend wiring)
- `/project-details/:orderId` now opens a timeline-driven project view where the selected checkpoint shows only its own linked textual details below, and the latest active checkpoint is selected by default
- `/project-details/:orderId` desktop layout now uses three aligned cards with shared row height, inner scroll areas, and no runtime size measuring; the main page bottom spacing is handled on the page container so the footer follows naturally after content

### Admin routes

- `/admin-panel/dashboard` - `AdminDashboard`
- `/admin-panel/clients` - `AdminClientsPage`
- `/admin-panel/clients/:customerId` - `AdminClientWorkspace`
- `/admin-panel/website-management/projects` - `AdminProjectProductsPage` (UI-only list shell; backend wiring pending)
- `/admin-panel/website-management/projects/add` - `AdminCreateProjectPage` (UI-only add form; backend wiring pending)

### Project product management status

- Admin project-product management now has an active UI-only list route, sidebar entry, and Add Project form route, but no product API is connected yet.
- `AllProducts`, `UploadProduct`, and `AdminEditProduct` remain legacy/unrouted product-management code.
- The active UI direction is the admin main-page `Website Management` section with a `Projects` tab for reusable project-product creation and management.
- `AdminProjectProductsPage` currently matches the Clients page list shell: compact dark header, sort and Add Project controls in the header, full-width search below the header, and a project list empty state. `AdminCreateProjectPage` provides the UI-only form with project name, category, conditional website page count, starting node title, base/selling prices, optional project image, rich description/specifications, Who is it for?, What's Included, and visibility. It does not fetch or save projects.
- `AdminClientsPage` keeps sort and refresh in the dark header while its full-width client search bar is rendered immediately below the header; this is the reference layout for the Projects list UI.
- New project products must store a mandatory Starting Node Title and must not generate predefined future nodes.
- Read `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` for the verified category/field matrix and implementation order.

## 3. Active Layouts

- `Header` selects `AdminHeader` or `CustomerHeader` based on `user.role`
- `CustomerHeader` now uses a profile-first layout with:
  - avatar fallback using first letter
  - hover dropdown on desktop
  - wallet and notification bell kept in the header
  - logout moved into the dropdown
- `AdminHeader` uses the same profile-first pattern with:
  - light header styling
  - hover dropdown on desktop
  - admin panel and logout in the dropdown
- `DashboardLayout` is the active customer dashboard shell
- `DashboardLayout` owns the sidebar page badge; `/projects-and-plans` resolves to `Projects and Plans`
- `DashboardLayout` resolves customer badges for wallet, orders, projects, support, updates, invoices, payments, cart, and profile-completion routes
- `OrderPage` keeps its header, filters, counts, and order list inside one shared card, matching the Projects and Plans single-box layout
- `OrderPage` active filters use the same emerald selection color as `ProjectsAndPlans`
- `CustomerDashboard` is the active customer dashboard launchpad page
- `UserDashboard` remains in the codebase as a legacy reference and is no longer the active dashboard route
- `ProjectsAndPlans` is the active customer project/plan list page
- `OrderPage` is the active customer purchase-history list page
- `OrderDetailPage` remains unchanged and is the order detail surface for a single record
- `AdminDashboard` is the active admin dashboard page
- `AdminLayout` is the shared admin shell used by dashboard, clients, and client detail pages
- `AppContent` now keeps the app outlet content flow natural instead of forcing a viewport min-height, so the footer can sit directly after page content
- `DashboardLayout` and `AdminLayout` sidebars are `sticky` (not `fixed`) inside a `flex items-stretch` row with the content column; this lets the sidebar's background visually extend to match content height instead of being viewport-locked and skipped by the page footer
- `Footer` no longer centers its desktop content with an internal `max-w-7xl`; it now uses the same `mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8` wrapper as `AdminWorkspaceShell`, so footer columns align with the sidebar-adjacent content width on both customer and admin pages instead of centering independently of the sidebar

## 4. Dashboard Behavior

### Customer dashboard

- Main content now lives in `CustomerDashboard`
- Left panel UI comes from `DashboardLayout`
- The dashboard is a launchpad for key customer information and next actions, not a workflow-heavy control panel
- Primary sidebar quick links are Dashboard, Projects and Plans, Start New Project, and Wallet, with Orders/Profile/Support kept as secondary links; the `Start New Project` quick link now points to `/start-new-project` (previously pointed to the public `/home` page before this link existed)
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

### Admin dashboard

- `AdminDashboard` now shows dashboard summary content only
- `AdminClientsPage` shows the client list as its own route
- It has:
  - sticky desktop sidebar (via `AdminLayout`); there is no mobile drawer for this sidebar — below the `lg` breakpoint the sidebar is not rendered at all, and mobile navigation comes only from `SharedHeader`'s own generic mobile nav dropdown
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

## 7. Local Dev Note

- Localhost may show `Cookie "user-details" has been rejected for invalid domain` if `REACT_APP_COOKIE_DOMAIN` is set for the production domain.
- In local development, cookie domain should be unset or localhost-safe so cookie writes are accepted.

## 6. What Is Legacy

Do not treat these as current source of truth:

- `AdminDashboardDummy.js`
- old docs describing `/admin-panel/dashboard` as removed
- old docs describing a customer-only system with no admin route
- old homepage cleanup docs that mention deleted landing pages as if they were current
