# Project Node System: Phase 2, 3 & Pre-Existing-Order Migration Complete; Schema Cleanup Pending

## Purpose

This is the handoff doc for the project-timeline "node" system migration. Read it before touching anything related to project progress, checkpoints, nodes, `AdminClientWorkspace.js`'s project detail view, `AdminProjectCheckpointDetail.js`, `ProjectDetails.js`, `createOrder.js`, `adminCreateProjectOrder.js`, `projectNodeService.js`, `projectNodeController.js`, `categoryBasePriceModel.js`, or `orderProductModel.js`/`productModel.js`'s checkpoint fields.

`admin-nodes.md` is the original design/planning doc for this system (written before implementation). Most of what it lists as "future phases" is now **done** — see the Superseded Status note at the top of that file. This doc (`39_...md`) is the current source of truth for what's actually implemented today.

## Update (this session): Pre-existing orders migrated

The Phase 4 central decision (see below) was made explicitly by the user: **migrate**, not leave-alone — justified by the low current client count (fewer than 10 clients), making a one-time data migration low-risk. All 9 pre-migration `isWebsiteProject: true` orders (the only ones the node system supports) were migrated via `backend/scripts/migratePreExistingOrdersToNodeSystem.js` (dry-run verified first, backup written to `backend/migration-backups/`, then `--apply`). One node was created per previously-completed checkpoint (running-sum cumulative progress, same-value duplicates merged into one node rather than artificially inflated), so real per-step history is preserved, not collapsed into a single before/after summary. All 9 orders now read `projectTimelineVersion: 1` and are fully live on the node system, both in the admin node UI and `ProjectDetails.js`. The 4 non-website legacy orders (`isWebsiteProject: false`, zero checkpoints) were intentionally left untouched — the node system/service only supports website-project orders. `AppConvertingBanner.js` (see item 3 in the table below) was also fixed this same session. **Legacy schema field removal (items 1 and 2 in the table below) has NOT been done yet** — still pending, now safe to do since the migration is verified, but not yet executed.

## Two Systems Exist Side by Side In Schema (Important Context)

This codebase has **two parallel project-progress systems**:

1. **Legacy "checkpoint" system** — `order.checkpoints[]` (fixed list, auto-generated per category, `{checkpointId, name, completed, completedAt, percentage}`), plus `order.projectProgress` calculated as the **sum** of completed checkpoint percentages. Still exists in the database schema (`orderProductModel.js`, `productModel.js`) and still holds real historical data on every order (never deleted by the migration — additive only), but is **no longer written to** for any current live flow, and no active order-creation or order-display code path reads it anymore as of this update (see Phase 2/3 and the migration note above).
2. **New "node" system** — `order.projectNodes[]` / `order.projectRuns[]` / `order.projectNodeEvents[]` (admin manually creates each node, no fixed list, `{nodeId, runId, title, cumulativeProgress, status, visibleToClient, createdAt, ...}`), plus the same `order.projectProgress` field, now calculated as the **max** `cumulativeProgress` among active nodes. This field is genuinely shared — both systems write to it, gated by `order.projectTimelineVersion` (`0` = legacy, `1` = new).

**As of this update, every website-project order in the database — new and pre-existing — is on `projectTimelineVersion: 1` and reads/writes exclusively through the node system.** The legacy system's code and data still exist in the schema (kept for audit/rollback safety, not because anything still reads it), and the 4 non-website legacy orders remain on the old system since the node system doesn't support their type. Removing the now-fully-dead legacy schema fields/hooks is the only remaining Phase 4 item — see the table below.

## What's Done

### Phase 1 (earlier, unrelated numbering — see `35_CATEGORY_BASE_PRICE_AND_PROJECT_FEATURES_SYSTEM.md`)
Added `startingNodeTitle` field to `categoryBasePriceModel.js`, exposed in the admin Category Base Price edit form. Per-category starting node titles can now be configured by admin instead of being hand-typed on every project.

### Phase 2 — Admin node UI wired to real backend
**Before**: `AdminProjectCheckpointDetail.js`'s Add Node / Send Update buttons were local-state-only previews (literal UI copy: "would be added when backend wiring is approved"). `AdminClientWorkspace.js`'s node-management command bar (Delete / Restore / Visibility / Reset History) operated only on a local `nodeUiState` object — no network calls anywhere.

**After**:
- 5 new `SummaryApi` entries added (`createProjectNode`, `deleteProjectNodes`, `restoreProjectNodes`, `setProjectNodeVisibility`, `resetProjectNodes`) — all point to the pre-existing (already built, already correct) backend routes at `POST /api/admin/projects/:orderId/nodes...` (`backend/routes/index.js:267-271`, `backend/controller/order/projectNodeController.js`).
- `AdminClientWorkspace.js`'s `WorkspaceDetailSubpage` component (the project-detail node UI) now reads `item.projectNodes`/`item.projectRuns` instead of `item.checkpoints`. All 5 actions (Add, Delete, Restore, Visibility toggle, Reset) make real `fetch` calls, show `toast` success/error feedback, and trigger a refetch (`onSoftRefresh` → `activeProjectRefreshKey` bump → re-fetch via `SummaryApi.orderDetails`) on success.
- Reset History now requires typing a new starting-node title (backend requires this — `resetProjectTimeline()` throws without it). The "Show old history to client" checkbox was **removed**, not left as a no-op — `createProjectRun()` hardcodes `showToClient: false` regardless of input, so a working-looking checkbox that silently did nothing would have been exactly the kind of preview-only UI this phase was meant to eliminate.
- `AdminProjectCheckpointDetail.js` now takes a `node`/`onAddNode`/`isSubmitting` prop contract instead of `checkpoint`/`cumulativeProgress`. The "Send Update" button (which had no backend equivalent — there is no standalone send-message-without-a-node endpoint) was removed; only "Add Node" and "Add Node & Send" remain, both real.
- **Scope limit**: this only works for orders where `projectNodes` already exists — i.e. admin-created client projects (`adminCreateProjectOrder.js`, which already called `initializeProjectTimeline()` before this phase). Regular customer-purchase orders did not yet have node data — that gap was closed in Phase 3.

Files touched: `frontend/src/common/index.js`, `frontend/src/pages/AdminClientWorkspace.js`, `frontend/src/components/admin/AdminProjectCheckpointDetail.js`.

### Phase 3 — Regular customer orders + customer-facing page migrated
**Before**: `backend/controller/order/createOrder.js` (the normal `ProductDetails` → `DirectPayment` → `POST /api/create-order` purchase path) built a hardcoded `orderData.checkpoints` array (structure/page/testing checkpoints for websites, copied `product.checkpoints` for cloud software) and never touched the node system. `frontend/src/pages/ProjectDetails.js` (the customer-facing project page) read `order.checkpoints`/`order.projectProgress` exclusively — zero references to `projectNodes` anywhere in the file.

**After**:
- `createOrder.js`: the hardcoded checkpoint-building block is gone. For website-category orders (`standard_websites`/`dynamic_websites`/`cloud_software_development` — note `app_development` was never in this list, pre-existing behavior, not touched), it now calls `initializeProjectTimeline()` before `order.save()`, using the category's `categoryBasePriceModel.startingNodeTitle` if set, else falling back to a hardcoded `"Project Started"` default (so checkout never hard-fails just because an admin forgot to configure a category's starting title).
- **Bug found and fixed while doing this**: `orderProductModel.js`'s legacy `pre('save')` hook (the one that copies `product.checkpoints` into a new order if the order has none) did not check `projectTimelineVersion`. Since `createOrder.js` no longer sets `orderData.checkpoints` directly, this hook would have silently re-populated legacy checkpoints on every new order anyway, defeating the whole migration. Fixed by adding `this.projectTimelineVersion !== 1` to the hook's guard condition (`orderProductModel.js` line ~530).
- `ProjectDetails.js`: fully migrated off `order.checkpoints` onto `order.projectNodes`. All checkpoint-derived concepts (`getCheckpointKey`, `sortedCheckpoints`, `inProgressCheckpoint`, `nextUpcomingCheckpoint`, `visibleCheckpoints`, `timelineNodes`, `selectedCheckpoint`, `selectedCheckpointMessages`, `checkpointMessageCounts`, message-to-checkpoint fuzzy matching) were replaced with node equivalents (`getDefaultNodeId`, `sortedNodes`, `inProgressNode`, `timelineNodes`, `selectedNode`, `selectedNodeMessages`, `nodeMessageCounts`). Message matching is now a direct `message.nodeId === node.nodeId` check (the new node system stamps `nodeId` on messages at creation time — no fuzzy/fallback matching needed, unlike the old system which had to guess via `checkpointId`/`checkpointName`/positional fallback).
- **Two deliberate UX decisions made during this phase** (both user-approved, not defaults):
  1. The old "next upcoming checkpoint" concept (a grayed-out "Soon" placeholder row shown even before any work existed) was **removed entirely**, not replaced. The new system has no predefined future list, so there is nothing to preview — the customer only ever sees nodes that actually exist.
  2. The internal-ID "Timeline: `<raw key>`" stat tile in the checkpoint detail panel (desktop view) was **removed** — it was exposing an internal identifier to the customer with no useful meaning; replaced with a "Progress: X%" tile instead.
- `order.projectProgress` itself (the shared field) was **not touched** — payment-unlock gating at 40%/75% installment thresholds in this same file still works unmodified, since that field's meaning is shared between both systems by design.

Files touched: `backend/controller/order/createOrder.js`, `backend/models/orderProductModel.js`, `frontend/src/pages/ProjectDetails.js`.

## What This Means Right Now

- **Every website-project order — new or pre-existing — is on the node system.** Orders created from this point forward (via either `createOrder.js` or `adminCreateProjectOrder.js`, for website-category products) get a real `projectNodes` array from the moment they're created. The 9 orders that predated this migration were converted this session (see the Update note above) and now behave identically — both the admin node UI and the customer-facing page read/write their `projectNodes` array correctly, end to end.
- **The 4 non-website legacy orders** (`isWebsiteProject: false`) remain on legacy `projectTimelineVersion: 0`/`checkpoints` data, unmigrated by design — the node system/service does not support non-website orders (`assertProjectOrder()` in `projectNodeService.js` hard-requires `isWebsiteProject: true`). This is not a gap to close; it's out of scope for this system.

## Phase 4 — Remaining Work

### The central decision (RESOLVED)

What should happen to pre-migration website-project orders? **Resolved this session: migrate them** (not leave them on a permanent legacy fallback) — the user's explicit reasoning was the current low client count (fewer than 10 clients), making a one-time data transformation low-risk. Executed via `backend/scripts/migratePreExistingOrdersToNodeSystem.js`, dry-run verified first, backup-first, then applied and re-verified against the live DB. See the Update note at the top of this doc for full detail.

### Full scope — remaining items only

| # | Area | What needs to happen | Status |
|---|---|---|---|
| 1 | `backend/models/orderProductModel.js` | Remove `checkpointProgressSchema`, the `checkpoints` field, and the two now-dead legacy `pre('save')` hooks (checkpoint-copy hook, checkpoint-sum progress hook) | **Pending** — now safe (migration verified), not yet done. Note: the 4 non-website legacy orders still use `projectProgress`/`status` fields directly (not checkpoints specifically), so confirm nothing there breaks before removing |
| 2 | `backend/models/productModel.js` | Remove `checkpointSchema`, the `checkpoints` field, `CLOUD_SOFTWARE_CHECKPOINTS`, `setWebsiteCheckpoints()`, and the checkpoint-generation half of its `pre('save')` hook (the `isWebsiteService`/`isFeatureUpgrade`/`isWebsiteUpdate` flag-setting half must stay — unrelated, still used) | **Pending** |
| 3 | `frontend/src/components/AppConvertingBanner.js` | The one remaining frontend file that read `order.checkpoints` directly (`checkpoints.filter(cp => cp.completed).length` for an "X/Y checkpoints" label) | **Done (this session)** — now shows an active-node count (`"N updates"`) when `order.projectTimelineVersion === 1`, falls back to the old checkpoint-based display only for the 4 still-legacy non-website orders |
| 4 | `backend/controller/order/validateUpdatePlan.js` | Reads `order.projectProgress` for a real business rule (can't buy an update plan without a 100%-complete project) | **No change needed**, confirmed — this field is shared and was not altered by the migration (additive-only) |
| 5 | Dead code cleanup (zero functional risk, confirmed unreachable) | `frontend/src/components/admin/ProjectWorkspaceModal.js` (calls `/api/update-project-progress`, a route that was never registered — already permanently broken), `sendProjectUpdateEmail`/`sendProjectMessageEmail` in `backend/helpers/emailService.js` (exported, zero callers anywhere), `frontend/src/components/UploadProduct.js` and `frontend/src/components/AdminEditProduct.js` (confirmed unrouted in the current admin route map, per `admin-nodes.md`) | **Pending**, not started |
| 6 | Final verification pass | New orders (both paths), the 9 migrated orders, admin node UI, customer `ProjectDetails.js` | **Done for the 9 migrated orders** (re-verified against live DB post-migration: all read `projectTimelineVersion: 1`, correct node counts, `checkpoints` data untouched). Not yet re-run after items 1/2/5 above are done. |

### How to Work This Phase Safely (read before starting)

These are the same working rules that applied to Phases 2 and 3, repeated here because Phase 4 is the highest-risk phase — it touches schema and can affect real historical customer data, not just add new code paths.

1. **Evidence before action.** Before writing any migration script or deleting any schema field, read real order documents from the actual database (not assumptions) to confirm what `checkpoints`/`projectProgress` actually look like across old orders — completed counts, edge cases (zero checkpoints, partial completion, unusual percentage sums). Followed for the pre-existing-order migration: real data was read and reasoned about before the script was written (see Update note).
2. **The pre-migration-orders decision is now resolved** (migrate, see above) — this rule remains here as a record of how that decision was made (evidence-first, explicit user confirmation, not a default), for reference on any future similar decision in this codebase.
3. **Backup before any destructive step.** If a migration script will write to production orders, it must support a dry-run mode first, and the actual run must be preceded by an explicit backup (matches the existing project convention — see `backend/scripts/auditPaymentInvoiceLedger.js` and `backend/scripts/migrateLegacyPlansToServicePlan.js` for the established backup/dry-run/apply pattern already used elsewhere in this codebase). Followed: `backend/scripts/migratePreExistingOrdersToNodeSystem.js` dry-ran first, then wrote a timestamped backup to `backend/migration-backups/` before `--apply`.
4. **Order of operations matters.** Do not remove the legacy `checkpoints` schema fields until *after* any needed migration has run and been verified against real data. **This condition is now satisfied for website-project orders** — the migration ran and was re-verified against the live DB — so items 1/2 in the table above are now safe to execute, but have not been executed yet.
5. **One phase, one component at a time**, same as Phases 2/3 — do not bundle schema cleanup, `AppConvertingBanner.js`'s fix, and dead-code deletion into one uncontrolled sweep. Each is independently low-risk once the central migration decision is made, but should still be reviewed as separate, small changes. Followed: the data migration and the `AppConvertingBanner.js` fix were done as two separate, separately-approved steps this session; schema cleanup (items 1/2) was deliberately not bundled in.
6. **No `npm run build`** without explicit permission (standing rule for this project, unrelated to this phase specifically).
7. **After Phase 4 is fully done** (schema cleanup + dead code removal, items 1/2/5 in the table above), this doc and `admin-nodes.md` should both be updated again to reflect the final single-system state — at that point the "two systems exist side by side in schema" framing becomes fully historical (it already is for the *live data path*, just not the schema itself yet).

## Evidence Index

| Concern | File |
|---|---|
| Node schema | `backend/models/orderProductModel.js` (`projectNodeSchema`, `projectRunSchema`, `projectNodeEventSchema`, lines ~55-172) |
| Node service (create/delete/restore/visibility/reset logic, validation rules) | `backend/helpers/projectNodeService.js` |
| Node write API (admin-only, migrated-orders-only) | `backend/controller/order/projectNodeController.js`, routes at `backend/routes/index.js:267-271` |
| Node read API (customer-filtered shape) | `backend/controller/order/getOrderDetails.js`'s `getCustomerTimeline()` |
| Admin node UI | `frontend/src/pages/AdminClientWorkspace.js` (`WorkspaceDetailSubpage`), `frontend/src/components/admin/AdminProjectCheckpointDetail.js` |
| Customer node UI | `frontend/src/pages/ProjectDetails.js` |
| Order creation (customer purchase) | `backend/controller/order/createOrder.js` |
| Order creation (admin-created client project) | `backend/controller/order/adminCreateProjectOrder.js` |
| Category starting-node-title config | `backend/models/categoryBasePriceModel.js`, `frontend/src/pages/AdminCategoryBasePricePage.js` |
| Legacy checkpoint schema (still present, no longer written or read by any live path for website-project orders; still used by the 4 non-website legacy orders) | `backend/models/orderProductModel.js` (`checkpointProgressSchema`, `checkpoints` field), `backend/models/productModel.js` (`checkpointSchema`, `CLOUD_SOFTWARE_CHECKPOINTS`, `setWebsiteCheckpoints()`) |
| Pre-existing-order migration script (this session) | `backend/scripts/migratePreExistingOrdersToNodeSystem.js` — dry-run by default, `--apply` to write; backups written to `backend/migration-backups/pre-existing-orders-before-node-migration-<timestamp>.json` |
| Original design/planning doc (mostly superseded now) | `admin-nodes.md` |
