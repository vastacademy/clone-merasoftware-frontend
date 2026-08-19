# Historical Codebase Audit Index

> Superseded for current project architecture on 2026-08-19. Start with `00_CURRENT_SYSTEM.md`: projects are private, admin-created client orders with a frozen `projectSnapshot`; there is no project catalogue, project-product route, or customer self-created project flow. This document remains only as pre-migration history.

**Audit scope**: Full project-product, customer purchase, payment approval, admin workspace, node timeline, customer project view, activity sorting, and documentation flow.  
**Original audit date**: 2026-07-19 (sections below refreshed as of the node-system migration/schema-cleanup session — see the note under each stale section for what changed)  
**Project root**: `E:\merasoftware-new`  
**Database status**: Read-only audit queries plus one approved, evidence-first, backup-first data migration (`backend/scripts/migratePreExistingOrdersToNodeSystem.js`) and one approved schema cleanup, both described in `39_PROJECT_NODE_SYSTEM_PHASE_2_3_DONE_PHASE_4_PENDING.md`.

This file is the central handoff index. It records what was verified in code and current data, what is active, what is legacy, what has already been implemented, and what must happen next. Read it with `39_PROJECT_NODE_SYSTEM_PHASE_2_3_DONE_PHASE_4_PENDING.md` (current node-system status — supersedes this file's original Section 6/7 node-system snapshot) and `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` before any new implementation.

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
| Customer project detail | `ProjectDetails.js` | Dynamic node-driven customer read view (migrated off `checkpoints`, reads `order.projectNodes`) |
| Customer start-new-project UI | `StartNewProject.js`, `StartNewProjectDetail.js`, `components/ProjectDetailView.js` | Live-wired list-row view at `/start-new-project` (fetches real products via `GET /api/get-product`, excludes `website_updates`/`feature_upgrades`, tab-filtered by category, dark-gradient-banner header) and detail subpage at `/start-new-project/:projectId` (fetches via `POST /api/product-details`, renders the new shared `ProjectDetailView.js` component: description -> what's included -> add-on feature checkboxes -> who is it for -> two proceed buttons, no price shown). Both proceed buttons (with/without payment) are UI-only no-ops. `data/sampleStartNewProjects.js` is retired/unused. See `15_START_NEW_PROJECT_UI_HISTORY.md` for the original design-iteration/backup history and `18_PROJECT_DETAIL_PAGE_AND_HEADER_REWORK.md` for the detail-page rebuild and header unification. |
| Admin shell/dashboard | `AdminDashboard.js`, `AdminLayout.js`, `AdminHeader.js` | Active admin shell and dashboard |
| Admin client list | `AdminClientsPage.js` | Client list sorted by `latestActivityAt`; sort/refresh stay in the dark header and the full-width search row is below it |
| Admin client workspace | `AdminClientWorkspace.js` | Active client overview, projects, plans, payments, project subpage |
| Admin project-product UI | `AdminProjectProductsPage.js`, `AdminCreateProjectPage.js`, `AdminLayout.js`, `adminRoutes.js` | Active Clients-style list shell at `/admin-panel/website-management/projects` and UI-only Add Project form at `/admin-panel/website-management/projects/add`; API and save are not wired |
| Admin node detail/update UI | `components/admin/AdminProjectCheckpointDetail.js` | Live-wired to real node/message API calls (Add Node/Add Node & Send), not local-state-only |
| Legacy node modal | `components/admin/ProjectWorkspaceModal.js` | Legacy/unrouted UI using old missing endpoint contracts (confirmed permanently unreachable — pending Phase 4 dead-code cleanup) |
| Legacy product UI | `AllProducts.js`, `UploadProduct.js`, `AdminEditProduct.js` | Existing but not active admin route; still references old predefined-checkpoint concepts internally, but no longer relevant since the schema field is gone — pending Phase 4 dead-code cleanup |

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
- Pending/rejected orders must not receive an active project timeline (the flow above still creates the order in `pending-approval` first — node initialization does not grant early project-visible status).

**Before/after**: this section originally planned for the product's Starting Node Title to be copied into the order's 0% node at the *approval* lifecycle step specifically. As implemented, `initializeProjectTimeline()` is actually called at order-*creation* time in `createOrder.js` (for website-category orders) — simpler than a separate approval-time step, and still idempotent (`initializeProjectTimeline()` no-ops if a timeline already exists).

Primary evidence: `ProductDetails.js`, `DirectPayment.js`, `backend/controller/order/createOrder.js`, `backend/controller/user/transactionApprovalController.js`, `backend/routes/index.js`.

## 4. Verified project/product category matrix

| Category | Business meaning | Current fields/behavior |
|---|---|---|
| `standard_websites` | Standard website project | `totalPages` 4–50; `startingNodeTitle` for the order's first dynamic node |
| `dynamic_websites` | Dynamic website project | `totalPages` 4–50; `startingNodeTitle` for the order's first dynamic node |
| `cloud_software_development` | Cloud/software project | `startingNodeTitle` for the order's first dynamic node |
| `app_development` | Mobile/app project | `startingNodeTitle` for the order's first dynamic node |
| `website_updates` | Update plan, not a project timeline | `validityPeriod`, `updateCount`, renewable/limited plan fields; excluded from project node creation |
| `feature_upgrades` | Add-on/feature product | `compatibleWith`, `keyBenefits`, additional feature relationships; not a standalone project timeline |

**Before/after**: this table originally described a "New-system treatment" column contrasting each category's then-current predefined-checkpoint behavior against a planned future node system. That transition is complete — the predefined-checkpoint columns/behavior no longer exist (schema field removed), so the table above shows only current fields.

### Product form field audit

Current common product fields include `serviceName`, `category`, `packageIncludes`, `perfectFor`, `serviceImage`, `price`, `sellingPrice`, `formattedDescriptions`, `additionalFeatures`, `compatibleWith`, and `isHidden`.

Current conditional fields:

- Website projects: `totalPages` with 4–50 validation; `startingNodeTitle` (required for the dynamic node system).
- Website updates: `validityPeriod`, `updateCount`, renewable/limited-plan fields.
- Feature upgrades: `compatibleWith`, `keyBenefits` and related product relationships.

**Before/after**: "Cloud/app products: old checkpoint templates" and "Required new project field: `startingNodeTitle`" (as a future item) are no longer applicable — the checkpoint templates are removed and `startingNodeTitle` is a live, already-added field, not a pending one.

## 5. Backend source-of-truth map

| Concern | Source | Current status |
|---|---|---|
| Customer/project order | `backend/models/orderProductModel.js` | SSOT; canonical timeline fields (`projectNodes`/`projectRuns`/`projectNodeEvents`/`projectTimelineVersion`) live for every order; legacy `checkpoints` field/hooks removed |
| Product template | `backend/models/productModel.js` | `startingNodeTitle` field live; legacy `checkpoints`/`checkpointSchema`/`CLOUD_SOFTWARE_CHECKPOINTS`/`setWebsiteCheckpoints()` removed |
| Customer workspace | `getAdminUserWorkspace.js` | Existing SSOT read bundle |
| Full order detail | `getOrderDetails.js` | Admin/customer read path; customer dynamic timeline filtering (`getCustomerTimeline()`) live |
| Client activity sorting | `getAdminClients.js` | Existing endpoint; reads `projectNodeEvents` timestamps as an activity source (its `order.checkpoints` reference is now effectively dead — the field no longer exists on any order, so that specific activity source never fires) |
| Order creation | `createOrder.js` | Product-based (catalog) path; calls `initializeProjectTimeline()` for website-category orders — no predefined checkpoint generation |
| Custom-project order creation (customer) | `customerCreateCustomProjectOrder.js` | Product-less path for the Customize flow (`POST /api/customer/custom-project-order`); customer-side twin of `adminCreateProjectOrder.js` — builds a hidden `isCustomClientProject` product, re-derives price server-side (`categoryBasePrice` + compatible `feature_upgrades`, pages priced per `pageCount`), creates a `pending-approval` order, calls `initializeProjectTimeline()`, and (partial) `buildInstallments` 2⇒50/50 or 3⇒30/30/40. Paid in-page via `/wallet/verify-payment` (see `42_...md`) |
| Payment approval | `transactionApprovalController.js` | Existing order activation; node initialization happens via `createOrder.js`/`adminCreateProjectOrder.js`/`customerCreateCustomProjectOrder.js` at order-creation time, not a separate approval-time step |
| Admin auth | `middleware/authToken.js` plus `req.userRole` checks | Existing cookie/JWT role path |
| Active route registry | `backend/routes/index.js` | Existing routes plus migrated-timeline-gated node routes (`/api/admin/projects/:orderId/nodes...`) |
| Plans/invoices/payments | Existing plan/order/invoice/transaction models/controllers | Must remain separate and regression-safe |

## 6. Dynamic node implementation (updated — this section originally described a still-pending system; it is now fully live)

### Order-owned fields added

`orderProductModel.js` now contains:

- `projectTimelineVersion` (`1` for every `isWebsiteProject: true` order — new and pre-existing; `0` only for the 4 non-website legacy orders the node system doesn't support)
- `projectTimelineInitialized`
- `projectRuns[]`
- `projectNodes[]`
- `projectNodeEvents[]`
- message linkage fields for `nodeId`, `runId`, and `senderId`

**Before/after**: at the original audit date, the old `checkpoints[]` field (and its `productModel.js` counterpart, `checkpointSchema`/`CLOUD_SOFTWARE_CHECKPOINTS`/`setWebsiteCheckpoints()`) still existed for compatibility and no orders had been migrated. Both have since been removed from the schema — every website-project order, including the 9 that predated the node system, is on the dynamic node system end to end. Full migration evidence, the decision record, and the schema-cleanup diff are in `39_PROJECT_NODE_SYSTEM_PHASE_2_3_DONE_PHASE_4_PENDING.md`.

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

## 7. Database audit evidence (updated — the migration this section anticipated has since run)

**Original snapshot (2026-07-19, for historical reference only — do not treat as current)**: 13 total orders, 9 project orders (7 completed, 2 zero-progress, 0 partially-completed), completed checkpoints had `completedAt` values, one verified completed project had checkpoint weight sum `99.91` vs order progress `100`.

**Current state**: the same 9 pre-existing website-project orders were migrated via `backend/scripts/migratePreExistingOrdersToNodeSystem.js` — one node per previously-completed checkpoint (running-sum cumulative progress; same-value duplicate steps, caused by 0%-weight checkpoints, merged into one node rather than artificially inflated). All 9 now read `projectTimelineVersion: 1` with real per-checkpoint node history, re-verified against the live DB post-migration. The 4 non-website legacy orders (no project checkpoint timeline, confirmed unrelated to plans/updates) were left untouched — the node system doesn't support their type. The legacy product-template checkpoint titles (`Website Structure ready`, `Project Initiation`, etc.) that this section originally flagged as future migration-mapping evidence were the actual titles used for the migrated nodes. See `39_PROJECT_NODE_SYSTEM_PHASE_2_3_DONE_PHASE_4_PENDING.md` for full before/after detail and the backup file locations.

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
- `AdminCreateProjectPage` Add Project form: all fields now wired to local state, reordered so category is classification-only and selected last, Additional Features multi-select live-wired to `GET /api/get-product` (`feature_upgrades` category, no category filtering), Who is it for?/What's Included using legacy fixed-dropdown `PackageSelect`/`perfectForOptions.js`/`packageOptions.js`. Still no backend save API/wiring. See `17_ADD_PROJECT_FORM_AND_PERFECT_FOR_AUDIT.md`.
- Fixed a real data bug: 6 of 8 `feature_upgrades` category products had `isHidden` stored as string `"false"` instead of boolean `false`, silently excluding them from `GET /api/get-product`. Corrected via raw MongoDB driver update, scoped only to those documents. Other product categories not yet audited for the same issue.
- Customer `/start-new-project` list page live-wired to real product data via existing `GET /api/get-product` (no backend changes needed); `/start-new-project/:projectId` detail subpage live-wired via existing `POST /api/product-details`; sidebar quick link restored and pointed at the route. `data/sampleStartNewProjects.js` is now unused/retired. See `15_START_NEW_PROJECT_UI_HISTORY.md`.
- `StartNewProject.js` list layout changed from card-grid to list-row (matches `ProjectsAndPlans.js` list pattern); price intentionally not shown on the list row.
- Shared `frontend/src/components/CustomerWorkspaceTabs.js` underline-style tab component added (mirrors admin's `AdminWorkspaceTabs.js`) and wired into `StartNewProject.js`, `ProjectsAndPlans.js`, `OrderPage.js`, and `UserInvoices.js`, replacing the earlier pill-style tab buttons on all four for visual consistency across the customer portal.
- `DashboardLayout`/`AdminLayout` sidebar changed from `position: fixed` to `sticky` inside a flex row with the content column, so the page footer runs full-width below both sidebar and content instead of only following content height
- `Footer.js` desktop content now shares the same `mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8` wrapper as `AdminWorkspaceShell`, so footer columns align with sidebar-adjacent page content instead of centering independently
- Documentation/index update
- New shared `frontend/src/components/ProjectDetailView.js` component built and wired into `StartNewProjectDetail.js`, replacing its previous inline detail markup. Section order (final, explicit): description -> what's included -> add-on feature checkboxes -> who is it for -> two proceed buttons ("Add to Cart & Proceed to Payment" / "Submit Project Request (Without Payment)", both UI-only no-ops). No price is shown anywhere on this page. `?` info-tooltips added for secondary detail on two section headings to keep visible text minimal without dropping information.
- Dark-gradient-banner header (matching the pre-existing `ProjectDetails.js` header) now also used by `StartNewProjectDetail.js` (via `ProjectDetailView.js`), `ProjectsAndPlans.js`, and `StartNewProject.js` — an explicit, scoped user decision to unify these four pages' header styling. Admin list pages (`AdminClientsPage.js`, `AdminProjectProductsPage.js`) were not touched and intentionally still use their own separate header pattern.
- A first admin-panel project detail page (`AdminProjectDetailPage.js`, dummy data) was built, then explicitly rejected and fully reverted (file deleted, route removed, `AdminProjectProductsPage.js`'s `handleProjectOpen` restored to its original toast-only placeholder) after the user redirected the approach: perfect the customer detail page first, reuse it for admin later. See `18_PROJECT_DETAIL_PAGE_AND_HEADER_REWORK.md` for the full history, rationale, and the confirmed reuse pattern for the next attempt.

### Pending next

**Node-system items originally listed here are done** (items 3, 4, 6, 7, 8, 9, 10 from the original list: `startingNodeTitle` added, predefined future-node generation removed from both product save and order creation, transaction approval wired to idempotent starting-node init via `initializeProjectTimeline()`, admin/customer UI connected to canonical node APIs, and the pre-existing-order migration dry-run + execution both completed). See `39_PROJECT_NODE_SYSTEM_PHASE_2_3_DONE_PHASE_4_PENDING.md` for what's still open in that system (dead-code cleanup only — `ProjectWorkspaceModal.js`, unused `emailService.js` exports, unrouted `UploadProduct.js`/`AdminEditProduct.js`).

Still open, unrelated to the node system:

1. Add the new product API/data source to the existing Clients-style Projects list.
2. Connect the existing Add Project UI form to the approved product create contract, then build edit/manage screens.
3. Verify customer product listing, ProductDetails, compatible features, pricing, and DirectPayment compatibility.
4. Build the admin-panel project detail/manage page: a thin new admin route/page that reuses `components/ProjectDetailView.js` (not a duplicate/branch) inside `AdminLayout`, wrapped with an admin action bar (Edit -> navigate to `AdminCreateProjectPage.js` in edit mode, Delete). Requires explicit scoping/approval before coding, per this project's standing rules. See `18_PROJECT_DETAIL_PAGE_AND_HEADER_REWORK.md`.
5. Decide and wire the real business logic behind `ProjectDetailView.js`'s two proceed buttons ("Add to Cart & Proceed to Payment", "Submit Project Request (Without Payment)") — currently both are UI-only no-ops; the exact meaning of "without payment" (booking vs. enquiry-only vs. something else) is explicitly undecided.

## 9. Regression boundaries

- Do not create a second project/node database.
- Do not physically delete old completed history during product creation.
- Do not initialize a node for pending/rejected orders.
- Do not change plans, invoices, payments, tickets, or update-plan behavior in the project-product phase.
- Do not reuse full-order delete for node soft deletion.
- Preserve `projectProgress`, order status, order visibility, product listing fields, and payment response contracts.
- Keep admin authorization and customer ownership filtering in every new read/write route.

**Before/after**: this section originally also said "do not use product `checkpoints[]` as the new dynamic timeline" and "do not retire old fields until migration/compatibility/rollback evidence are verified" — both were about the legacy checkpoint field, which no longer exists in the schema (removed only after the migration ran and was re-verified against the live DB; a full backup was taken first). See `39_PROJECT_NODE_SYSTEM_PHASE_2_3_DONE_PHASE_4_PENDING.md`.

## 10. Documentation entry points

- `14_CODEBASE_AUDIT_INDEX.md` — this complete audit handoff and current implementation/pending-state index
- `README.md` — documentation index and current high-level map
- `00_CURRENT_SYSTEM.md` — active application behavior
- `39_PROJECT_NODE_SYSTEM_PHASE_2_3_DONE_PHASE_4_PENDING.md` — **current source of truth for the dynamic node system** (this file's Sections 6/7 are a historical snapshot, refreshed with pointers here but not a substitute); read this before touching anything node/checkpoint/timeline-related
- `04_BACKEND_OVERVIEW.md` — backend architecture and dynamic node status
- `05_QUICK_REFERENCE.md` — file/route lookup
- `12_CLIENT_ACTIVITY_SORT_AUDIT.md` — activity sorting and node write-path history
- `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` — approved new project-product and approval plan
- `18_PROJECT_DETAIL_PAGE_AND_HEADER_REWORK.md` — customer project detail page rebuild on the new shared `ProjectDetailView.js` component, its style-iteration history, the dark-banner header unification across four customer pages, and the reverted admin-detail-page attempt/confirmed reuse plan
- `admin-nodes.md` — original dynamic node requirements/rules/phases (design doc, superseded by `39_...md` for current status; still accurate for node validation rules/delete-restore-reset semantics)
- `admin-plan.md` — admin strategy and project creation sequence
- `AdminProjectProductsPage.js` — current UI-only Projects list screen; no API or database writes
- `AdminCreateProjectPage.js` — current UI-only Add Project form; no API or database writes
