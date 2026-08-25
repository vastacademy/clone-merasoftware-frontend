# Node Edit, Dynamic Client-Detail Tabs, Payment Link, and Project/Plan List SSOT

## Purpose

This doc records four independent, individually-approved changes made this session:

1. Admin client-detail dynamic tab ordering (active project/plan tab first).
2. Real in-place project-node **edit** (replaces the earlier delete+create "correction" idea, which could not edit a 0% starting node).
3. A "Proceed for payment" link inside `ProjectDetails.js`'s Payment Pending banner.
4. Full single-source-of-truth (SSOT) rework of the customer project/plan list — both its **logic** (status/sort/summary/colors) and its **UI/layout** (a shared row component) — shared by `CustomerDashboard.js`'s recent list and `ProjectsAndPlans.js`'s full list.

Read this before touching `AdminClientWorkspace.js`'s tabs or its `WorkspaceDetailSubpage` node UI, `AdminProjectCheckpointDetail.js`, `projectNodeService.js`/`projectNodeController.js`, `ProjectDetails.js`'s Payment Pending banner, `CustomerDashboard.js`/`ProjectsAndPlans.js`'s list, or the new `helpers/orderPresentation.js`/`components/OrderListRow.js`.

---

## 1. Admin Client-Detail: dynamic tab ordering

**Before:** `AdminClientWorkspace.js` had a module-level static `tabs` array (`[Overview, Projects, Plans, Payment & Invoices]`, fixed order) and `activeTab` defaulted to `"overview"`. Overview always opened first regardless of what the client actually had running.

**After:** the tab list is now a derived value, following the exact same pattern `CustomerDashboard.js`'s `primaryAction` already uses (derived, no extra state, no auto-select side-state):
- Four named tab constants (`OVERVIEW_TAB`/`PROJECTS_TAB`/`PLANS_TAB`/`PAYMENTS_TAB`) plus a `useMemo`'d `tabs`.
- `hasActiveProject` = `projectOrders.some(isActiveOrder)`; `hasActivePlan` = `planOrders.some(p => getPlanDisplayStatus(p) === "Active")` — both reuse the file's pre-existing helpers, no new "active" definition invented.
- Order: if an active project exists → `[Projects, Plans, Overview, Payments]`; else if an active plan exists → `[Plans, Projects, Overview, Payments]`; else `[Overview, Projects, Plans, Payments]` (original order). Payment & Invoices always stays last.
- `activeTab` initial state is `location.state?.activeTab || null`; a single `useEffect` (deps `[dataLoading]`) sets it to `tabs[0].id` exactly once, when data finishes loading. After that the admin's own click always wins (the effect never re-fires and re-selects on later tab-list changes). The tabs header uses `activeTab || tabs[0].id` as a render fallback so nothing flashes during the one loading render.

**Rejected first attempt (same session, reverted):** an earlier version added a separate `hasAutoSelectedTab` state and a `resolvedActiveTab` fallback variable used at every conditional-render site — the user flagged this as patch-shaped (two parallel states + a fallback var just for null handling). It was fully reverted and redone as the single-effect derived version above.

**File touched:** `frontend/src/pages/AdminClientWorkspace.js`.

---

## 2. Real in-place project-node edit

### The problem that forced a backend change

The first design was UI-only: an "Edit" button that deleted the selected node and re-created it with new values (the delete+create "correction" pattern `admin-nodes.md` line 185 documented as the only allowed correction). **This could not edit the 0% starting node** — `appendProjectNode()` rejects any node below `currentProgress + 0.1`, and a starting node is 0%, so re-creating it always failed with "0 is not acceptable". A starting 0% node can only ever be created by `initializeProjectTimeline()`/`resetProjectTimeline()`, never by `appendProjectNode()`. The user chose to build a proper backend edit operation instead of patching around this.

### Backend (the new operation works for **every** node, not just 0%)

- **`backend/helpers/projectNodeService.js`** — new `editProjectNode({ order, nodeId, title, cumulativeProgress, actorId })`:
  - Target must be an **active** node of the active run (deleted/archived → "restore first").
  - Title always required.
  - The run's **starting node** (first active node of the run) is locked at 0% — only its title can change; passing any non-zero progress throws.
  - Any **other node**: new progress must sit strictly between its neighbours — at least `0.1` above the previous active node and at least `0.1` below the next active node — so the cumulative ordering can never break.
  - Writes `editedAt`/`editedBy` on the node, pushes a `node_edited` audit event, and calls `syncActiveProjectProgress(order)` so `projectProgress` recomputes.
- **`backend/models/orderProductModel.js`** — additive only: `editedAt`/`editedBy` on `projectNodeSchema`, and `node_edited` added to the `projectNodeEventSchema` event `enum`.
- **`backend/controller/order/projectNodeController.js`** — new `editProjectNode` controller, same shape as the other node controllers (`requireAdmin` → `getOrderForAdmin` → service → `saveResponse`), and it can attach an optional message the same way `createProjectNode` does.
- **`backend/routes/index.js`** — new route `POST /admin/projects/:orderId/nodes/edit`.

### Frontend

- **`frontend/src/common/index.js`** — new `editProjectNode` `SummaryApi` entry (same base URL as the other node endpoints; the path suffix `/edit` is appended by `callNodeApi`).
- **`frontend/src/pages/AdminClientWorkspace.js`** (`WorkspaceDetailSubpage`) — a new `editingNodeKey` state; an "Edit" button in the node command bar (amber, `Pencil` icon), enabled only when **exactly one active node** is selected; `handleSaveCorrection` now makes a **single** `editProjectNode` call (the earlier delete+create sequence was removed entirely). Editing state resets on item change, on selecting a different node, and on opening the "Add Node" panel. An `editBounds` object (`{ isStartingNode, lowerBound, upperBound }`) is derived from the active-node ordering and passed to the detail component.
- **`frontend/src/components/admin/AdminProjectCheckpointDetail.js`** — new `editingNode`/`editBounds`/`onSaveCorrection`/`onCancelEdit` props. In edit mode the form pre-fills from the node, shows an amber "Editing … will replace this node" banner, disables+locks the progress input at 0% for the starting node, enforces the lower **and** upper bound for other nodes (validation mirrors the backend exactly), and shows "Save Correction" + "Cancel Edit" instead of "Add Node"/"Add Node & Send".

**Supersedes:** `admin-nodes.md` line 185 ("Existing node edit is not allowed. Correction is delete the node and create a new node.") — node edit is now a real, supported operation.

**Files touched:** `projectNodeService.js`, `orderProductModel.js`, `projectNodeController.js`, `routes/index.js`, `common/index.js`, `AdminClientWorkspace.js`, `AdminProjectCheckpointDetail.js`.

---

## 3. "Proceed for payment" link in the Payment Pending banner

**Before:** `ProjectDetails.js`'s customer-side amber "Payment Pending" banner (`38_...md`, shown when `order.hasUnpaidInvoice`) was text-only — it named the unpaid invoice but offered no way to reach it.

**After:** a "Proceed for payment" text-link (underlined, amber, styled per the banner's light/glass `g()` theme — first built as a filled button, then changed to a plain link at the user's request) that navigates to `/invoice-detail/:invoiceId` using `order.unpaidInvoice._id`. Shown only when `order.unpaidInvoice._id` exists.

**Investigation that scoped this to link-only (Phase A):** `getOrderDetails.js` returns `unpaidInvoice` with `_id` (default Mongoose include); `/invoice-detail/:invoiceId` (`InvoiceDetailPage.js`) already fetches and displays the invoice via `getMyPaymentWorkspace` (which merges the new `invoiceModel` project invoices into its `invoices` array). **Known gap, explicitly deferred (Phase B, not built):** `InvoiceDetailPage.js`'s "Pay Now" navigates to `/direct-payment` with an `invoicePayment`/`invoiceId`/`invoiceAmount` state that `DirectPayment.js` does **not** handle (it only reads `paymentData`/`retryPaymentId`) — so the client can *view* the invoice but cannot yet actually pay it online. The new `invoiceModel` still has no customer-facing pay flow.

**File touched:** `frontend/src/pages/ProjectDetails.js`.

---

## 4. Project/Plan list SSOT — logic **and** UI

The customer's recent list (`CustomerDashboard.js`) and full list (`ProjectsAndPlans.js`) previously duplicated both their derivation logic and their row markup, and had drifted apart (different sort field, different status labels, no type colors on the dashboard). This was unified in three approved steps.

### 4a. Sorting + type colors (first, on `ProjectsAndPlans.js`)

**Before:** sorted only by `updatedAt` desc — finished items could appear anywhere. Rows had grey alternating stripes; the type badge was plain white everywhere.

**After:** rank-based sort mirroring the admin client-list — finished items (completed project / closed plan) rank last, latest-update first within a rank. Each row got a type accent: **emerald = project, amber = plan** (left `border-l-4` + colored type badge). "Finished" reuses the exact conditions `getStatusMeta` already used, no new definition.

### 4b. Logic SSOT (`helpers/`)

**Before:** `getStatusMeta`/`getSummaryText`/`getTypeLabel`/`getTypeAccent`/`getRemainingDays` and a rank/sort helper existed as **separate copies** in both pages, with real label differences (dashboard said "Pending approval"/"In progress"; ProjectsAndPlans said "Booked"/"Developer Assigned"/"45% Complete").

**After:**
- `frontend/src/helpers/orderType.js` gained `isFinishedItem` + `sortItemsLatestFirst` (used for the rank sort).
- New `frontend/src/helpers/orderPresentation.js` owns `getRemainingDays`, `getItemStatusMeta`, `getItemSummary`, `getItemTypeLabel`, `getItemTypeAccent`. The user chose the **ProjectsAndPlans** status version as canonical (more informative), so the dashboard's status labels changed to match ("Booked"/"Developer Assigned"/"45% Complete"/"Active plan").
- Both pages import these; their local copies were deleted. `getItemLink` stayed local to the dashboard (navigation, not presentation).

### 4c. UI/layout SSOT (`components/OrderListRow.js`)

**Before:** the entire row `<button>` JSX and the "Item/Type/Status/Updated/Open" header were duplicated in both pages, with small drifts (dashboard used raw `toLocaleDateString('en-GB')`, showed an assigned-developer line, and a `progress%`/`days left` value in the Open column; ProjectsAndPlans used `formatDate` "8 Aug 2026", no developer line, plan-only value).

**After:** new `frontend/src/components/OrderListRow.js` exports `OrderListRow` (one row) and `OrderListHeader` (the column header). The **ProjectsAndPlans layout is the canonical one** (explicit user choice) — so the dashboard row lost the developer line and the extra progress column and now uses `formatDate`. Both pages render `<OrderListHeader />` + `<OrderListRow order={…} index={…} onClick={…} />`; their inline row/header markup and now-unused imports were removed. `onClick` is each page's own navigate handler (functionally identical: plan → `/plan-details/:id`, project → `/project-details/:id`).

**Net result:** any change to how a project/plan row looks *or* behaves is now made in exactly one place — `helpers/orderPresentation.js` + `helpers/orderType.js` (logic) and `components/OrderListRow.js` (layout) — and both lists update together. What is **not** shared: each page's own header/tabs/filters/empty-state and its navigate handler.

**Files touched:** `helpers/orderType.js`, `helpers/orderPresentation.js` (new), `components/OrderListRow.js` (new), `pages/CustomerDashboard.js`, `pages/ProjectsAndPlans.js`.

---

## Verification

- All changed frontend files pass `@babel/core` parse; all changed backend files pass `node --check`.
- `npm run build` was **not** run (standing project rule — no build without explicit permission).
- Node edit (including the previously-failing 0% starting node) and the dynamic tab ordering were user-verified in the browser against the live app.
