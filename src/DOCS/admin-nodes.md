# Admin Nodes: System Handoff and Implementation Context

## Purpose

This document is the single handoff reference for the project-node redesign discussed with the user. Read it before planning or changing product, order, admin-project, customer-project, node, reset, visibility, or template behavior.

Status on 2026-07-19: requirements discovery and audit completed. The order-owned dynamic node schema/service and migrated-timeline-gated admin node APIs are implemented; existing orders remain legacy version `0` until controlled migration.

## Working Rules

- Work evidence-first. Do not assume missing behavior.
- Do not change code without explicit user permission.
- No `npm run build` without explicit permission.
- Use a new `backup/changesN/` folder before every change attempt.
- Do not use a narrow patch approach for this redesign. Audit the full product -> order -> admin -> customer data path before implementation.

## Current System: Verified Facts

### Active admin surfaces

- Active admin routes are dashboard, clients, client workspace, payment detail, and admin project detail. Product management is not an active admin route. See `frontend/src/routes/adminRoutes.js`.
- The current client project subpage is `frontend/src/pages/AdminClientWorkspace.js`.
- It fetches the customer workspace first, then fetches full project details from `GET /api/order-details/:orderId` when a project is opened.
- The active project-detail component is `frontend/src/components/admin/AdminProjectCheckpointDetail.js`.
- The current visible actions (`Complete Selected`, `Send Update`, `Complete & Send`) have no action handlers/API calls. They are UI only.

### Legacy/unrouted product UI

- `frontend/src/pages/AllProducts.js` renders the old product list/create surface.
- `frontend/src/components/UploadProduct.js` and `frontend/src/components/AdminEditProduct.js` implement old product creation/editing.
- These files still contain automatic/predefined checkpoint logic, but they are not connected to the active admin route map.

### Existing product and order data model

- MongoDB uses `products` for product templates and `orders` for customer-specific project orders. There is no separate nodes/checkpoints collection.
- Product checkpoints currently contain a name and percentage only (`backend/models/productModel.js`).
- Each order currently embeds checkpoints with `checkpointId`, `name`, `percentage`, `completed`, and `completedAt` (`backend/models/orderProductModel.js`).
- Each order also embeds project messages with a sender, message, timestamp, checkpoint ID, and checkpoint name.
- Existing order save middleware recalculates `projectProgress` by summing completed checkpoint percentages and updates `lastUpdated`.

### Existing automatic/predefined behavior to replace later

- `backend/models/productModel.js` has category-specific default checkpoint generation.
- `backend/controller/order/createOrder.js` explicitly creates fixed website checkpoints for standard website projects and copies product checkpoints for cloud software projects.
- This is the old predefined-node system. It must not be mixed blindly with the future manual node system.

## Product Creation and Customer Project Purchase: Current Audit

### Active customer purchase lifecycle

1. Customer opens a listed project product from Home/category listing and reaches `ProductDetails`.
2. `ProductDetails` lets the customer choose compatible features, coupon, and full/partial payment. It prepares this data and opens `DirectPayment`.
3. `DirectPayment` calls `POST /api/create-order` before payment approval. The new order is created with `orderVisibility: pending-approval`.
4. The payment-verification request creates a separate pending transaction through `POST /api/wallet/verify-payment`.
5. An admin approves that transaction through `POST /api/wallet/approve-transaction`. The approval controller updates the linked order to `orderVisibility: approved`; a pending order status becomes `in_progress`.
6. Customer `ProjectsAndPlans` reads the customer's orders. It only treats an approved/visible project order as active work; pending and rejected payment orders are not active projects.

### Current predefined checkpoint lifecycle

- The legacy product-create UI (`UploadProduct`) automatically generates fixed checkpoint data for standard/dynamic website products, based on page count. It generates a fixed cloud-software list for cloud products.
- `productModel` repeats this automatic logic at database save time. Therefore the old predefined checkpoint model has more than one generation path and must not be reused as the new single source of truth.
- `createOrder` copies/generates checkpoint data into the order. Standard/dynamic website checkpoints are generated in the controller; cloud-software checkpoints are copied from `products.checkpoints`.
- `orderProductModel` also has creation middleware that can copy `products.checkpoints` into a new order if it has none. Its progress middleware sums the percentages of `completed` checkpoints.
- Consequently, current percentage values are incremental completion weights, not the required new cumulative node percentage values.

### Current route and UI status

- Customer project purchase routes are active: `ProductDetails` -> `DirectPayment` -> customer `ProjectsAndPlans` / `ProjectDetails`.
- The active admin route map has no product-management route.
- `AllProducts`, `UploadProduct`, and `AdminEditProduct` still exist as legacy/unrouted product-management code. They can create/edit old predefined checkpoints but are not the correct foundation for the new system as-is.

### New project-product direction

- New project-product creation is now the next implementation priority under the planned admin main-page `Website Management` -> `Projects` module.
- The product will store a mandatory Starting Node Title, but no predefined future nodes.
- Customer purchase will continue through the existing `ProductDetails` -> `DirectPayment` -> pending order -> payment approval flow.
- The approved order, not the product, will receive the copied 0% starting node.
- Existing project migration is intentionally later; it is not a prerequisite for creating new project products.
- See `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` for the verified category-specific fields and regression boundaries.

### Locked architecture implication for the new node system

- An order is created before payment approval, but a project becomes active after approval. Therefore the product's required 0% Starting Node must be initialized at the approved project-start lifecycle point, not merely when a pending order is inserted.
- This prevents rejected or still-pending payment orders from receiving a false active project timeline.
- Product creation is still separate from project start: the future product record stores only its Starting Node Title; an approved order gets its own independent 0% node copy. Later product edits must not modify an already-started order.
- The order-owned dynamic node persistence is in place. The next implementation focus is the new project-product UI and its product contract; approved-project-start integration follows after the product form and customer purchase compatibility are locked.

### Evidence index for this audit

| Concern | Evidence |
|---|---|
| Product selection and payment handoff | `frontend/src/pages/ProductDetails.js`, `frontend/src/pages/DirectPayment.js` |
| Customer project visibility/status | `frontend/src/pages/ProjectsAndPlans.js`, `frontend/src/helpers/orderVisibility.js`, `backend/controller/order/order.controller.js` |
| Order creation before approval | `backend/controller/order/createOrder.js`, `backend/controller/user/verifyPaymentController.js` |
| Approval activates order | `backend/controller/user/transactionApprovalController.js` |
| Old product checkpoint creation | `frontend/src/components/UploadProduct.js`, `frontend/src/components/AdminEditProduct.js`, `backend/models/productModel.js` |
| Order checkpoint copy/progress model | `backend/models/orderProductModel.js`, `backend/controller/order/createOrder.js` |
| Route reachability | `frontend/src/routes/adminRoutes.js`, `frontend/src/routes/customerRoutes.js` |

### Current backend persistence gap

- Frontend `SummaryApi` defines `POST /api/update-project-progress`, `POST /api/project-message`, and `POST /api/update-project-link`.
- Active backend routes do not register these node/project write endpoints.
- The old `ProjectWorkspaceModal` calls the missing progress/message endpoints, but that modal is only used by legacy `UserWorkspace`, which is not in the active admin route map.
- Therefore current node selection and message-template UI do not persist node completion, messages, or progress to the database.

### Current message-template UI

- `AdminProjectCheckpointDetail.js` currently has a local React-state template list and Save, Save As, Delete UI.
- It does not persist templates to the backend/database. The user's target is universal/global admin templates, so persistence and reuse must be designed in a later node phase.

### Current admin node UI prototype (implemented, local-only)

The active client-workspace project-detail UI has been updated only for workflow review. It does not add node write APIs or database persistence.

- Node selection, selected-node details, related messages, and update/message concepts remain in place.
- The right update panel no longer has a second node dropdown. A node is selected from the left node list, then its details remain available in the right panel.
- The manual-node form has New Progress % on the left and Node Title on the right, followed by the existing template/manual-message UI and preview-only actions.
- Every node list row has a checkbox outside the left edge of the node card. The node card remains a separate clickable detail target.
- Windows-style local selection behavior is implemented: normal click selects one node and opens detail; checkbox toggles selection; Ctrl+click adds/removes nodes; Shift+click selects a range; Arrow Up/Down moves row focus; Space toggles focused-row selection; Shift+Space selects the anchor-to-focused range.
- Node-management controls are in the list command bar, not the right detail panel: Delete Node, Undo Delete, Hide/Show for Client, the global `Always hide deleted nodes from client` switch, and Reset Project History.
- Button/switch enablement is state-specific: Delete requires selected active nodes; Undo requires selected inactive nodes; Hide/Show requires selected inactive nodes; the global deleted-node switch requires at least one inactive node; reset requires at least one node.
- These controls currently change only local UI state. Delete marks selected nodes inactive in the preview, clears selection/anchor/focus, and then triggers the existing `GET /api/order-details/:orderId` project-detail soft refresh. The existing project-detail loading UI provides the read-refresh loader.
- The soft refresh is read-only. It does not persist a node delete because the required backend delete API does not yet exist.

## User-Confirmed Target System

### Scope boundary

- The redesign applies only to project-type products/projects.
- Plans keep their existing separate system.
- Product creation and project start are different operations.

### Product creation (future phase)

An admin creates a reusable project product with:

- Project name
- Project type
- Description/specifications/details
- Price
- Mandatory Starting Node Title

The product does not contain predefined future nodes. It provides only the title for the project order's first 0% node. If the product's Starting Node Title changes later, only future started projects use the new title; existing client projects retain their copied starting node.

### Project start

- A customer currently starts a project through the normal product/order/payment flow.
- Later, an admin must be able to open a client workspace, use Projects -> Add Project, select an already-created project product, and execute the same customer order/payment process on the customer's behalf.
- There must be no separate project database or payment bypass.
- At project start, the order gets its first 0% node using the product's Starting Node Title.

### Dynamic node model

After the initial 0% node, admin controls all project updates manually. No automatic future node generation is allowed.

Each new node needs:

- Node title (required)
- Cumulative progress percentage
- Optional manual message or selected universal template message
- Actor/admin and event time for audit

Rules:

- New node percentage must be at least 0.1% above the current active progress.
- Valid progress is from 0% to 100%.
- The first copied starting node is always 0%.
- At exactly 100%, creating another node is blocked.
- Admin may create a node without a message; node-only updates must work.
- Admin may create a node and send an optional message in the same action.
- Existing node edit is not allowed. Correction is delete the node and create a new node.

### Admin update UI target

The existing node-selection, node-detail, related-message, and update-panel concepts must remain. The redesign improves them; it does not remove them.

- All project nodes remain selectable from the node list/dropdown.
- Selecting a node must continue to show that node's name, percentage, status, related records/messages, and detail history.
- The current update panel remains available in the selected-node context, but its fixed/predefined future-node dependency is replaced by manual dynamic-node creation.
- The old `Complete Selected` / `Send Update` intent remains, but must be backed by the new dynamic-node operations rather than an unverified UI-only action.

Improve the active project-detail update panel with:

1. Current active percentage display.
2. Numeric progress input constrained by the active progress + 0.1 through 100.
3. Node title input before message-template selection.
4. Existing universal template selection UI.
5. Manual message area.
6. Separate actions for node-only update and node + message send.

The change is only this: a fixed list of predefined *future* nodes must not control what admin can create next. It does not mean the full node list, node selection, node information, or update workflow is removed.

### Delete, restore, and reset behavior

Deletion is soft deletion, never a physical DB deletion:

- Deleted node remains in admin audit/history.
- Deleted node is removed from the active timeline, subject to customer visibility settings.
- Admin can delete an individual node or use bulk delete.
- Deleting a middle node does not affect later active nodes or their current progress. The visible active timeline may therefore jump, for example from 10% to 50%.

Restore rule:

- Admin can attempt to restore a soft-deleted node.
- Restore is allowed only when every later active node has a percentage higher than the deleted node.
- Example allowed: delete 70%, later create 75%, then restore 70%.
- Example blocked: delete 70%, later create 60%, then attempt to restore 70%.
- Reset-archived nodes can never be restored.

Reset rule:

- Reset archives/inactivates every node from the current run and sets active progress to 0%.
- Reset is not physical deletion; all old data stays in database audit history.
- Reset starts a new independent project run/timeline.
- Each reset creates its own archived history section.
- Nodes from a reset section are permanently non-restorable, even if their percentages would otherwise satisfy restore rules.

### Customer visibility and audit

- Admin sees complete audit information: node creation, soft deletion, restore attempt/result, reset, visibility change, actor, and time.
- Active normal nodes are customer-facing project timeline data.
- Inactive/deleted/archived history is shown to a customer only when admin enables it.
- Individual inactive node visibility to the customer must be controllable.
- Each reset archive section has its own `Show old history to client` control; enabling one reset history does not enable another.
- Customer history presentation needs a clear separator between active timeline and each visible reset archive section.

### Templates

- Templates are universal/global admin templates, not project-specific templates.
- Admin can create as many templates as needed, save changes, save as new, and delete templates.
- Admin can always ignore templates and send a manual message.
- No automated node title or message generation is wanted.

## Design Consequences: Do Not Ignore

- Existing `orders.checkpoints` represents a completed-boolean checkpoint model. The target needs an ordered, auditable, dynamic timeline model with soft-delete, restore constraints, reset generations, customer visibility, and optional message linkage.
- Do not make the future design rely only on `completed` and `completedAt`; those fields cannot represent delete/reset/restore/visibility history safely.
- The future persistence design must have one order-owned source of truth for active progress and immutable/auditable node events/history. Do not create a parallel admin-only database.
- Product edits must never rewrite nodes in already-started orders.
- Existing project orders will switch into the same new dynamic timeline system; no separate temporary legacy UI/runtime system will be created. A controlled migration must preserve old completed history, messages, and verified current progress, then allow in-progress orders to receive new dynamic nodes.
- New product creation is not a prerequisite for the node-engine phase. Product creation later needs to supply the Starting Node Title and reuse the same node engine.

## Current File and API Index

### Active frontend

| Area | File | Current role |
|---|---|---|
| Admin route map | `frontend/src/routes/adminRoutes.js` | Active admin entry points; no product management route |
| Client workspace | `frontend/src/pages/AdminClientWorkspace.js` | Active admin client/project UI and detail loading |
| Node/update panel | `frontend/src/components/admin/AdminProjectCheckpointDetail.js` | Current local node/template UI; action buttons not wired |
| Customer/admin project read view | `frontend/src/pages/ProjectDetails.js` | Reads order details and shows checkpoint timeline |
| Legacy node modal | `frontend/src/components/admin/ProjectWorkspaceModal.js` | Calls missing project write APIs; not active admin route |
| Old product list | `frontend/src/pages/AllProducts.js` | Existing but not routed admin product UI |
| Old product create | `frontend/src/components/UploadProduct.js` | Existing predefined-node product creation UI |
| Old product edit | `frontend/src/components/AdminEditProduct.js` | Existing predefined-node product edit UI |
| API map | `frontend/src/common/index.js` | Contains current and stale endpoint definitions |

### Backend

| Area | File | Current role |
|---|---|---|
| Active route registry | `backend/routes/index.js` | Registers product create/update and order detail; does not register node progress/message writes |
| Product schema | `backend/models/productModel.js` | Product template fields and old automatic checkpoint defaults |
| Order schema | `backend/models/orderProductModel.js` | Existing embedded checkpoints/messages and progress middleware |
| Product creation controller | `backend/controller/product/uploadPoduct.js` | Saves product document |
| Product update controller | `backend/controller/product/updateProduct.js` | Updates product document |
| Order creation controller | `backend/controller/order/createOrder.js` | Copies/generates old checkpoints and creates order |
| Order detail controller | `backend/controller/order/getOrderDetails.js` | Admin/customer read of a project order |
| Admin client workspace controller | `backend/controller/user/getAdminUserWorkspace.js` | Loads customer orders and related workspace data |

## Recommended Phase Order

### Phase 0: Full audit and UI workflow lock

- Audit active versus legacy product/project files.
- Lock the unified admin node-selection, detail, update, delete/restore, bulk-delete, reset, and visibility workflow before backend implementation.
- Define how current completed checkpoint values map to cumulative historical nodes, using real existing-order samples.
- Define the exact order-owned node/event schema, reset generation model, visibility rules, and indexes from the approved UI workflow.
- Define API contracts and admin authorization before wiring UI actions.

### Phase 1: Node backend and data model

- Implement one admin-authorized node service/controller path.
- Create node, node-only update, node plus message, soft delete, restore validation, bulk delete, reset, and customer-visibility operations.
- Persist actor/time/audit data.
- Calculate active progress from the valid active run, not from stale predefined checkpoint sums.
- Add read contract for admin complete history and customer filtered history.

### Phase 2: Existing project migration safety

- Convert existing project orders into the unified dynamic timeline; do not create a separate legacy display mode.
- Preserve old completed checkpoints/history, messages, and verified current progress without data loss.
- Remove old uncompleted predefined future checkpoints from future-node control after safe conversion; in-progress projects continue from their converted current progress using new manual nodes.
- Do not mutate historical customer order data without an approved migration plan and rollback approach.

### Phase 3: Active admin project UI

- Retain and improve node selection, selected-node detail, linked records/messages, and update controls in `AdminClientWorkspace` and `AdminProjectCheckpointDetail`.
- Add current-progress input, title, template/manual message, delete/restore/bulk delete/reset, audit view, and customer visibility controls.

### Phase 4: Customer project UI

- Render active dynamic timeline.
- Render only customer-authorized inactive/reset history.
- Add reset-history separators and preserve customer read-only access.

### Phase 5: Product-management system

- Add active admin product list/create/edit routes and navigation under `Website Management` -> `Projects`.
- Build the category-aware project product form using the verified project field matrix.
- Remove predefined future-node configuration from new project product creation.
- Add required Starting Node Title for project products.
- Make order/project start create the copied 0% starting node from the product template.
- Keep plan-product flow separate.

### Phase 6: Verification

- Backend authorization and validation tests.
- Progress boundary tests: 0%, +0.1, 100%, duplicate/lower rejection.
- Middle delete, restore allowed/blocked, bulk delete, reset, multi-reset, and visibility tests.
- Existing-order regression tests.
- Customer/admin response-contract and route tests.
- Run `npm run build` only after explicit user permission.

## Do Not Implement Yet

- Do not add a new node collection or a separate admin database without explicit approval.
- Do not reuse old predefined checkpoint generation as the new dynamic engine.
- Do not wire the current visible Complete/Send buttons to an unverified endpoint.
- Do not change plans while implementing project nodes.
- Do not modify existing orders/products in bulk before a user-approved migration plan.

## Confirmed Migration Direction

All existing project orders will move to the same new dynamic node system. Completed projects remain completed; in-progress projects retain converted historical progress and receive future updates through the new manual node workflow. No separate legacy UI/runtime system is planned.
