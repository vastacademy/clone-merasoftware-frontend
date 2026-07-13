# MeraSoftware - Data Flow & Integration Patterns

## 🔄 Complete Data Flow Architecture

This guide explains how data flows through the application from frontend to backend and back.

---

## 📡 Three-Layer State Management

### Layer 1: Redux Store (Persistent Global State)
**File**: `store/store.js` + `store/userSlice.js`

**Purpose**: Store user-related data that persists across page navigation

**State Shape**:
```javascript
{
  user: {
    userDetails: {
      _id: "user123",
      email: "user@example.com",
      name: "John Doe",
      roles: ["customer"],
      walletBalance: 5000
    },
    isLoading: false,
    error: null
  }
}
```

**Actions**:
- `setUserDetails(user)` - Login successful, store user
- `updateWalletBalance(amount)` - Update wallet amount
- `logout()` - Clear user data
- `initializeState()` - Load from localStorage on app start
- `updateUserRole(role)` - Change active role

**Persistence**: Uses redux-persist to save to localStorage
- Survives page refresh
- Cleared on logout
- Auto-loaded on app restart

**Current wallet SSOT note**:
- `walletBalance` is initialized from the authenticated user snapshot
- The clean source of truth is backend `current_user` / `userDetails`
- Do not treat `/api/wallet/balance` as a required frontend dependency unless backend adds it explicitly

### Layer 2: React Context (Shared App Data)
**File**: `context/index.js`

**Purpose**: Share frequently-used data without Redux (lighter weight)

**Context Value**:
```javascript
{
  fetchUserDetails: () => Promise,
  cartProductCount: 5,
  walletBalance: 5000,
  activeProject: null,
  handleLogout: () => void,
  onlineStatus: true/false
}
```

**Providers**:
- **App.js**: OnlineStatusContext (monitors internet connection)
- **AppContent.js**: Main context with user data and methods

**Usage Pattern**:
```jsx
import { useContext } from 'react'
import { Context } from '../context'

function MyComponent() {
  const { cartProductCount, walletBalance } = useContext(Context)
  return <div>{cartProductCount} items, ₹{walletBalance}</div>
}
```

### Layer 3: LocalStorage (Persistent Cache)
**File**: `utils/storageService.js`

**Purpose**: Cache data with expiry to reduce API calls

**Cache Items**:
| Key | Expiry | Purpose |
|-----|--------|---------|
| userDetails | persistent | User profile data |
| walletBalance | 30 min | Current wallet amount |
| productsList | 30 min | All products |
| bannersList | 1 hour | Promotional banners |
| categories | 24 hours | Product categories |
| guestSlides | persistent | Welcome content |

**Methods**:
```javascript
// Set with expiry
storageService.setCache('key', data, 30) // 30 minutes

// Get (null if expired)
const data = storageService.getCache('key')

// Clear specific item
storageService.removeItem('key')

// Clear all (on logout)
storageService.clearAll()
```

**Cache Flow**:
```
Component needs data
    ↓
Check Redux store
    ↓
If empty, check localStorage
    ↓
If expired, make API call
    ↓
Store result in Redux + localStorage
    ↓
Component uses data
```

### Wallet SSOT Rules

- One source of truth: backend user record `walletBalance`
- One read path: `current_user` / `userDetails`
- One UI consumer: `AppContent` shared context and Redux
- No dashboard-specific wallet fetch should be added in `CustomerDashboard`
- If a separate wallet endpoint exists later, it must replace, not duplicate, the user snapshot source
- Wallet history is a separate read-only transaction view from `/api/wallet/history`; it must never be used to recalculate or overwrite `walletBalance`

### List Surface Contracts

- `CustomerDashboard` recent items are a compact preview of the latest 5 project/plan records
- `ProjectsAndPlans` is the full project/plan tracking list and keeps progress at the far-right row slot
- `OrderPage` is the purchase-history list and shows price, purchase date, type, and order status only
- `OrderDetailPage` remains the single-record detail surface and is not part of the row-list contract
- Do not copy project-tracking fields such as percentage, days left, or updates left into `OrderPage`
- Do not copy purchase-only fields such as price into `CustomerDashboard` or `ProjectsAndPlans` unless they are intentionally part of that surface

---

## 🔌 API Integration Pattern

### SummaryApi Object (API Endpoints)
**File**: `common/index.js`

**Structure**:
```javascript
const SummaryApi = {
  // Each endpoint defined as object with method and url
  signup: {
    method: "post",
    url: `/api/signup`
  },
  getUserDetails: {
    method: "get",
    url: `/api/user-details`
  },
  addToCart: {
    method: "post",
    url: `/api/addtocart`
  },
  // ... 100+ endpoints
}

export default SummaryApi
```

**Benefits**:
- Centralized endpoint definitions
- Easy to find all APIs
- Consistent structure
- Simple refactoring (change URL once)

**Wallet flow in the current cleaned architecture**:
1. App init verifies session through `current_user`
2. Backend returns `walletBalance` with the user snapshot
3. `AppContent` writes wallet balance to Redux + local cache
4. Customer dashboard reads the shared wallet state
5. Wallet-changing actions update backend first, then refresh the shared snapshot

### Making API Calls (Fetch Pattern)

**Basic Pattern**:
```javascript
// In component or service
const response = await fetch(SummaryApi.getProduct.url, {
  method: SummaryApi.getProduct.method.toUpperCase(),
  credentials: 'include',  // Send cookies (important!)
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data) // For POST/PUT
})

const result = await response.json()

if (result.success) {
  // Update Redux/Context with result.data
} else {
  // Show error: result.message
}
```

**With Error Handling**:
```javascript
try {
  const response = await fetch(endpoint.url, {
    method: endpoint.method.toUpperCase(),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined
  })
  
  const result = await response.json()
  
  if (result.success) {
    return result.data
  } else {
    throw new Error(result.message)
  }
} catch (error) {
  console.error('API Error:', error)
  // Show toast to user
  return null
}
```

### Authentication (Token & Cookies)

**JWT Token Flow**:
1. User logs in → POST `/api/signin`
2. Backend returns JWT in httpOnly cookie
3. Frontend sends `credentials: 'include'` with every request
4. Cookie automatically attached by browser
5. Backend validates JWT in auth middleware
6. Unauthorized → 401 response → Frontend redirects to login

**Security**:
- httpOnly cookies prevent JavaScript access (XSS protection)
- Secure flag ensures HTTPS only
- SameSite restriction prevents CSRF
- Token expires after 365 days
- Clear cookies on logout

### Admin Delete Flow

**Current pattern**:
1. Admin clicks delete in `AdminClientWorkspace`
2. Frontend calls the delete scan endpoint first
3. Backend returns the active linked sections and any already-missing sections
4. Admin checks every active section in the modal
5. Final delete request sends the checked section list back to backend
6. Backend validates the same scan plan again, then deletes linked records in a serialized order
7. Frontend clears the affected customer's cached order list
8. UI removes the project only after the backend confirms full success

**Why this matters**:
- It avoids partial deletes being treated as success
- It keeps scan and delete on the same SSOT path
- Dead/corrupt records can still be scanned and cleaned if linked data remains

---

## 📊 Complete Data Flow Examples

### Example 1: User Login Flow

```
1. User enters email/password
   └─ LoginPage.js handleLogin()

2. Submit form
   └─ POST /api/signin with credentials

3. Backend validates
   └─ Check email exists
   └─ Verify password with bcrypt
   └─ Generate JWT token
   └─ Return user object + set cookie

4. Frontend receives response
   └─ result.success === true
   └─ result.data = { _id, email, name, roles, walletBalance }

5. Store in Redux
   └─ dispatch(setUserDetails(result.data))
   └─ Redux saves to Redux Persist → localStorage

6. Store in Context
   └─ AppContent updates context value with user data

7. Store in localStorage
   └─ storageService.setCache('userDetails', user)

8. Cookie set by browser
   └─ httpOnly cookie with JWT
   └─ Automatically sent with future requests

9. Redirect to dashboard
   └─ Router redirects to role-based dashboard
   └─ Header updates with user name/avatar

10. Future API calls
    └─ Every request includes cookie
    └─ Backend validates token
    └─ Adds userId to request
```

### Example 2: Add to Cart Flow

```
1. User clicks "Add to Cart" on product
   └─ ProductCard component button click

2. Get product ID
   └─ Product._id from props

3. Send to backend
   └─ POST /api/addtocart
   └─ Body: { productId, quantity, price }
   └─ Cookie with JWT sent automatically

4. Backend processes
   └─ Verify user authenticated (from token)
   └─ Check product exists
   └─ Add to cart collection
   └─ Return success

5. Frontend receives response
   └─ result.success === true
   └─ Show success toast

6. Update cart count
   └─ GET /api/countAddToCartProduct
   └─ Backend returns count
   └─ Update Context: cartProductCount = 5

7. Update localStorage
   └─ Cache updated cart count

8. Component re-renders
   └─ Cart icon shows "5" badge
   └─ User sees confirmation

9. Next page load
   └─ App initializes from localStorage cache
   └─ Cart count shown immediately
   └─ No API call if within cache expiry
```

### Example 3: Create Order Flow

```
1. User views cart, clicks "Proceed to Checkout"
   └─ CartPage → CheckoutPage

2. Checkout page loads
   └─ GET /api/view-card-product (view cart items)
   └─ Display items with total price

3. User applies coupon
   └─ POST /api/validate-coupon
   └─ Backend validates coupon
   └─ Calculates discount
   └─ Returns discounted total

4. User selects payment method & confirms
   └─ Button click: "Place Order"

5. Create order
   └─ POST /api/create-order
   └─ Body: { 
       cartItems: [...],
       couponCode: "SAVE10",
       paymentMethod: "stripe"
     }
   └─ Backend:
     └─ Creates order document
     └─ Copies checkpoints from product
     └─ Sets status = "pending"
     └─ Returns order ID

6. Frontend receives order ID
   └─ Redirects to payment page

7. Payment page
   └─ For Stripe: Load Stripe.js
   └─ For Wallet: Deduct from wallet
   └─ For Combined: Split between both

8. After payment
   └─ POST /api/wallet/verify-payment
   └─ Body: { transactionId, paymentProof }
   └─ Backend:
     └─ Records transaction
     └─ Sets transaction status = "pending"
     └─ Creates notification for admin

9. Frontend shows success
   └─ Redirect to order details page
   └─ Display "Awaiting Admin Approval"

10. Admin approves
    └─ Admin panel: "Pending Orders"
    └─ Reviews payment proof
    └─ Clicks "Approve Order"
    └─ POST /api/approve-order
    └─ Order status → "approved"
    └─ Notification sent to customer

11. Order now active
    └─ Customer can see progress
    └─ Admin can assign developer
    └─ Project begins
```

### Example 4: Track Project Progress

```
1. Order in "approved" state
   └─ Admin optionally assigns developer
   └─ POST /api/assign-developer with developer ID

2. Developer sees assignment
   └─ Developer dashboard shows order

3. Admin updates progress
   └─ POST /api/update-project-progress
   └─ Body: { orderId, checkpointIndex, completed: true }
   └─ Backend:
     └─ Marks checkpoint completed
     └─ Calculates new projectProgress %
     └─ Updates timestamp
     └─ Creates notification

4. User sees update
   └─ GET /api/order-details/:orderId
   └─ Shows new progress bar
   └─ Shows checkpoint completed badge

5. Communication
   └─ Admin sends message via ProjectWorkspaceModal
   └─ POST /api/project-message
   └─ Backend stores in messages array
   └─ Frontend shows in "Messages" tab

6. 100% Complete
   └─ Last checkpoint marked completed
   └─ projectProgress = 100
   └─ currentPhase = "completed"
   └─ Order status → "completed"
   └─ Invoice generated
   └─ Notification sent
```

### Example 5: Subscription Renewal Flow

```
1. Customer buys monthly renewable plan (₹3000/month for 12 months)
   └─ Order created with:
     └─ isMonthlyLimitedPlan = true
     └─ monthlyUpdateLimit = 1
     └─ monthlyRenewalCost = 3000
     └─ totalYearlyDaysRemaining = 365
     └─ currentMonthExpiryDate = today + 30 days
     └─ autoRenewalStatus = "active"

2. Customer requests updates
   └─ Uses monthly quota
   └─ currentMonthUpdatesUsed = 1
   └─ currentMonthUpdatesRemaining = 0
   └─ Can't request more until next month

3. Month expiry date arrives
   └─ Cron job runs: autoRenewalCron.js
   └─ Finds orders with currentMonthExpiryDate = today
   └─ For each order:

4. Auto-renewal process
   └─ Check autoRenewalStatus = "active"
   └─ Check totalYearlyDaysRemaining > 0
   └─ Calculate renewal:
     └─ daysToAdd = min(30, remainingDays)
   └─ Update order:
     └─ currentMonthUpdatesUsed = 0
     └─ currentMonthUpdatesRemaining = 1
     └─ currentMonthExpiryDate += 30 days
     └─ monthlyRenewalHistory.push({date, amount, status})
     └─ totalYearlyDaysRemaining -= 30
   └─ Create transaction:
     └─ type = "renewal"
     └─ amount = 3000
     └─ status = "completed"
   └─ Generate invoice:
     └─ Create monthly invoice PDF
     └─ Send email with invoice
   └─ Create notification

5. Customer gets:
   └─ Email: "Your plan renewed for ₹3000"
   └─ Invoice attachment
   └─ New month quota (1 update)

6. After 12 months (365 days used)
   └─ totalYearlyDaysRemaining = 0
   └─ autoRenewalStatus changes to "expired"
   └─ Can't renew automatically
   └─ Option: Buy new plan
```

---

## 🎯 Key Integration Points

### Frontend ↔ Backend Communication

**Always Include**:
- `credentials: 'include'` - Send cookies
- `Content-Type: application/json` - Specify JSON
- Proper error handling for network issues
- User feedback (toast, spinner, error message)

**Response Structure** (from backend):
```javascript
{
  success: true/false,
  message: "Error or success message",
  data: { /* response data */ },
  error: false
}
```

**Status Codes**:
- 200 - Success
- 400 - Bad request (validation error)
- 401 - Unauthorized (no token or invalid)
- 403 - Forbidden (permission denied)
- 404 - Not found
- 500 - Server error

### Error Handling Pattern

```javascript
try {
  const response = await fetch(apiUrl, options)
  const result = await response.json()
  
  // Network error
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  // API error
  if (!result.success) {
    throw new Error(result.message)
  }
  
  // Success
  return result.data
  
} catch (error) {
  // Log for debugging
  console.error('API Error:', error)
  
  // Show to user
  toast.error(error.message || 'Something went wrong')
  
  // Return null for component to handle
  return null
}
```

---

## 🔄 Cache Invalidation Strategy

### When to Clear Cache

**Clear userDetails**:
- User logout
- User role change
- Profile update

**Clear cartProductCount**:
- Add to cart
- Remove from cart
- After checkout

**Clear walletBalance**:
- Transaction approved/rejected
- Wallet add/deduct
- After payment

**Clear products/categories**:
- Admin adds product
- Admin updates category
- Admin deletes item

**Clear admin workspace project data**:
- Admin deletes a project/order
- Remove linked invoices, transactions, update requests, and cached workspace counts

### Implementation

```javascript
// After logout
storageService.clearAll()
localStorage.removeItem('token')
// Redirect to login

// After transaction
storageService.removeItem('walletBalance')
// Next API call will fetch fresh data

// After cart change
storageService.removeItem('cartProductCount')
// Context update will trigger re-fetch
```

---

## 🌐 Multi-Tenant Considerations

**Subdomain Detection**: `utils/getSubdomain.js`
- Extracts subdomain from URL
- Can route requests to different backends
- Used for white-label features

```javascript
// Example
// URL: customer.merasoftware.com → subdomain = "customer"
// Can conditionally set API_URL per subdomain
```

**Local cookie domain note**:
- If local dev reuses production cookie-domain env values, browser may reject `user-details`
- That warning is an environment config issue, not a wallet logic failure

---

## 📝 Next Steps for Development

1. **Before adding feature**: Review data flow for similar feature
2. **When creating API call**: Follow pattern in existing services
3. **Cache strategy**: Decide expiry based on data freshness needs
4. **Error handling**: Always include try-catch + user feedback
5. **State management**: Use Redux for persisted, Context for shared

---

## 🔍 Debugging Data Flow

### Check Redux Store
```javascript
// In browser console
// Redux DevTools extension installed?
// window.__REDUX_DEVTOOLS_EXTENSION__

// Check current state
console.log(store.getState())
```

### Check localStorage
```javascript
// Browser DevTools → Application → Storage → Local Storage
// Look for: userDetails, walletBalance, productsList, etc.
```

### Check Network Requests
```javascript
// Browser DevTools → Network tab
// Watch API calls
// Check Request/Response payloads
// Check status codes and timing
```

### Check Context
```javascript
// Add console.log in context consumer
const contextValue = useContext(Context)
console.log('Context:', contextValue)
```
