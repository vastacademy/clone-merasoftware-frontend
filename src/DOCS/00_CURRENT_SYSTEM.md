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

## 4. Dashboard Behavior

### Customer dashboard

- Main content remains in `UserDashboard`
- Left panel UI comes from `DashboardLayout`
- The customer shell is visual-only and does not change the working content logic

### Admin dashboard

- `AdminDashboard` currently shows the client list as the active module
- It has:
  - fixed desktop sidebar
  - mobile drawer
  - landscape orientation button on mobile
  - client search and refresh actions

## 5. API Notes

- Login uses the sign-in endpoint from `SummaryApi`
- Customer dashboard reads orders and wallet data from existing API calls
- Admin dashboard fetches clients from `SummaryApi.adminClients`
- `backend/controller/user/getAdminClients.js` powers the admin client list endpoint

## 6. What Is Legacy

Do not treat these as current source of truth:

- `AdminDashboardDummy.js`
- old docs describing `/admin-panel/dashboard` as removed
- old docs describing a customer-only system with no admin route
- old homepage cleanup docs that mention deleted landing pages as if they were current

