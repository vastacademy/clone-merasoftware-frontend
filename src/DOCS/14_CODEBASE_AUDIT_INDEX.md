# Codebase Audit Index and AI Handoff

**Audit scope**: Full project-product, customer purchase, payment approval, admin workspace, node timeline, customer project view, activity sorting, and documentation flow.  
**Audit date**: 2026-07-19  
**Project root**: `E:\merasoftware-new`  
**Build status**: `npm run build` was not run.  
**Database status**: Read-only audit queries only; no database migration/update/delete was run.

This file is the central handoff index. It records what was verified in code and current data, what is active, what is legacy, what has already been implemented, and what must happen next. Read it with `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` and `admin-nodes.md` before any new implementation.

## 1. User-confirmed architecture and scope

- Work must remain evidence-based; no guess-based implementation.
- The system must use one source of truth.
- No separate admin backend, admin database, or parallel project/node store.
- Project products and customer project orders are separate operations.
- Admin creates reusable project products first under `Website Management > Projects`; the UI list shell now exists, while product API/form wiring remains pending.
- Customer purchase remains on the existing product -> payment -> approval flow.
- Only an approved project receives its order-owned 0% Starting Node.
- Existing project migration will happen later, after new-project creation is proven.
- Plans remain separate from project nodes.
- New project nodes are dynamic, cumulative, auditable, soft-deletable, restorable, resettable, and customer-visibility controlled.

## 2. Active frontend route and component map

| Area | Active source | Verified role |
|---|---|---|
| Public entry | `frontend/src/routes/publicRoutes.js`, `RoleBasedHome` | Public home/category/product entry |
| Customer dashboard | `frontend/src/routes/customerRoutes.js`, `CustomerDashboard.js` | Customer launchpad |
| Customer project/plan list | `ProjectsAndPlans.js` | Active project and plan list |
| Customer product detail | `ProductDetails.js` | Product details, compatible features, coupon, payment handoff |
| Customer payment | `DirectPayment.js` | Full/partial wallet or UPI payment and order creation |
| Customer project detail | `ProjectDetails.js` | Current checkpoint-driven customer/admin read view |
| Customer start-new-project UI | `StartNewProject.js`, `StartNewProjectDetail.js`, `data/sampleStartNewProjects.js` | Active UI-only sample project grid at `/start-new-project` (tab-filtered by category, matches `ProjectsAndPlans.js` shell) and detail subpage at `/start-new-project/:projectId`; "Proceed to Payment" has no handler yet, no backend wiring. See `15_START_NEW_PROJECT_UI_HISTORY.md` for the full design-iteration and backup history. |
| Admin shell/dashboard | `AdminDashboard.js`, `AdminLayout.js`, `AdminHeader.js` | Active admin shell and dashboard |
| Admin client list | `AdminClientsPage.js` | Client list sorted by `latestActivityAt`; sort/refresh stay in the dark header and the full-width search row is below it |
| Admin client workspace | `AdminClientWorkspace.js` | Active client overview, projects, plans, payments, project subpage |
| Admin project-product UI | `AdminProjectProductsPage.js`, `AdminCreateProjectPage.js`, `AdminLayout.js`, `adminRoutes.js` | Active Clients-style list shell at `/admin-panel/website-management/projects` and UI-only Add Project form at `/admin-panel/website-management/projects/add`; API and save are not wired |
| Admin node detail/update UI | `components/admin/AdminProjectCheckpointDetail.js` | Current local node/template UI; new API wiring is not connected yet |
| Legacy node modal | `components/admin/ProjectWorkspaceModal.js` | Legacy/unrouted UI using old missing endpoint contracts |
| Legacy product UI | `AllProducts.js`, `UploadProduct.js`, `AdminEditProduct.js` | Existing but not active admin route; generates old predefined checkpoints |

### Current admin route facts

Active admin routes include dashboard, clients, client detail/workspace, payment record detail, admin project detail, the UI-only project-product list at `/admin-panel/website-management/projects`, and its UI-only Add Project form at `/admin-panel/website-management/projects/add`. Project-product data/create/edit APIs are not implemented or connected yet.

## 3. Verified customer purchase and approval flow

```text
Home/category listing
  -> ProductDetails
  -> DirectPayment
  -> POST /api/create-order
  -> pending-approval order
  -> pending transaction for UPI/QR where applicable
  -> admin transaction approval
  -> order approved/in_progress
  -> customer ProjectsAndPlans
  -> customer ProjectDetails
```

Verified consequences:

- Product creation must not create an order.
- Product creation must not bypass payment.
- Pending/rejected orders must not receive an active project timeline.
- Approval is the correct lifecycle point to copy the product Starting Node Title into the order's 0% node.
- Approval initialization must be idempotent.

Primary evidence: `ProductDetails.js`, `DirectPayment.js`, `backend/controller/order/createOrder.js`, `backend/controller/user/transactionApprovalController.js`, `backend/routes/index.js`.

## 4. Verified project/product category matrix

| Category | Business meaning | Current fields/behavior | New-system treatment |
|---|---|---|---|
| `standard_websites` | Standard website project | `totalPages` 4–50; automatic structure/page/testing checkpoints | Project product with mandatory `startingNodeTitle`; no predefined future checkpoint template |
| `dynamic_websites` | Dynamic website project | `totalPages` 4–50; automatic website checkpoints | Project product with mandatory `startingNodeTitle`; no fixed future-node template |
| `cloud_software_development` | Cloud/software project | Fixed cloud checkpoint template in product model/order creation | Project product with mandatory `startingNodeTitle`; no fixed future nodes |
| `app_development` | Mobile/app project | Product model currently reuses cloud checkpoint template; some products have no checkpoints | Project product with mandatory `startingNodeTitle`; no fixed future nodes |
| `website_updates` | Update plan, not a project timeline | `validityPeriod`, `updateCount`, renewable/limited plan fields | Remains plan system; excluded from project node creation |
| `feature_upgrades` | Add-on/feature product | `compatibleWith`, `keyBenefits`, additional feature relationships | Not a standalone project timeline |

### Product form field audit

Current common product fields include `serviceName`, `category`, `packageIncludes`, `perfectFor`, `serviceImage`, `price`, `sellingPrice`, `formattedDescriptions`, `additionalFeatures`, `compatibleWith`, and `isHidden`.

Current conditional fields:

- Website projects: `totalPages` with 4–50 validation.
- Website updates: `validityPeriod`, `updateCount`, renewable/limited-plan fields.
- Feature upgrades: `compatibleWith`, `keyBenefits` and related product relationships.
- Cloud/app products: old checkpoint templates; these are to be retired for new products.

Required new project field: `startingNodeTitle`.

## 5. Backend source-of-truth map

| Concern | Source | Current status |
|---|---|---|
| Customer/project order | `backend/models/orderProductModel.js` | Existing SSOT; now extended with canonical timeline fields |
| Product template | `backend/models/productModel.js` | Existing product source; Starting Node Title not added yet |
| Customer workspace | `getAdminUserWorkspace.js` | Existing SSOT read bundle |
| Full order detail | `getOrderDetails.js` | Admin/customer read path; customer dynamic timeline filtering added |
| Client activity sorting | `getAdminClients.js` | Existing endpoint; now reads dynamic node event timestamps too |
| Order creation | `createOrder.js` | Still contains old predefined checkpoint generation; must be updated for new products |
| Payment approval | `transactionApprovalController.js` | Existing order activation; approved-start node initialization still pending |
| Admin auth | `middleware/authToken.js` plus `req.userRole` checks | Existing cookie/JWT role path |
| Active route registry | `backend/routes/index.js` | Existing routes plus new migrated-timeline-gated node routes |
| Plans/invoices/payments | Existing plan/order/invoice/transaction models/controllers | Must remain separate and regression-safe |

## 6. Dynamic node implementation already completed

### Order-owned fields added

`orderProductModel.js` now contains:

- `projectTimelineVersion` (`0` legacy, `1` canonical)
- `projectTimelineInitialized`
- `projectRuns[]`
- `projectNodes[]`
- `projectNodeEvents[]`
- message linkage fields for `nodeId`, `runId`, and `senderId`

The old checkpoint fields remain for compatibility. Existing orders are not automatically migrated.

### Canonical service

`backend/helpers/projectNodeService.js` owns:

- Idempotent 0% timeline initialization
- Active run/progress lookup
- Cumulative progress validation
- Node creation
- Soft delete
- Restore blocking when later active nodes have equal/lower progress
- Client visibility updates
- Reset/archive and new-run creation
- Progress/status synchronization

### Admin node routes

`backend/controller/order/projectNodeController.js` and `backend/routes/index.js` provide admin-only routes under:

- `POST /api/admin/projects/:orderId/nodes`
- `POST /api/admin/projects/:orderId/nodes/delete`
- `POST /api/admin/projects/:orderId/nodes/restore`
- `POST /api/admin/projects/:orderId/nodes/visibility`
- `POST /api/admin/projects/:orderId/nodes/reset`

These routes intentionally reject legacy timeline version `0` orders until migration/initialization is completed. The old `SummaryApi.updateProjectProgress` and `/api/update-project-progress` contract is legacy and not the canonical new-node contract.

## 7. Actual database audit evidence

Read-only audit against the current database returned:

- Total orders: `13`
- Project orders: `9`
- Completed project orders: `7`
- Zero-progress/planning project orders: `2`
- Partially completed project orders: `0`
- Completed checkpoints had `completedAt` values.
- Existing completed projects contain messages linked to old checkpoints.
- Completed project totals are generally `100`; one verified completed project has old checkpoint weight sum `99.91` while order progress is `100`, so migration must preserve verified order progress.
- Plans/update orders have no project checkpoint timeline and must remain outside node migration.

Product audit also confirmed existing product records use old checkpoint templates such as `Website Structure ready` and `Project Initiation`. These titles can be used as evidence for historical migration mapping, but the future product form must explicitly store Starting Node Title.

## 8. Current state versus pending work

### Complete

- Full current product/order/admin/customer flow audit
- Real database read-only audit
- Order-owned canonical dynamic node schema
- Canonical node lifecycle service
- Admin node API layer with legacy-order gate
- Customer timeline filtering for canonical fields
- Admin client activity aggregation for node events
- Clients-style `Website Management > Projects` list UI, nested sidebar entry, and protected route
- Projects list search placement and compact list layout aligned with the Clients page
- UI-only `AdminCreateProjectPage` Add Project form (no backend wiring; most inputs are unmanaged local state)
- UI-only customer `/start-new-project` sample project grid and `/start-new-project/:projectId` detail subpage, with the sidebar quick link restored and pointed at the new route
- `DashboardLayout`/`AdminLayout` sidebar changed from `position: fixed` to `sticky` inside a flex row with the content column, so the page footer runs full-width below both sidebar and content instead of only following content height
- `Footer.js` desktop content now shares the same `mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8` wrapper as `AdminWorkspaceShell`, so footer columns align with sidebar-adjacent page content instead of centering independently
- Documentation/index update

### Pending next

1. Add the new product API/data source to the existing Clients-style Projects list.
2. Connect the existing Add Project UI form to the approved product create contract, then build edit/manage screens.
3. Add `startingNodeTitle` to product model and new project-product validation.
4. Remove predefined future-node generation from new product save/order creation while preserving legacy data.
5. Verify customer product listing, ProductDetails, compatible features, pricing, and DirectPayment compatibility.
6. Wire transaction approval to idempotent 0% starting-node initialization.
7. Connect active admin project UI to canonical node APIs.
8. Connect customer ProjectDetails to canonical visible timeline fields.
9. Run migration dry-run for existing completed and zero-progress orders.
10. Execute controlled migration only after new-project flow passes verification.

## 9. Regression boundaries

- Do not create a second project/node database.
- Do not use product `checkpoints[]` as the new dynamic timeline.
- Do not physically delete old completed history during product creation.
- Do not initialize a node for pending/rejected orders.
- Do not change plans, invoices, payments, tickets, or update-plan behavior in the project-product phase.
- Do not reuse full-order delete for node soft deletion.
- Preserve `projectProgress`, order status, order visibility, product listing fields, and payment response contracts.
- Keep admin authorization and customer ownership filtering in every new read/write route.
- Do not retire old fields until migration, customer/admin compatibility, and rollback evidence are verified.

## 10. Documentation entry points

- `14_CODEBASE_AUDIT_INDEX.md` — this complete audit handoff and current implementation/pending-state index
- `README.md` — documentation index and current high-level map
- `00_CURRENT_SYSTEM.md` — active application behavior
- `04_BACKEND_OVERVIEW.md` — backend architecture and dynamic node status
- `05_QUICK_REFERENCE.md` — file/route lookup
- `12_CLIENT_ACTIVITY_SORT_AUDIT.md` — activity sorting and node write-path history
- `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` — approved new project-product and approval plan
- `admin-nodes.md` — dynamic node requirements, rules, and implementation phases
- `admin-plan.md` — admin strategy and project creation sequence
- `AdminProjectProductsPage.js` — current UI-only Projects list screen; no API or database writes
- `AdminCreateProjectPage.js` — current UI-only Add Project form; no API or database writes
