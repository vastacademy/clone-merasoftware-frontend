# Public Site Removal — Phase 1 to 5

**Scope**: The entire public marketing/storefront site (`/home` and everything reachable from it) was removed. The app is now **portal-only** — only the **customer portal** and **admin portal** remain. Done in five approved phases, backup-first at every step, **no `npm run build` run** (standing instruction). Nothing was permanently deleted — every removed file was **moved** to a numbered backup folder and is restorable.

**Read this before touching**: `frontend/src/routes/publicRoutes.js` (now only `/`, `/login`, `/unauthorized`), `frontend/src/components/RoleBasedHome.js`, `frontend/src/helpers/portalHome.js` (new SSOT), `frontend/src/helpers/postLogin.js`, `frontend/src/pages/SetNewPassword.js`, `frontend/src/AppContent.js` (chrome stripped), `frontend/src/components/DashboardLayout.js` (now hosts the cart), `backend/routes/index.js` (storefront routes removed).

---

## Why / core decision

The public site and the portals shared one layout tree (`AppContent.js` wrapped **every** page in the public `Header`/`Footer`). Removing the public site was therefore **architecture-level**, not a file delete — the portals first had to be **detached** from the public chrome (they already have their own `DashboardLayout`/`AdminLayout` shells). Ordering was chosen so the app stays runnable after each phase: rewire entry → detach layout → remove routes → delete files → clean up.

A **Phase 0 dependency audit** (read-only, two `Explore` sub-agents — one frontend, one backend) classified every public file as PUBLIC-ONLY (safe delete), PORTAL-SHARED (keep), or ALREADY-ORPHAN. **Agent output was verified, not trusted**: the audit initially mis-flagged `SummaryApi.ordersList` (`/get-order`) as a dead storefront route — a grep proved it is used by `CustomerDashboard`, `ProjectsAndPlans`, `OrderPage`, `WalletDetails`, `UserUpdateDashboard`, and `orderSummaryClient`, so it was **kept**. This is why nothing was deleted on agent word alone.

---

## Phase 1 — entry / routing rewire (no delete)

New SSOT helper `frontend/src/helpers/portalHome.js` → `getPortalHome(role)`: `admin` → `/admin-panel/dashboard`, everyone else → `/dashboard`.

- **`RoleBasedHome.js`** (root `/`): was always `Navigate → /home`. Now: logged-out → `/login`, logged-in → `getPortalHome(role)`.
- **`postLogin.js`**: post-login `navigate("/home")` → `navigate(getPortalHome(user.role))` (the `mustResetPassword` → `/set-new-password` branch is unchanged).
- **`SetNewPassword.js`**: both the save-success and "Skip" navigates went to `/home` → now `getPortalHome(role)` (role read from Redux).

`/home` still existed as a route after this phase (unreachable by default, no crash).

## Phase 2 — layout detach (architecture core, no delete)

`AppContent.js` wrapped every page in `<Header/>` + `<Footer/>` + `<DraftOrderSavedDrawer/>` + `<FloatingCartButton/>`. Verified first: **28 portal files use the `Context.Provider`** that also lives in `AppContent`, so the provider had to stay — only the visual chrome was removed. `DraftOrdersProvider` lives one level up in `App.js`, so the cart components keep their context after moving.

- **`AppContent.js`**: removed `Header`/`Footer`/`DraftOrderSavedDrawer`/`FloatingCartButton` (render + imports). Kept `Context.Provider`, `ScrollToTop`, `<Outlet/>`.
- **`DashboardLayout.js`**: now imports and mounts `DraftOrderSavedDrawer` + `FloatingCartButton` (cart is a **customer-portal** feature — admin/public don't get it).

Result: portal pages show only their own `DashboardLayout`/`AdminLayout` chrome (no duplicate public top-bar, no public footer). `SharedHeader.js`/`Footer.js` were left on disk (deleted in Phase 4) but became orphan here.

## Phase 3 — public routes remove (no file delete)

`publicRoutes.js` reduced from ~19 routes to **3**: `/` (`RoleBasedHome`), `/login` (`Login`), `/unauthorized` (verified still used by `ProtectedRoute.js`). All storefront/policy/demo routes and their imports removed. Public URLs became unreachable; files still on disk.

## Phase 4 — file delete (backup-first, moved not erased)

**4A — frontend** → `frontend/src/backup-publicremoval-phase4A/` (36 files): pages (Home, ProductDetails, CategoryProduct, SearchProduct, ForgotPassword, Cancel, Success, 7 policy pages, ContactUsForm, ServiceCard, UserDemo, Practice, Cart), components (CategoryList, BannerProduct, VerticalCardProduct, AppConvertingBanner, HomeSecondBanner, VerticalCard, SingleBanner, CartPopup, LoginPopup, Header, SharedHeader, Footer, BrandLogo, CategoryWiseProductDisplay, HorizontalCardProduct), helpers (addToCart, fetchCategoryWiseProduct, productDB). Verified **zero live imports** to any moved file afterward.

**4B — backend** → `backend/backup-publicremoval-phase4B/` (16 files) + old routes copy: cart controllers (addToCartController, countAddToCartProduct, addToCartViewProduct, updateAddToCartProduct, deleteAddToCartProduct), storefront product controllers (getCategoryWiseProduct, getCategoryProductOne, filterProduct, searchProduct), contact controllers (contactController, arrangeCallBack), order controllers (paymentController=`/checkout`, order.controller=`/order-list`, allOrder.controller=`/all-order`), models (cartProduct, contactRequestModel). Their imports + routes were removed from `routes/index.js`. **Kept** (portal-shared): `/get-product`, `/product-details`, `/get-order`, all auth/admin/wallet/order/ticket routes. Verified: `routes/index.js` **requires cleanly** with no broken import, and **zero live references** to any moved backend file.

## Phase 5 — cleanup (dead-code, backup-first)

Removed now-dead leftovers:
- **`AppContent.js`**: the old public cart-badge logic (`cartProductCount` state, `fetchUserAddToCart`, its `initializeData` calls, its two `Context.Provider` values) — its backend route was gone.
- **`postLogin.js`** / **`Login.js`**: dropped the `fetchUserAddToCart` param/context/call.
- **Orphan files** → `frontend/src/backup-publicremoval-phase5/`: `hooks/useDataFetching.js`, `components/CompletedProjectDashboard.js` (both had no live importer).
- **`common/index.js`**: removed orphan endpoint keys (`categoryProduct`, `categoryWiseProduct`, `addToCartProduct`, `addToCartProductCount`, `addToCartProductView`, `updateCartProduct`, `deleteCartProduct`, `searchProduct`, `filterProduct`, `payment`, `getOrder`, `allOrder`, `contactUs`). **Kept `productDetails`** (portal-shared).

---

## Current entry flow (live after this work)

```
/  (RoleBasedHome)
   ├─ logged out            → /login
   ├─ logged in (admin)     → /admin-panel/dashboard
   └─ logged in (customer)  → /dashboard
Login success → getPortalHome(role)
SetNewPassword save/skip → getPortalHome(role)
No public marketing pages exist; /home and the storefront are gone.
```

## Restore / backups

Every removal is a **move**, not an erase. To restore, move files back from:
`frontend/src/backup-publicremoval-phase1..5/`, `backend/backup-publicremoval-phase4B/`, and re-add the corresponding routes/imports (old `routes/index.js` copy is in `backup-publicremoval-phase4B/routes/`).

## Not done / notes

- **No `npm run build`** was run (standing instruction) — changes are verified by babel parse (frontend) and `require` load (backend), not a production build.
- Backend `emailService.js` needs a Resend/SendGrid API key (env) to load without warning — a **pre-existing** condition, unrelated to this removal.
- The old public `Cart.js`/`cartProduct` system is fully gone; the **new** customer cart (`DraftOrdersContext`/`DraftOrderSavedDrawer`/`FloatingCartButton`, see `28_...md`) is untouched and now mounted inside `DashboardLayout`.
