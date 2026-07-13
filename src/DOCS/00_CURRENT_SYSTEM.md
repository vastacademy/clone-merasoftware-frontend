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
- `/project-details/:orderId` now opens a timeline-driven project view where the selected checkpoint shows only its own linked textual details below, and the latest active checkpoint is selected by default
- `/project-details/:orderId` desktop layout now uses three aligned cards with shared row height, inner scroll areas, and no runtime size measuring; the main page bottom spacing is handled on the page container so the footer follows naturally after content

### Admin routes

- `/admin-panel/dashboard` - `AdminDashboard`
- `/admin-panel/clients` - `AdminClientsPage`
- `/admin-panel/clients/:customerId` - `AdminClientWorkspace`

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
- `OrderPage` keeps its header, filters, counts, and order list inside one shared card, matching the Projects and Plans single-box layout
- `CustomerDashboard` is the active customer dashboard launchpad page
- `UserDashboard` remains in the codebase as a legacy reference and is no longer the active dashboard route
- `ProjectsAndPlans` is the active customer project/plan list page
- `OrderPage` is the active customer purchase-history list page
- `OrderDetailPage` remains unchanged and is the order detail surface for a single record
- `AdminDashboard` is the active admin dashboard page
- `AdminLayout` is the shared admin shell used by dashboard, clients, and client detail pages
- `AppContent` now keeps the app outlet content flow natural instead of forcing a viewport min-height, so the footer can sit directly after page content

## 4. Dashboard Behavior

### Customer dashboard

- Main content now lives in `CustomerDashboard`
- Left panel UI comes from `DashboardLayout`
- The dashboard is a launchpad for key customer information and next actions, not a workflow-heavy control panel
- Primary sidebar links prioritize Dashboard, Track Project, and Wallet, with Orders/Profile/Support kept as secondary links; `Start New Project` is currently hidden temporarily from the sidebar but the route still exists
- Wallet balance is treated as a single source of truth from `current_user` / `userDetails`; `AppContent` reads that value and the dashboard does not own a separate wallet fetch
- Dashboard recent items use a row-based list layout with status and progress-only-at-the-far-right presentation

### Admin dashboard

- `AdminDashboard` now shows dashboard summary content only
- `AdminClientsPage` shows the client list as its own route
- It has:
  - fixed desktop sidebar
  - mobile drawer
  - landscape orientation button on mobile
  - dashboard refresh actions

### Admin clients

- `AdminClientsPage` shows the searchable client table
- The table can be sorted by name and last updated
- Clicking a client opens `/admin-panel/clients/:customerId`
- Browser history now keeps `dashboard -> clients -> client detail`
- `AdminClientWorkspace` loads customer overview data from the existing customer SSOT APIs
- `AdminClientWorkspace` has simple `Projects` and `Plans` tabs
- The `Projects` tab now opens a project subpage inside the same workspace, and back returns to the projects list
- The `Plans` tab now opens a plan subpage inside the same workspace, and back returns to the plans list
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
- Admin dashboard fetches clients from `SummaryApi.adminClients`
- `backend/controller/user/getAdminClients.js` powers the admin client list endpoint
- `backend/controller/order/scanDeleteOrder.js` is called by `/api/admin/delete-order/:orderId/scan` for the delete scan step
- `backend/controller/order/scanDeleteOrder.js` handles the admin delete scan response
- `backend/controller/order/deleteOrder.js` handles admin-only project deletion with linked cleanup after checklist confirmation

## 7. Local Dev Note

- Localhost may show `Cookie "user-details" has been rejected for invalid domain` if `REACT_APP_COOKIE_DOMAIN` is set for the production domain.
- In local development, cookie domain should be unset or localhost-safe so cookie writes are accepted.

## 6. What Is Legacy

Do not treat these as current source of truth:

- `AdminDashboardDummy.js`
- old docs describing `/admin-panel/dashboard` as removed
- old docs describing a customer-only system with no admin route
- old homepage cleanup docs that mention deleted landing pages as if they were current
