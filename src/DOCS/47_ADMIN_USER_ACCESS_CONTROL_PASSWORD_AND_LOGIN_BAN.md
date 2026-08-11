# Admin User Access Control — Password View/Reset + Login Ban

**Session date**: 2026-08-11
**Scope**: New admin capability to fully control a client's account from `AdminClientWorkspace` — **view** the client's password (plaintext), **reset** it, and **ban/enable** login. Built cleanly (SSOT, flag-gated, reversible), **no `npm run build` run** (standing instruction).

**Owner decision (recorded)**: passwords are stored in **plaintext** (`plainPassword` on `userModel`) so an admin can read them. `bcrypt` is one-way — the original password cannot be recovered from the hash, so viewing requires an extra plaintext copy. The DB-leak risk of this was **explicitly accepted** by the owner ("mujhe risk accept hai db leak ka", "yeh meri website hai ismein main apna system rakhunga"). The feature is a single flag away from being disabled + wiped.

---

## Why plaintext (the one hard limit)

- Login always compares the **bcrypt hash** (`userSignIn.js` `bcrypt.compare`) — the hash stays the real auth source of truth. `plainPassword` is **display-only**, never used for authentication.
- A hash cannot be reversed to plaintext (maths, not policy). So "view password" is impossible without also storing plaintext. Two options existed — (A) store plaintext + view, (B) never store, admin only resets. Owner chose **A**.

---

## 1. Single control flag (new)

`backend/config/accessControlConfig.js` → `STORE_PLAIN_PASSWORD: true`.

This is the **one switch** for the whole feature. Every plaintext write is gated by it, so disabling later = set `false` (stops all new writes) + run the cleanup script (wipes existing). No need to edit the 4 write-points.

---

## 2. `userModel.js` — 2 additive fields

**Before**: `userModel` had `password` (bcrypt hash only), no plaintext, no login gate.
**After** (additive, default-safe — pre-existing users byte-unaffected):
- `plainPassword: String` (default `undefined`) — display-only plaintext copy.
- `isActive: Boolean` (default `true`) — login gate; `false` = admin-disabled account.

Added right after `mustResetPassword` in `backend/models/userModel.js`.

---

## 3. Plaintext write-points (SSOT — 4 places, all flag-gated)

Password is set in exactly these places; each now also writes `plainPassword` when `STORE_PLAIN_PASSWORD` is on:

| File | Before | After |
|---|---|---|
| `backend/controller/user/userSignUp.js` | saved only `password: hash` | + `payload.plainPassword = password` |
| `backend/controller/lead/convertLead.js` | saved only `password: hash` (`"1234"`) | + `plainPassword: UNIVERSAL_DEFAULT_PASSWORD` |
| `backend/controller/user/setNewPassword.js` | updated only `user.password` | + `user.plainPassword = newPassword` |
| `backend/controller/user/userSignIn.js` | no plaintext handling | **backfill**: on successful login, if `!user.plainPassword`, store the typed password (best-effort, try/catch) |

**Old-user backfill (the gap this closes)**: pre-existing users have only a hash. On their **next successful login** the typed plaintext is in hand, so it is stored once. Until then the admin panel shows "Not available yet". Users who never log in again stay blank (their real password exists nowhere) — admin can Reset to populate it.

---

## 4. `userSignIn.js` — login gate + response safety

**Before**: `findOne({email})` → `bcrypt.compare` → issue token. No account-disable check; plaintext never involved.
**After** (additive):
- `.select(...)` extended with `plainPassword isActive`.
- **After** a successful password match: `if (user.isActive === false)` → throw "Your account has been disabled. Please contact support." (checked *after* match so a wrong password never reveals disabled state).
- Backfill block (see §3).
- Login response `user` object now strips `plainPassword: undefined` (alongside the existing `password: undefined`) so it never leaks to the client.

---

## 5. Three admin-only endpoints (new)

All guarded by `req.userRole === "admin"`, following the existing `/admin/clients/:customerId/*` convention. Registered in `backend/routes/index.js` right after `create-project`.

- `GET  /admin/clients/:customerId/credentials` — `backend/controller/admin/getClientCredentials.js` → returns `{ email, plainPassword|null, plainPasswordAvailable, isActive, mustResetPassword }`. Returns `null` plaintext when the flag is off or not yet backfilled.
- `POST /admin/clients/:customerId/reset-password` — `backend/controller/admin/resetClientPassword.js` → sets a new password (min 4). Updates the bcrypt hash (real auth source) **and** plaintext (flag-gated); clears `mustResetPassword` (admin set it deliberately). Same hashing as `userSignUp`/`setNewPassword` — no separate auth system.
- `POST /admin/clients/:customerId/account-status` — `backend/controller/admin/updateClientAccountStatus.js` → sets `isActive` (boolean). **Guards**: an admin cannot disable their own account, and admin-role accounts cannot be disabled through this endpoint.

---

## 6. Cleanup script (future disable)

`backend/scripts/removePlainPasswords.js` — `updateMany({}, { $unset: { plainPassword: "" } })`. Run after setting the flag to `false` to wipe all stored plaintext. Hashes untouched, logins keep working. Run from `backend/`: `node scripts/removePlainPasswords.js`.

---

## 7. Frontend

- **`frontend/src/common/index.js`** — 3 new entries (`clientCredentials`, `resetClientPassword`, `updateClientAccountStatus`), all base-URL `.../api/admin/clients`; the caller appends `/:customerId/<action>` (same pattern as `adminCreateProjectOrder`).
- **`frontend/src/pages/AdminClientWorkspace.js`** — new **"Account & Access"** tab (added to all 3 `tabs` orderings). Lazy-loads credentials on tab open. New `AccountAccessPanel` component with three cards:
  1. **Login Credentials** — email + password (show/hide toggle, copy), or "Not available yet" hint.
  2. **Reset Password** — text input + Set Password button.
  3. **Login Access** — active/disabled state + Disable/Enable Login toggle (rose when active, emerald when disabled).
  New state: `accessData`, `accessLoading`, `accessError`, `showPassword`, `newPasswordInput`, `resetting`, `statusUpdating`. New icons imported: `Copy`, `KeyRound`, `ShieldAlert`. Uses `sonner` `toast` (already imported) for feedback.

---

## 8. Files touched this session

- **New (backend)**: `config/accessControlConfig.js`; `controller/admin/getClientCredentials.js`, `resetClientPassword.js`, `updateClientAccountStatus.js`; `scripts/removePlainPasswords.js`.
- **Changed (backend)**: `models/userModel.js` (`plainPassword`, `isActive`); `controller/user/userSignUp.js`, `controller/user/userSignIn.js`, `controller/user/setNewPassword.js`, `controller/lead/convertLead.js` (plaintext writes / gate / backfill); `routes/index.js` (3 routes + imports).
- **New (frontend)**: none.
- **Changed (frontend)**: `common/index.js` (3 API entries); `pages/AdminClientWorkspace.js` (tab, state, handlers, `AccountAccessPanel`).
- **Backup**: `backend/backup-user-access-control-20260811_173706/`.
- **Not run**: `npm run build`.

---

## 9. Reversibility (why plaintext is safe to try now)

`plainPassword` is a standalone display field, never part of auth. To remove entirely later: (1) flag → `false`, (2) run cleanup script, (3) remove the UI show-section. Live DB becomes fully clean; only pre-disable backups/leaks would still hold plaintext (history can't be un-leaked — a mass reset is the belt-and-suspenders option).
