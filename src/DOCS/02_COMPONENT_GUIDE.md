# Component Guide

This guide focuses on the active components that matter most in the current codebase.

## Layout Components

### `Header.js`

- Role-based header switcher
- Renders `AdminHeader` for admin users
- Renders `CustomerHeader` for everyone else

### `CustomerHeader.js`

- Customer-facing header
- Profile-first avatar with first-letter fallback
- Hover dropdown on desktop
- Wallet amount and notification bell stay in the header
- Logout lives in the profile dropdown

### `AdminHeader.js`

- Admin-facing header
- Light header styling
- Profile avatar with first-letter fallback
- Hover dropdown on desktop
- Dropdown contains admin panel access and logout

### `DashboardLayout.js`

- Shared customer dashboard shell
- Left side panel is fixed on desktop
- Primary quick links are dashboard, track project, and wallet
- Orders, profile, and support remain as secondary links
- `Start New Project` is temporarily hidden from the sidebar, but the `/home` route still exists
- Logout confirmation popup is part of this layout
- Customer route page badges are resolved centrally from the current pathname, including updates, invoices, payments, cart, support tickets, and profile completion
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

### `UserDashboard.js`

- Legacy customer dashboard page
- Kept in the codebase for reference only

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

- Used in the customer header
- Keeps notifications separate from the account dropdown

### `LoginPopup.js`

- Used when protected navigation needs login

## Current Working Pattern

- Keep UI shell changes inside `Header`, `DashboardLayout`, or the page shell
- Keep dashboard business logic inside the page component
- Do not move working data fetching into docs-only examples
- Keep wallet balance ownership in `AppContent` + backend `current_user`; avoid duplicate wallet fetches from dashboard pages
- Keep `ProjectsAndPlans` for project/plan tracking and `OrderPage` for purchase history; do not mix those purposes in the same list
- `WalletDetails` follows the customer portal full-width workspace language with a balance header, four wallet metrics, Wallet Summary/Balance view, Recent Activity details, and complete transaction history
- Transaction history provides All/Credit/Debit/Pending filters, text search, and pagination from the existing wallet history response
- `WalletDetails` keeps recharge hidden until `Add Money` is selected; the existing UPI QR and verification flow opens in a right-side drawer without changing the wallet data flow

## Legacy Note

Older admin/customer dashboard variants are no longer active reference points. If you see them in old docs, treat them as historical only.
