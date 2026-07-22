# Wallet Width and Projects/Plans Status Fix: Before/After

**Purpose**: Record the exact before state, the evidence that justified the change, and the after state for the wallet width fix, the Projects and Plans tab reduction, and the project status logic rewrite, so a future session does not need to re-audit these files from scratch.

**Files touched**: `frontend/src/pages/WalletDetails.js`, `frontend/src/pages/ProjectsAndPlans.js`
**Files not touched**: no backend files, no other frontend pages, no models/routes/controllers.

## 1. Wallet page width

### Before
`WalletDetails.js` wrapped its content in `mx-auto max-w-6xl`, while `ProjectsAndPlans.js` and `StartNewProject.js` both used `mx-auto max-w-7xl`. This made the wallet page visibly narrower than the other two customer workspace pages, even though all three share the same `DashboardLayout` shell and the same outer padding pattern.

### After
`WalletDetails.js` container class changed from `max-w-6xl` to `max-w-7xl` (single class change, one line). No other spacing, card, or layout logic was touched.

## 2. Projects and Plans tabs

### Before
`ProjectsAndPlans.js` had five tabs: `All`, `Active`, `Projects`, `Plans`, `Completed`. The `visibleItems` filter had matching `active` and `completed` branches, and a separate `completedItems` memo computed the completed-item list for the `Completed` tab.

### After
Only three tabs remain: `All`, `Projects`, `Plans`. The `active` and `completed` branches were removed from the `visibleItems` filter, and the now-unused `completedItems` memo was deleted entirely (not left as dead code). The `activeProjects` / `activePlans` memos were kept as-is because they still feed the header's "Active: N" count badge, which is unrelated to tab filtering.

## 3. Project row status logic

### Before
`getStatusMeta(order)` for project rows (in `isProjectItem(order)` branch) only produced two real states:
- `orderVisibility === 'payment-rejected'` -> "Payment rejected"
- `progressProgress >= 100` or `currentPhase === 'completed'` -> "Completed"
- any other approved order -> a static string **"In progress"**, regardless of whether progress was 0% or 95%

Separately, the real `projectProgress` number was computed as `currentValue` and rendered in two other places in the row: a small grey line under the "Updated" date column, and again in the far-right column slot. The row also showed `order.assignedDeveloper?.name || 'Not assigned'` next to the updated date — a field that is defined on the order schema but, per the `assignDeveloper` audit in this same session, has no working backend write path (`/api/assign-developer` is referenced by `frontend/src/common/index.js` and by the legacy `ProjectWorkspaceModal.js`, but is not registered in `backend/routes/index.js`, so it 404s and is never actually called from any active UI).

Net effect: a project's real lifecycle state was split across three separate visual locations (status badge, updated-column subtext, far-right column), and the badge itself never reflected the 0-100% progress number.

### After
`getStatusMeta(order)` for project rows now derives the full lifecycle from fields that already exist on the order object (`orderVisibility`, `projectProgress`, `currentPhase`) with the following priority:

1. `orderVisibility === 'payment-rejected'` -> `Payment Rejected`
2. `orderVisibility === 'pending-approval'` -> `Booked`
3. `projectProgress >= 100` or `currentPhase === 'completed'` -> `Completed`
4. approved (`orderVisibility === 'approved' | 'visible'`) and `projectProgress === 0` -> `Developer Assigned` (static label, chosen deliberately with no real name attached, since no developer-assignment backend exists — see note below)
5. approved and `0 < projectProgress < 100` -> `` `${progress}% Complete` ``

The row markup was also cleaned up: the `assignedDeveloper?.name` / `Not assigned` line and the duplicate progress text in the updated-column and far-right slots were removed for project rows. That information now lives only in the Status badge. Plan rows are unaffected — they still show `currentValue` (`days left` / `updates left`) in the same two slots as before.

## 4. Known gap: no real developer-assignment backend

Confirmed by evidence during this session:
- `orderProductModel.js` defines `assignedDeveloper` (ref to `Developer`) and `assignedAt`, and a `Developer` model (`developerModel.js`) exists.
- The only backend read of `assignedDeveloper` is a `.populate()` call in `getOrderDetails.js`. No controller anywhere writes to it.
- The only UI that attempts to assign a developer is `components/admin/ProjectWorkspaceModal.js`, which is legacy/unrouted (per `14_CODEBASE_AUDIT_INDEX.md`) and calls `SummaryApi.assignDeveloper` -> `/api/assign-developer`, which is **not** registered in `backend/routes/index.js`.

Decision (explicit, from the user): do not build the real assignment backend now. Use a static "Developer Assigned" label instead, driven purely by `projectProgress === 0` on an approved order. If real developer assignment is ever implemented, the `/api/assign-developer` route must be added to `backend/routes/index.js` and wired to write `assignedDeveloper`/`assignedAt` on the order before this static label can be replaced with the real developer's name.

## 5. Regression boundaries for future work

- Do not reintroduce the `Active`/`Completed` tabs without an explicit user request.
- Do not move the plan-status logic (`Closed` / `Active plan`) — this pass touched project rows only, per explicit instruction to handle projects first.
- Do not wire `assignedDeveloper` display to real data until the backend route actually exists and is confirmed working.
- Any future status-label change must keep using the existing `orderVisibility` / `projectProgress` / `currentPhase` fields; do not introduce a new status field without evidence that the existing three are insufficient.
