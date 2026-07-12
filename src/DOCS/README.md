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
- Admin dashboard route: `/admin-panel/dashboard`
- Customer header: `CustomerHeader`
- Admin header: `AdminHeader`
- Customer dashboard shell: `DashboardLayout`
- Customer dashboard page: `CustomerDashboard`
- Admin dashboard page: `AdminDashboard`

## Notes

- `Header` is role-based and selects the admin or customer header automatically.
- Login currently uses direct sign-in with `postLogin()` redirecting to `/home`.
- `AdminDashboardDummy.js` is no longer part of the active codebase.
- `CustomerDashboard` is the active customer dashboard page.
