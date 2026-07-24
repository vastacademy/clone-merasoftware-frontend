# Typography Standardization — Full-Site Audit and Locked Rules

**Status**: Audit complete, rules approved by user. Code changes not yet started.
**Scope**: Whole frontend (`frontend/src/pages`, `frontend/src/components` including `components/admin`), not just the customer dashboard.

## 1. Why this exists

The user asked for a professional, consistent look starting with the customer dashboard, then widened it to the whole site: reduce every font-size in the codebase to a small fixed scale, and reduce text color to a single black/white rule. Before touching any file, a full read-only audit was run to find every current text-size and text-color class in use, so the standardization is evidence-based instead of a guess.

## 2. Approved target type-scale (max 5 sizes)

| Role | Class | Size | Weight | Usage rule |
|---|---|---|---|---|
| H1 | `text-2xl` | 24px | Bold | Page/section main heading |
| H2 | `text-xl` | 20px | Bold | Sub-section heading |
| H3 | `text-lg` | 18px | Semibold | Card/row title |
| Text (default) | `text-base` | 16px | Regular | All normal text — paragraphs, labels, buttons, nav links, table headers — unless it qualifies as sub-text |
| Sub-text | `text-sm` | 14px | Regular | Only when the text is secondary/supporting info under a main line (date under a title, category under a name, etc.) |

No other size class is allowed after this change: `text-xs`, arbitrary bracket sizes (`text-[10px]`, `text-[11px]`, `text-[15px]`, `text-[16px]`, `text-[17px]`), `text-3xl`, `text-4xl`, `text-5xl`, `text-6xl`, and `font-black` are all being removed and mapped into the 5 rows above.

## 3. Approved color rule

- Canonical near-black is **`text-black`** (pure `#000000`) — chosen over the competing `text-slate-950` convention that also existed in the codebase.
- Light background → `text-black`
- Dark background → `text-white`
- All grey-family text colors (`text-gray-400/500/600/700/800/900`, `text-slate-300/400/500/600/700/800/900`) are being removed and mapped to `text-black` or `text-white` depending on the background they sit on (checked per file, not blanket).

## 4. Explicit exemption — status badges/pills

Confirmed by user: the black/white rule applies to normal body text only. Status badges/pills (e.g. "Active Plan", "Payment Rejected", "Completed", "Pending approval") keep their existing semantic colors (green/red/amber/blue/emerald/violet/etc.) so status stays visually distinguishable at a glance. Roughly 230 occurrences across ~70 files fall under this exemption and are NOT part of the black/white conversion.

## 5. Small badge/pill sizes — approved approach

`text-xs`, `text-[10px]`, `text-[11px]` are mostly used on small uppercase tracked badges/pills (rounded-full, tight padding). User approved a direct conversion to `text-sm` across the board rather than a slow per-component visual-QA pass. Any pill/padding breakage this causes will be fixed afterward as a follow-up, not blocked on up front.

## 6. Demo/scratch pages — confirmed live, in scope

`Practice.js` and `UserDemo.js` looked like scratch pages (generic names, no legacy marker) but were verified against `frontend/src/routes/publicRoutes.js`:
- `UserDemo` is routed at `/demo` (`publicRoutes.js:96`)
- `Practice` is routed at `/practice` (`publicRoutes.js:100`)

Both are live, routed pages — they are included in the standardization scope, not skipped as dead code.

## 7. Audit results — scale of the change

- 161 `.js`/`.jsx` files scanned under `pages/` and `components/` (all `backup_*` folders and `*.js.bak` files excluded).
- 143 files contain at least one text-size or text-color class; 18 have none (thin wrapper/redirect components).
- ~140 files will need changes; effectively none of the scanned files are already fully compliant with the 5-size/black-white rule (even the closest files mix a compliant `text-black`/`text-base` with a non-compliant `text-slate-*`/caption-as-body-text pattern in the same file).
- Current size-class usage before this change (whole codebase): `text-sm` (~1,139 occurrences/~100 files) and `text-xs` (~482/~65 files) dominate, followed by `text-lg`, `text-xl`, `text-2xl`, `text-base`, `text-3xl`, `text-4xl`, plus long-tail arbitrary values (`text-[10px]`, `text-[11px]`, `text-[15px]`, `text-[16px]`, `text-[17px]`) and a single `text-6xl` in `WalletRecharge.js`.
- Two parallel "near-black" text-color conventions existed before this decision: `text-black` (19 occurrences/6 files: `StartNewProject.js`, `ProjectDetailView.js`, `PerfectForField.js`, `AdminCreateProjectPage.js`, `OtpVerification.js`, `AdminProductCard.js`) and `text-slate-950` (38 occurrences/14 files). `text-black` is now canonical; `text-slate-950` usages will convert to it.

## 8. Known risk areas going into implementation

- `text-sm` is currently used inconsistently as both primary body copy and genuine sub-text within the same file (e.g. `UserWorkspace.js`, `ProjectDetails.js`, `AdminClientWorkspace.js`, and the marketing service pages `WebsiteDevelopmentService.js`, `MobileAppDevelopmentService.js`, `WebSoftwareService.js`, `FeatureUpgradesService.js`, `AppConvertingBanner.js`, `UserDemo.js`, `Practice.js`). Each occurrence needs per-block judgment (does this line sit under a main line as supporting info, or is it the primary text) rather than a blind global rename.
- `text-gray-300` / `text-slate-300` occurrences (`Footer.js`, `WhyChooseSection.js`, `ServiceCard.js`, `ProjectDetails.js`, `AdminDashboard.js`, `AdminFilterDropdown.js`, `ProjectsAndPlans.js`) sit on dark backgrounds and must map to `text-white`, not `text-black` — background context must be checked per occurrence.
- `WalletRecharge.js`'s single `text-6xl` and `VerticalCardProduct.js`'s unique `text-[16px]`/`text-[17px]` are one-off values worth a quick visual look during implementation, not just a mechanical remap, since they may be deliberate focal-point sizing.
- `components/AdminEditWelcomeContent .js` has a trailing space in its filename before `.js` — flagged for awareness, not something this typography pass should silently "fix" without separately confirming it's not an orphaned duplicate.

## 9. Process from here

Per the user's standing workflow rules: no file will be edited until the user explicitly approves starting the coding phase, work will proceed evidence-based and file-by-file (no blind bulk find-replace), a numbered backup folder will be created before changes begin, and this doc set will be updated again once the user confirms the implementation is correct.

## 10. Per-file BEFORE ledger (source of truth for every future change)

Purpose: before any file is touched, this table is the record of exactly what text-size/text-color classes existed in it and roughly how many times, so any change can be checked against "what was here before" instead of guessed. When a file is actually changed, add a dated entry to that file's row (or a linked per-file note) recording the AFTER state — do not overwrite the BEFORE data. This keeps a permanent before/after trail per file, per this project's doc rule.

**How to read "Current classes (approx count)"**: class name followed by rough occurrence count in that file, from the full-codebase audit. Counts are approximate (audit-time, pre-change), not exact line counts.

**"Change status"**: `Not started` (default, nothing implemented yet) → update to `Done <date>` with a one-line before→after note once a file is actually edited.

### pages/

| File | Current classes (approx count) — BEFORE | Change status |
|---|---|---|
| AdminClientWorkspace.js | slate-500 ~31, text-xs ~28, text-sm ~26, slate-900 ~19, slate-700 ~14, slate-600 ~9, `[11px]` ~7, text-xl ~4, slate-400 ~4, text-lg ~3, white ~2, text-base ~2, text-2xl/3xl ~1 each | Not started |
| AdminClientsPage.js | text-xs 5, text-sm 4, slate-900 3, slate-500 3, slate-400 2, white 1, slate-950 1, text-base 1 | Not started |
| AdminCreateProjectPage.js | slate-400 6, text-base 6, text-black 3, text-xs 2, text-sm 2, slate-700 2, white/slate-950/slate-600/slate-500 1 each | Not started |
| AdminDashboard.js | text-sm 13, slate-500 7, slate-900 5, text-xs 4, white 4, slate-400 4, slate-950 2, slate-300 2, text-base 2, text-3xl 2, xl/slate-700/4xl/2xl 1 each | Not started |
| AdminPaymentRecordDetail.js | text-sm 24, slate-900 13, slate-700 8, slate-500 5, text-lg 5, text-xs 4, white 4, slate-600 2, 3xl/2xl 1 each | Not started |
| AdminProjectProductsPage.js | text-sm 6, text-xs 4, slate-900 3, slate-950 2, slate-500 2, slate-400 2, white 1, slate-600 1, text-base 1 | Not started |
| AllAds.js | gray-500 5, text-sm 4, white 1, text-lg 1 | Not started |
| AllCategory.js | text-xs 5, gray-500 5, text-xl 1, white 1 | Not started |
| AllDevelopers.js | text-xs 9, gray-500 8, white 1, text-sm 1, text-lg 1, gray-800/600 1 each | Not started |
| AllOrder.js | text-lg 7, gray-500 4 | Not started |
| AllProducts.js | text-xs 4, text-sm 4, gray-500 4, white 2, text-xl 1, gray-800 1 | Not started |
| AllWelcomeContent.js | gray-500 12, text-sm 10, white 4, text-lg 4 | Not started |
| BusinessCreated.js | text-2xl 1 | Not started |
| Cancel.js | text-xl 1, white 1 | Not started |
| Cart.js | text-lg 9, white 5, slate-600 3, text-xs 2, gray-500 2, text-xl 1, slate-400 1, gray-600 1 | Not started |
| ClientsServices.js | text-sm 12, gray-600 11, text-xs 8, gray-700 6, text-2xl 4, gray-800 3, gray-500 2, white 1, gray-900 1, gray-400 1, `[10px]` 1, text-3xl 1 | Not started |
| ClosePlanManagement.js | text-sm 6, gray-600 6, gray-800 5, gray-700 4, white 3, text-xs 2, xl/lg/gray-500/gray-400 1 each, text-3xl 1 | Not started |
| CodingBasedWebsitePage.js | gray-900 20, text-2xl 14, text-xl 13, text-sm 10, gray-600 9, `[15px]` 5 (`md:`), gray-700 4, text-3xl 2, white/90 1, white 1, text-lg 1, gray-500 1, text-5xl 1 | Not started |
| CompleteProfile.js | text-sm 21, gray-700 17, gray-600 7, text-base 7, gray-400 5, white 4, gray-800 4, text-2xl 4, text-xl 3, text-xs 1, text-lg 1, gray-900 1, text-3xl 1 | Not started |
| ContactSupport.js | gray-500 9, gray-900 7, text-xl 6, text-sm 3, text-2xl 2, white 1, text-lg 1, text-4xl 1 | Not started |
| ContactUsForm.js | text-sm 3, gray-700 3, white 2, gray-600 2, text-lg/gray-900/gray-800/3xl/2xl 1 each | Not started |
| CookiesPolicyPage.js | gray-800 8, gray-600 8, text-sm 7, text-xl 5, white 2, gray-700 2, gray-500 1, text-3xl 1 | Not started |
| CustomerDashboard.js | white 12, text-sm 10, text-xs 8, slate-500 8, slate-700 5, slate-950 4, `[11px]` 4, slate-400 3, text-lg 3, slate-900 2, text-base 2, `[10px]` 2, text-4xl 2, text-2xl 2, text-xl 1, white/75 1, white/70 1, slate-600 1, slate-300 1, text-3xl 1 | Not started |
| CustomerDetailPage.js | text-sm 8, gray-500 8, text-xs 7, gray-800 3, gray-700/600 1 each, text-3xl 1 | Not started |
| DeliveryPolicyPage.js | text-sm 20, gray-600 8, text-xl 7, gray-800 7, white 2, gray-700/500 1 each, text-3xl 1 | Not started |
| DirectPayment.js | text-lg 6, gray-600 6, gray-500 6, text-sm 5, white 3, text-xs 2, text-xl 2, gray-400 2, gray-800 1, text-2xl 1 | Not started |
| DisclaimersPage.js | gray-800 12, gray-600 7, text-xl 6, white 2, gray-700 2, text-sm 1, text-lg 1, gray-500 1, text-3xl 1 | Not started |
| FeatureUpgradesService.js | text-sm 37, gray-600 28, gray-900 16, text-xl 13, text-xs 12, white 8, text-2xl 7, text-3xl 5, gray-800 4, gray-500 4, text-base 4, text-lg 3, white/90 1, text-5xl 1, text-4xl 1 | Not started |
| FirstPurchaseList.js | text-2xl 1 | Not started |
| HiddenProducts.js | text-xs 4, gray-500 4, text-xl 1 | Not started |
| InstallmentPayment.js | text-sm 6, gray-600 5, text-xs 3, text-xl 3, white 3, text-lg 3, gray-500 3, gray-800/700 1 each | Not started |
| KYCVerification.js | text-sm 11, gray-900 11, gray-600 8, gray-700 6, gray-500 5, white 4, gray-400 4, text-lg 3, text-xs 2, text-xl 2, text-2xl 1 | Not started |
| LocalBusinessWebsite.js | white 10, gray-800 10, gray-600 10, text-xl 9, text-4xl 6, text-2xl 6, text-sm 5, text-lg 4, gray-400 2, text-5xl 1 | Not started |
| Login.js | text-sm 5, slate-900 5, white 4, slate-600 4, slate-700 2, text-2xl 2, text-xl/lg/4xl/3xl 1 each | Not started |
| MobileAppDevelopmentService.js | text-sm 36, gray-900 35, gray-600 25, text-xs 15, gray-700 13, text-lg 9, text-xl 8, gray-500 8, white 7, text-base 6, text-3xl 6, text-2xl 6, `[10px]` 2, text-5xl 2, white/90 1, gray-800/text-4xl 1 each | Not started |
| OrderDetailPage.js | white 10, gray-500 5, text-sm 4, text-lg 3, gray-600 3, text-xl 2, text-xs 1, text-2xl 1 | Not started |
| OrderPage.js | text-sm 9, white 8, slate-500 8, text-xs 6, slate-950 3, slate-900 3, slate-700 3, text-xl 1, slate-600/slate-400/text-lg/text-base 1 each, `[11px]` 1, `[10px]` 1, text-3xl/2xl 1 each | Not started |
| OtpVerification.js | text-sm 6, gray-800 3, gray-600 3, text-xl 2, white 1, text-black 1 | Not started |
| PendingRenewals.js | gray-600 11, text-sm 9, text-xs 5, gray-800 5, gray-700 4, white 3, gray-500 3, text-lg 2, text-2xl 1 | Not started |
| Practice.js | text-sm 30, gray-600 13, text-xs 12, gray-800 10, text-lg 9, gray-500 9, white 7, gray-700 7, gray-900 5, text-xl 3, gray-400 3, text-2xl 1 | Not started |
| PrivacyPolicyPage.js | text-xl 5, gray-800 5, gray-600 5, gray-700 3, white 2, gray-500 1, text-3xl 1 | Not started |
| ProductDetails.js | text-sm 10, white 6, gray-800 6, gray-500 6, text-base 6, text-xs 5, text-xl 3, text-lg 3, gray-600 3, gray-900 2, gray-700 1, text-5xl 1, text-2xl 1 | Not started |
| Profile.js | text-sm 12, slate-400 5, slate-700 4, slate-900 3, slate-500 3, text-xs 1, white 1, slate-950 1, text-3xl/2xl 1 each | Not started |
| ProjectDetails.js | text-sm 41, slate-500 29, slate-900 25, `[11px]` 11, white 9, text-xs 7, text-xl 5, text-lg 4, slate-600 3, text-3xl 2, slate-700/slate-300/gray-600/text-base/text-2xl 1 each | Not started |
| ProjectsAndPlans.js | text-sm 10, white 8, slate-500 7, text-xs 5, slate-700 5, slate-950 2, slate-900 2, slate-400 2, `[11px]` 2, `[10px]` 2, text-xl/slate-600/slate-300/text-lg/text-base 1 each, text-4xl 1, text-3xl 1 | Not started |
| RefundPolicyPage.js | gray-800 12, gray-600 10, text-sm 8, text-xl 7, white 2, text-lg 2, gray-700 2, gray-500/gray-400 1 each, text-3xl 1 | Not started |
| SearchProduct.js | text-lg 3 | Not started |
| ServiceCard.js | white 23, text-sm 20, gray-600 17, gray-900 14, text-lg 11, text-xl 6, text-3xl 5, gray-300 4, gray-400 1, text-5xl/4xl/2xl 1 each | Not started |
| SignUp.js | text-xl 2, text-xs 1, white 1 | Not started |
| StartNewProject.js | text-sm 5, text-black 5, white 3, `[11px]` 2, slate-950/slate-400/slate-300/text-lg/text-base 1 each, text-4xl/3xl 1 each | Not started |
| StartNewProjectDetail.js | text-sm 2, white 1, slate-500 1 | Not started |
| StaticWebsitesPage.js | text-sm 9, text-xs 4, gray-900 3, gray-700 3, text-xl 2, gray-600 2, gray-500 2, text-3xl 2, text-2xl 2, white/lg/base 1 each | Not started |
| Success.js | white 2, gray-500 1, text-2xl 1 | Not started |
| TermsAndConditionsPage.js | gray-800 12, text-sm 11, text-xl 10, gray-600 10, white 2, gray-700/gray-500 1 each, text-3xl 1 | Not started |
| TicketDetail.js | gray-500 14, text-sm 13, gray-900 10, white 4, gray-700 4, text-xs 3, text-lg 2, gray-800 2, text-xl/gray-600/gray-400 1 each | Not started |
| UserDashboard.js | text-xs 32, text-sm 29, white 16, gray-800 13, gray-500 12, gray-600 11, gray-700 10, text-lg 8, gray-400 4, text-2xl 4, text-xl 3 | Not started |
| UserDemo.js | text-sm 42, gray-500 25, gray-800 13, gray-600 13, text-lg 11, white 7, text-xs 5, text-xl 4, gray-400 4, text-2xl 2, slate-700/gray-900/gray-700 1 each | Not started |
| UserInvoices.js | gray-600 6, text-sm 4, gray-800 4, text-xs 2, white 2, text-lg 2, gray-500/gray-400 1 each, text-3xl/2xl 1 each | Not started |
| UserUpdateDashboard.js | gray-600 3, text-xs 2, white 2, text-sm 2, text-xl/lg/gray-500 1 each | Not started |
| UserWorkspace.js | slate-700 49, text-sm 36, slate-500 34, slate-900 33, text-xs 17, slate-600 11, text-lg 9, text-3xl 6, `[10px]` 2, white 1, slate-800/slate-400/text-base/text-2xl 1 each | Not started |
| WalletDetails.js | text-xs 21, slate-500 14, slate-400 13, text-sm 12, slate-950 11, white 7, text-lg 5, slate-900 4, `[11px]` 4, slate-700 3, slate-600 3, `[10px]` 3, text-base 2, text-3xl 2, text-xl/slate-300/slate-200/text-4xl/text-2xl 1 each | Not started |
| WalletManagement.js | text-sm 3, text-lg 2, white 1, gray-500 1, text-2xl 1 | Not started |
| WebSoftwareService.js | gray-900 40, text-sm 36, gray-600 31, text-lg 17, gray-700 14, text-xs 11, text-xl 6, gray-500 6, text-3xl 6, white 5, text-2xl 5, text-base 3, `[10px]` 2, text-5xl 2, white/90 1, gray-800/text-4xl 1 each | Not started |
| WebsiteDevelopmentService.js | text-sm 49, gray-900 35, text-xs 25, gray-600 25, gray-500 13, text-lg 9, text-xl 8, white 8, gray-700 8, text-2xl 8, text-base 6, text-3xl 6, `[10px]` 2, text-5xl 2, white/90 1, gray-800/text-4xl 1 each | Not started |

### components/ (incl. admin/)

| File | Current classes (approx count) — BEFORE | Change status |
|---|---|---|
| AddAdminModal.js | text-xl 3, text-xs 1, white 1 | Not started |
| AddCustomerModal.js | gray-600 7, text-xl 1, white 1, gray-800 1, gray-500 1, text-2xl 1 | Not started |
| AddDeveloperModal.js | gray-600 6, text-xl 1, white 1, gray-800/gray-500 1 each, text-2xl 1 | Not started |
| AddPartnerModal.js | gray-600 6, text-xl 1, white 1, gray-800/gray-500 1 each, text-2xl 1 | Not started |
| AddRoleToUserModal.js | text-sm 20, slate-700 10, slate-500 10, slate-900 5, text-xs 4, text-base 3, text-xl 1, white 1, slate-800/slate-600/text-lg 1 each | Not started |
| AdminBannerCard.js | white 3, text-sm 3, gray-500 1, gray-400 1 | Not started |
| AdminCategoryCard.js | text-sm 5, white 2, gray-900 2, text-xs 1, gray-800/gray-500 1 each | Not started |
| AdminDeleteBanner.js | white 1, text-lg 1, gray-600 1 | Not started |
| AdminDeleteCategory.js | white 1, text-lg 1, gray-600 1 | Not started |
| AdminDeleteProduct.js | white 1, text-lg 1 | Not started |
| AdminDeleteWelcomeContent.js | white 1, text-sm 1, text-lg 1, gray-800/gray-700 1 each, text-2xl 1 | Not started |
| AdminEditBanner.js | text-sm 6, gray-500 3, white 2, slate-500 1, text-lg 1, text-4xl 1, text-2xl 1 | Not started |
| AdminEditCategory.js | white 2, text-xs 1, text-sm 1, slate-500 1, text-lg 1, text-4xl 1, text-2xl 1 | Not started |
| AdminEditProduct.js | text-sm 23, text-xs 10, gray-600 7, gray-500 5, white 4, gray-700 2, slate-500/text-lg/gray-800/text-4xl/text-2xl 1 each | Not started |
| AdminEditWelcomeContent .js *(filename has a trailing space before .js — flagged, see Section 8)* | white 3, text-lg 3, text-sm 1, text-2xl 1 | Not started |
| AdminLayout.js | text-xs 6, text-sm 4, slate-500 3, white 2, slate-950 2, slate-200 2, slate-400 1, text-lg 1, `[11px]` 1 | Not started |
| AdminProductCard.js | text-sm 6, white 3, gray-800 2, text-xs 1, gray-900 1, text-black 1 (on a yellow badge) | Not started |
| AdminTransactionHistory.js | text-xs 26, gray-500 21, text-sm 20, white 12, gray-700 6, gray-600 5, text-2xl 4, text-lg 3, gray-800 2, gray-400 1, text-5xl 1 | Not started |
| AdminWelcomeCard.js | text-sm 6, white 2, gray-600 2, gray-500 1 | Not started |
| AppConvertingBanner.js | text-sm 38, gray-500 21, gray-600 16, text-xs 10, text-2xl 7, white 5, gray-900 5, gray-700 4, text-base 3, text-xl 2, text-lg 2, gray-800/text-5xl/text-4xl/text-3xl 1 each | Not started |
| BannerProduct.js | text-2xl 1 | Not started |
| BrandLogo.js | white 1 | Not started |
| CartPopup.js | gray-700 3, text-sm 2, white 1, gray-500 1, text-2xl 1 | Not started |
| CategoryList.js | text-xs 2, text-xl 2, gray-800 2, gray-100 2, white 1, text-sm 1, gray-600 1, text-base 1, text-2xl 1 | Not started |
| CategoryWiseProductDisplay.js | text-sm 2, text-2xl 2, text-xs 1, white 1, text-lg 1, gray-400 1 | Not started |
| ChangeUserRole.js | white 1, text-lg 1 | Not started |
| CompleteBusinessSolutions.js | text-sm 9, gray-700 9, white 6, gray-900 4, gray-600 4, text-2xl 3, text-xl 1, text-4xl 1 | Not started |
| CompletedProjectDashboard.js | white 4, text-xs 3, gray-800 3, text-xl 2, text-sm 2, text-lg/gray-600/text-2xl 1 each | Not started |
| CreateTicket.js | text-sm 5, gray-700 4, white 2, text-xl 1, gray-800/gray-500 1 each | Not started |
| CustomerWorkspaceTabs.js | text-sm 1, slate-900 1, slate-500 1 | Not started |
| DashboardLayout.js | white 4, text-sm 4, gray-600 3, text-xs 2, slate-500 2, text-lg 2, gray-800 2, `[11px]` 2, slate-950/slate-400/slate-300/slate-200/gray-700/gray-400 1 each | Not started |
| DisplayImage.js | text-2xl 1 | Not started |
| EditDeveloper.js | text-sm 10, gray-700 10, white 1, text-lg 1, gray-400 1, text-2xl 1 | Not started |
| EditProfileModal.js | gray-700 5, white 4, text-sm 4, gray-500 3, text-xs 1, text-lg 1, text-3xl 1 | Not started |
| EditUserBasicModal.js | text-sm 6, slate-700 4, slate-500 2, white 1, slate-900 1, text-lg 1 | Not started |
| Footer.js | white 19, slate-400 8, text-xs 7, text-sm 4, slate-300 1, emerald-400 5 (link icons — semantic, not covered by black/white rule) | Not started |
| GuestSlidesForm.js | white 1, text-lg 1, text-2xl 1 | Not started |
| GuestSlidesTableRow.js | white 3, text-sm 3, gray-500 1 | Not started |
| HorizontalCardProduct.js | text-xs 3, text-base 2, text-2xl 1 | Not started |
| ImagePopup.js | text-lg 1, gray-600 1 | Not started |
| LoginPopup.js | text-sm 11, text-xs 9, gray-500 4, white 3, gray-800 2, gray-400 2, text-xl/gray-700/gray-600/text-base 1 each | Not started |
| NotificationBell.js | text-xs 5, text-sm 3, gray-500 2, white 1, gray-700/gray-600 1 each | Not started |
| OrderDetailsModal.js | white 4, text-lg 3, text-xs 2, gray-800 2, gray-500 2, text-xl 1, gray-200 1 | Not started |
| OurReadySolutions.js | gray-900 5, text-xl 4, gray-600 4, text-3xl 1 | Not started |
| PackageSelect.js | text-sm 2, white 1 | Not started |
| PaymentAlert.js | text-sm 5, white 1 | Not started |
| PerfectForField.js | text-black 2, text-base 2, text-sm 1, slate-500/slate-400 1 each | Not started |
| ProjectDetailView.js | text-sm 7, text-black 7, white 5, text-base 4, text-xl 1, slate-700/slate-400/slate-300 1 each, text-3xl/2xl 1 each | Not started |
| QRModal.js | text-xl 1, text-sm 1, gray-600 1 | Not started |
| QuantitySelector.js | text-sm 3, gray-300 3, gray-500 2, gray-700 1 | Not started |
| RenewalModal.js | text-sm 12, text-xs 8, gray-700 5, gray-500 5, text-lg 4, gray-800 4, white 3, gray-600 3, text-xl 1, gray-400/text-2xl 1 each | Not started |
| RequestFileViewer.js | text-xs 1, text-sm 1, gray-500 1, gray-400 1 | Not started |
| RoleDirectoryPage.js | text-sm 9, text-xs 8, gray-600 8, gray-700 6, gray-800 3, gray-500 2, white 1, gray-900/gray-400 1 each, text-3xl/2xl 1 each | Not started |
| SharedHeader.js | text-sm 11, slate-950 5, slate-700 5, white 3, slate-600 3, slate-500 3, slate-900 2, text-xs 1, `[11px]` 1, `[10px]` 1 | Not started |
| SpinningLoader.js | text-sm 2, text-xl 1, gray-700/gray-500 1 each | Not started |
| TicketsList.js | gray-500 16, text-xs 11, text-sm 10, gray-800 4, white 3, gray-400 3, text-lg 2, gray-900/gray-300 1 each | Not started |
| TransactionModal.js | text-sm 18, gray-600 9, gray-700 3, white 2, gray-500 2, text-4xl 2, text-xs 1, text-xl 1 | Not started |
| TriangleMazeLoader.js | text-sm 1, gray-600 1 | Not started |
| UpdateRequestModal.js | text-sm 7, gray-600 7, gray-400 7, gray-500 5, text-xs 4, white 3, text-xl/text-lg/gray-700/gray-300 1 each | Not started |
| UploadBanner.js | text-sm 6, gray-500 3, white 2, slate-500/text-lg/text-4xl/text-2xl 1 each | Not started |
| UploadCategory.js | white 2, text-xs 1, text-sm 1, slate-500/text-lg/text-4xl/text-2xl 1 each | Not started |
| UploadDeveloper.js | text-sm 7, gray-700 7, white 1, text-lg/gray-400/text-2xl 1 each | Not started |
| UploadProduct.js | text-sm 23, text-xs 11, gray-600 7, gray-500 6, white 4, gray-700 2, slate-500/text-lg/gray-800/text-4xl/text-2xl 1 each | Not started |
| UserWelcomeForm.js | white 1, text-lg 1, text-2xl 1 | Not started |
| UserWelcomeTableRow.js | white 3, text-sm 3, gray-500 1 | Not started |
| VerticalCard.js | text-sm 11, gray-700 6, gray-500 3, text-xl/white/gray-900/gray-800/gray-600/text-2xl 1 each | Not started |
| VerticalCardProduct.js | text-sm 6, text-base 3, text-xl 2, gray-700 2, white 1, `[17px]` 1 (`md:`), `[16px]` 1, text-2xl 1 | Not started |
| WalletRecharge.js | text-sm 5, white 3, text-xs 2, text-xl 2, gray-500 2, gray-600 1, text-6xl 1 | Not started |
| WhatDoYouNeedSection.js | gray-900 4, gray-600 4, text-xl 3, white 3, text-3xl 1 | Not started |
| WhyChooseSection.js | text-sm 4, text-lg 4, gray-300 4, white 1, text-3xl 1 | Not started |
| YearlyPlanDetailsModal.js | text-sm 10, text-xs 6, text-lg 6, gray-800 6, gray-700 5, gray-500 5, gray-600 4, white 3, text-2xl 2, text-3xl 1 | Not started |
| admin/AdminFilterDropdown.js | text-sm 2, slate-950 2, slate-400 2, slate-200 2, slate-300 1 | Not started |
| admin/AdminInfoPill.js | text-sm 2, `[11px]` 2, white 1, slate-900/slate-500/slate-400 1 each | Not started |
| admin/AdminProjectCheckpointDetail.js | text-xs 20, text-sm 14, slate-700 8, slate-500 8, slate-900 6, white 5, slate-800 3, text-lg 2, slate-600/slate-400 1 each | Not started |
| admin/AdminWorkspaceList.js | slate-500 4, text-sm 3, `[11px]` 1 | Not started |
| admin/AdminWorkspaceShell.js | text-xs 2, white 2, text-sm 1, slate-400/slate-300 1 each, text-3xl/2xl 1 each | Not started |
| admin/AdminWorkspaceTabs.js | text-sm 1, slate-900 1, slate-500 1 | Not started |
| admin/ProjectWorkspaceModal.js | text-sm 28, text-xs 9, gray-700 7, gray-500 7, gray-600 5, white 4, gray-900 2, text-xl 1, gray-400 1 | Not started |
| admin/UpdateRequestWorkspaceModal.js | text-sm 9, gray-500 9, text-xs 6, white 5, gray-600 5, text-lg/gray-800/gray-700/gray-400 1 each | Not started |

### Files scanned with no text-size/color classes (no action needed)

`components/AdminManagement.js`, `AnimatedRoutes.js`, `CustomerManagement.js`, `DeveloperManagement.js`, `Header.js`, `HomeSecondBanner.js`, `LoadingWrapper.js`, `Logo.js`, `ManagerManagement.js`, `PartnerManagement.js`, `ProtectedRoute.js`, `RoleBasedHome.js`, `SingleBanner.js`, `socket.js`; `pages/CategoryProduct.js`, `DynamicWebistesPage.js`, `ForgotPassword.js`, `Home.js`.

## 11. How to update this doc after implementation (mandatory, per project doc rule)

When a file is actually changed:
1. Update that file's row in Section 10 — keep the BEFORE data as-is, and append `→ AFTER: <new classes/roles>, changed <date>` to the same cell, or add a short dated note directly under the table for that file.
2. Update the "Change status" cell from `Not started` to `Done <date>` with a one-line summary of what moved (e.g. "text-xs badges → text-sm; gray-600 body → text-black").
3. If a file's mapping required a judgment call beyond the default rule (e.g. a `text-sm` line kept as sub-text vs promoted to `text-base`, or a dark-background grey mapped to `text-white`), record that reasoning in the note so a future AI/session understands why that exception was made.
4. Once ALL files in Section 10 show `Done`, update the top **Status** line in Section 1 from "Audit complete... Code changes not yet started" to "Implementation complete <date>" and update `README.md`'s summary line for this doc to reflect the finished state instead of the pending state.
