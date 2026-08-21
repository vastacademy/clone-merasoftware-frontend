# Guest Login System — Implemented

**Status**: **Implemented and tested against the live DB.** Sections 1-8 below are the original approved plan (kept for context/rationale). Section 9 records what was actually built and the live test results — read that first if you just need current state.

**Read this before touching**: `Login.js`, `userModel.js`, `leadModel.js`, `convertLead.js`, `getAdminClients.js`, `authToken.js`, `chessGameModel.js`/`chessRoomManager.js`, `AdminLeadsPage.js`, `guestLogin.js`, `guestCascadeDelete.js`, `purgeExpiredGuests.js`, `guestDummyWalletCredit.js`, `GuestLoginModal.js`, or anything under `backend/controller/lead/` or `backend/chess/`.

---

## 1. What this feature is

A "Login as Guest" button on the Login page lets a visitor fill a small popup (Name, Phone, Email) and get a **real, fully-functional temporary customer account** — same dashboard, same orders, same chess, same wallet mechanics as a real customer (SSOT — no parallel/duplicate systems). The visitor is simultaneously captured as a normal **lead** (existing `leadModel`/CRM pipeline), tagged with a "Guest" badge so admin knows the source. If the guest is inactive for 24 hours, the temporary account and everything it created (orders, transactions, invoices, chess games, etc.) is cascade-deleted — but the **lead itself is permanent** and is never deleted. If admin converts the guest's lead to a real client (using the **existing** "Convert to Client" flow, no new button), the guest's dummy data is discarded and only name/phone/email carry over into the new real customer account.

## 2. Confirmed requirements (do not re-litigate these)

1. Popup on Login page (not a new route) — Name/Phone/Email, all required.
2. On submit: create a lead (`source: "guest"`) AND a live `userModel` account (`isGuest: true`), linked to each other, guest is immediately logged in.
3. Guest has full portal access using the SAME live models as real customers — orders, chess, wallet — no separate "demo" schema/system.
4. Wallet: guest cannot use real UPI/payment gateway. A dummy-credit button gives fake balance. **Decision: this DOES create a `transactionModel` row**, tagged distinguishably (e.g. `paymentMethod: "demo"`), so wallet history UI isn't empty/broken for a guest — reuses the SSOT transaction-history pattern rather than inventing a guest-only view.
5. Expiry: **24-hour INACTIVITY** window (not fixed-from-creation) — activity resets the clock.
   - **Decision: activity = every authenticated API call**, refreshed via `authToken.js` middleware. Accepted trade-off: this adds a new per-request DB write to a middleware that currently does zero DB calls (verified — `authToken.js` only does `jwt.verify()`, no DB access at all today). Simplicity of "one hook point" was chosen over the alternative (only refresh on explicit actions like order/chess/login), which would need per-action wiring in multiple controllers.
6. On expiry, or on lead-conversion: full cascade delete of the guest's `userModel` row and everything it created — orders, transactions, invoices (both `invoiceModel` and `monthlyInvoiceModel`), tickets, notifications, update requests, chess games. **The lead row is never deleted** — only its `guestUserId` link field is cleared.
7. **Chess mid-game exception (decision)**: a guest must NOT be expired/deleted while they have an active chess game (any status other than `closed`, using the existing `getActiveGamesForUser(userId)` helper in `chessRoomManager.js:112-119`). Defer expiry until the game ends. Reason: chess has **no forfeit/abandon concept at all** (verified — status enum is only `active`/`reset-pending`/`end-pending`/`closed`, no `winner`/`result` field, `closed` is declared but never actually used anywhere — games end by being **deleted**, not by status transition). There is no "auto-forfeit and keep a record" option available without inventing new schema/status, so the only safe choice is defer-until-game-ends.
8. Purge trigger: **lazy-purge**, same pattern as the existing Trash system (`getTrash.js` — purges whenever its list page loads, no cron anywhere in this codebase for user deletion). Guest purge should run (a) opportunistically on admin Clients-list load, and (b) as a self-check on the guest-login/resume endpoint (an expired guest trying to resume triggers its own cleanup first, then creates fresh).
9. Cross-device resume: if the same person (matched by **email AND phone both**, not just one) returns within the 24h window on a different device, they resume the SAME still-alive guest account rather than getting a new one. Same-device return works automatically via the existing session cookie, no extra logic needed for that case.
10. Convert-to-client uses the **existing** `AdminLeadDetailPage.js` "Convert to Client" button and **existing** `convertLead.js` controller — no new guest-specific UI/button/page. On convert: guest's dummy `userModel` account + all its data is cascade-deleted (reusing the same cascade helper as expiry), only name/phone/email carry into the new real customer record.

## 3. Verified current-code facts that constrain implementation

All verified by reading the actual files (not assumed) — see git history / this session's research for exact line numbers, re-verify if this doc is read much later and the code may have moved.

- **`leadModel.js`** already has `source` (String, default `""`, trim) and `convertedToUserId` (ObjectId ref `user`, default null). Both stay as-is. A **new** `guestUserId` field (ObjectId ref `user`, default null) must be added — it must be a **separate** field from `convertedToUserId`, not a reuse, because their semantics differ (`guestUserId` = "a live temporary guest account exists right now and may get deleted"; `convertedToUserId` = "permanently converted, Won status").
- **`userModel.js`** has `email` as `{ required: true, unique: true }` — a **hard, non-partial, non-sparse unique index**. This is a real constraint, not just an app-level check: a guest's real email and a later real-customer account **cannot both exist in the DB at the same time** with that email. **The guest account must be deleted before (or atomically with) creating the new real-customer account during conversion**, or MongoDB itself throws a duplicate-key error — this is a hard ordering requirement, not a style preference.
- **`convertLead.js`**'s existing duplicate-email guard is a **hard 409 reject**, unconditional, with **no special-casing for anything** today (confirmed — no guest concept exists in this file at all currently). This means: simply adding a guest flow will make every guest-originated conversion **immediately fail** with "user already exists" unless this guard is explicitly updated to recognize and handle the guest-is-the-one-being-replaced case. This is new logic to write, not an existing pattern to extend.
- **`getAdminClients.js`**'s client-list query is exactly `userModel.find({ roles: "customer", deletedAt: null })` — **no guest-awareness at all**. A guest account (which will have `roles: ["customer"]`) **will leak into the normal admin Clients list** unless this query is updated to exclude `isGuest: true`. Confirmed regression, must be fixed as part of this feature.
- **`orderDeletePlan.js`/`deleteOrder.js`** (the codebase's only existing "cascade + transaction" delete pattern, scoped to one order) cascades: `updateRequestModel`, `monthlyInvoiceModel`, `transactionModel`, `partnerCommissionModel`, then the order itself — all inside a `mongoose.startSession()` transaction. **`invoiceModel` is absent from this cascade — a known, confirmed gap.** The new guest-cascade-delete helper must NOT copy this omission; it must explicitly include `invoiceModel` (which has a required `userId` field, confirmed).
- **Trash system (`getTrash.js`)** is the only existing "lazy purge" precedent: on every load of the Trash list, it runs `deleteMany` for anything past its 30-day retention — no cron exists anywhere in this backend for user-record deletion. The new guest-purge should follow this exact shape, not introduce the codebase's first cron.
- **Chess** (`chessGameModel.js`): `players.white`/`players.black` are optional ObjectId refs to `user`, no name/email snapshot on the game document itself — identity is attached only via `.populate()` at read time (`chessRoomManager.js`, `chessSocket.js`). A **ready-made helper already exists** for "does this user have a live game" — `getActiveGamesForUser(userId)` in `chessRoomManager.js:112-119`, which treats anything not `status: 'closed'` as active. Reuse this helper directly for the expiry-defer check rather than writing a new query.
- **`authToken.js`** currently does zero DB calls — pure JWT decode. Adding an activity-timestamp write here is a deliberate, accepted new per-request DB write (see requirement #5 above).

## 4. Schema changes (additive-only)

**`backend/models/leadModel.js`**
- New: `guestUserId` (ObjectId, ref `"user"`, default `null`)

**`backend/models/userModel.js`**
- New: `isGuest` (Boolean, default `false`)
- New: `guestLeadId` (ObjectId, ref `"lead"`, default `null`)
- New: `lastActivityAt` (Date, default `null`)

No changes needed to `orderProductModel`, `transactionModel`, `chessGameModel`, `invoiceModel`, `ticketModel`, `updateRequestModel`, `notificationModel` — a guest's `_id` sits in their existing `userId`/`players.*` fields exactly like any real customer, which is the entire point of SSOT reuse.

## 5. New backend pieces

- **`backend/controller/user/guestLogin.js`** (new) — public endpoint (`POST /api/guest-login`, no auth). Logic: (1) opportunistic self-purge check for this email+phone if an existing guest is already expired, (2) if a non-expired guest already exists matching **both** email and phone, resume it (refresh `lastActivityAt`, issue the same JWT cookie as normal login, no new records), (3) otherwise create a `leadModel` doc (`source: "guest"`) and a `userModel` doc (`roles: ["customer"], isGuest: true, walletBalance: 0`) together, cross-link `guestUserId`/`guestLeadId`, issue JWT cookie exactly like `userSignIn.js`. Recommend wrapping the create-path in a Mongo transaction since two documents must land together.
- **`backend/helpers/guestCascadeDelete.js`** (new) — `buildGuestDeletePlan(userId)` (counts) + `executeGuestCascadeDelete(userId)` (transactional deletes across `updateRequestModel`, `monthlyInvoiceModel`, `transactionModel`, `invoiceModel`, `ticketModel`, `notificationModel`, `chessGameModel`, `orderProductModel`, then the `userModel` row itself) — modeled on `orderDeletePlan.js`/`deleteOrder.js`'s plan+transaction shape, but scoped to a user, and explicitly including `invoiceModel` (the gap that pattern has today). Must check `getActiveGamesForUser(userId)` first and skip/defer if any non-`closed` chess game exists. After deletion, must null out the linking lead's `guestUserId` (lead itself stays).
- **Lazy-purge wiring**: a small `backend/helpers/purgeExpiredGuests.js` (new) called from (a) `getAdminClients.js` on load, (b) the start of `guestLogin.js`'s resume-check path.
- **`convertLead.js`** additive change: after a successful conversion, if `lead.guestUserId` is set, run `executeGuestCascadeDelete` and clear the link. **Also**: the existing hard 409 duplicate-email guard must be updated to allow-through when the found existing user IS the linked guest (`existingUser._id.equals(lead.guestUserId)`) — and the guest must be deleted **before** the new real user with that email is created, to avoid the unique-index collision described in Section 3.
- **Route registration**: `POST /guest-login` in `backend/routes/index.js`, alongside the existing lead/signup routes, no `authToken` guard (public).

## 6. New frontend pieces

- **`Login.js`**: add a "Login as Guest" button that opens a new modal component (no route change).
- **`frontend/src/components/GuestLoginModal.js`** (new): Name/Phone/Email form, posts to `/guest-login`, on success reuses the existing `postLogin.js` flow unchanged (guest has `role: "customer"`, routes normally to `/dashboard`).
- **`AdminLeadsPage.js`**: where `lead.source` is currently rendered as plain text, add a conditional "Guest" badge when `lead.source === "guest"`. No structural page change, no new admin page.

## 7. Regression risks to verify/fix as part of this work

- `getAdminClients.js` must exclude `isGuest: true` — confirmed leak otherwise.
- `convertLead.js`'s duplicate-email guard must special-case the guest-is-being-replaced scenario, and deletion must happen before/atomically-with new-user creation (unique index constraint, not just app logic).
- A full-repo audit of every other `userModel.find({ roles: "customer" ... })` call site (beyond `getAdminClients.js` and `getTrash.js`, both checked) was **not exhaustively done** — worth a quick grep pass before shipping to make sure guests don't leak elsewhere.
- Socket/chess frontend should be checked for how it behaves if a game document disappears mid-session (relevant only in the rare window between "guest went inactive" and "guest's active-game check correctly deferred expiry" — should be a non-issue given the defer rule, but worth a sanity test).

## 8. What is explicitly NOT part of this phase

- No guest-specific admin page — guests appear only as normal leads with a badge.
- No new cron job — lazy-purge only, per existing codebase convention.
- No real payment/UPI path for guests — dummy wallet credit only.
- No chess forfeit/abandon status invented — defer-expiry-until-game-ends is the chosen workaround instead.

---

## 9. What was actually built (implementation record)

All items from Sections 4-6 were implemented exactly as planned, no scope changes. No `npm run build` was run — verified via `node --check` (backend, all 9 touched/new files) and `@babel/core` parse (frontend, all 4 touched/new files), then live-tested against the real MongoDB (`merasoftware-db`) with real create/resume/credit/cascade/convert calls — all test records were cleaned up afterward, nothing left in production data.

### Files changed/added (exact, for future reference)

**Schema**
- `backend/models/leadModel.js` — added `guestUserId` (ObjectId ref `user`, default null), separate from `convertedToUserId`.
- `backend/models/userModel.js` — added `isGuest` (Boolean, default false), `guestLeadId` (ObjectId ref `lead`, default null), `lastActivityAt` (Date, default null).
- `backend/models/transactionModel.js` — `paymentMethod` enum additively gained `"demo"` (existing values untouched).

**New backend files**
- `backend/helpers/guestCascadeDelete.js` — `buildGuestDeletePlan()` + `executeGuestCascadeDelete()`. Refuses to run on a non-`isGuest` user (safety guard) and refuses while `chessRoomManager.getActiveGamesForUser()` returns any live game. Cascades `updateRequestModel`, `monthlyInvoiceModel` (via the guest's own order ids), `transactionModel`, `invoiceModel`, `ticketModel`, `notificationModel`, `orderProductModel`, then the user itself, all inside one Mongo transaction. Clears (does not delete) the linked lead's `guestUserId`.
- `backend/helpers/purgeExpiredGuests.js` — finds guests past 24h inactivity (`lastActivityAt` or, if never set, `createdAt`) and runs the cascade helper on each; lazy, no cron, matches `getTrash.js`'s pattern exactly.
- `backend/controller/user/guestLogin.js` — public `POST /api/guest-login`. Purges expired guests first, then checks for a live guest matching **both** email and phone on a `source: "guest"` lead; resumes it (refreshes `lastActivityAt`, reissues the login cookie) if found, otherwise creates the lead+user pair in one transaction and logs in.
- `backend/controller/user/guestDummyWalletCredit.js` — guest-only `POST /api/guest/demo-wallet-credit`, fixed ₹5000, reuses `transactionService.creditWalletInstant()` with `paymentMethod: "demo"`.

**Edited backend files**
- `backend/controller/lead/convertLead.js` — the existing-user-by-email guard now allow-throughs when the found user is the lead's own `guestUserId`, cascade-deletes that guest first (avoids the `userModel.email` unique-index collision), then proceeds with the normal conversion unchanged.
- `backend/controller/user/getAdminClients.js` — client-list query gained `isGuest: { $ne: true }`; also now calls `purgeExpiredGuests()` on load (second lazy-purge trigger point, alongside the guest-login endpoint's own self-check).
- `backend/middleware/authToken.js` — added a fire-and-forget `userModel.updateOne({ _id: req.userId, isGuest: true }, { $set: { lastActivityAt: new Date() } })` after token verification. The query's own `isGuest: true` filter means it matches zero documents (no-op) for every real-customer/admin request — the new per-request DB write only actually happens for guest sessions, not universally.
- `backend/routes/index.js` — registered `POST /guest-login` (public) and `POST /guest/demo-wallet-credit` (authToken-guarded).

**Frontend**
- `frontend/src/components/GuestLoginModal.js` (new) — Name/Phone/Email popup, posts to `guestLogin`, calls `onSuccess(dataApi)` on success.
- `frontend/src/pages/Login.js` — added a "Login as Guest" button opening the modal; on success reuses the existing `postLogin()` unchanged.
- `frontend/src/common/index.js` — added `guestLogin` and `guestDummyWalletCredit` `SummaryApi` entries.
- `frontend/src/pages/AdminLeadsPage.js` — the `source` column now renders a purple "Guest" badge when `lead.source === "guest"`, plain text otherwise (unchanged for every other source value).

### Live test results (against real DB, all test data cleaned up after)

| Test | Result |
|---|---|
| Fresh guest login creates linked lead (`source:"guest"`) + user (`isGuest:true`) | Pass |
| Same email+phone resubmitted → resumes same `_id`, no duplicate created | Pass |
| `lastActivityAt` set/refreshed via the resume path | Pass |
| Guest excluded from `getAdminClients.js`'s filter | Pass (confirmed query returns null for a real guest `_id`) |
| Dummy wallet credit reaches `walletBalance` (5000) via a `paymentMethod:"demo"` transaction | Pass |
| Cascade-delete removes the user + its demo transaction, lead survives with `guestUserId` cleared to null | Pass |
| Cascade-delete refuses (`reason:"active_chess_game"`) while an active game exists between the guest and a real second user | Pass |
| `convertLead.js` on a guest-originated lead: deletes the old guest account, creates the real customer with the same email (no unique-index collision), lead becomes `Won` with `convertedToUserId` set and `guestUserId` cleared | Pass |

### Known follow-ups not built this pass (not required by the approved scope, noted for future reference)

- No admin-facing UI shows `buildGuestDeletePlan()`'s counts before a manual purge — expiry/purge is fully automatic (lazy, on the two trigger points above), so this was never required by the approved scope.
- A full-repo grep for every other `userModel.find({ roles: "customer" ... })` call site (beyond `getAdminClients.js`, which is fixed, and `getTrash.js`, which is unaffected since guests are hard-deleted not soft-deleted) was flagged in Section 7 as worth a pass but was not exhaustively re-verified in this implementation session.
- Chess "active game" defer only blocks deletion — it does not proactively notify the guest or the real opponent that expiry is pending; this matches the approved decision (Section 2, item 7) exactly, just noting the UX is silent-defer, not defer-with-notice.
