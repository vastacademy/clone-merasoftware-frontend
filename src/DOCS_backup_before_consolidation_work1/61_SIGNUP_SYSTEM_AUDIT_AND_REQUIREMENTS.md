# Signup System — Audit, Gaps, and Requirements Handoff

**Status**: **Audit only. No signup code has been written or changed.** Sections 2–3 record what actually exists today, verified against live routes, controllers and models on 2026-08-21 — not assumed. Sections 4–6 are what must be decided and built. Section 8 records a second-session discussion of three onboarding shapes and why two of them were set aside.

**Purpose**: This file exists so a fresh session can pick up signup work without re-deriving anything. Read this file, then `47_ADMIN_USER_ACCESS_CONTROL_PASSWORD_AND_LOGIN_BAN.md` (login gating), then `43_LEAD_CRM_SYSTEM_PHASE_1_TO_6A.md` (how customers are actually created today).

**Working rules for whoever continues this** (standing instructions from the owner):
- No code change, file edit, or `npm run build` without explicit permission.
- Answer questions first; do not start working while a question is open.
- Evidence-based only — verify against real code/DB, never assume.
- Clean implementation, no patch-work. Look at the whole flow, not a narrow scope.
- Backup before any file change.
- Answer only what is asked, in short well-formatted points.

---

## 1. Why this document exists

The owner asked for the signup plan and requirements to be captured so a new AI session can read the docs and understand both the code audit and the intent.

**Important**: at the time of writing, signup had **not** been discussed as a feature in any working session, and no plan for it had been agreed. What follows is therefore an **audit of the existing code plus the questions that must be answered** — not a record of decisions already made. Nothing here should be read as owner-approved design.

---

## 2. Current state — verified, not assumed

### 2.1 The headline finding

**There is no customer-facing signup in the running app.** A backend signup endpoint exists and works, but nothing in the UI reaches it.

| Layer | State |
|---|---|
| Backend `POST /api/signup` | ✅ Exists and functional (`routes/index.js:173`) |
| `SummaryApi.signUP` | ✅ Still defined (`frontend/src/common/index.js:8`) |
| Signup **page** | ❌ Does not exist — `pages/` contains only `Login.js` |
| Signup **route** | ❌ Not in `routes/publicRoutes.js` (only `""`, `login`, `unauthorized`) |
| Link from Login | ❌ `Login.js` contains no signup/register link |
| OTP verification **page** | ❌ Does not exist (`00_CURRENT_SYSTEM.md` claimed `src/pages/OtpVerification.js` still existed — that was stale and has been corrected) |
| Forgot-password **page** | ❌ Only survives as `frontend/src/backup-publicremoval-phase4A/pages/ForgotPassword.js` — not routed, not built |

So the endpoint is reachable by direct API call but is **dead from the UI's point of view**. This is consistent with `44_PUBLIC_SITE_REMOVAL.md` — the public marketing site was removed and the app became portal-only; the signup surface appears to have gone with it.

### 2.2 How customers are actually created today

Two live paths, both admin-driven:

1. **Lead conversion** — `controller/lead/convertLead.js` creates the `userModel` document from a lead, with a **universal default password** and an existing-email guard. See `43_LEAD_CRM_SYSTEM_PHASE_1_TO_6A.md`.
2. **Admin client management** — `controller/admin/` (`resetClientPassword.js`, `updateClientAccountStatus.js`, `getClientCredentials.js`). See `47_ADMIN_USER_ACCESS_CONTROL_PASSWORD_AND_LOGIN_BAN.md`.

**Implication**: the business currently onboards customers manually. Whether self-signup is even wanted is **Open question O1** — it is a business decision, not a technical gap to close by default.

### 2.3 What `POST /api/signup` does today

`controller/user/userSignUp.js` (108 lines):
- Validates email format via regex; requires email, password, name.
- Normalises email (`trim().toLowerCase()`).
- Hashes the password with `bcryptjs` (salt rounds 10).
- Has an **existing-user branch** — it does not simply reject a duplicate email; it updates the existing document (exact semantics must be re-read before relying on them).
- Accepts `role` **from the request body** — see §3 G1.
- Accepts `referredBy` and maintains the referral graph on both sides (`referrals: [{ userId, role, referredDate }]` via `$addToSet`).

### 2.4 The OTP system exists but is not connected to signup

This is the second significant finding.

| Piece | State |
|---|---|
| `helpers/otpUtils.js` | ✅ `generateOTP`, `saveOTP`, `sendOTPEmail`, `verifyOTP` |
| `models/otpModel.js` | ✅ Exists |
| `POST /api/verify-otp` | ✅ `verifyOtpController.js` — verifies, then **issues a 365-day JWT and sets the auth cookie** |
| `POST /api/resend-otp` | ✅ `resendOtpController.js` — generates, saves, emails a fresh OTP |
| **Signup issuing an OTP** | ❌ **`userSignUp.js` contains no OTP code at all** |

So: a user can be verified and logged in via OTP, and an OTP can be *resent* — but **nothing ever sends the first one** during signup. `resendOtpController` is the only code path that calls `generateOTP`/`sendOTPEmail`.

Delivery is **SendGrid** (`@sendgrid/mail` in `otpUtils.js`). Note the environment already logs `SENDGRID_API_KEY missing or invalid` on boot in this workspace, so OTP email delivery is presumed non-functional locally.

### 2.5 The user model has no verification flag

`models/userModel.js` has `phone` (a plain `String`) and `isActive`, but **no `isVerified` / `emailVerified` field**. `isActive` is the admin login ban from doc 47 — a different concept and must not be overloaded for verification (**Open question O4**).

---

## 3. The gaps — each with evidence

| # | Gap | Evidence |
|---|---|---|
| **G1** | **`role` is taken from the request body.** A self-signup endpoint that accepts a client-supplied role is a privilege-escalation risk unless it is hard-forced to `customer` server-side. This must be settled before any signup UI is exposed. | `userSignUp.js:8` destructures `role` from `req.body` |
| **G2** | **No signup UI at all** — no page, no route, no link. | `pages/` has only `Login.js`; `publicRoutes.js` has no signup entry |
| **G3** | **Signup never issues an OTP**, so the account is created already usable and the verify/resend pair is unreachable in a real flow. | grep: no OTP reference in `userSignUp.js`; only `resendOtpController` calls `sendOTPEmail` |
| **G4** | **No verification state on the user.** Nothing records whether an email was ever confirmed. | `userModel.js` — no `isVerified`/`emailVerified` |
| **G5** | **`verify-otp` issues a 365-day session cookie.** Signup-time verification and login are therefore the same act; that may be intended, but it is a security decision that should be explicit. | `verifyOtpController.js:37` — `expiresIn: '365d'` |
| **G6** | **Duplicate-email behaviour is an update, not a rejection.** Needs re-reading and an explicit decision before self-signup is exposed. | `userSignUp.js:43-52` — `findOne` then `existingUser.save()` |
| **G7** | **No password strength rule, no rate limiting, no CAPTCHA** on the signup endpoint. | `userSignUp.js` — only presence/format checks |
| **G8** | **No forgot-password flow** for customers. Password recovery today is admin-driven (`resetClientPassword.js`). A `ForgotPassword.js` exists only inside `backup-publicremoval-phase4A/` — it was removed with the public site and is not routed. | `routes/index.js` — no forgot/reset-password customer route; `publicRoutes.js` — no route |
| **G9** | **`phone` is an unvalidated free-text `String`** and is not collected at signup. | `userModel.js:83` |
| **G10** | **Referral capture has no UI.** `referredBy` is supported server-side but nothing passes it, since there is no signup page to carry a referral link. | `userSignUp.js:70`, `:83-88` |
| **G11** | **SendGrid key is missing/invalid in this environment**, so any OTP email path cannot currently be verified end-to-end locally. | boot log: `SENDGRID_API_KEY missing or invalid` |

---

## 4. Open questions — must be answered before building

| # | Question | Why it blocks |
|---|---|---|
| **O1** | **Is customer self-signup actually wanted?** Today onboarding is deliberately admin-driven (lead conversion). Self-signup is a business model change, not just a missing page. | Everything else depends on this |
| **O2** | If yes — is signup **open to anyone**, or invite/lead-gated (e.g. only an email that already exists as a lead)? | Decides the whole shape |
| **O3** | **Email OTP, or password-only?** The OTP pieces exist and are ~80% there; wiring them into signup is far less work than building them, but adds a step for the customer. | Decides scope |
| **O4** | If OTP — add a **new `isVerified` flag**, or reuse `isActive`? Reusing `isActive` would collide with doc 47's admin login ban. **Recommendation: a new field.** | Schema decision |
| **O5** | Should an **unverified** account be able to log in at all, or be blocked until verified? | Changes `userSignIn.js` |
| **O6** | Should `verify-otp` keep issuing a **365-day** session on signup verification, or a shorter one? | G5 |
| **O7** | Duplicate email — **reject**, or keep the current update-in-place behaviour? | G6 |
| **O8** | Is **phone** required at signup? If so it needs validation and possibly its own verification. | G9 |
| **O9** | Is the **referral link** flow in scope now (it is the only reason `referredBy` exists), or later? | G10 |
| **O10** | Is **forgot-password** part of this work, or separate? Without it, a self-signed-up customer who forgets their password must contact an admin. | G8 |

---

## 5. Suggested phasing (not agreed — for discussion only)

If O1 is "yes", the dependency order would be:

- **Phase A — decide and secure the endpoint.** Force `role: "customer"` server-side (G1), settle duplicate-email behaviour (G6), add password rules and rate limiting (G7). No UI yet. This is the phase that must not be skipped.
- **Phase B — verification.** Add the verification flag (G4/O4), make signup issue the first OTP (G3), decide the login gate (O5) and session length (O6).
- **Phase C — UI.** Signup page + route + link from `Login.js` (G2), carrying `referredBy` from the URL if O9 is in scope.
- **Phase D — recovery.** Customer-facing forgot-password (G8), if O10 is in scope.

**Phase A before any UI**: exposing a signup page while `role` comes from the body would let a caller create an admin account.

---

## 6. Regression boundaries

- **Do not** break the two live onboarding paths — lead conversion (`convertLead.js`) and admin client management. They create real customers today.
- **Do not** overload `isActive` for verification — it is the admin login ban (doc 47).
- **Do not** change `verifyOtpController`'s token shape without checking `authToken` and every consumer of the cookie.
- **Do not** remove `SummaryApi.signUP` before confirming nothing else calls it.
- Keep the referral graph intact on both sides of `referredBy` if signup is touched.

---

## 7. Second-session discussion — three onboarding shapes considered, none built

Held after this document was first written, on the same "no code without permission" rule. **Still audit/discussion only — nothing below has been implemented.**

### 7.1 Why this came up

The owner asked what a client signup system would need under the current architecture. Section 2.2 already answered the technical part (two admin-driven paths exist; self-signup does not); this section records the design conversation that followed, comparing three concrete shapes.

### 7.2 The three shapes compared

| | **A — Public self-signup** | **B — Fix + wire the dead `userSignUp.js`** | **C — Public form feeds the existing lead pipeline** |
|---|---|---|---|
| Account created | Immediately, on submit | Immediately, on submit | Not immediately — only when an admin runs `convertLead.js`, exactly as today |
| New customer-creation path? | Yes — a third one, alongside lead conversion and admin client management | Yes — same problem, reusing dead code instead of writing new | **No** — reuses `createLead.js`, the same API `AdminLeadsPage.js` already calls |
| Matches O1's current answer (admin-driven onboarding)? | No | No | Yes |
| Still blocked on G1 (role from request body)? | Yes, directly | Yes, directly | N/A — no account is created by the form itself |

**Outcome**: the owner picked the shape closest to **C** — but not full public self-signup, and not exactly C's form-only shape either. See 7.3.

### 7.3 The idea that followed: a guest account with real portal access

The owner then proposed a **"Login as Guest"** button: a visitor clicks it and lands directly in a working customer portal — dashboard, projects, wallet — without filling anything in first.

**Why this doesn't fit the current architecture, verified against live code:**

- Every read in the portal is scoped by a real `userId`. `middleware/authToken.js` decodes the JWT into `req.userId`; `controller/order/getOrderDetails.js:53` and others filter every query by it. There is no "no-user" or "sample-data" mode anywhere in the request path — a guest needs a real `userModel` row to see anything at all, the same as any customer.
- That leaves exactly two ways to make "Login as Guest" work, both with a cost:
  - **One shared guest account** — cheapest, but every guest sees and can mutate the same wallet/orders/data as every other guest simultaneously.
  - **A fresh temporary account per click** — isolated per guest, but leaves a throwaway row in `userModel` (and whatever orders/transactions the guest creates) that must eventually be cleaned up.
- The owner chose the second (isolated, temporary-account) shape over the shared one, on data-isolation grounds.
- A cleanup mechanism was sketched but **explicitly deferred, not decided**: reuse the existing lazy-purge pattern from `controller/trash/purgeTrash.js` plus the existing cron pattern from `backend/cron/servicePlanRenewalCron.js` — a new `isGuest`/`guestExpiresAt` pair on `userModel` and a daily cron that deletes expired guest rows. **Expiry window and whether guest payment actions are enabled were never settled** (see 7.4) — this bullet is a sketch of *how* cleanup could reuse existing patterns, not a spec.

### 7.4 Where it actually landed

Mid-discussion the owner reframed the goal: **not** "cleanup can wait," but "don't build guest login for now — instead, take the visitor's basic information (name/email/phone) and keep it as our lead data," explicitly confirming this converges on the same shape as **Option C** (7.2) — a public form that writes into the existing lead pipeline, not a new account-creation path and not a guest session.

**Net result of this session**: no option was approved to build. The owner's last instruction was to update documentation only, matching this session's discussion, and stop there.

### 7.5 What this adds to the open questions (§4)

- **O1 stands, reaffirmed**: onboarding stays admin-driven for now; nothing here overrides that.
- **New, not yet in §4's table**: if a "basic info" public form is built later, it is a **UI-only addition in front of `createLead.js`** — it does not touch `userSignUp.js`, does not resolve G1, and creates no `userModel` row by itself. It would need its own decision on required fields (name/email/phone — phone is G9's unvalidated free-text concern, now doubly relevant since it would be collected from an unauthenticated public visitor) and on rate-limiting/spam protection, since `createLead.js` would become reachable without an admin session.

---

## 8. Where things live

**Backend**
- `controller/user/userSignUp.js` — the signup endpoint
- `controller/user/userSignIn.js` — login
- `controller/user/verifyOtpController.js` — verify + issues the session cookie
- `controller/user/resendOtpController.js` — the only caller of `sendOTPEmail`
- `helpers/otpUtils.js` — generate / save / send / verify
- `models/otpModel.js`, `models/userModel.js`
- `controller/lead/convertLead.js` — how customers are really created today
- `controller/admin/resetClientPassword.js`, `updateClientAccountStatus.js`
- `routes/index.js` — `:173` signup, `:176` signin, `:212` verify-otp, `:213` resend-otp

**Frontend**
- `pages/Login.js` — the only auth screen
- `routes/publicRoutes.js` — where a signup route would be registered
- `common/index.js` — `SummaryApi.signUP` (currently unused)

**Docs to read in order**: this file → `47_ADMIN_USER_ACCESS_CONTROL_PASSWORD_AND_LOGIN_BAN.md` → `43_LEAD_CRM_SYSTEM_PHASE_1_TO_6A.md` → `44_PUBLIC_SITE_REMOVAL.md` (why the signup surface disappeared).
