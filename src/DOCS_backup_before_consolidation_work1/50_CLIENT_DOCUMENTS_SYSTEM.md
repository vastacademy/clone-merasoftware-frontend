# Client Documents System — One Place for Proposals + Agreements

**Session date**: 2026-08-12
**Scope**: A new **Documents** system so a customer sees every admin-sent file — the **proposal/quotation** and **follow-up attachment** sent while they were a lead, and any **agreement/document** sent after they became a client — in **one newest-first timeline**. Admin uploads agreements from the client workspace (works even for a demo client with **no running project**); the customer reads them on a new `/documents` page. Built in 4 approved phases (Phase 5 — attaching a document during a project-node update — is **deferred**, see "Not built yet"). **No `npm run build` run** (standing instruction).
**Read this before touching**: `backend/models/userModel.js` (`documents[]` field + `clientDocumentSchema`), `backend/helpers/clientDocumentsTimeline.js` (new, the shared merge), `backend/controller/user/uploadClientDocument.js` / `getClientDocuments.js` / `getAdminClientDocuments.js` (new), `backend/routes/index.js`, `frontend/src/pages/CustomerDocuments.js` (new), `frontend/src/pages/AdminClientWorkspace.js` (Documents tab + `ClientDocumentsPanel`), `frontend/src/components/DashboardLayout.js` (sidebar + title), `frontend/src/routes/customerRoutes.js`, `frontend/src/common/index.js`.
**Read alongside**: `43_LEAD_CRM_SYSTEM_PHASE_1_TO_6A.md` (lead `proposals[]` — the second source this timeline reads, and the "two owners, one collection each" rule this follows), `49_TRASH_SYSTEM_SOFT_DELETE.md` (the additive-field precedent on `userModel`), `39_PROJECT_NODE_SYSTEM_...md` / `40_NODE_EDIT_...md` (the node system Phase 5 will extend).

---

## Core design decisions (each confirmed with the user before coding)

- **The document lives on the CLIENT (`userModel`), not on an order/node.** The deciding requirement: a client can exist with **no running project** (e.g. a demo client) and must still have one place an agreement can be sent to. A node exists only while a project is running, and an order exists only when there is an order — both would miss the demo-client case. `userModel` is always present, so it is the correct owner. (A node back-link is still recorded when a document is sent during a node update — see Phase 5 — but the document's home is always the client.)
- **Lead and client are two separate records — the document is NOT copied on convert.** Per `43_...md`, convert (`convertLead.js`) creates a **new** `userModel` record and only sets `lead.convertedToUserId`; the lead row (with its `proposals[]` and `followUps[].attachment`) stays in `leadModel`. Lead-stage files remain there and agreements go in `userModel.documents[]` — **two owners, never merged in the DB**. The customer Documents page **reads both and merges them into one view** (linked by `convertedToUserId`).
- **One file-handling pattern, reused — not a new storage system.** `userModel.documents[]` uses the exact same Google Drive shape as `leadModel.proposals[]` (`name, driveFileId, downloadLink, type, size, uploadedAt, uploadedBy`), uploaded via the existing shared `GoogleDriveService` (same key-file resolution + `createFolder`/`uploadFile`/`getDownloadLink` as `uploadProposal.js`), into a `ClientDocuments` Drive folder.
- **Admin fetch is a dedicated lazy endpoint, not bundled into the workspace payload.** `getAdminUserWorkspace.js`'s `customer` object is deliberately minimal (`name email phone status walletBalance...`). Documents (with Drive links) load only when the admin opens the Documents tab, mirroring how the Account & Access tab fetches its own `credentials` — established pattern, no extra payload on every tab load.
- **The merge logic is a single shared helper.** `clientDocumentsTimeline.js` is called by **both** the customer endpoint and the admin endpoint, so both sides return the identical shape — no duplicated merge/sort.

---

## 1. Schema (additive, default-safe)

**`backend/models/userModel.js`** — new `clientDocumentSchema` + `documents: [clientDocumentSchema]` (default `[]`).

```
clientDocumentSchema {
  name, driveFileId, downloadLink, type, size,     // same Drive shape as proposals[]
  source: enum ['agreement','general'] default 'general',
  orderId → order (default null),   nodeId: String (default null),   // optional node back-links
  uploadedAt, uploadedBy → user
}   // _id: true (each document is addressable)
```

Default `[]`, so every pre-existing user is byte-unaffected (same additive precedent as `49_...md`'s `deletedAt`).

## 2. Shared merge helper (new)

**`backend/helpers/clientDocumentsTimeline.js`** — `buildClientDocumentsTimeline(userId)`:
- Reads `userModel.documents[]` → maps each to `{id, kind:"agreement", name, downloadLink, type, size, source, nodeId, orderId, date:uploadedAt}`.
- Reads the converted lead (`leadModel.findOne({ convertedToUserId: userId })`) → maps each proposal and each follow-up attachment with a download link into its own timeline record.
- Returns the two arrays merged, **newest-first** (`sort` on `date` desc). Returns `null` if the user doesn't exist.
- **Read-only — owns no data.** Both endpoints below call it, so the timeline shape is identical on both sides.

## 3. Controllers (new)

- **`uploadClientDocument.js`** (`POST /api/admin/clients/:customerId/documents`, `authToken` + `upload.any()`): admin guard; requires `roles:"customer"` target; requires a file. Uploads to Drive (`ClientDocuments` folder) exactly like `uploadProposal.js`, then pushes onto `client.documents`. Accepts optional `source` (validated against `['agreement','general']`, default `general`) and optional `orderId`/`nodeId` (for node-update uploads, Phase 5).
- **`getClientDocuments.js`** (`GET /api/my-documents`, `authToken`): customer-facing. Returns `buildClientDocumentsTimeline(req.userId)` (404 if the helper returns null). Nothing but admin-sent files ever appears here.
- **`getAdminClientDocuments.js`** (`GET /api/admin/clients/:customerId/documents`, `authToken`): admin-facing. Admin guard + `roles:"customer"` check, then the **same** helper for `customerId`. Loaded lazily when the admin opens the Documents tab.

## 4. Routes (`backend/routes/index.js`)

```
POST /api/admin/clients/:customerId/documents   → uploadClientDocument   (upload.any())
GET  /api/admin/clients/:customerId/documents    → getAdminClientDocuments
GET  /api/my-documents                            → getClientDocuments
```
`/admin/clients/:customerId/documents` sits alongside the existing `/credentials`, `/reset-password`, `/account-status`, `/create-project`, `/trash` client sub-routes — no shadowing. `/my-documents` is a distinct customer path.

## 5. Frontend

- **`common/index.js`**: `uploadClientDocument` (POST `/api/admin/clients`), `adminClientDocuments` (GET `/api/admin/clients`), `myDocuments` (GET `/api/my-documents`). The `:customerId/documents` suffix is appended at the call site (same convention as `credentials`).
- **`AdminClientWorkspace.js`**:
  - New `DOCUMENTS_TAB` added to all three dynamic tab-order branches (after Payment & Invoices, before Account & Access).
  - Documents state (`documentsList`/`documentsLoading`/`documentsError`/`documentUploading`), a lazy `loadDocuments()` fetch that fires when `activeTab === "documents"` (same pattern as `loadAccessData`), and `handleUploadDocument({file, source})` that POSTs `FormData` then re-fetches from the source of truth.
  - New `ClientDocumentsPanel` component: an **upload card** (file `.pdf,.doc,.docx` + source dropdown Agreement/General + Upload button) and a **timeline card** (newest-first, badge-tagged — Agreement=emerald, Proposal vN=amber, Document=slate — with date, size, and a Drive Download link). New `Upload`/`Download` lucide imports; new local `formatFileSize`/`getDocKindMeta` helpers.
- **`CustomerDocuments.js`** (new, route `/documents`): full-page glass template (`DashboardLayout` + `bg-slate-950` + `BG.png` overlay, centered header, absolute-left Back button → `/dashboard`, dark-glass timeline card). Fetches `GET /my-documents` once on mount; renders the newest-first list with the same badge/label logic (emerald Agreement / amber Proposal), date, size, Download. Empty/loading/error states. Shows **only** admin-sent documents — no other files.
- **`customerRoutes.js`**: `/documents` → `CustomerDocuments` (customer-protected).
- **`DashboardLayout.js`**: sidebar `secondaryLinks` gains `Documents` (`FileCheck` icon, `to:/documents`, after Orders); `getPageTitle()` maps `/documents` → "Documents". Shared `sidebarContent` means it also appears in the mobile drawer.

## 6. End-to-end flow

```
(lead stage)  Admin → Lead → upload proposal/follow-up attachment → leadModel.proposals[] / followUps[].attachment
(client stage) Admin → Client workspace → Documents tab → upload agreement
                    → userModel.documents[] (Drive, source=agreement)         ← works with NO project
Customer → sidebar Documents → /documents (GET /my-documents)
        → buildClientDocumentsTimeline merges userModel.documents[]
          + converted-lead proposals[] / followUps[].attachment → one newest-first timeline, download links
```

## 7. SSOT / conflict verification (audited, not assumed)

- **One DB owner per source**: client documents = `userModel.documents[]`; lead proposals and follow-up attachments = `leadModel` (pre-existing). The timeline **reads** both but the DB never duplicates a document across collections.
- **One merge, one shape**: `clientDocumentsTimeline.js` is the single source for both the customer and admin endpoints.
- **All additive** — `documents[]` defaults `[]`; no existing model/query/flow modified. `getAdminUserWorkspace.js` deliberately **not** touched (documents load via their own endpoint).
- **One file pattern** — same `GoogleDriveService` + Drive shape as `uploadProposal.js`; no new storage system.
- Route ordering checked: the new `/admin/clients/:customerId/documents` GET+POST do not shadow other `/admin/clients/*` sub-routes.

## 8. Not built yet (explicitly deferred)

- **Phase 5 — document upload during a project-node update**: the schema already carries `orderId`/`nodeId` back-links and `uploadClientDocument.js` already accepts them, but `AdminProjectCheckpointDetail.js`'s Add-Node panel and `projectNodeController.js`'s `createProjectNode`/`editProjectNode` do **not** yet upload a file — only the existing optional text message. When built, a node-update file will push to the same `userModel.documents[]` with `nodeId`/`orderId` set, so the timeline can show which node update it arrived with. Nothing else changes.
- **Delete / replace a document** — upload + view only; no admin delete of an uploaded document yet.
- **Customer upload** — the Documents page is read-only for the customer; only admin sends documents.
- **Trash integration** — a trashed client's `documents[]` are left as-is (same as their orders in `49_...md`).

## Files touched this session

- **New (backend)**: `helpers/clientDocumentsTimeline.js`; `controller/user/uploadClientDocument.js`, `getClientDocuments.js`, `getAdminClientDocuments.js`.
- **Changed (backend)**: `models/userModel.js` (`clientDocumentSchema` + `documents[]`); `routes/index.js` (3 imports + 3 routes).
- **New (frontend)**: `pages/CustomerDocuments.js`.
- **Changed (frontend)**: `common/index.js` (3 API entries); `pages/AdminClientWorkspace.js` (`DOCUMENTS_TAB`, documents state/handlers, `ClientDocumentsPanel`, `Upload`/`Download` imports); `components/DashboardLayout.js` (sidebar entry + `FileCheck` import + page title); `routes/customerRoutes.js` (`/documents` route).
- **Not touched**: `getAdminUserWorkspace.js`, `convertLead.js`, `uploadProposal.js`, `leadModel.js` (logic reused, not edited); no `npm run build` run.

## Verification

- All changed backend files pass `node --check`.
- All changed/new frontend files pass `@babel/core` parse (with `@babel/preset-react` for JSX files).
- `npm run build` was **not** run (standing project rule).
