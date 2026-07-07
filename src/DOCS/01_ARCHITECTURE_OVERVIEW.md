# MeraSoftware - Frontend Architecture Overview

## 🎯 Project Purpose
MeraSoftware is a comprehensive SaaS platform for managing digital services delivery (websites, apps, cloud software development). It handles e-commerce, project management, subscriptions, payments, and multi-role access.

---

## 📊 Technology Stack

### Core Framework
- **React** 19.0.0 - UI library
- **React Router** v7.1.1 - Client-side routing
- **Redux Toolkit** 2.5.0 - State management
- **Redux Persist** - State persistence to localStorage

### Styling & UI
- **Tailwind CSS** 4.0.14 - Utility-first CSS framework
- **React Icons** - Icon library
- **TipTap** - Rich text editor for content creation

### Payment & Transactions
- **Stripe.js** - Payment processing

### Communication
- **Socket.io-client** - Real-time notifications and messaging

### Data & Utilities
- **Moment.js** - Date/time formatting
- **date-fns** - Date utilities
- **js-cookie** - Cookie management
- **jsPDF** - PDF generation
- **html2canvas** - HTML to image conversion
- **React-Select** - Dropdown/select components

### Build & Development
- **React Scripts** 5.0.1 - Build tooling
- **Axios** - HTTP client (if custom configured)

---

## 📁 Directory Structure

```
frontend/src/
├── pages/              (83 page components - main screens)
├── components/         (81 reusable components)
├── store/              (Redux store management)
├── context/            (React context API for shared data)
├── routes/             (React Router configuration)
├── services/           (External API integration)
├── utils/              (Utility functions and helpers)
├── helpers/            (Helper functions for business logic)
├── hooks/              (Custom React hooks)
├── common/             (Constants, API endpoints)
├── assest/             (Static assets, images, logos)
├── App.js              (Root component)
├── App.css             (Global styles)
├── index.js            (React DOM entry point)
└── index.css           (Global CSS)
```

---

## 🔐 Authentication & Authorization

### Entry Flow
1. **App.js** → Root component
   - Creates `OnlineStatusContext` for network monitoring
   - Tracks online/offline events
   
2. **index.js** → React DOM initialization
   - Wraps app with Redux Provider
   - Configures React Router
   
3. **AppContent.js** → Main layout component
   - Initializes user authentication
   - Fetches user details from API/localStorage
   - Provides Context with shared app data
   - Conditionally renders Header/Footer based on role

### User Roles
- **Admin** - Full system access
- **Manager** - Project and developer management
- **Developer** - Task and update management
- **Partner** - Customer and commission management
- **User/Customer** - Order placement and tracking

### Session Management
- JWT token stored in httpOnly cookie
- User details cached in Redux + localStorage
- Token validation on every protected route
- Auto-logout on token expiry
- Clear state on logout via Context handler

---

## 🔄 State Management

### Redux Store (`store/store.js`)
**Slice: userSlice**
- `setUserDetails(user)` - Set logged-in user
- `updateWalletBalance(amount)` - Update wallet
- `logout()` - Clear user state
- `initializeState()` - Initialize from localStorage
- `updateUserRole(role)` - Switch user role
- Persists to localStorage via redux-persist

### React Context (`context/index.js`)
**Purpose**: Share data across all pages without prop drilling
- `fetchUserDetails()` - Fetch user data
- `cartProductCount` - Number of items in cart
- `walletBalance` - Current wallet balance
- `activeProject` - Currently active project
- `handleLogout()` - Logout handler

### LocalStorage (`utils/storageService.js`)
**Cache Management** with expiry:
- User details (persistent)
- Wallet balance (30 min)
- Products (30 min)
- Banners (1 hour)
- Categories (24 hours)
- Guest slides (persistent)

---

## 🛣️ Routing Architecture

### Route Categories

#### 1. Public Routes (No Auth Required)
```
/                           → Role-based home redirect
/home                       → Homepage
/login, /staff/login        → Authentication
/forgot-password            → Password recovery
/product/:id                → Product details
/cart                       → Shopping cart
/search                     → Product search
/contact-us                 → Contact form
/terms, /privacy, /cookies  → Policy pages
```

#### 2. Protected Routes (Auth Required)
```
/dashboard                  → User dashboard
/order, /order-detail/:id   → Orders
/profile                    → User profile
/wallet                     → Wallet management
/my-updates                 → Website updates
/my-invoices                → Invoice history
/support                    → Support tickets
```

#### 3. Admin Routes (`/admin-panel/...`)
- dashboard, all-products, all-users, all-category
- admin management, developer management, partner management
- order approval, payment verification
- coupon management, invoice management
- support tickets, admin settings
- renewal management, plan closure

#### 4. Manager Routes (`/manager-panel/...`)
- dashboard, projects, website updates

#### 5. Developer Routes (`/developer-panel/...`)
- assigned updates, update requests

#### 6. Partner Routes (`/partner-panel/...`)
- dashboard, customers, commission history
- first-purchase-list, withdrawal management

---

## 📄 Pages (83 Total)

### User Dashboard Pages
- Home, Login, SignUp, ForgotPassword
- Profile, CompleteProfile
- ProductDetails, CategoryProduct
- Cart, SearchProduct
- OrderPage, AllOrder, OrderDetailPage
- UserDashboard, UserUpdateDashboard
- UserInvoices, ContactSupport
- DirectPayment, InstallmentPayment
- KYCVerification

### Admin Pages (Active: 25+)
**Primary Admin Dashboard**:
- AdminPanel - Main admin container with sidebar navigation
- AdminDashboard - **PRIMARY** dashboard (active in `/admin-panel/dashboard` route)

**Admin Management Sections** (under `/admin-panel/...`):
- AllUsers, AllProducts, AllCategory, AllAds
- AdminProjects, ProjectDetails
- AdminWebsiteUpdates, AdminUpdateRequests
- AdminPaymentVerification, AdminCouponPage
- AdminOrdersPage, AdminTicketsDashboard
- AdminInvoiceManagement, AdminWithdrawalManagement
- PendingRenewals, ClosePlanManagement
- CustomerDetail, UserDetail
- ClientsServices, AdminFileSettings
- KYCVerification

**Unused/Orphaned Pages** (exist but not imported in routes):
- AdminCustomerDashboard.js (abandoned, unused)
- AdminCustomerPortal.js (abandoned, unused)

> Note: AdminCustomerDashboard and AdminCustomerPortal are old versions of admin dashboard. Currently AdminDashboard.js is the only active dashboard page used in production routes.

### Manager Pages
- ManagerPanel, ManagerDashboard, ClientProjects

### Developer Pages
- DeveloperPanel, DeveloperUpdatePanel

### Partner Pages
- PartnerPanel, PartnerDashboard
- PartnerCustomers, BusinessCreated, FirstPurchaseList

---

## 🧩 Components (81 Total)

### Layout Components
- Header - Navigation bar with role-based menu
- Footer - App footer
- DashboardLayout - Admin/manager dashboard layout
- ProtectedRoute - Route wrapper for auth-required pages

### Modal/Dialog Components
- AddAdminModal, AddCustomerModal, AddDeveloperModal
- AddPartnerModal, AddRoleToUserModal
- EditProfileModal, EditUserBasicModal, EditDeveloper
- CreateTicket
- ImagePopup, DisplayImage

### Admin Components
- AdminManagement, DeveloperManagement
- PartnerManagement, ManagerManagement
- CustomerManagement
- AdminProductCard, AdminCategoryCard
- AdminBannerCard, AdminWelcomeCard
- AdminEditProduct, AdminEditCategory
- AdminDeleteProduct, AdminDeleteCategory
- AdminTransactionHistory

### Product Components
- BannerProduct, CategoryList
- CategoryWiseProductDisplay
- ProductCard (multiple variants)
- HorizontalCardProduct, FeatureProductCard

### Feature Components
- RoleBasedHome - Route user to correct dashboard
- ChangeUserRole - Switch between roles
- CartPopup, GuestSlidesForm
- HomeSecondBanner, AnimatedRoutes
- AppConvertingBanner

---

## 🔌 API Integration

### Backend Endpoints (SummaryApi in `common/index.js`)

**Authentication**
- POST `/api/signup` - Register new user
- POST `/api/signin` - Login
- POST `/api/verify-otp`, `/api/resend-otp` - OTP verification
- GET `/api/user-details` - Current user profile
- GET `/api/logout` - Logout

**Products**
- GET `/api/get-product` - All products
- GET `/api/product-details/:id` - Single product
- GET `/api/get-categories` - Category list
- GET `/api/search` - Product search
- POST `/api/filter-product` - Advanced filtering
- GET `/api/compatible-features` - Upgrade options

**Cart**
- POST `/api/addtocart` - Add to cart
- GET `/api/view-card-product` - View cart
- POST `/api/update-cart-product` - Update quantity
- DELETE `/api/delete-cart-product` - Remove from cart
- GET `/api/countAddToCartProduct` - Cart count

**Orders & Payment**
- POST `/api/create-order` - Create order
- GET `/api/order-list`, `/api/all-order` - List orders
- GET `/api/order-details/:id` - Order details
- POST `/api/checkout` - Stripe payment
- POST `/api/wallet/verify-payment` - Verify payment
- POST `/api/validate-coupon` - Coupon validation

**Wallet**
- GET `/api/wallet/balance` - Balance
- GET `/api/wallet/history` - Transaction history
- POST `/api/wallet/add-balance` - Add funds (admin)

**User Operations**
- POST `/api/update-profile` - Update user info
- POST `/api/complete-profile` - Complete KYC
- POST `/api/add-bank-account` - Add bank details
- GET `/api/user-kyc-status` - KYC status

**Updates & Renewals**
- GET `/api/user-update-plans` - Active update plans
- POST `/api/user-request-update` - Submit update request
- POST `/api/create-renewal` - Request renewal
- GET `/api/check-pending-renewal` - Renewal status
- POST `/api/toggle-update-plan` - Activate/deactivate plan

---

## 🎨 Styling & Theme

### Tailwind CSS
- Utility-first approach
- Dark mode support
- Responsive design (mobile-first)
- Custom color palette

### Common Classes
- `container` - Max-width container
- `btn`, `btn-primary`, `btn-secondary` - Button styles
- `card`, `shadow-md` - Card components
- Flexbox utilities for layouts
- Grid for complex layouts

---

## 🪝 Custom Hooks

Located in `src/hooks/`:
- Custom hooks for API calls
- State management helpers
- Context consumption utilities
- Local state abstractions

---

## 🛠️ Utilities (`src/utils/`)

### storageService.js
- Cache management with expiry
- `setCache(key, data, expiryMinutes)`
- `getCache(key)`
- `clearAll()` - Clear on logout
- `clearUserData()` - Selective clearing

### cookieManager.js
- User detail persistence
- Cross-domain cookie support
- Methods: setUserDetails, getUserDetails, clearAll

### getSubdomain.js
- Extracts subdomain for multi-tenant features

### Other Utilities
- formatCurrency - Money formatting
- formatDate - Date formatting
- validateEmail - Email validation
- getInitials - User avatar text

---

## 📡 Data Flow

### Component ↔ Redux ↔ Context ↔ API
```
Component renders
    ↓
Needs data → check Redux store
    ↓
Redux empty → fetch from API (service)
    ↓
API response → store in Redux
    ↓
Also store in localStorage (cache)
    ↓
Component re-renders with data
    ↓
User logs out → clear Redux + localStorage
```

### API Call Pattern
1. Component calls service function
2. Service constructs API request with SummaryApi
3. Sends request with auth token
4. Handles response/error
5. Updates Redux/Context
6. Component re-renders

---

## 🔒 Security Measures

- JWT tokens in httpOnly cookies (XSS protection)
- CORS validation with backend
- Local auth checks before API calls
- User role validation on protected routes
- Sensitive data excluded from localStorage
- Clear session on logout

---

## 📊 Key Features Implemented

1. **Multi-Role Access** - Different dashboards per role
2. **E-Commerce** - Products, cart, checkout, coupons
3. **Project Tracking** - Orders with progress checkpoints
4. **Subscriptions** - Monthly renewable plans with auto-renewal
5. **Wallet System** - Add funds, track balance, transaction history
6. **Payment Options** - Stripe, wallet, combined payment
7. **Update Requests** - Submit website updates with file upload
8. **Invoice Management** - View, download, track invoices
9. **Support Tickets** - Create and track support requests
10. **KYC Verification** - Complete profile with document upload

---

## 🚀 Getting Started

### Setup
```bash
npm install
npm start
```

### Environment Variables (`.env`)
```
REACT_APP_BACKEND_URL=http://localhost:5000
```

### Key Files to Understand First
1. `src/App.js` - Entry point
2. `src/routes/index.js` - All routes
3. `src/store/store.js` - Redux configuration
4. `src/context/index.js` - Shared context
5. `src/common/index.js` - API endpoints
6. `src/pages/Home.js` - Homepage structure

---

## 💡 Next Steps for Development

1. Review the backend documentation (see Backend Architecture Overview)
2. Understand the API contract between frontend and backend
3. Check specific page/component logic when working on features
4. Review Redux patterns used in store/userSlice.js
5. Follow existing patterns when adding new features

