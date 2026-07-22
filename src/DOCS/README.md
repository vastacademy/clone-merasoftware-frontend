# MeraSoftware Documentation Index

This folder is split into two groups:

- Active reference docs for the current codebase.
- Legacy docs kept for historical context only.

If you are trying to understand the app as it works today, start with `00_CURRENT_SYSTEM.md`.

## Active Docs

### `00_CURRENT_SYSTEM.md`
Current source of truth for routes, dashboards, headers, and login flow.

### `01_ARCHITECTURE_OVERVIEW.md`
Current frontend architecture, route layout, auth flow, and active shell components.

### `02_COMPONENT_GUIDE.md`
Current component guide for the active header, dashboard, and layout components.

### `03_DATA_FLOW_AND_PATTERNS.md`
State, API, and caching patterns used by the app.

### `04_BACKEND_OVERVIEW.md`
Backend structure, routes, models, and helpers.

### `05_QUICK_REFERENCE.md`
Fast lookup for files, routes, and common development tasks.

### `12_CLIENT_ACTIVITY_SORT_AUDIT.md`
Current audit and implementation routing for admin client working-activity sorting and the pending node-update write path.

### `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md`
Verified project categories, product fields, customer purchase flow, admin `Website Management > Projects` UI scaffold, approval integration, and regression guardrails.

### `14_CODEBASE_AUDIT_INDEX.md`
Central AI handoff index containing the audited route/file/model map, real database evidence, current implementation state, pending work, and regression boundaries.

### `15_START_NEW_PROJECT_UI_HISTORY.md`
Current `/start-new-project` list-row UI (now live-wired to real product data via `/api/get-product` and `/api/product-details`), the shared `CustomerWorkspaceTabs` underline-tab component now used across the customer portal, named backup folders with restore instructions, rejected/reverted approaches, and the related sidebar/footer layout fix.

## Legacy Docs

These files are historical snapshots. Read them only if you need old context:

- `06_CODE_AUDIT_FINDINGS.md`
- `07_CUSTOMER_HOMEPAGES_ANALYSIS.md`
- `08_HOMEPAGE_CLEANUP_COMPLETE.md`
- `09_MVP_CONVERSION_COMPLETE.md`
- `10_CUSTOMER_ONLY_LOGIN_SYSTEM.md`
- `11_ADMIN_LOGIN_IMPLEMENTATION.md`
- `UPDATES_SUMMARY.md`

## Current High-Level Map

- Public entry: `/` uses `RoleBasedHome`
- Customer home: `/home`
- Login: `/login`
- Customer dashboard route: `/dashboard`
- Customer purchase-history route: `/order`
- Admin dashboard route: `/admin-panel/dashboard`
- Customer header: `CustomerHeader`
- Admin header: `AdminHeader`
- Customer dashboard shell: `DashboardLayout`
- Customer dashboard page: `CustomerDashboard`
- Customer project/plan list page: `ProjectsAndPlans`
- Customer order detail page: `OrderDetailPage`
- Customer purchase-history list page: `OrderPage`
- Admin dashboard page: `AdminDashboard`
- Admin project-product UI route: `/admin-panel/website-management/projects` (`AdminProjectProductsPage`); list UI is active, API wiring is pending
- Admin client list sorting source: existing `GET /api/admin/clients` response field `latestActivityAt`
- Node update status: canonical dynamic node schema/service and migrated-timeline-gated admin APIs exist; existing orders remain legacy until migration. Read `admin-nodes.md` and `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` before extending the flow
- New project creation direction: admin `Website Management > Projects` now has the Clients-style list UI and an active UI-only Add Project form at `/admin-panel/website-management/projects/add`; the form has no backend save/API wiring yet. Read `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` before extending it
- Full audit handoff: read `14_CODEBASE_AUDIT_INDEX.md` first when resuming work in a new chat or by another AI

## Notes

- `Header` is role-based and selects the admin or customer header automatically.
- Login currently uses direct sign-in with `postLogin()` redirecting to `/home`.
- `AdminDashboardDummy.js` is no longer part of the active codebase.
- `CustomerDashboard` is the active customer dashboard page.
- `ProjectsAndPlans` is the active project and plan tracking list.
- `OrderPage` is the active purchase-history list and should not be used for progress tracking.
- The customer sidebar `Start New Project` quick link is visible and points to `/start-new-project` (`StartNewProject` list page and `StartNewProjectDetail` detail page). `StartNewProject` is live-wired to real product data (`GET /api/get-product`, filtered to project categories only); `StartNewProjectDetail` fetches a single product via `POST /api/product-details` but remains otherwise UI-only (no "Proceed to Payment" handler). See `15_START_NEW_PROJECT_UI_HISTORY.md`.
- `frontend/src/components/CustomerWorkspaceTabs.js` is a shared underline-style tab component (mirrors admin's `AdminWorkspaceTabs.js`) used by `StartNewProject`, `ProjectsAndPlans`, `OrderPage`, and `UserInvoices`, replacing the earlier pill-style tab buttons on all four pages.
- `DashboardLayout` and `AdminLayout` sidebars use `sticky` positioning inside a flex row with the content column (not `position: fixed`), so the page footer runs full-width below both the sidebar and the content instead of only following content height.
