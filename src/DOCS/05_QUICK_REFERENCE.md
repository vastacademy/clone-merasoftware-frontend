# Quick Reference

Fast lookup for the current codebase.

## Key Frontend Files

| File | Purpose |
|------|---------|
| `src/App.js` | Online status and app boot |
| `src/AppContent.js` | Session init, context provider, `<Outlet/>` only (no global header/footer) |
| `src/helpers/portalHome.js` | `getPortalHome(role)` — SSOT for post-login/root landing |
| `src/components/DashboardLayout.js` | Customer dashboard shell (hosts the cart) |
| `src/components/AdminLayout.js` | Shared admin shell |
| `src/pages/CustomerDashboard.js` | Active customer dashboard launchpad |
| `src/pages/ProjectsAndPlans.js` | Active project/plan tracking list |
| `src/pages/AdminDashboard.js` | Admin dashboard content |
| `src/pages/AdminClientsPage.js` | Admin client list page |
| `src/pages/AdminClientWorkspace.js` | Admin client detail page |
| `src/pages/OrderPage.js` | Active purchase-history list |
| `src/pages/OrderDetailPage.js` | Single order detail page |
| `src/pages/ProjectDetails.js` | Customer/admin project detail timeline page |
| `src/common/index.js` | API endpoint definitions, including admin delete order |
| `src/pages/Login.js` | Login form |
| `src/helpers/postLogin.js` | Login post-processing and redirect |
| `src/routes/index.js` | Route assembly |
| `src/routes/customerRoutes.js` | Customer route group |
| `src/routes/adminRoutes.js` | Admin route group |
| `src/common/index.js` | API endpoint definitions |

## Current Route Map

### Entry (public site removed — see `44_PUBLIC_SITE_REMOVAL.md`)

- `/` - `RoleBasedHome` (redirects to `/login` or the role's portal home)
- `/login`
- `/unauthorized`

### Customer

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
- `/project-details/:orderId` now uses a fixed desktop three-column shell with equal-height cards, inner timeline/detail scrolling, and page-level bottom breathing room so the footer follows content naturally
- `/order` now uses a purchase-history row list with price, purchase date, type, and status only

### Admin

- `/admin-panel/dashboard`
- `/admin-panel/clients`
- `/admin-panel/clients/:customerId`

## Current Login Flow

1. User submits credentials on `/login`
2. `Login.js` calls the sign-in API
3. `postLogin()` stores user data and redirects via `getPortalHome(role)` (admin → `/admin-panel/dashboard`, customer → `/dashboard`); there is no `/home`
4. Portal chrome comes from `DashboardLayout`/`AdminLayout` (no global header)
5. Protected routes handle access after login

## Current Dashboard Roles

- Customer dashboard work belongs in `CustomerDashboard.js`
- `UserDashboard.js` no longer exists — the customer dashboard is `CustomerDashboard.js` inside `DashboardLayout`
- Customer shell work belongs in `DashboardLayout.js`
- Wallet balance ownership belongs in `AppContent.js` + backend `current_user`
- Do not add a separate dashboard-owned wallet fetch path
- `ProjectsAndPlans.js` owns the project/plan row list, not the order history list
- `OrderPage.js` owns purchase-history list behavior, not progress tracking
- Admin dashboard work belongs in `AdminDashboard.js`
- Admin client list work belongs in `AdminClientsPage.js`
- Admin client list default sorting consumes backend `latestActivityAt`; the endpoint remains `GET /api/admin/clients`
- Admin client activity read logic belongs in `backend/controller/user/getAdminClients.js`; do not add a separate activity endpoint or store
- `ProjectWorkspaceModal.js` and `SummaryApi.updateProjectProgress` are legacy, unreachable node-write references (route was never registered).
- Canonical dynamic node work belongs to `backend/helpers/projectNodeService.js`, `backend/controller/order/projectNodeController.js`, and order-owned timeline fields (`projectRuns`, `projectNodes`, `projectNodeEvents`, `projectTimelineVersion`) in `orderProductModel.js`.
- New admin node APIs are migrated-timeline-gated under `/api/admin/projects/:orderId/nodes...`. Every `isWebsiteProject: true` order (new and pre-existing) is on `projectTimelineVersion: 1` as of the migration in `39_PROJECT_NODE_SYSTEM_PHASE_2_3_DONE_PHASE_4_PENDING.md` — the legacy `checkpoints` schema field/hooks have been removed from `orderProductModel.js`/`productModel.js`. The 4 non-website legacy orders remain on version 0 by design (node system doesn't support their type).
- Admin client detail work belongs in `AdminClientWorkspace.js`
- Admin shell/header work belongs in `AdminLayout.js` (there is no separate `AdminHeader` — removed with the public site)
- Admin `Payment & Invoices` tab work belongs in `AdminClientWorkspace.js`
- Admin payment records in that tab come from `allData.transactions`; do not create a separate admin payment source
- Admin invoice records in that tab come from `allData.invoices`; `Mark Paid` calls `/api/invoices/:invoiceId/mark-paid`
- Payment approve/reject actions should not be wired until active backend transaction approval routes are verified/completed
- Project detail UI work belongs in `ProjectDetails.js`
- Shell flow work belongs to `AppContent.js`, `DashboardLayout.js`, and `AdminLayout.js` (there is no global `Footer` — removed with the public site)
- Admin client overview data should be pulled from the existing customer APIs, not a separate admin DB
- Admin project detail now follows a history-first subpage pattern: checkpoint list, selected checkpoint notes, project submissions, and file metadata all live in the same project subpage
- Customer project detail at `/project-details/:orderId` is checkpoint-driven: the active checkpoint opens by default, timeline clicks update the detail panel, and the old Recent Updates feed is not shown
- New project product creation is planned under admin `Website Management > Projects`; see `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` for the category-specific field contract and approval sequence
- Admin project delete work belongs to the scan endpoint, admin delete controller, and `AdminClientWorkspace.js`
- Admin project and plan details in the workspace should stay as in-page subviews that return to their list tabs
- Customer dashboard quick links now prioritize Dashboard, Track Project, and Wallet; `Start New Project` is temporarily hidden from the customer sidebar
- Localhost cookie warnings usually mean production cookie-domain env values are being reused in dev

## API Files To Check First

- `src/common/index.js` for endpoint names
- `src/helpers/postLogin.js` for login redirect
- `src/routes/customerRoutes.js` for customer access
- `src/routes/adminRoutes.js` for admin access
- `backend/controller/user/getAdminUserWorkspace.js` for admin customer workspace data
- `backend/controller/invoice/monthlyInvoiceController.js` for invoice lifecycle admin actions
- `backend/helpers/invoiceLifecycle.js` for overdue pause and paid resume rules
- `backend/controller/user/getAdminClients.js` for verified working-activity aggregation used by admin client sorting
- `backend/models/orderProductModel.js` for dynamic node fields (`projectNodes`, `projectRuns`, `projectNodeEvents`, `projectTimelineVersion`), project progress, and timestamp middleware — legacy `checkpoints` field/hooks removed
- `backend/routes/index.js` to verify whether a node-progress route is actually active

## Historical Files

A set of older legacy docs (customer-only-role experiment, orphaned-file audits, MVP-conversion history) were deleted in a doc-cleanup session after individual verification that nothing in them described current live code beyond what's already in `00_CURRENT_SYSTEM.md`/`README.md`. Full copies are kept at `frontend/src/DOCS/deleted-legacy-docs-backup/` if old context is ever needed.
