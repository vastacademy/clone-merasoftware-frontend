# Lead / CRM System — Phase 1 to 6A

**Session date**: 2026-08-10
**Scope**: New admin-side **Lead / CRM system** — a prospect pipeline that lives *before* a person becomes a registered customer. Leads are stored in a brand-new `leadModel` collection (never in `userModel`); a lead becomes a real client only on an explicit **Convert** step, which is the only place a `userModel` user is created. Built in six approved sub-phases (Phase 5 CSV import and Phase 6B system-generated quotation builder are **not** done — see "Not built yet"). **No `npm run build` run** (standing instruction).

**Read this before touching**: `backend/models/leadModel.js` (new), anything under `backend/controller/lead/` (new folder: `createLead.js`, `getLeads.js`, `getLeadDetail.js`, `updateLead.js`, `globalSearch.js`, `convertLead.js`, `uploadProposal.js`), `backend/controller/user/setNewPassword.js` (new), `backend/models/userModel.js` (`mustResetPassword` field), `backend/controller/user/userSignIn.js` (login response field), `frontend/src/pages/AdminLeadsPage.js` / `AdminLeadDetailPage.js` (new), `frontend/src/pages/SetNewPassword.js` (new), `frontend/src/components/admin/AdminGlobalSearch.js` (new), `frontend/src/helpers/postLogin.js` (first-login gate), `frontend/src/components/AdminLayout.js` (sidebar + search mount), `frontend/src/routes/adminRoutes.js` / `customerRoutes.js`, `frontend/src/common/index.js`.
**Read alongside**: `33_ADMIN_CREATE_PROJECT_FOR_CLIENT.md` (the "reuse SSOT, no separate admin backend" precedent this system follows), `04_BACKEND_OVERVIEW.md` (`userModel`/roles, the customer this system eventually creates).

---

## Core design decisions (each confirmed with the user before coding)

- **Separate `leadModel` collection, NOT a flag on `userModel`.** A lead is a person with no account yet; the entire live codebase filters clients by `roles: "customer"` (`getAdminClients.js`). Putting leads in `userModel` would leak them into every customer flow — rejected as patch-work. A lead and a client are two owners; **one active record is owned by exactly one collection**, never duplicated.
- **SSOT**: lead's truth = `leadModel`; client's truth = `userModel` (`roles: "customer"`) — unchanged. Convert is an **ownership handoff**: after convert the lead row stays only as historical/audit (`convertedToUserId` set, status `Won`), and all live business data (orders/projects/payments) comes from `userModel` + the existing order system.
- **Same backend, same DB.** No separate admin backend, no separate database — `leadModel` is one more collection in the same MongoDB, additive controllers/routes follow the existing `admin/*` convention.
- **Separate `Leads` page + one global search** (not a merged Clients list with a filter). Merging would force one page/table to read two collections = patch-work. Instead: `Leads` is its own top-level page, `Clients` is untouched, and a single sidebar **global search** reads both collections and badge-tags each result (`Lead` / `Client`) so the admin never searches two places. Converted leads are hidden from lead search results (they already surface as a client).

---

## 1. `leadModel` schema (new, `backend/models/leadModel.js`)

```
name (required), phone (trim, lowercase-email), email (lowercase), source, notes
status: enum [New, Contacted, Qualified, Proposal Sent, Won, Lost], default New
followUps:  [{ note, date, createdBy→user, createdAt }]              // Phase 2
proposals:  [{ version, name, driveFileId, downloadLink, type, size, // Phase 6A
               uploadedAt, uploadedBy→user }]
convertedToUserId → user (default null; set only on convert)         // Phase 4
createdBy → user, timestamps
```

**Before/after note**: Phase 1 reserved a single `proposalFile { url, name, uploadedAt }` object. Phase 6A replaced it with the `proposals: []` **versioned array** (each upload = a new version, so the full revision timeline is kept — clients often request changes). Safe additive change: no lead carried a proposal yet, so nothing to migrate.

---

## 2. Phase 1 — create + list

- **`createLead.js`** (`POST /api/admin/leads`): admin guard, `name` required, **`phone` required** (email optional at create time), duplicate guard (phone/email match) within the leads collection only.
- **`getLeads.js`** (`GET /api/admin/leads`): admin guard, latest-`updatedAt`-first list.
- **Frontend `AdminLeadsPage.js`** (route `/admin-panel/leads`): reuses the `AdminClientsPage.js` list-shell (`AdminWorkspaceShell`/`AdminWorkspaceList`/`AdminFilterDropdown`), plus an **Add Lead** modal (Name*, Phone*, Email, Source, Notes) and client-side search + sort. Rows are click-navigable to the detail page.
- **Sidebar**: new `Leads` entry (`UserPlus` icon) in `AdminLayout.js`'s `adminSidebarModules`, placed directly **above** `Clients`.

**Before/after note**: create originally required "phone OR email"; the user later required **phone mandatory for every lead** (so convert always has a phone), and email needed only later at convert — `createLead.js` and the Add-Lead form were both updated to phone-required.

---

## 3. Phase 2 — detail page, pipeline, follow-up log

- **`getLeadDetail.js`** (`GET /api/admin/leads/:leadId`): full lead, `followUps.createdBy` populated (name/email).
- **`updateLead.js`** (`POST /api/admin/leads/:leadId`): one controller, two `action`s — `"status"` (validated against the 6-stage enum) or `"followUp"` (pushes `{note, createdBy, createdAt}`). **Converted leads are read-only** (409). Status change and follow-up are **deliberately separate actions** (user's choice — no auto-logging of a status change as a follow-up; revisitable later).
- **Frontend `AdminLeadDetailPage.js`** (route `/admin-panel/leads/:leadId`): `AdminWorkspaceShell` header with a Back button (`leadingAction`), a Contact/Notes card, a **pipeline-stage pill selector**, and a **follow-up** section (add-note form + latest-first timeline showing author + timestamp).

---

## 4. Phase 3 — global admin search

- **`globalSearch.js`** (`GET /api/admin/search?q=`): admin guard, matches `name`/`email`/`phone` (case-insensitive, **regex-escaped** input) across **both** `userModel` (`roles: "customer"`) and `leadModel`. **Converted leads excluded** (`convertedToUserId: null`) since they already show as a client. Returns a merged, clients-first list; each row tagged `type: "client" | "lead"` (+ `status` for leads). `RESULT_LIMIT = 12` per side.
- **Frontend `AdminGlobalSearch.js`**: a search input + dropdown mounted in `AdminLayout.js`'s sidebar top (below the "Admin Panel" badge). 300ms-debounced fetch, `AbortController` to drop stale requests, outside-click close, badge-tagged results (`Client` emerald / `Lead` amber), click → `/admin-panel/clients/:id` or `/admin-panel/leads/:id`. Because `sidebarContent` is reused by both the desktop sidebar and `MobileSidebarDrawer`, the search appears in both automatically; `onNavigate` closes the mobile drawer.
- **Search owns no data** — read-only reflection of the two real owners. SSOT intact.

---

## 5. Phase 4 — convert (lead → customer) + first-login password reset

This is the first phase to touch **existing/shared files** (unavoidable — the login flow must know about the reset). All touches are additive and default-safe.

- **`userModel.js`**: new additive `mustResetPassword: Boolean` (default `false`) — pre-existing users unaffected.
- **`convertLead.js`** (`POST /api/admin/leads/:leadId/convert`): admin guard, already-converted guard, **phone required + email required** (email is the userModel unique key and the only login identifier — verified in `userSignIn.js`, which does `findOne({email})`; there is no phone login), existing-email guard (same as `userSignUp.js`). Creates a `userModel` user (`roles: ["customer"]`, name/phone/email carried, **reuses `bcrypt` hashing exactly like `userSignUp.js`**) with the **universal default password `"1234"`** and `mustResetPassword: true`. Then links the lead: `convertedToUserId = newUser._id`, `status = "Won"`. Returns `{ userId, email, defaultPassword }` so the admin can share the login.
- **`setNewPassword.js`** (`POST /api/set-new-password`, `authToken`): a logged-in user sets a new password (min 4 chars) and clears `mustResetPassword`. **This is the only password-change endpoint in the codebase — there was no forgot/reset/change-password route before this.**
- **`userSignIn.js`**: additive only — `mustResetPassword` added to the `.select(...)` and to the login response `data`. Non-breaking.
- **Frontend**:
  - `AdminLeadDetailPage.js`: a **Convert to Client** card (disabled unless both phone and email exist, with an amber hint); on success a toast shows the login email + password `1234`. After convert the pipeline card becomes read-only and shows a **View as Client** link to `/admin-panel/clients/:convertedToUserId`.
  - `postLogin.js` (shared login helper, used by `Login.js`): if `mustResetPassword` → navigate to `/set-new-password`, else `/home` as before. `Login.js` itself does no `/home` navigate of its own, so this helper is the single correct gate.
  - `SetNewPassword.js` (route `/set-new-password`, customer-protected): New/Confirm password form + **"Skip for now"** (soft gate, user's choice — the reset is offered, not forced).

**Universal password `"1234"`** is a hardcoded constant in `convertLead.js` (`UNIVERSAL_DEFAULT_PASSWORD`). Making it admin-configurable is future work.

---

## 6. Phase 6A — proposal / quotation file upload (versioned)

- **`uploadProposal.js`** (`POST /api/admin/leads/:leadId/proposal`, `authToken` + `upload.any()`): admin guard, converted-guard, requires a file. **Reuses the existing `GoogleDriveService`** (same key-file resolution + `createFolder`/`uploadFile`/`getDownloadLink` calls as `submitUpdateRequest.js`), into a `LeadProposals` Drive folder. New version = current highest `version + 1`. Pushes `{version, name, driveFileId, downloadLink, type, size, uploadedAt, uploadedBy}` onto `lead.proposals`. **First proposal auto-advances `status` to "Proposal Sent"** (skipped if the lead is already `Won`/`Lost`).
- Upload middleware is the pre-existing `multer` memoryStorage `upload` in `routes/index.js` (PDF/DOC/DOCX already allowed, 5MB limit) — no new upload system.
- **Frontend `AdminLeadDetailPage.js`**: a **Proposals & Quotations** card — file input (`.pdf,.doc,.docx`) + Upload button (posts `FormData`), and a **version timeline** (latest first: "Proposal vN · filename · date" + Drive Download link).

**Requires Google Drive credentials** (`config/google-drive-credentials.json` locally, or `GOOGLE_DRIVE_CREDENTIALS_PATH` in prod) — same prerequisite as the existing update-request file feature. Without it, upload fails.

---

## 7. End-to-end flow (live after this session)

```
Admin → Leads (add lead: name + phone required)
  → Lead detail: move pipeline stage, log follow-ups, upload proposal versions
  → Convert (needs phone + email)
        → new userModel customer (roles:["customer"], password "1234", mustResetPassword)
        → lead row: convertedToUserId set, status "Won", read-only, "View as Client" link
  → Client logs in with email + "1234"
        → postLogin sees mustResetPassword → /set-new-password (or Skip) → /home
        → from here the client is a normal customer on the existing order/project system
Global search (sidebar) → finds leads + clients, badge-tagged, one box
```

---

## 8. SSOT / conflict verification (audited, not assumed)

- Clients list is `userModel.find({ roles: "customer" })` — a lead has no `customer` role, so **leads never leak into the Clients list**.
- No existing model/query/flow is modified except the additive `mustResetPassword` (default false) and the additive `mustResetPassword` line in the login response — pre-existing users and flows are byte-unaffected.
- Convert reuses `userSignUp.js`'s hashing and enforces the same email-unique guard — no duplicate password/auth system.
- Route ordering: `/admin/search` is registered before `/admin/leads/:leadId`; distinct paths, no shadowing.
- Backend `ALLOWED_STATUSES` and frontend `PIPELINE_STAGES` are the same 6 stages.

---

## 9. Not built yet (explicitly deferred)

- **Phase 5 — CSV bulk import**: paused at the user's request ("abhi nahi") — the plan (multer already present, parse → validate → dedup-report → insert) is agreed but no code exists.
- **Phase 6B — system-generated quotation builder**: build a quotation *inside* the app (line items + prices + total → generate a document), separate from 6A's file upload. Not started.
- **Communication / send**: email + WhatsApp integration on "send proposal/quotation" — future; today everything is manual/record-only, nothing is emailed or messaged.
- **Enhancement (optional, not a bug)**: `createLead.js` dedups within leads only; it does not warn if the phone/email already belongs to an existing client. Convert's `existingUser` guard still blocks a duplicate account, so this is safe — a create-time "already a client" warning (leveraging Phase 3 search) is a possible future nicety.
- **Configurable universal password** (currently hardcoded `"1234"`).

---

## Files touched this session

- **New (backend)**: `backend/models/leadModel.js`; `backend/controller/lead/` → `createLead.js`, `getLeads.js`, `getLeadDetail.js`, `updateLead.js`, `globalSearch.js`, `convertLead.js`, `uploadProposal.js`; `backend/controller/user/setNewPassword.js`.
- **Changed (backend)**: `backend/routes/index.js` (lead imports + routes, `/admin/search`, `/set-new-password`, `/admin/leads/:leadId/proposal` with `upload.any()`); `backend/models/userModel.js` (`mustResetPassword`); `backend/controller/user/userSignIn.js` (`mustResetPassword` in `.select` + response).
- **New (frontend)**: `frontend/src/pages/AdminLeadsPage.js`, `frontend/src/pages/AdminLeadDetailPage.js`, `frontend/src/pages/SetNewPassword.js`, `frontend/src/components/admin/AdminGlobalSearch.js`.
- **Changed (frontend)**: `frontend/src/common/index.js` (`adminLeads`, `createLead`, `leadDetail`, `updateLead`, `adminGlobalSearch`, `convertLead`, `setNewPassword`, `uploadProposal`); `frontend/src/components/AdminLayout.js` (sidebar `Leads` entry + `AdminGlobalSearch` mount); `frontend/src/routes/adminRoutes.js` (`/admin-panel/leads`, `/admin-panel/leads/:leadId`); `frontend/src/routes/customerRoutes.js` (`/set-new-password`); `frontend/src/helpers/postLogin.js` (first-login gate).
- **Not touched**: `getAdminClients.js`, `AdminClientsPage.js`, `AdminClientWorkspace.js`, `createOrder.js`, `adminCreateProjectOrder.js`, `userSignUp.js` (logic reused, not edited); no `npm run build` run.
