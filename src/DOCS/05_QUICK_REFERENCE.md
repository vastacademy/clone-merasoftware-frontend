# Quick Reference

Fast lookup for the current codebase.

## Key Frontend Files

| File | Purpose |
|------|---------|
| `src/App.js` | Online status and app boot |
| `src/AppContent.js` | Session init, context provider, shared shell |
| `src/components/Header.js` | Role-based header selector |
| `src/components/AdminHeader.js` | Admin header UI |
| `src/components/CustomerHeader.js` | Customer header UI |
| `src/components/DashboardLayout.js` | Customer dashboard shell |
| `src/components/AdminLayout.js` | Shared admin shell |
| `src/components/Footer.js` | Global footer |
| `src/pages/CustomerDashboard.js` | Active customer dashboard launchpad |
| `src/pages/UserDashboard.js` | Legacy customer dashboard content |
| `src/pages/AdminDashboard.js` | Admin dashboard content |
| `src/pages/AdminClientsPage.js` | Admin client list page |
| `src/pages/AdminClientWorkspace.js` | Admin client detail page |
| `src/pages/ProjectDetails.js` | Customer/admin project detail timeline page |
| `src/common/index.js` | API endpoint definitions, including admin delete order |
| `src/pages/Login.js` | Login form |
| `src/helpers/postLogin.js` | Login post-processing and redirect |
| `src/routes/index.js` | Route assembly |
| `src/routes/customerRoutes.js` | Customer route group |
| `src/routes/adminRoutes.js` | Admin route group |
| `src/common/index.js` | API endpoint definitions |

## Current Route Map

### Public

- `/` - `RoleBasedHome`
- `/home`
- `/login`
- `/forgot-password`
- `/product/:id`
- `/search`
- policy pages
- `/contact-us`

### Customer

- `/dashboard`
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
- `/project-details/:orderId` now uses a fixed desktop three-column shell with equal-height cards, inner timeline/detail scrolling, and page-level bottom breathing room so the footer follows content naturally

### Admin

- `/admin-panel/dashboard`
- `/admin-panel/clients`
- `/admin-panel/clients/:customerId`

## Current Login Flow

1. User submits credentials on `/login`
2. `Login.js` calls the sign-in API
3. `postLogin()` stores user data and redirects to `/home`
4. `Header` picks the correct header based on role
5. Protected routes handle access after login

## Current Dashboard Roles

- Customer dashboard work belongs in `CustomerDashboard.js`
- `UserDashboard.js` is legacy and should not be extended for the current dashboard experience
- Customer shell work belongs in `DashboardLayout.js`
- Wallet balance ownership belongs in `AppContent.js` + backend `current_user`
- Do not add a separate dashboard-owned wallet fetch path
- Admin dashboard work belongs in `AdminDashboard.js`
- Admin client list work belongs in `AdminClientsPage.js`
- Admin client detail work belongs in `AdminClientWorkspace.js`
- Admin shell work belongs in `AdminLayout.js`
- Admin header work belongs in `AdminHeader.js`
- Project detail UI work belongs in `ProjectDetails.js`
- Footer spacing and shell flow work belong to `AppContent.js`, `DashboardLayout.js`, and `Footer.js`
- Admin client overview data should be pulled from the existing customer APIs, not a separate admin DB
- Admin project detail now follows a history-first subpage pattern: checkpoint list, selected checkpoint notes, project submissions, and file metadata all live in the same project subpage
- Customer project detail at `/project-details/:orderId` is checkpoint-driven: the active checkpoint opens by default, timeline clicks update the detail panel, and the old Recent Updates feed is not shown
- Admin project delete work belongs to the scan endpoint, admin delete controller, and `AdminClientWorkspace.js`
- Admin project and plan details in the workspace should stay as in-page subviews that return to their list tabs
- Customer dashboard quick links now prioritize Dashboard, Track Project, Start New Project, and Wallet
- Localhost cookie warnings usually mean production cookie-domain env values are being reused in dev

## API Files To Check First

- `src/common/index.js` for endpoint names
- `src/helpers/postLogin.js` for login redirect
- `src/routes/customerRoutes.js` for customer access
- `src/routes/adminRoutes.js` for admin access

## Historical Files

Older docs such as `06_CODE_AUDIT_FINDINGS.md`, `10_CUSTOMER_ONLY_LOGIN_SYSTEM.md`, and `11_ADMIN_LOGIN_IMPLEMENTATION.md` are legacy references. Use them only for history, not as current behavior.
