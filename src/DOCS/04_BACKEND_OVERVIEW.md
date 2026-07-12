# MeraSoftware - Backend Architecture Overview

## 🖥️ Server & Setup

**Framework**: Express.js 4.21.2  
**Runtime**: Node.js  
**Database**: MongoDB (Mongoose 8.9.3)  
**Port**: Configured in environment (typically 5000)  

### Server Initialization (`index.js`)

**Startup Sequence**:
1. Load environment variables
2. Set up CORS with whitelisted origins (15 allowed domains)
3. Configure body parsers (JSON, URL-encoded up to 10MB)
4. Attach cookie-parser middleware
5. Serve static files from `/uploads` directory
6. Connect to MongoDB
7. Initialize keep-alive cron (prevents dyno sleep)
8. Initialize file cleanup scheduler (remove old uploads)
9. Initialize auto-renewal scheduler (monthly plan renewals)
10. Start listening on configured port

**Keep-Alive**: Runs every 5 minutes to prevent Render/Heroku from sleeping

---

## 🗄️ Database Models (21 Total)

### Core Business Models

#### 1. **User Model** (`userModel.js`)
Represents customer, admin, manager, developer, or partner accounts.

**Fields**:
- `email` (unique, indexed)
- `password` (hashed with bcryptjs)
- `name`
- `phone`
- `roles` - Array of roles (customer, admin, manager, developer, partner)
- `walletBalance` - Current wallet amount (₹)
- `referrals` - Array of referred user IDs
- `referredBy` - Reference to referrer user ID
- **KYC Fields**:
  - `kycStatus` - pending, approved, rejected
  - `kycDocuments` - Array of uploaded documents
  - `kycApprovedDate`
  - `kycRejectionReason`
- **Bank Details** (array of bank accounts):
  - `bankName`, `accountNumber`, `ifscCode`
  - `accountHolderName`, `accountType` (savings, current)
  - `upiId` (for direct UPI transfer)
- **Additional Fields**:
  - `address`, `city`, `state`, `zipCode`
  - `profileImage`
  - `createdAt`, `updatedAt`
  - Status flags: `isActive`, `isDeleted`

**Indexes**: email, roles, referredBy

**Current frontend SSOT usage**:
- The frontend reads wallet balance from `GET /api/user-details` via `current_user`
- The clean customer dashboard flow does not require a separate `/api/wallet/balance` call

#### 2. **Product Model** (`productModel.js`)
Represents services (website development, app development, website updates, feature upgrades).

**Common Fields**:
- `serviceName` - Unique service identifier
- `category` - Website / App / Software / Update / Upgrade
- `price` - Cost price (₹)
- `sellingPrice` - Selling price (₹)
- `description` (rich text)
- `benefits` - Array of key benefits
- `image` - Product image URL
- `isHidden` - Admin can hide product from catalog

**Category-Specific Fields**:

**Website Projects** (Website category):
- `totalPages` - 4 to 50 pages range
- `checkpoints` - Array: 
  - Each page gets one checkpoint
  - Example: Page 1-5, Page 6-10, etc.
  - Default: 4 checkpoints for basic, up to 50 for enterprise

**Cloud Software/App Development** (App category):
- `checkpoints` - Predefined 19-step checkpoint system
  - Planning (5%)
  - Backend setup (10%)
  - Frontend setup (10%)
  - API integration (10%)
  - Backend development (15%)
  - Frontend development (15%)
  - Testing (10%)
  - Deployment (5%)
  - Support (5%)

**Website Updates** (Update category):
- `validityPeriod` - Number of days valid (30/90/180/365)
- `updateCount` - Number of updates included
- `updateDescription` - What updates cover

**Monthly Renewable Plans**:
- `isMonthlyRenewablePlan` - Boolean flag
- `yearlyPlanDuration` - Total months plan valid
- `monthlyRenewalCost` - Cost per month (₹)
- `isMonthlyLimitedPlan` - Capped monthly updates
- `monthlyUpdateLimit` - Max updates per month
- `monthlyRenewalPrice` - Renewal cost if expired

**Feature Upgrades**:
- `compatibleWith` - Reference to base product
- `keyBenefits` - Array of benefits
- `upgradeDescription`

**Relations**:
- `additionalFeatures` - Array of references to other products (upsells)

#### 3. **Order/Order Product Model** (`orderProductModel.js`)
Represents customer purchase of a product (most critical model).

**Basic Fields**:
- `userId` - Reference to user (indexed)
- `productId` - Reference to product
- `quantity` - Number of services
- `price` - Unit price paid
- `totalPrice` - Quantity × price

**Status Fields**:
- `orderVisibility` - visible, approved, pending-approval, payment-rejected, hidden
- `status` - pending, in_progress, completed, cancelled
- `currentPhase` - planning, development, review, completed

**Progress Tracking** (most important):
- `projectProgress` - 0-100% completion
- `currentPhase` - Which phase of project
- `isWebsiteProject` - Boolean flag
- `checkpoints` - Array of checkpoint objects:
  ```javascript
  {
    index: 0,
    description: "Homepage Design",
    percentage: 10,
    completed: false,
    completedAt: null
  }
  ```

**Communication**:
- `messages` - Array of message objects:
  ```javascript
  {
    senderRole: "admin" / "user",
    senderId: userId,
    senderName: "John Doe",
    message: "Message text",
    timestamp: Date
  }
  ```

**Payment & Installments**:
- `paymentMethod` - full, installment
- `installmentPlan` - 1, 2, or 3 installments
- `installments` - Array of payment objects:
  ```javascript
  {
    installmentNumber: 1,
    amount: 1000,
    percentage: 33.33,
    dueDate: Date,
    status: "pending" / "approved" / "rejected",
    transactionId: "TXN123"
  }
  ```
- `couponApplied` - Coupon code used
- `discountAmount` - Discount in ₹
- `paidAmount` - Already paid amount
- `remainingAmount` - Still to pay

**Renewal System** (critical for recurring revenue):
- `monthlyRenewalHistory` - Array of renewal records:
  ```javascript
  {
    renewalNumber: 1,
    renewalDate: Date,
    amount: 3000,
    expiryDate: Date,
    status: "active" / "expired"
  }
  ```
- `totalYearlyDaysRemaining` - Days left in yearly plan
- `currentMonthExpiryDate` - When current month expires
- `autoRenewalStatus` - active, paused, expired
- `currentMonthUpdatesUsed` - Updates used this month
- `currentMonthUpdatesRemaining` - Updates available

**Project Management**:
- `assignedDeveloper` - Reference to developer user
- `projectLink` - Deployed website URL (added when project ready)

**Plan Closure**:
- `planStatus` - active, closed
- `closureReason` - Why plan was closed
- `closedAt` - Closure timestamp
- `closedBy` - Admin user who closed

**Indexes**: userId, productId, status, orderVisibility

#### 4. **Transaction Model** (`transactionModel.js`)
Records all money movements (payments, refunds, commissions).

**Fields**:
- `userId` - Who made transaction
- `transactionId` - Unique transaction ID
- `amount` - Amount in ₹
- `status` - pending, completed, failed, refunded, rejected
- `type` - deposit, payment, refund, renewal, commission
- `paymentMethod` - wallet, upi, stripe, combined
- `paymentProof` - Screenshot/UTR for verification
- **Installment Details**:
  - `orderId` - Related order
  - `installmentNumber` - Which installment (1/2/3)
- **Renewal Details**:
  - `renewalNumber` - Which monthly renewal
  - `renewalPeriodStart`, `renewalPeriodEnd`
- **Verification**:
  - `verifiedBy` - Admin who verified
  - `verificationDate`
  - `paymentStatus` - verification status
  - `rejectionReason` - If rejected
  - `rejectedAt`, `rejectedBy`
- **Commission**:
  - `partnerWalletCredited` - Was commission credited?
  - `commissionAmount`
- Timestamps: `createdAt`, `updatedAt`

**Indexes**: userId, transactionId, status, type

#### 5. **Developer Model** (`developerModel.js`)
Represents internal staff developers/team members.

**Personal Info**:
- `name`, `email` (unique), `phone`
- `designation` - Senior Dev, Junior Dev, etc.
- `department` - Backend, Frontend, QA, etc.
- `employeeId` - Internal ID

**Expertise**:
- `expertise` - Array of skills:
  ```javascript
  {
    skillName: "React",
    level: "Expert" / "Intermediate" / "Beginner",
    yearsOfExperience: 5
  }
  ```
- `totalYearsExperience` - Total in field

**Experience**:
- `previousCompanies` - Work history array

**Workload & Availability**:
- `maxProjects` - Max concurrent projects
- `maxUpdatesPerDay` - Update task limit
- `timeZone` - Preferred timezone
- `workingHours` - Start and end time
- `leaves` - Array of leave dates

**Performance Metrics**:
- `ratings` - Array of rating objects (1-5)
- `averageRating` - Calculated average
- `successRate` - % of completed projects
- `onTimeDelivery` - % delivered on deadline

**Workload Tracking**:
- `activeProjects` - Count of current assignments
- `completedProjects` - Total completed
- `currentUpdates` - Currently assigned updates

**Notifications**:
- `notifications` - Array of system notifications

**System Access**:
- `role` - developer, lead, etc.
- `permissions` - Array of allowed actions

#### 6. **Category Model** (`categoryModel.js`)
Product categories (Website, App, Software, Updates, Features).

**Fields**:
- `categoryName` (unique)
- `description`
- `image`
- `position` - Display order
- `isHidden` - Admin visibility control

#### 7. **Coupon Model** (`couponModel.js`)
Discount coupons for orders.

**Fields**:
- `couponCode` (unique)
- `discountType` - fixed / percentage
- `discountValue` - Amount or percentage
- `minOrderAmount` - Minimum order value
- `maxOrderAmount` - Maximum order value
- `applicableCategories` - Products eligible
- `usageLimit` - Max uses of coupon
- `usageCount` - Current uses
- `expiryDate`
- `isActive`

#### 8. **Monthly Invoice Model** (`monthlyInvoiceModel.js`)
Auto-generated monthly invoice for renewable plans.

**Fields**:
- `userId`
- `invoiceNumber` - Format: INV-YYYYMM-XXXX
- `month` / `year`
- `items` - Array of services charged
- `totalAmount`
- `status` - draft, sent, paid, cancelled
- `generatedDate`, `paidDate`
- `pdfUrl` - Generated PDF link

#### 9. **Update Request Model** (`updateRequestModel.js`)
Tracks website update requests from customers.

**Fields**:
- `userId` - Who requested
- `orderId` - Related order
- `description` - What to update
- `attachments` - Array of files
- `status` - pending, assigned, completed, rejected
- `assignedDeveloper` - Developer ID
- `messages` - Communication array
- `createdAt`, `completedAt`

#### 10. **Support Ticket Model** (`ticketModel.js`)
Customer support tickets.

**Fields**:
- `userId`
- `subject`
- `description`
- `category`
- `attachments`
- `status` - open, in-progress, resolved, closed
- `replies` - Array of responses
- `priority` - low, medium, high
- Timestamps

#### 11. **OTP Model** (`otpModel.js`)
One-time passwords for email verification.

**Fields**:
- `email`
- `otp` - 6-digit code
- `expiresAt` - 10 minutes from creation
- `isUsed`

### Supporting Models
- `bannerModel.js` - Promotional banners
- `adModel.js` - Advertisement images
- `guestSlidesModal.js` - Welcome slides for non-logged-in users
- `userWelcomeModal.js` - Welcome content personalization
- `notificationModel.js` - System notifications
- `contactRequestModel.js` - Contact form submissions
- `partnerCommissionModel.js` - Partner earnings tracking
- `withdrawalRequestModel.js` - Withdrawal requests from partners
- `adminSettingsModel.js` - Admin configuration
- `cartProduct.js` - Shopping cart items

---

## 🛣️ API Routes & Endpoints (140+)

### Route Organization
**File**: `routes/index.js`

All routes organized by domain:
```
/api/
├── user/          (30+ routes)
├── product/       (20+ routes)
├── cart/          (5 routes)
├── order/         (30+ routes)
├── wallet/        (8 routes)
├── admin/         (40+ routes)
├── developer/     (5 routes)
├── partner/       (6 routes)
└── ...            (etc)
```

### Controller Organization
**File**: `controller/` directory

**149 controller files organized as**:
```
controller/
├── user/          (User signup, login, profile, etc.)
├── admin/         (Admin operations - 40+ controllers)
├── product/       (Product CRUD operations)
├── order/         (Order creation, management)
├── developer/     (Developer tasks)
├── partner/       (Partner operations)
└── ...
```

---

## 🔐 Middleware

### Auth Middleware (`middleware/authToken.js`)
**Applied to**: All protected routes

**Process**:
1. Extract token from cookies
2. Verify JWT signature with TOKEN_SECRET_KEY
3. Decode token to get userId + userRole
4. Attach `req.userId` and `req.userRole` to request
5. If invalid/missing → Return 401 Unauthorized

**Usage**:
```javascript
router.get('/user-details', authToken, getUserDetailsController)
```

---

## 🔧 Helper Services

### Email Service (`helpers/emailService.js`)
Sends all email notifications.

**Functions**:
- `sendWelcomeEmail(email, name)` - Welcome to platform
- `sendOtpEmail(email, otp)` - OTP for verification
- `sendPasswordResetEmail(email, resetLink)` - Password recovery
- `sendProjectAssignmentEmail(developerEmail, projectDetails)`
- `sendUpdateCompletionEmail(userEmail, updateDetails)`
- `sendMonthlyInvoiceEmail(userEmail, invoicePdf)`
- `sendAdminAutoRenewalNotification(adminEmail, renewalStats)`

**Providers**:
- SendGrid (primary)
- Resend (fallback)

### OTP Service (`helpers/otpUtils.js`)
- Generate random 6-digit OTP
- Save to database with 10-min expiry
- Validate OTP matches and not expired
- Mark OTP as used after validation

### Permission Service (`helpers/permission.js`)
- Role-based permission checks
- Admin can access everything
- Manager can access assigned projects
- Developer can access assigned tasks
- Partner can access own customers
- User can access own data

### Notification Service (`helpers/notificationService.js`)
- Create notification records
- Track notification status
- Deliver to users
- Mark as read

### File Management
- `helpers/fileCleanupScheduler.js` - Delete old uploads
- `helpers/googleDriveService.js` - Upload to Google Drive

### Workspace Activity (`helpers/workspaceActivityRules.js`)
- Log admin/developer actions
- Calculate workspace metrics
- Track completion rates

---

## ⏰ Cron Jobs

### Auto-Renewal Scheduler (`cron/autoRenewalCron.js`)

**Runs**: Once per day (can be configured monthly)

**Process**:
1. Find all orders with `currentMonthExpiryDate = today`
2. Filter for active `autoRenewalStatus = "active"`
3. Check `totalYearlyDaysRemaining > 0`
4. Calculate renewal days:
   - `daysToAdd = min(30, remainingDays)`
5. Update order:
   - Reset monthly updates counter
   - Extend expiry date
   - Decrement yearly days
   - Add to renewal history
6. Create transaction record
7. Generate monthly invoice
8. Send notification email
9. Log audit trail

**Example Renewal**:
```
Order: Monthly Plan (₹3000/month, 12 months)
Day 0: Purchase → expires in 30 days
Day 30: Cron runs → Renew for next 30 days
Day 60: Cron runs → Renew again
...
Day 365: No more days remaining → Status = "expired"
```

### Keep-Alive Cron (in `index.js`)
- Runs every 5 minutes
- Sends HEAD request to keep server active
- Prevents Heroku/Render free tier from sleeping

---

## 🗄️ Configuration

### Database Connection (`config/db.js`)
- MongoDB URI from environment variable
- Connection pooling via Mongoose
- Server selection timeout: 10 seconds

### Environment Variables Required
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/merasoftware
TOKEN_SECRET_KEY=your-secret-key
STRIPE_SECRET_KEY=sk_live_xxxxx
SENDGRID_API_KEY=SG.xxxxx
GOOGLE_DRIVE_API_KEY=xxxxx
NODE_ENV=production
PORT=5000
COOKIE_DOMAIN=.merasoftware.com
KEEP_ALIVE_URL=https://merasoftware-backend.herokuapp.com
```

---

## 🔄 Business Logic Flows

### Order Lifecycle
```
1. Created (pending approval)
   ↓
2. Payment verified
   ↓
3. Admin approves
   ↓
4. Order becomes "approved" (in_progress)
   ↓
5. Developer assigned (optional)
   ↓
6. Checkpoints tracked/updated
   ↓
7. 100% progress reached
   ↓
8. Order → "completed"
   ↓
9. Invoice generated
   ↓
10. Notification sent
```

### Subscription Renewal Flow
```
User buys 12-month plan
   ↓
Day 0-29: Active, using monthly updates
   ↓
Day 30: Cron job runs
   ↓
Check remaining days (335 left)
   ↓
Renew for 30 days
   ↓
Reset monthly updates to 1
   ↓
Extend expiry to Day 60
   ↓
Deduct 30 days from yearly (305 left)
   ↓
Repeat monthly
   ↓
Day 365: Last renewal
   ↓
Day 395 (one month after 365): Last renewal expires
   ↓
autoRenewalStatus = "expired"
   ↓
User sees "Plan Expired"
   ↓
Option: Buy new plan
```

### Payment Verification Flow
```
User completes payment (Stripe/UPI/Wallet)
   ↓
User uploads payment proof (screenshot/UTR)
   ↓
POST /wallet/verify-payment
   ↓
Backend stores transaction (status = pending)
   ↓
Creates notification for admin
   ↓
Admin reviews in "Pending Verification"
   ↓
Approves: status = completed, order proceeds
   ↓
Rejects: status = rejected, user can retry
```

---

## 🚀 Performance & Scaling

### Database Indexes
- `User`: email, roles, referredBy
- `Order`: userId, productId, status
- `Developer`: email, department
- `Transaction`: userId, status, type

### Caching Strategy
- Frontend caches API responses in localStorage
- Backend doesn't cache (MongoDB queries always fresh)
- File uploads stored in Google Drive

### Scalability Considerations
1. **Horizontal**: Stateless Express servers behind load balancer
2. **Database**: MongoDB Atlas clusters with replicas
3. **File Storage**: Google Drive (scalable, reliable)
4. **Email**: SendGrid (handles high volume)
5. **Notifications**: Can be moved to Redis/queue (for v2)

---

## 🔒 Security Features

1. **Authentication**: JWT with httpOnly cookies
2. **Password**: Bcrypt hashing (10 rounds)
3. **CORS**: Whitelist 15 allowed origins
4. **File Upload**: Type/size validation, virus scan (optional)
5. **Input Validation**: Both client and server-side
6. **Rate Limiting**: Optional (can be added)
7. **Encryption**: Sensitive data at rest (optional)
8. **Audit Trail**: All admin actions logged

---

## 📊 Key Features

1. ✅ Multi-role system (admin, manager, dev, partner, customer)
2. ✅ E-commerce (products, cart, checkout, coupons)
3. ✅ Project management (checkpoints, progress, developers)
4. ✅ Subscriptions (monthly renewable, auto-renewal)
5. ✅ Payments (Stripe, wallet, combined, installments)
6. ✅ Commission tracking (partner earnings, withdrawals)
7. ✅ KYC verification (documents, approval workflow)
8. ✅ Support tickets (customer support system)
9. ✅ Invoice management (auto-generation, PDF, reminders)
10. ✅ Website updates (post-purchase update requests)
11. ✅ Notifications (email, in-app, SMS)
12. ✅ Wallet system (balance, transaction history)

---

## 🔍 Debugging & Monitoring

### Logs to Check
- Server logs (console)
- MongoDB logs (Atlas dashboard)
- Email logs (SendGrid dashboard)
- Payment logs (Stripe dashboard)

### Common Issues
1. **Payment not verified**: Check transaction timestamp
2. **Renewal not running**: Check cron job logs
3. **Order not approved**: Check admin notifications
4. **Email not sent**: Check SendGrid quota
5. **File upload failed**: Check Google Drive auth

---

## 📚 Next Steps for Development

1. Review specific controller for feature you're working on
2. Check data model for structure
3. Understand API contract (frontend expects what response?)
4. Test API endpoint with Postman/Insomnia
5. Write corresponding frontend service call
6. Test integration end-to-end
