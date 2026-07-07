# MeraSoftware - Component & Pages Guide

## 📚 Complete Component Reference

This guide explains all 81 reusable components and their usage patterns.

---

## 🎯 Core Components (Layout & Navigation)

### Header.js
**Purpose**: Main navigation bar
- **Props**: Role-based, shows different menu items
- **Features**:
  - User avatar with role indicator
  - Navigation links based on user role
  - Logout functionality
  - Cart icon (if customer)
  - Notification bell (admin/manager)
  - Mobile responsive menu

**Usage**: Rendered in AppContent.js
```jsx
<Header user={user} onLogout={handleLogout} />
```

### Footer.js
**Purpose**: App footer
- **Content**: Links, copyright, contact info
- **Features**: Role-based visibility
- **Responsive**: Mobile-friendly

### DashboardLayout.js
**Purpose**: Wrapper for admin/manager dashboards
- **Structure**:
  - Sidebar with navigation
  - Main content area
  - Breadcrumb navigation
- **Props**: 
  - children - Content to render
  - title - Page title
  - breadcrumbs - Navigation path

### ProtectedRoute.js
**Purpose**: Route wrapper for auth-required pages
- **Logic**: Check if user authenticated
- **Redirect**: Unauthenticated → /login
- **Props**: 
  - element - Component to render
  - allowedRoles - Array of permitted roles (optional)

**Usage**: In routes/index.js for protected pages

---

## 🔐 Authentication Components

### AddRoleToUserModal.js
**Purpose**: Dialog to add new role to existing user
- **Workflow**: 
  1. Select user
  2. Select role (admin, manager, developer, partner)
  3. Set permissions
  4. Confirm addition
- **API Call**: POST `/api/addRole`
- **Features**: Form validation, error handling

### EditProfileModal.js
**Purpose**: User profile editing dialog
- **Fields**:
  - Name, email, phone
  - Address, city, state, zip
  - Photo upload
  - Bio/About
- **Validation**: Email format, phone length
- **API Call**: POST `/api/update-profile`

### ChangeUserRole.js
**Purpose**: Switch between user's assigned roles
- **Logic**: 
  1. Display available roles
  2. Set selected role as active
  3. Reload dashboard with new role context
- **Stores**: Active role in Redux + localStorage

---

## 👥 User Management Components

### CustomerManagement.js
**Purpose**: Admin view of all customers
- **Features**:
  - Customer list with search/filter
  - View customer details
  - Edit customer info
  - Delete customer
  - View order history
- **Columns**: Name, Email, Phone, Total Orders, Join Date, Actions
- **API Calls**:
  - GET `/api/all-user` - Fetch all users
  - POST `/api/update-user` - Update customer
  - DELETE `/api/delete-user` - Remove customer

### AdminManagement.js
**Purpose**: Manage admin users
- **Features**: Add, edit, remove admins
- **Fields**: Name, email, role level, permissions
- **API Calls**:
  - POST `/api/upload-admin` - Add admin
  - POST `/api/edit-admin` - Update admin
  - DELETE `/api/delete-admin` - Remove admin

### DeveloperManagement.js
**Purpose**: Manage developer staff
- **Fields**:
  - Name, email, phone, designation
  - Expertise (skills, experience level)
  - Max projects limit
  - Availability/timezone
  - Performance ratings
- **Features**:
  - Add/edit/delete developers
  - View workload (active projects)
  - Track ratings and success rate
- **API Calls**:
  - POST `/api/upload-developer`
  - POST `/api/edit-developer`
  - GET `/api/get-developer`

### PartnerManagement.js
**Purpose**: Manage partner relationships
- **Fields**: Name, email, commission rate
- **Features**:
  - List partners
  - View commission history
  - View referred customers
  - Block/activate partners

### ManagerManagement.js
**Purpose**: Manage project managers
- **Similar to**: DeveloperManagement
- **Additional**: Project assignment tracking

---

## 🛍️ Product Management Components

### AdminProductCard.js
**Purpose**: Card display for products in admin view
- **Shows**:
  - Product image
  - Name, price, selling price
  - Category
  - Edit/delete buttons
- **Interactive**:
  - Click to edit
  - Delete with confirmation
  - Hide/unhide toggle

### AdminEditProduct.js
**Purpose**: Product creation/editing form
- **Fields**:
  - Service name, category
  - Price, selling price
  - Description, benefits
  - Checkpoints (if applicable)
  - Package includes
  - Validity period
  - Renewal settings
  - Hidden flag
- **Features**:
  - Rich text editor for descriptions
  - Multiple checkpoint support
  - File upload for images
- **API Calls**:
  - POST `/api/upload-product` - Create
  - POST `/api/update-product` - Edit
  - Validation before submit

### AdminDeleteProduct.js
**Purpose**: Product deletion with confirmation
- **Prompt**: Confirm deletion + reason
- **API Call**: DELETE `/api/delete-product/:id`
- **Cleanup**: Remove from orders, cart

### AdminCategoryCard.js & AdminEditCategory.js
**Purpose**: Category management
- **Similar pattern to** product management
- **Fields**: Category name, description, image
- **API Calls**:
  - GET `/api/get-categories`
  - POST `/api/upload-category`
  - POST `/api/update-category`
  - DELETE `/api/delete-category`

### AdminBannerCard.js & AdminEditBanner.js
**Purpose**: Promotional banners management
- **Fields**: Banner image, title, link, position
- **Features**: Drag to reorder, preview
- **API Calls**: CRUD operations similar to products

### ProductCard (Variants)
**Purpose**: Display products in customer view
- **Variants**:
  - **ProductCard** - Standard grid view
  - **HorizontalCardProduct** - List view with details
  - **FeatureProductCard** - Highlighted feature product
- **Shows**: Image, name, price, rating, "Add to Cart" button
- **Interactive**: Click to details, add to cart

### BannerProduct.js
**Purpose**: Hero banner carousel
- **Features**:
  - Auto-scroll slideshow
  - Navigation dots
  - Call-to-action buttons
  - Responsive sizing

### CategoryList.js & CategoryWiseProductDisplay.js
**Purpose**: Category filtering
- **Flow**:
  1. Show category list
  2. User clicks category
  3. Display products in that category
  4. Apply filters (price, rating)

---

## 🛒 Cart & Checkout Components

### CartPopup.js
**Purpose**: Cart preview popup (not full cart page)
- **Shows**:
  - Item count
  - Quick view of items
  - "Go to Cart" button
  - "Checkout" button
- **Triggers**: Cart icon click

### FeatureProductCard.js
**Purpose**: Prominent product card for featured items
- **Larger display** than regular cards
- **Show more details**: Description, benefits, pricing tiers
- **"Add to Cart"** button prominent

---

## 📦 Project & Order Management Components

### AdminProjectCard.js
**Purpose**: Display project/order as a card in admin view
- **Shows**:
  - Project name/order ID
  - Customer name
  - Current progress
  - Status badge
  - Last updated date
- **Click to**: Open project details

### admin/ProjectWorkspaceModal.js
**Purpose**: Detailed project management modal
- **Tabs/Sections**:
  - Overview (status, progress, customer)
  - Checkpoints (track completion)
  - Messages (communication)
  - Files (attachments)
  - Assigned developer
- **Actions**:
  - Update progress
  - Add message
  - Assign/reassign developer
  - Update project link
  - Close project

### admin/UpdateRequestWorkspaceModal.js
**Purpose**: Website update request management
- **Shows**:
  - Update request details
  - Requested files/changes
  - Assigned developer
  - Status (pending, in-progress, completed)
- **Actions**:
  - Assign developer
  - Mark complete
  - Reject request
  - Send message

### AdminTransactionHistory.js
**Purpose**: Display transaction/payment history
- **Columns**: Transaction ID, date, amount, type, status, action
- **Features**:
  - Filter by status (pending, approved, rejected)
  - Filter by date range
  - View transaction details
  - Download receipt

---

## 📧 Support & Communication Components

### CreateTicket.js
**Purpose**: Support ticket creation form
- **Fields**:
  - Subject
  - Category
  - Description
  - File attachments
  - Priority level
- **Validation**: Non-empty fields, file type/size
- **API Call**: POST `/api/create-ticket`
- **Success**: Show ticket ID for tracking

---

## 🖼️ Media & Display Components

### ImagePopup.js
**Purpose**: Modal for viewing full-size images
- **Features**:
  - Zoom in/out
  - Download button
  - Share option
  - Fullscreen mode
- **Usage**: Click on product image → opens popup

### DisplayImage.js
**Purpose**: Optimized image display component
- **Features**:
  - Lazy loading
  - Fallback for missing images
  - Responsive sizing
  - Alt text
- **Props**: 
  - src - Image URL
  - alt - Alt text
  - width, height - Dimensions

---

## 🎨 Layout & UI Components

### HomeSecondBanner.js
**Purpose**: Secondary banner section on homepage
- **Content**: Text + CTA button
- **Responsive**: Stack on mobile

### AppConvertingBanner.js
**Purpose**: Conversion-focused banner
- **Purpose**: Drive users to specific action
- **Shows**: Headline, subheading, CTA

### AnimatedRoutes.js
**Purpose**: Route transitions with animations
- **Effect**: Fade in/out between page changes
- **Improves**: User experience during navigation

### CompleteBusinessSolutions.js
**Purpose**: Section showcasing complete service offerings
- **Shows**: Grid of service cards
- **Each Card**: Icon, title, description, link

### CompletedProjectDashboard.js
**Purpose**: Showcase completed projects
- **Shows**: Project list with before/after images
- **Interactive**: Filter by category

---

## 📋 Form Components

### GuestSlidesForm.js
**Purpose**: Form for collecting guest/lead information
- **Fields**: Name, email, phone, service interest, budget
- **Validation**: Required fields, email format
- **API Call**: POST `/api/create-lead`
- **Stores**: In localStorage for future use

### GuestSlidesTableRow.js
**Purpose**: Display guest/lead data in table format
- **Shows**: Name, email, phone, interest, date submitted
- **Admin only**: View all guest submissions
- **Actions**: Delete, send follow-up

### EditUserBasicModal.js
**Purpose**: Quick edit for user basic info
- **Fields**: Name, email, phone, status
- **Admin feature**: Edit any user's basic info
- **API Call**: POST `/api/update-user`

### EditDeveloper.js
**Purpose**: Edit developer information
- **Fields**: All developer model fields (see backend docs)
- **Features**: Add/remove expertise, update workload
- **API Call**: POST `/api/edit-developer`

---

## 🎯 Role-Based Components

### RoleBasedHome.js
**Purpose**: Route users to correct dashboard based on role
- **Logic**:
  - Admin → `/admin-panel/dashboard`
  - Manager → `/manager-panel/dashboard`
  - Developer → `/developer-panel/dashboard`
  - Partner → `/partner-panel/dashboard`
  - Customer → `/user-dashboard`
- **Usage**: `/home` route uses this

### AddAdminModal.js
**Purpose**: Create new admin user
- **Fields**: Email, name, permissions level
- **Validation**: Email uniqueness, password strength
- **API Call**: POST `/api/upload-admin`

### AddCustomerModal.js, AddDeveloperModal.js, AddPartnerModal.js
**Purpose**: Bulk add users in specific roles
- **Workflow**:
  1. Fill form with user details
  2. Select role permissions
  3. Send invitation email
  4. User completes signup with invitation code
- **API Calls**: POST `/api/upload-{role}`

---

## 🌐 Utility Components

### RoleBasedHome.js
Routes user to correct dashboard after login

### ChangeUserRole.js
Allows users with multiple roles to switch active role

### CompleteBusinessSolutions.js
Displays service offerings

### AnimatedRoutes.js
Provides smooth page transition animations

---

## 📊 Component Usage Patterns

### For Creating Lists (Products, Users, Orders)
```jsx
// Use map() to render items
{items.map(item => (
  <Card key={item._id}>
    <CardContent item={item} />
    <CardActions onEdit={edit} onDelete={delete} />
  </Card>
))}
```

### For Forms (Add/Edit)
```jsx
// Controlled components with React state
const [formData, setFormData] = useState({})
const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value})
const handleSubmit = async (e) => {
  e.preventDefault()
  // Validate
  // Call API
  // Show toast
}
```

### For Modals
```jsx
// Use state to control visibility
const [isOpen, setIsOpen] = useState(false)
return (
  <>
    <Button onClick={() => setIsOpen(true)}>Open</Button>
    {isOpen && <Modal onClose={() => setIsOpen(false)} />}
  </>
)
```

---

## 🔄 Component Interaction Flow

### Adding a Product
1. Admin clicks "Add Product"
2. AdminEditProduct modal opens
3. Admin fills form
4. Click "Save"
5. API call to POST `/api/upload-product`
6. Success → toast notification + modal close
7. Product list refreshes
8. New product visible immediately

### Creating an Order
1. Customer adds items to cart
2. Clicks "Checkout"
3. Order creation page loads
4. Review items and pricing
5. Apply coupon (if any)
6. Select payment method
7. Complete payment
8. Order record created
9. Redirect to order details
10. Admin sees pending approval

### Managing Project Progress
1. Admin views project in dashboard
2. Clicks project card
3. ProjectWorkspaceModal opens
4. Updates checkpoint progress
5. Adds message to customer
6. Saves changes
7. Customer gets notification
8. Can repeat until 100% complete
9. Auto-close at completion

---

## 🎨 Styling Consistency

All components use:
- **Tailwind CSS** for utilities
- **Common classes**: btn, card, shadow-md, border-gray-200
- **Color scheme**: Primary (blue), Success (green), Error (red), Warning (yellow)
- **Spacing**: Consistent padding/margin via Tailwind scale
- **Responsive**: Mobile-first design with breakpoints (sm, md, lg, xl)

---

## 🚀 Best Practices When Creating New Components

1. **Component Purpose**: Clear, single responsibility
2. **Props**: Minimal and well-defined
3. **State**: Only local state, use Context/Redux for shared data
4. **Error Handling**: Try-catch + user-friendly error messages
5. **Loading States**: Show spinners during API calls
6. **Validation**: Both client-side and trust backend validation
7. **Comments**: Only for non-obvious logic
8. **Naming**: Descriptive, PascalCase for components
9. **File Organization**: One component per file (unless very small)
10. **Reusability**: Extract common patterns into separate components

---

## 📝 Next Steps

1. Review specific page structure for feature you're working on
2. Look at similar components for patterns to follow
3. Check Redux store for state shape
4. Review API integration in services/
5. Test component in isolation before integration

---

## 🔴 Important: Admin Dashboard Cleanup Needed

### Current Status (Code Verified)

**PRIMARY ACTIVE ADMIN DASHBOARD** ✅
- **File**: `AdminDashboard.js`
- **Route**: `/admin-panel/dashboard`
- **Container**: `AdminPanel.js` (sidebar navigation)
- **Status**: Actively used, in production
- **Features**:
  - Overall statistics (users, orders, revenue, active projects)
  - Pending actions dashboard (payments, renewals, invoices, updates, tickets, withdrawals)
  - Workspace activity summary
  - Real-time stats from backend

**ORPHANED/UNUSED FILES** ❌
- `AdminCustomerDashboard.js`
  - Tab-based interface (6 tabs)
  - NOT imported in any route
  - NOT referenced anywhere in codebase
  - Status: **Unused, can be deleted**
  - Recommendation: Remove or archive

- `AdminCustomerPortal.js`
  - Section-based scrollable layout
  - Shows top 5 items from each section
  - NOT imported in any route
  - NOT referenced anywhere in codebase
  - Status: **Unused, can be deleted**
  - Recommendation: Remove or archive

### Why They Exist

These appear to be alternative implementations or earlier versions that were replaced by `AdminDashboard.js`. They share same backend APIs but different UI approaches:

| Aspect | AdminDashboard | AdminCustomerDashboard | AdminCustomerPortal |
|--------|---|---|---|
| Layout | Cards + Statistics | Tabs (6 total) | Scrollable Sections |
| Data Display | Overview dashboard | Tab-based switching | All sections visible |
| API Calls | 12 parallel fetches | Similar fetches | Similar fetches |
| Status | ✅ ACTIVE | ❌ UNUSED | ❌ UNUSED |
| Route | `/admin-panel/dashboard` | None | None |

### Action Items

1. **Verify these files are not used elsewhere**
   - Done: Grep search confirms no imports/references
   
2. **Consider deletion**
   - Safe to delete `AdminCustomerDashboard.js`
   - Safe to delete `AdminCustomerPortal.js`
   - Keep `AdminDashboard.js` (PRIMARY)

3. **Update documentation**
   - ✅ Done in this guide
   - Update main architecture doc

