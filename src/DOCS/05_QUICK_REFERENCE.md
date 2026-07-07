# MeraSoftware - Quick Reference Guide

Quick lookup for common tasks, patterns, and file locations.

---

## 📍 Quick File Locations

### Frontend Core Files
| File | Purpose |
|------|---------|
| `src/App.js` | Root component, online status setup |
| `src/AppContent.js` | Main layout, user auth, context setup |
| `src/index.js` | React DOM entry point |
| `src/store/store.js` | Redux store configuration |
| `src/store/userSlice.js` | User state management |
| `src/context/index.js` | Shared app context |
| `src/routes/index.js` | All route definitions |
| `src/common/index.js` | API endpoints (SummaryApi) |

### Frontend Services & Utils
| File | Purpose |
|------|---------|
| `src/utils/storageService.js` | localStorage cache with expiry |
| `src/utils/cookieManager.js` | Cookie operations |
| `src/utils/getSubdomain.js` | Subdomain detection |
| `src/services/` | External API integration |
| `src/helpers/` | Business logic helpers |
| `src/hooks/` | Custom React hooks |

### Frontend Components & Pages
| Location | Contains |
|----------|----------|
| `src/components/` | 81 reusable components |
| `src/pages/` | 83 page components |
| `src/assest/` | Images, logos, static files |

### Backend Core Files
| File | Purpose |
|------|---------|
| `backend/index.js` | Server entry point |
| `backend/config/db.js` | MongoDB connection |
| `backend/models/` | 21 Mongoose schemas |
| `backend/controller/` | 149 controller files |
| `backend/routes/index.js` | Route aggregation |
| `backend/middleware/authToken.js` | JWT authentication |
| `backend/helpers/` | Email, OTP, permissions, etc. |
| `backend/cron/autoRenewalCron.js` | Monthly renewal scheduler |

---

## 🔧 Common Development Tasks

### Adding a New API Endpoint

**Step 1**: Create controller in `backend/controller/{domain}/{name}.js`
```javascript
const {Model} = require('../../models/modelName')

const controllerName = async (req, res) => {
  try {
    // Get data from request
    const { userId } = req
    const { field } = req.body
    
    // Validate
    if (!field) {
      return res.status(400).json({
        success: false,
        message: "Field is required"
      })
    }
    
    // Database operation
    const result = await Model.create({ ...data })
    
    // Response
    return res.json({
      success: true,
      message: "Operation successful",
      data: result
    })
  } catch(error) {
    console.error('Error:', error)
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: true
    })
  }
}

module.exports = controllerName
```

**Step 2**: Add route in `backend/routes/index.js`
```javascript
router.post('/new-endpoint', authToken, controllerName)
```

**Step 3**: Add to `frontend/src/common/index.js`
```javascript
newEndpoint: {
  method: "post",
  url: `/api/new-endpoint`
}
```

**Step 4**: Call from frontend component
```javascript
const response = await fetch(SummaryApi.newEndpoint.url, {
  method: SummaryApi.newEndpoint.method.toUpperCase(),
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
const result = await response.json()
```

---

### Adding a New Page

**Step 1**: Create page file in `src/pages/PageName.js`
```javascript
import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Context } from '../context'
import SummaryApi from '../common'

function PageName() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user } = useSelector(state => state.user)
  const context = useContext(Context)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(SummaryApi.someEndpoint.url, {
        method: SummaryApi.someEndpoint.method.toUpperCase(),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch(error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1>Page Title</h1>
      {loading && <p>Loading...</p>}
      {data && <div>{/* Render data */}</div>}
    </div>
  )
}

export default PageName
```

**Step 2**: Add route in `src/routes/index.js`
```javascript
{
  path: '/page-name',
  element: <ProtectedRoute element={<PageName />} allowedRoles={['customer']} />
}
// Note: All users have single 'customer' role (see doc 10_CUSTOMER_ONLY_LOGIN_SYSTEM.md)
```

---

### Working with Redux Store

**Access state**:
```javascript
const { user } = useSelector(state => state.user)
console.log(user.userDetails)
console.log(user.walletBalance)
```

**Dispatch action**:
```javascript
import { useDispatch } from 'react-redux'
import { setUserDetails, logout } from '../store/userSlice'

const dispatch = useDispatch()

// Set user
dispatch(setUserDetails(userData))

// Logout
dispatch(logout())

// Update wallet
dispatch(updateWalletBalance(5000))
```

---

### Working with Context

**Get context values**:
```javascript
import { useContext } from 'react'
import { Context } from '../context'

function MyComponent() {
  const { cartProductCount, walletBalance, handleLogout } = useContext(Context)
  
  return (
    <div>
      <p>Cart: {cartProductCount}</p>
      <p>Wallet: ₹{walletBalance}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
```

---

### Using localStorage Cache

**Set cache**:
```javascript
import { storageService } from '../utils/storageService'

storageService.setCache('products', productsArray, 30) // 30 minutes
```

**Get cache**:
```javascript
const cached = storageService.getCache('products')
if (cached) {
  // Use cached data
} else {
  // Fetch fresh data
}
```

**Clear on logout**:
```javascript
storageService.clearAll()
```

---

## 🎯 Common API Patterns

### Authentication Pattern
```javascript
// Login
POST /api/signin
Body: { email, password }
Response: { success, user, message }

// Get current user
GET /api/user-details
Response: { success, data: { _id, email, name, roles, walletBalance } }

// Logout
GET /api/logout
Response: { success, message }
```

### CRUD Pattern
```javascript
// Create
POST /api/resource
Body: { field1, field2 }
Response: { success, data: createdObject }

// Read
GET /api/resource/:id
Response: { success, data: object }

// Update
POST /api/update-resource
Body: { id, field1, field2 }
Response: { success, message, data }

// Delete
DELETE /api/delete-resource/:id
Response: { success, message }
```

### Pagination Pattern
```javascript
GET /api/resource?page=1&limit=10
Response: { 
  success, 
  data: [...items],
  totalCount: 150,
  currentPage: 1,
  totalPages: 15
}
```

---

## 🎨 Styling Quick Reference

### Tailwind Classes Used
```
Layout:
- container, mx-auto, px-4, py-4
- flex, gap-4, justify-between, items-center
- grid, grid-cols-3, gap-6
- w-full, h-full, w-1/2, h-screen

Text:
- text-lg, text-sm, text-xs
- font-bold, font-semibold, font-normal
- text-gray-700, text-white, text-red-500

Colors:
- bg-blue-500, bg-green-500, bg-red-500
- text-blue-600, text-white

Spacing:
- p-4, px-6, py-2
- m-4, mx-auto, my-2
- gap-4, space-y-4

Shadows & Borders:
- shadow-md, shadow-lg
- border, border-gray-200, border-b-2

Responsive:
- md:flex, lg:grid-cols-3, sm:text-sm
- hidden md:block, block lg:hidden
```

---

## 🔐 Security Checklist

Before deploying changes:
- [ ] No hardcoded API keys/secrets
- [ ] All API calls use credentials: 'include'
- [ ] Protected routes check authorization
- [ ] Form inputs validated
- [ ] Error messages don't expose sensitive info
- [ ] Passwords hashed on backend (bcryptjs)
- [ ] JWT tokens in httpOnly cookies
- [ ] CORS configured with whitelist
- [ ] Environment variables used for configs
- [ ] No console.logs with sensitive data

---

## 🐛 Debugging Quick Tips

### Check Network Requests
```
Browser DevTools → Network tab
Filter by API calls
Check Status (200, 401, 500, etc.)
Check Response payload
Check Request headers (Cookie, Authorization)
```

### Check Redux State
```
Install Redux DevTools extension
Open DevTools → Redux tab
See current state
See action history
Time-travel debug
```

### Check localStorage
```
Browser DevTools → Application → Local Storage
Look for: userDetails, walletBalance, products, etc.
Check expiry times
```

### Console Errors
```javascript
// Add to problematic function
console.log('Function called:', params)
try { ... } catch(e) { console.error('Error:', e.message) }

// Check in Browser DevTools Console
Press F12 → Console tab
```

### API Testing with Postman
```
1. Create request (GET/POST/etc.)
2. Set URL: http://localhost:5000/api/endpoint
3. Add headers: Content-Type: application/json
4. Add body (for POST)
5. Send request
6. Check response
```

---

## 🚀 Deployment Checklist

### Frontend Build
```bash
npm run build
# Creates optimized production build in /build folder
```

### Environment Variables
```
REACT_APP_BACKEND_URL=https://api.merasoftware.com
```

### Backend Requirements
```bash
npm install
# Create .env file with all environment variables
```

### Environment File (.env)
```
MONGODB_URI=mongodb+srv://...
TOKEN_SECRET_KEY=your-secret
STRIPE_SECRET_KEY=sk_...
SENDGRID_API_KEY=SG...
PORT=5000
NODE_ENV=production
```

### Deployment Platforms
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Heroku, Railway, Render, AWS EC2
- **Database**: MongoDB Atlas
- **Storage**: Google Cloud Storage, AWS S3

---

## 📊 Key Models Quick View

### User Model
```javascript
{
  email, password, name, phone,
  roles: ["customer"],  // Single role only (updated 2026-07-03)
  walletBalance: 5000,
  referredBy, referrals,
  kycStatus, kycDocuments,
  bankAccounts: [{bankName, accountNumber, ifsc, upi}],
  address, city, state, zipCode
}
// Note: All users have single 'customer' role enforced at DB level
// See: frontend/src/DOCS/10_CUSTOMER_ONLY_LOGIN_SYSTEM.md
```

### Product Model
```javascript
{
  serviceName, category,
  price, sellingPrice,
  description, benefits,
  image,
  // For websites:
  totalPages, checkpoints,
  // For subscriptions:
  isMonthlyRenewablePlan, monthlyRenewalCost,
  validityPeriod, updateCount
}
```

### Order Model
```javascript
{
  userId, productId, quantity, price,
  status: "pending/approved/completed",
  projectProgress: 0-100,
  checkpoints: [{description, percentage, completed}],
  messages: [{sender, message, timestamp}],
  paymentMethod, installments,
  monthlyRenewalHistory: [{date, amount, status}],
  autoRenewalStatus,
  assignedDeveloper, projectLink,
  planStatus: "active/closed"
}
```

### Transaction Model
```javascript
{
  userId, transactionId, amount,
  status: "pending/completed/rejected",
  type: "payment/renewal/commission",
  paymentMethod: "wallet/upi/stripe",
  paymentProof,
  orderId, installmentNumber,
  verifiedBy, verificationDate,
  createdAt, updatedAt
}
```

---

## 🔄 Common Workflows

### User Login to Dashboard
```
1. User → /login page
2. Enter email/password
3. POST /api/signin
4. Backend validates, returns user + JWT
5. Frontend stores in Redux + localStorage
6. Cookie set by browser
7. Redirect to /dashboard
8. Header shows user name
```

### Create Order to Completion
```
1. Add items to cart
2. Checkout
3. POST /api/create-order
4. Order created, status = "pending"
5. User pays (Stripe/UPI/Wallet)
6. POST /api/verify-payment
7. Admin reviews payment
8. POST /api/approve-order
9. Order status = "approved"
10. Track progress with checkpoints
11. At 100% → status = "completed"
12. Invoice generated
```

### Monthly Subscription Renewal
```
1. User buys 12-month plan
2. Order created with renewal fields
3. Each month:
   - Cron job runs
   - Checks expiry date
   - Renews for next 30 days
   - Updates monthly updates quota
   - Generates invoice
   - Sends email
4. After 12 months (365 days):
   - Plan expires
   - Status = "expired"
   - User can buy new plan
```

---

## 📚 Documentation Files Location

All in: `frontend/src/DOCS/`

- `01_ARCHITECTURE_OVERVIEW.md` - Tech stack, structure, overview
- `02_COMPONENT_GUIDE.md` - All 81 components explained
- `03_DATA_FLOW_AND_PATTERNS.md` - State management, API patterns
- `04_BACKEND_OVERVIEW.md` - Server, models, routes, logic
- `05_QUICK_REFERENCE.md` - This file!

---

## ⚡ Performance Tips

1. **Cache API responses** in localStorage (30min-24hr)
2. **Use Redux** for frequently-accessed data
3. **Lazy load pages** with React Router
4. **Minimize re-renders** - use useCallback, useMemo
5. **Optimize images** - compress, use correct format
6. **Bundle splitting** - code splitting by route
7. **API calls** - Batch requests when possible
8. **Database** - Add indexes on frequently-queried fields

---

---

## 🟠 IMPORTANT UPDATE (2026-07-03): Admin Panel Status

### ⚠️ Admin Panel Removed from Accessibility

**Previous Status (2026-07-01)**:
- ❌ AdminDashboard.js route deleted (was `/admin-panel/dashboard`)
- ❌ All admin panel routes removed
- See: `frontend/src/DOCS/09_MVP_CONVERSION_COMPLETE.md`

**Current Status (2026-07-03)**:
- ✅ Admin panel files may still exist in codebase
- ❌ NOT ACCESSIBLE via routes (all routes deleted)
- ❌ NOT ACCESSIBLE via role system (all users are 'customer' role)
- See: `frontend/src/DOCS/10_CUSTOMER_ONLY_LOGIN_SYSTEM.md`

**Files that existed (status unknown)**:
- `AdminDashboard.js` - Route deleted, may exist as orphaned file
- `AdminCustomerDashboard.js` - Old version, status unknown
- `AdminCustomerPortal.js` - Old version, status unknown

**Recommendation**: Clean up orphaned admin files if confirmed deleted. Current system is 100% customer-only with no admin access possible.

---

## 🎯 Next Step

Pick a task → Find related file → Review documentation → Implement → Test

Good luck! 🚀

