# Trash System — Soft-Delete + 30-Day Restore (Leads + Clients)

**Session date**: 2026-08-11
**Scope**: A new admin **Trash** system. Deleting a lead or a client no longer removes it permanently — it is soft-deleted into Trash, hidden everywhere, restorable for 30 days, then permanently purged. Purge is **lazy** (no cron): it happens when the Trash page is opened, plus a manual "Delete Forever". Applies to both **leads** (`leadModel`) and **clients** (`userModel`, `roles: "customer"`).
**Read this before touching**: `backend/models/userModel.js` / `backend/models/leadModel.js` (`deletedAt`/`deletedBy` fields), anything under `backend/controller/trash/`, `backend/controller/lead/deleteLead.js` (now soft-deletes), `backend/controller/lead/getLeads.js`, `backend/controller/lead/globalSearch.js`, `backend/controller/user/getAdminClients.js` (all now filter `deletedAt: null`), `backend/routes/index.js`, `frontend/src/pages/AdminTrashPage.js` (new), `frontend/src/pages/AdminClientWorkspace.js` (Account & Access → Delete Client), `frontend/src/pages/AdminLeadsPage.js` (delete wording), `frontend/src/components/AdminLayout.js` (sidebar Trash entry), `frontend/src/routes/adminRoutes.js`, `frontend/src/common/index.js`.

---

## Core design decisions (each confirmed with the user before coding)

- **Soft-delete via a flag on the same collection — NOT a separate Trash collection.** A separate collection would duplicate the record's data = patch-work. Instead each of the two owners (`userModel`, `leadModel`) gets two additive fields: `deletedAt` (Date, default null) + `deletedBy` (ref user, default null). `deletedAt === null` = active/visible exactly as before; a date = in Trash. One record, one owner, only its state changes — SSOT intact (matches `43_LEAD_CRM_SYSTEM_PHASE_1_TO_6A.md`'s "one active record is owned by exactly one collection").
- **Every existing lead/client list query must hide trashed records.** Verified (not assumed) via grep — the three read paths are `getLeads.js`, `getAdminClients.js`, and `globalSearch.js` (both its userModel + leadModel branches). All now filter `deletedAt: null`. Without this, trashed records would leak back into the normal lists.
- **"Delete" now means "move to Trash".** The pre-existing lead delete (`deleteLead.js`) was a hard `findByIdAndDelete`; it now soft-deletes. Permanent removal only happens from the Trash page ("Delete Forever") or by the 30-day lazy purge.
- **No cron — lazy purge.** The user chose manual + lazy cleanup over a background job. Opening the Trash page (`getTrash.js`) is what permanently deletes anything past its 30-day retention; the page also shows an "N days left" countdown and a per-row "Delete Forever" button.
- **Client soft-delete also blocks login.** A trashed client has `isActive: false` set (reusing the existing login gate from `47_ADMIN_USER_ACCESS_CONTROL_...md`), so they cannot log in while in Trash. Restore re-enables `isActive: true`.

---

## 1. Schema (additive, default-safe)

- **`userModel.js`**: `deletedAt: Date (null)`, `deletedBy: ref user (null)`.
- **`leadModel.js`**: same two fields.

Both default null, so every pre-existing user/lead stays active and visible — byte-unaffected.

## 2. List queries — trashed records hidden (the required filters)

- `getLeads.js`: `.find()` → `.find({ deletedAt: null })`
- `getAdminClients.js`: `.find({ roles: "customer" })` → `.find({ roles: "customer", deletedAt: null })`
- `globalSearch.js`: userModel branch gains `deletedAt: null`; leadModel branch gains `deletedAt: null` (alongside the pre-existing `convertedToUserId: null`).

## 3. Retention constant + helper

- **`backend/controller/trash/trashConstants.js`** (new): `TRASH_RETENTION_DAYS = 30`, `expiryCutoff()` (the `now - 30d` boundary), `daysLeft(deletedAt)` (whole days until purge, ≥ 0). Shared by `getTrash.js`.

## 4. Controllers (new folder `backend/controller/trash/`)

- **`deleteLead.js` (modified, not new)**: still admin-guarded and still blocks converted leads. Instead of `findByIdAndDelete`, it now sets `deletedAt = now`, `deletedBy = req.userId` and saves. Guards against double-trashing (`deletedAt` already set → 409).
- **`trashClient.js`** (`POST /api/admin/clients/:customerId/trash`): admin guard; **cannot trash your own account** (self-guard); **only `roles: "customer"`** accounts are trashable (never another admin); double-trash guard. Sets `deletedAt`/`deletedBy` **and** `isActive = false` (login block).
- **`getTrash.js`** (`GET /api/admin/trash`): admin guard. **Step 1 — lazy purge**: `deleteMany({ deletedAt: { $ne: null, $lt: expiryCutoff() } })` on both models. **Step 2 — list** the remaining trashed clients + leads, badge-tagged `type: "client" | "lead"`, each with `daysLeft`, merged newest-deleted first.
- **`restoreTrash.js`** (`POST /api/admin/trash/:type/:id/restore`): clears `deletedAt`/`deletedBy` back to null; for a client also `isActive = true`. 404 if the record isn't actually in Trash.
- **`purgeTrash.js`** (`DELETE /api/admin/trash/:type/:id`): permanent `findByIdAndDelete`, but only for records already in Trash (`deletedAt` set) — irreversible "Delete Forever".

## 5. Routes (`backend/routes/index.js`)

```
POST   /api/admin/clients/:customerId/trash       → trashClient
GET    /api/admin/trash                            → getTrash
POST   /api/admin/trash/:type/:id/restore          → restoreTrash
DELETE /api/admin/trash/:type/:id                  → purgeTrash
DELETE /api/admin/leads/:leadId                     → deleteLead (now soft-delete; unchanged route)
```
`/admin/trash*` paths are distinct from `/admin/leads*`, `/admin/clients*`, `/admin/search` — no route shadowing.

## 6. Frontend

- **`common/index.js`**: `trashClient`, `getTrash`, `restoreTrash`, `purgeTrash` entries.
- **`AdminLayout.js`**: new sidebar module `Trash` (`Trash2` icon, `to: /admin-panel/trash`), placed above the "Upcoming" stubs. Because `sidebarContent` is shared, it appears in both the desktop sidebar and `MobileSidebarDrawer` automatically.
- **`AdminTrashPage.js`** (new, route `/admin-panel/trash`): reuses the `AdminWorkspaceShell`/`AdminWorkspaceList`/`AdminFilterDropdown` shell (same as `AdminLeadsPage.js`). Badge-tagged rows (Client emerald / Lead amber), an "N days left" chip (red at ≤ 3 days), and per-row **Restore** + **Delete Forever** (with a confirm modal). Client-side search + sort.
- **`AdminClientWorkspace.js`**: the **Account & Access** tab (`AccountAccessPanel`) gains a rose "Delete Client" card below Login Access → "Move to Trash", with a confirm modal on the page; on success it navigates back to `/admin-panel/clients`.
- **`AdminLeadsPage.js`**: the existing delete button/modal wording changed from "Delete lead?" / "Delete" to "Move lead to Trash?" / "Move to Trash", and the success toast to "Lead moved to Trash" (behavior was already routed through `deleteLead`, which now soft-deletes).

## 7. End-to-end flow

```
Admin → Leads (row Delete) OR Client → Account & Access → Move to Trash
  → record soft-deleted: deletedAt set (+ client: isActive=false, login blocked)
  → disappears from Leads/Clients/global-search (all filter deletedAt:null)
Admin → Trash (sidebar)
  → opening the page lazily purges anything > 30 days old
  → each row shows "N days left", Restore, Delete Forever
      Restore  → deletedAt=null (+ client: isActive=true) → reappears everywhere
      Delete Forever → permanent findByIdAndDelete
```

## 8. SSOT / conflict verification (audited, not assumed)

- All three lead/client read paths (`getLeads`, `getAdminClients`, `globalSearch` ×2) filter `deletedAt: null` — verified by grepping every `roles: "customer"` / `leadModel.find` / `userModel.find` list query in `backend/controller`.
- Converted leads are still delete-blocked in `deleteLead.js` (audit trail preserved).
- No new database, no new payment/order path. Order/project deletion (`scanDeleteOrder.js`/`deleteOrder.js`) is a **separate** system and is out of this scope — a trashed client's orders are left as-is and reappear on restore.
- Additive fields only; `isActive` reuse is the same login gate from `47_...md`.

## 9. Not built / out of scope

- **Order/project trash** — only leads and clients are covered. A client's orders are untouched by trashing (they simply become inaccessible while the client is hidden + login-blocked).
- **Bulk restore / bulk purge** — one record at a time.
- **Configurable retention** — 30 days is a constant in `trashConstants.js`.
- **No `npm run build` run** (standing instruction).

## Files touched this session

- **New (backend)**: `controller/trash/trashConstants.js`, `trashClient.js`, `getTrash.js`, `restoreTrash.js`, `purgeTrash.js`.
- **Changed (backend)**: `models/userModel.js`, `models/leadModel.js` (soft-delete fields); `controller/lead/deleteLead.js` (soft-delete); `controller/lead/getLeads.js`, `controller/lead/globalSearch.js`, `controller/user/getAdminClients.js` (`deletedAt: null` filter); `routes/index.js` (imports + 4 routes).
- **New (frontend)**: `pages/AdminTrashPage.js`.
- **Changed (frontend)**: `common/index.js` (4 API entries); `components/AdminLayout.js` (sidebar + `Trash2` import); `routes/adminRoutes.js` (route); `pages/AdminClientWorkspace.js` (Delete Client card + trash handler + modal); `pages/AdminLeadsPage.js` (delete → trash wording).
- **Backups**: `backend/_backup_trash_work1/`, `frontend/src/_backup_trash_work1/`.
