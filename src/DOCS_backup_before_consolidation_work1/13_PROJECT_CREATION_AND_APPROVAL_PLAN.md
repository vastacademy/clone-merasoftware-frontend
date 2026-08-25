# New Project Creation and Approval Plan

**Status**: Architecture locked; admin project-product UI form implemented, backend creation not started  
**Scope**: Admin project-product creation first, customer purchase and approval integration second  
**Source of truth**: Existing customer/order backend and the order-owned dynamic project timeline

## 1. Confirmed direction

The next system will first create and manage reusable project products from the admin panel. Existing project migration will be handled later. New project creation must work correctly for future projects without waiting for historical migration.

Planned admin navigation:

```text
Admin main page
└── Website Management
    └── Projects
        ├── Project list
        ├── Create project
        ├── Edit project
        ├── Hide/show project
        └── Project details
```

`Website Management > Projects` has an active UI-only route and sidebar entry at `/admin-panel/website-management/projects`, plus the UI-only Add Project form at `/admin-panel/website-management/projects/add`. The list and form do not read or write products yet. `AllProducts`, `UploadProduct`, and `AdminEditProduct` remain legacy/unrouted product-management code and are not the final foundation without redesign. For the complete audited file/state index, read `14_CODEBASE_AUDIT_INDEX.md`.

### Current Add Project UI contract

The current form presents Project Name, Category, Starting Node Title, conditional Total Pages for website categories, Base Price, Selling Price, optional Project Image, Description / Specifications, Who is it for?, What's Included, and Visibility. Description / Specifications uses the shared rich-text editor. Who is it for? and What's Included retain resizable, scrollable textarea behavior; pressing Enter creates a visible new line with a subtle separator and each existing line can be removed with its `×` control. These fields are UI-only until the product API and save contract are approved.

## 2. Verified current customer purchase flow

1. Customer opens a product from Home/category listing.
2. `ProductDetails` loads the product and compatible additional features.
3. Customer selects features, coupon, full/partial payment, and payment method.
4. `DirectPayment` calls `POST /api/create-order`.
5. The order is created with `orderVisibility: pending-approval`.
6. UPI/QR payment creates a pending transaction.
7. Admin approves the transaction through the existing approval flow.
8. Approval changes the order to `approved`; pending orders become `in_progress`.
9. Customer sees the order through `ProjectsAndPlans` and opens `ProjectDetails`.

Product creation must not create a customer order, bypass payment, or create an active project timeline by itself.

## 3. Verified product/project categories

| Category | Current meaning | Current category-specific fields | New project creation requirement |
|---|---|---|---|
| `standard_websites` | Standard website project | `totalPages` from 4–50; old product checkpoints are generated from fixed pages/structure/testing | Project fields plus mandatory `startingNodeTitle`; no predefined future nodes |
| `dynamic_websites` | Dynamic website project | `totalPages` from 4–50; old product checkpoints are generated similarly | Project fields plus mandatory `startingNodeTitle`; no fixed future-node template |
| `cloud_software_development` | Cloud/software project | Old product contains a fixed 20-step checkpoint template | Project fields plus mandatory `startingNodeTitle`; no fixed future-node template |
| `app_development` | Mobile/app development project | Current product model reuses the cloud checkpoint template; some app products have no checkpoints | Project fields plus mandatory `startingNodeTitle`; no fixed future-node template |
| `website_updates` | Update plan, not a project timeline | `validityPeriod`, `updateCount`, renewable/limited plan fields | Remains in the existing plan system; excluded from project node creation |
| `feature_upgrades` | Feature/add-on product | `compatibleWith`, `keyBenefits`, additional feature relationships | Not a standalone project; remains an add-on/product relationship |

## 4. Product fields for the new admin form

### Common project fields

- Project name (`serviceName`)
- Project category
- Project description/specifications (`formattedDescriptions`)
- Selling price and internal/base price
- Project images
- Package includes
- Perfect-for/customer-fit information
- Compatible/additional feature relationships where applicable
- Mandatory Starting Node Title
- Visibility status (`isHidden`)

The Starting Node Title belongs to the reusable product template. It is copied into the customer order only when the project becomes active through the approved project-start lifecycle. Later product edits must not rewrite an already-started order's node.

### Standard and dynamic website fields

- Total pages, constrained to 4–50
- Page-count/additional-page commercial configuration where supported
- No future checkpoint list in the new product form
- No percentage weights for future work

### Cloud software and app fields

- No website page-count field
- Project-specific description/specifications
- Mandatory Starting Node Title
- No predefined cloud 20-step future timeline

### Fields that must not control the new project timeline

- Product `checkpoints[]` percentage weights
- Fixed website structure/page/testing checkpoint generation
- Cloud software fixed checkpoint list
- Any automatic future-node generation in product save or order creation

Legacy checkpoint fields remain available only for existing data/migration compatibility until migration is verified.

## 5. Project product versus customer project order

| Operation | Source of truth | Result |
|---|---|---|
| Admin creates a project product | `productModel` | Reusable catalog product with Starting Node Title; no customer/order/node is created |
| Customer buys the project | Existing order/payment flow | Customer-specific order is created as pending approval |
| Admin approves payment | Existing transaction/order flow | Order becomes approved/in progress |
| Project starts | Approved order | Product Starting Node Title is copied into an order-owned 0% node |
| Admin updates project | Order-owned dynamic timeline | New cumulative nodes/events/messages are persisted on the order |

The product is a template. The order owns the actual project history. There will be no separate admin project database or parallel node source.

## 6. Approval phase after product creation

1. Customer purchase creates a pending order using the selected product.
2. Pending orders do not receive an active project timeline.
3. Payment approval activates the order.
4. Activation initializes exactly one order-owned 0% node from the product's Starting Node Title.
5. Initialization is idempotent; repeated approval/retry cannot create duplicate starting nodes.
6. Future updates use cumulative progress and the dynamic node lifecycle defined in `admin-nodes.md`.

Rejected or still-pending orders must never receive a false active project timeline.

## 7. Regression guardrails

- Keep customer product listing, `ProductDetails`, compatible features, pricing, and `DirectPayment` contracts working.
- Keep wallet, UPI, installments, transactions, invoices, and order visibility behavior unchanged except for the approved activation hook.
- Keep `orderProductModel` as the order/project SSOT.
- Do not change plans while implementing project creation.
- Do not use product checkpoints as the new dynamic node engine.
- Do not create a project order from the admin product form.
- Do not create a starting node before approved project activation.
- Do not physically delete old checkpoint history during product-creation work.
- New admin routes must require admin authorization.
- Existing project migration remains a separate controlled phase with dry-run mapping and rollback evidence.

## 8. Planned implementation order

### Phase A: Admin project-product management

- Add the admin main-page `Website Management` section.
- Add the `Projects` tab and project list.
- Add the new project create/edit form using the fields above.
- Add backend product validation for project categories and Starting Node Title.
- Stop new products from generating predefined future checkpoints.
- Preserve existing product listing APIs needed by the customer portal.

### Phase B: Customer purchase compatibility

- Verify the new product response still supports Home, category listing, `ProductDetails`, compatible features, pricing, and `DirectPayment`.
- Keep order creation and payment calculations compatible.
- Ensure new orders are pending approval and do not receive an active node early.

### Phase C: Approved project start

- Add approval-to-start integration.
- Copy Starting Node Title into the order-owned 0% node exactly once.
- Preserve existing order status, progress, and payment behavior.

### Phase D: Existing project migration

- Migrate completed historical projects and zero-progress pending projects only after the new-project path is proven.
- Preserve old history/messages and maintain rollback evidence.

## 9. Current implementation status

- Dynamic order-owned node schema/service exists in backend code.
- Admin node endpoints exist but intentionally require a migrated timeline.
- Existing orders remain on legacy timeline version `0`.
- Clients-style `Website Management > Projects` list UI and route now exist, but the list is intentionally empty until the new product API is approved and wired.
- Add Project currently opens a UI-only form; it does not create a product or call a backend save API.
- Product Starting Node Title is present in the UI form but is not yet connected to the active product model/API.
- Approval-to-start initialization is not yet wired.
