# Component Guide

This guide focuses on the active components that matter most in the current codebase.

## Layout Components

> The old global `Header.js` / `SharedHeader.js` / `CustomerHeader` / `AdminHeader` / `Footer.js` were **removed** with the public site — portal chrome now comes only from `DashboardLayout` / `AdminLayout`. See `44_PUBLIC_SITE_REMOVAL.md`.

### `DashboardLayout.js`

- Shared customer dashboard shell (also hosts the customer cart: `DraftOrderSavedDrawer` + `FloatingCartButton`)
- Left side panel is sticky on desktop; `MobileSidebarDrawer` + `MobileBottomNav` below `lg`
- Primary quick links are Dashboard, Projects and Plans, Start New Project; Orders/Wallet/Games/Profile/Support are secondary ("More")
- Logout confirmation popup is part of this layout
- Customer route page badges are resolved centrally from the current pathname
- Does not change the customer dashboard business logic

### `ProtectedRoute.js`

- Route guard for protected pages
- Redirects unauthenticated users to `/login`
- Enforces role-based access for customer/admin route groups

## Active Pages

### `CustomerDashboard.js`

- Main customer dashboard launchpad page
- Fetches dashboard summary data from the order list source
- Shows key customer info, next actions, wallet snapshot, and the latest 5 projects/plans
- Uses `DashboardLayout` for the shell
- Does not own the wallet source of truth; it reads wallet state from the shared app context/Redux layer
- Recent items use the same row-based list language as `ProjectsAndPlans`, with progress shown only at the far-right row slot

### `ProjectsAndPlans.js`

- Active customer project/plan list page
- Uses a dense row-based list with headers for item, type, status, updated date, and open action
- Project rows show progress only at the far-right end slot
- Plan rows show remaining days or updates in the same far-right placement

### `OrderPage.js`

- Active customer purchase-history list page
- Uses a row-based purchase history layout
- Shows price, purchase date, purchase type, and order status
- Does not show progress percentage or days-left style tracking in the list

### `OrderDetailPage.js`

- Single-order detail page
- Left unchanged while the order list UI was redesigned

### `AdminDashboard.js`

- Main admin dashboard page
- Current active module is `clients`
- Fetches client list from the admin clients endpoint
- Includes mobile sidebar and landscape orientation control

## Important Supporting Components

### `RoleBasedHome.js`

- Public entry router at `/`
- Routes the user to the right starting point based on auth state

### `NotificationBell.js`

- **Unused.** The component file still exists, but the header that rendered it (`SharedHeader.js`) was deleted with the public site — see `44_PUBLIC_SITE_REMOVAL.md`. Backend notification APIs/models were left untouched.
- Was previously used in the customer header, keeping notifications separate from the account dropdown

## Current Working Pattern

- Keep UI shell changes inside `DashboardLayout`/`AdminLayout` or the page shell
- Keep dashboard business logic inside the page component
- Do not move working data fetching into docs-only examples
- Keep wallet balance ownership in `AppContent` + backend `current_user`; avoid duplicate wallet fetches from dashboard pages
- Keep `ProjectsAndPlans` for project/plan tracking and `OrderPage` for purchase history; do not mix those purposes in the same list
- `WalletDetails` follows the customer portal full-width workspace language with a balance header, four wallet metrics, Wallet Summary/Balance view, Recent Activity details, and complete transaction history
- Transaction history provides All/Credit/Debit/Pending filters, text search, and pagination from the existing wallet history response
- `WalletDetails` keeps recharge hidden until `Add Money` is selected; the existing UPI QR and verification flow opens in a right-side drawer without changing the wallet data flow

## Legacy Note

Older admin/customer dashboard variants are no longer active reference points. If you see them in old docs, treat them as historical only.
