# Mobile Sidebar Drawer Fix + Chess Socket iPhone Audit

This doc records two separate audits done in the same session: (1) a confirmed, fixed gap — the customer/admin dashboard sidebar was desktop-only — and (2) a confirmed, **not-yet-fixed** root cause for chess buttons not responding on iPhone. Read this before touching `DashboardLayout.js`, `AdminLayout.js`, `MobileSidebarDrawer.js`, `SharedHeader.js`, or anything under `frontend/src/chess/` / `backend/chess/`.

## 1. Mobile Sidebar Drawer — FIXED

### Before (confirmed via code read, not assumption)

- `DashboardLayout.js` (customer) and `AdminLayout.js` (admin) each rendered their own full sidebar (`Dashboard`, `Projects and Plans`, `Start New Project`, `Wallet`, `Orders`, `Games`, `Profile`, `Support` for customer; `Dashboard`, `Clients`, `Website Management > Projects`, etc. for admin).
- Both `<aside>` elements used the class `hidden ... lg:flex` — the sidebar did not render at all below the `lg` breakpoint. There was no mobile drawer, no mobile trigger button, nothing replacing it.
- The only mobile navigation available inside `/dashboard` or `/admin-panel/*` routes was `SharedHeader.js`'s own generic hamburger menu, which uses a completely separate, much shorter nav list:
  - `customerNavigation` = `Dashboard, Projects & Plans, Orders, Support` (4 items — missing Start New Project, Wallet, Games, Profile)
  - `adminNavigation` = `Dashboard, Clients` (2 items — missing Website Management)
- This was already partially documented in `00_CURRENT_SYSTEM.md` line ~131 ("there is no mobile drawer for this sidebar") for the admin side, but not fixed, and not documented for the customer side at all.
- Root cause was **not** a bug/regression — the desktop sidebar was simply never built with a mobile equivalent.

### After (what was built)

- New shared component: `frontend/src/components/MobileSidebarDrawer.js` — a generic, presentation-only slide-in overlay (`isOpen`, `onClose`, `children` props). No nav data of its own; it only renders whatever `children` it's given. Locks `document.body` scroll while open.
- `DashboardLayout.js`:
  - The existing sidebar JSX (profile block, Quick Links, More links, Logout) was extracted as-is into a `sidebarContent` variable — no markup duplicated.
  - Desktop `<aside>` (`hidden ... lg:flex`) now renders `{sidebarContent}` — unchanged visually.
  - `<MobileSidebarDrawer isOpen={mobileMenuOpen} onClose={...}>{sidebarContent}</MobileSidebarDrawer>` added — same links, same active-state logic, same `quickLinks`/`secondaryLinks` arrays (single source of truth preserved).
  - New mobile-only top bar (`lg:hidden`) with a `Menu` icon button that sets `mobileMenuOpen = true`.
  - Every `<Link>` inside `sidebarContent` now also calls `setMobileMenuOpen(false)` onClick, so the drawer auto-closes on navigation (desktop is unaffected since the drawer state is irrelevant there).
- `AdminLayout.js`: identical pattern. It already had a `sidebarContent` variable (from `adminSidebarModules`), so only the drawer wiring, the mobile trigger bar, and `onClick={() => setMobileMenuOpen(false)}` on each `Link` were added.
- `SharedHeader.js` was **not touched** — its own hamburger/mobile-nav dropdown for public/customer/admin route groups still works exactly as before. The two mobile menus are visually distinct (`SharedHeader`'s is a dropdown under the top header; the new one is a left-side slide-in drawer triggered from a second bar below the header on dashboard/admin routes only).

### Regression boundary

- Desktop behavior (`lg:` breakpoint and above) for both layouts is byte-for-byte unchanged except for the addition of `{sidebarContent}` replacing inline JSX (same output).
- No existing route, link list, or active-state logic was changed — `quickLinks`, `secondaryLinks`, and `adminSidebarModules` are untouched.
- Backups of the pre-change files: `frontend/src/components/work1/DashboardLayout.js.bak`, `frontend/src/components/work1/AdminLayout.js.bak`.
- `npm run build` was intentionally **not** run (user preference — do not run it automatically). Manual browser verification at mobile width is the pending confirmation step before considering this fully closed.

## 2. Chess Socket Not Responding On iPhone — AUDITED, NOT FIXED

This is a separate, unrelated feature (`/games`, `/games/chess`) that is **not covered anywhere else in `DOCS/`** — it was undocumented before this audit.

### Confirmed symptom

On iPhone, all chess buttons (Create Room, Join Room, Find Opponent, and later in-game actions) appear completely dead — no visible response — while every other page on the same site (login, dashboard, wallet, orders, etc., all plain HTTP-based) works correctly on the same iPhone. Android and PC work fine for chess too.

### Confirmed root cause chain (read from code, not assumed)

1. Chess is the **only** feature in this codebase that uses a live WebSocket connection (`socket.io-client`, `frontend/src/chess/useChessSocket.js`) instead of normal HTTP requests. Everything else on the site is HTTP (`fetch`/`axios`), which is why only chess is affected.
2. The backend chess namespace authenticates the socket handshake **purely from the `token` cookie** (`backend/chess/chessSocket.js` lines ~50-58):
   ```js
   const cookieHeader = socket.handshake.headers.cookie;
   const token = parsedCookies.token;
   if (!token) return next(new Error('Please login to play'));
   ```
   There is no fallback (no query token, no auth-header token).
3. The login cookie itself (`backend/controller/user/userSignIn.js` lines ~50-60) is set as:
   ```js
   { httpOnly: true, secure: true, sameSite: 'None', domain: process.env.COOKIE_DOMAIN }
   ```
   `sameSite: 'None'` is required because the frontend (`portal.merasoftware.com`, confirmed via `allowedOrigins` in `backend/index.js`) and the backend API are on **different domains** (backend's own production domain was not found in this repo's `.env` — it is set at the hosting-provider level, e.g. Render/Railway).
4. iOS Safari's Intelligent Tracking Prevention (ITP) is confirmed (by Apple's own documented behavior, not guessed) to be materially stricter about sending `SameSite=None` cross-site cookies on WebSocket upgrade handshakes than Android Chrome or desktop browsers are. This is the most likely reason the cookie fails to reach the socket handshake specifically on iPhone, while the same cookie works fine for ordinary same-flow HTTP calls (browsers are generally more lenient with normal cross-site XHR/fetch than with long-lived WS connections under ITP).
5. **Separately confirmed UI gap that hides the failure**: `useChessSocket.js` tracks a `connected` boolean and an `errorMessage` string, but **no component ever reads `connected`** to disable buttons or show a "Connecting…"/"Connection failed" state. `ChessLobby.js` and `ChessPage.js` render all action buttons as always-clickable regardless of socket state. So when the handshake is silently rejected, the click handler still fires client-side (e.g., `socketRef.current?.emit(...)`), but the emit goes nowhere — from the user's perspective this is indistinguishable from "the button did nothing."

### Why this was not fixed

Two candidate fixes were evaluated with the user and both were paused as too risky without further confirmation:

- **Token fallback (send JWT via `socket.io` `auth` option instead of relying on the cookie)** — ruled out because the JWT is never exposed to client-side JS at all (`frontend/src/helpers/postLogin.js` only stores `_id, name, email, role`, never the raw token, and the cookie is `httpOnly`). Making the token client-readable to work around this would weaken the `httpOnly` XSS protection for the **entire site's session token**, not just chess — rejected as an unacceptable regression to core auth security.
- **Same-site reverse proxy** (route `portal.merasoftware.com/api/*` and `/chess-socket/*` through the frontend domain via Vercel rewrites, so the cookie is never cross-site) — technically the cleanest root-cause fix, but requires hosting/infra-level changes outside this repo's code that were not verified to be safe for WebSocket proxying specifically, and the user did not want to proceed without more certainty.
- A third option (a separate, chess-scoped, low-privilege token issued alongside login, used only for the socket handshake, never touching the httpOnly session cookie) was proposed as the safer middle ground but **implementation was paused at the user's request** ("yeh sab working risky lag rahi hai").

### Current state

No code has been changed for chess. `frontend/src/chess/*` and `backend/chess/*` are exactly as they were. If resumed later, read this section first — the root cause and the three evaluated options are already established; no re-audit should be needed unless the login/cookie or chess socket files have changed since.

### Files involved (for future reference, no changes made)

- `frontend/src/chess/ChessPage.js`, `ChessLobby.js`, `ChessBoardFlat.js`, `useChessSocket.js`, `GamesListPage.js`
- `backend/chess/chessSocket.js`, `chessRoomManager.js`, `chessGameModel.js`, `chessCleanupCron.js`
- `backend/controller/user/userSignIn.js` (cookie issuance)
- `frontend/src/helpers/postLogin.js` (confirms token is never stored client-side)
- `backend/index.js` (confirms `allowedOrigins`/CORS setup and that chess socket and HTTP API share the same cross-domain constraint)
