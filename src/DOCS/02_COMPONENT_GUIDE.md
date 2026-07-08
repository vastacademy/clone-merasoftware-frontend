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
- Drawer behavior is handled on the page shell where needed
- Logout confirmation popup is part of this layout
- Does not change the customer dashboard business logic

### `ProtectedRoute.js`

- Route guard for protected pages
- Redirects unauthenticated users to `/login`
- Enforces role-based access for customer/admin route groups

## Active Pages

### `UserDashboard.js`

- Main customer dashboard content page
- Fetches and displays customer orders and plan state
- Uses `DashboardLayout` for the shell

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

## Legacy Note

Older admin/customer dashboard variants are no longer active reference points. If you see them in old docs, treat them as historical only.

