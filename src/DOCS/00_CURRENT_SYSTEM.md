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

- `/dashboard` - `UserDashboard`
- `/order`
- `/order-detail/:orderId`
- `/project-details/:orderId`
- `/wallet`
- `/my-updates`
- `/my-invoices`
- `/direct-payment`
- `/support`
- `/installment-payment/:orderId/:installmentNumber`
- `/profile`
- `/support-tickets/:ticketId`
- `/complete-profile`

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
- `UserDashboard` is the active customer dashboard content page
- `AdminDashboard` is the active admin dashboard page
- `AdminLayout` is the shared admin shell used by dashboard, clients, and client detail pages

## 4. Dashboard Behavior

### Customer dashboard

- Main content remains in `UserDashboard`
- Left panel UI comes from `DashboardLayout`
- The customer shell is visual-only and does not change the working content logic

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
- Each project/plan row also has an admin delete action that permanently removes the order record and linked workspace data
- Admin project and plan subpages reuse the same order details backend with admin access
- Admin project details page now includes a history-following back button in the main header
- Overview cards are populated from orders, plans, invoices, update requests, and wallet balance

## 5. API Notes

- Login uses the sign-in endpoint from `SummaryApi`
- Customer dashboard reads orders and wallet data from existing API calls
- Admin dashboard fetches clients from `SummaryApi.adminClients`
- `backend/controller/user/getAdminClients.js` powers the admin client list endpoint
- `backend/controller/order/deleteOrder.js` handles admin-only project deletion with linked cleanup

## 6. What Is Legacy

Do not treat these as current source of truth:

- `AdminDashboardDummy.js`
- old docs describing `/admin-panel/dashboard` as removed
- old docs describing a customer-only system with no admin route
- old homepage cleanup docs that mention deleted landing pages as if they were current
