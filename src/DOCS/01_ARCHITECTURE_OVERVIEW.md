# Frontend Architecture Overview

This is the current architecture summary for the active frontend code.

## Project Shape

- React app with role-based routing
- Redux for user/session state
- Context for shared runtime values such as wallet, cart count, and active project
- Tailwind for UI
- `SummaryApi` for API endpoint mapping

## Core Entry Flow

1. `src/index.js` boots the React app.
2. `src/App.js` provides online status context.
3. `src/AppContent.js` initializes user session state and shared app context.
4. `src/components/Header.js` selects the correct header for the current role.
5. `src/routes/index.js` builds the route tree from public, customer, and admin route groups.

## Active Route Groups

### Public

- `/` - `RoleBasedHome`
- `/home` - `Home`
- `/login` - `Login`
- `/forgot-password`
- product, search, policy, and contact pages

### Customer

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

### Admin

- `/admin-panel/dashboard` - `AdminDashboard`

## Authentication And Access

- Login is handled by `src/pages/Login.js`
- The current post-login helper is `src/helpers/postLogin.js`
- `postLogin()` writes the user snapshot to Redux, cookies, and local storage
- `ProtectedRoute` guards customer and admin routes
- `customerRoutes` are restricted to `role: customer`
- `adminRoutes` are restricted to `role: admin`

## Header And Shell Layout

- `Header` chooses `CustomerHeader` or `AdminHeader` based on role
- `CustomerHeader` is the customer-facing header
- `AdminHeader` is the admin-facing header
- `DashboardLayout` is the shared customer dashboard shell
- `UserDashboard` is the active customer dashboard page
- `AdminDashboard` is the active admin dashboard page

## Current Notes

- The customer login path currently redirects to `/home`
- The admin dashboard is no longer a dummy page; `AdminDashboard.js` is the active page
- The customer dashboard side panel is the active shell for the current UI direction
- Old admin dummy and landing-page docs are legacy only

