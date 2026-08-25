# Project Catalogue Retirement, Services, and Customer Custom Project Flow

**Status**: Current implementation handoff — verified from the active routes, controllers, schemas, and customer UI on 2026-08-19.

**Read before changing**: `orderProductModel.js`, `adminCreateProjectOrder.js`, `customerCreateCustomProjectOrder.js`, `StartNewWebsiteBuild.js`, `StartNewWebsiteCustomize.js`, `startproject.js`, `StartNewProject.js`, `submitUpdateRequest.js`, or service purchase controllers.

---

## 1. Final architecture

### Projects are private order records, never catalogue products

- A project is one `orderProductModel` with `isWebsiteProject: true` and its own frozen `projectSnapshot`.
- `projectSnapshot` carries the agreed name, category, start-node title, page count, base/final price, and selected features.
- The same order owns its client, timeline, project progress, payment state, installments, and invoices.
- `productId` is optional. It remains for reusable service products and legacy compatibility; a new private project does not need it.
- Admin configuration (`categoryBasePriceModel` and `feature_upgrades` products) is used only to price/configure a project. It is not a project catalogue.

### No project catalogue exists

- There is no customer or admin route that lists reusable project templates/products.
- Admin creates a project only inside the selected client's workspace: `POST /api/admin/clients/:customerId/create-project`.
- Customer customization is intended to create a direct private order only; it never creates a hidden `productModel` record.
- Legacy project orders were migrated to their own `projectSnapshot` before project-category product records were removed. Presentation helpers read the snapshot first and only use `productId` as a legacy fallback.

This keeps one project scope in one database record and prevents duplicate catalogue/project data.

---

## 2. Customer Start New Project flow

### Entry surface

`frontend/src/pages/startproject.js` renders two customer choices:

| Choice | Route / result |
|---|---|
| `Create a Custom Project` | Opens `/start-new-project/build/new_website` |
| `Start a Service or Add-ons` | Opens the existing service-choice surface |

Customer-facing navigation, page badges, and the service catalogue tab use the label **`Explore Services`**. The internal route names and `services` tab ID are intentionally unchanged.

### Restored customer interaction

- `StartNewWebsiteBuild.js` is the original interactive question flow restored from the frontend Git source.
- It asks the budget/ownership/type questions and directs qualifying customers into customization.
- `StartNewWebsiteCustomize.js` is the original customization UI restored from the frontend Git source.
- It retains category, budget, ownership, features, page-count pricing, full payment, partial installments, pay-later, wallet, UPI, and combined wallet + UPI UI.

### Backend contract

- `POST /api/customer/custom-project-order` is customer-authenticated.
- The server re-reads category base price and compatible feature products; it never trusts a browser-sent total.
- It clamps page count to 4–99, derives the final amount, initializes the project timeline, creates the due invoice, and uses the existing wallet/UPI/combined payment helpers.
- It writes direct `projectSnapshot` data to the new order and deliberately does **not** create a `productModel` document.
- `GET /api/customer/category-base-price?category=...` is a customer-safe read of the same base-price source used by the server-side price derivation.

### Confirmed current blocker — do not ignore

The restored Customize page calls `SummaryApi.customerCategoryBasePrice`, but `frontend/src/common/index.js` currently has no mapping with that name. The backend endpoint exists, but the page will fail when it tries to construct that URL.

**Required correction (not performed in this documentation work):** add the customer base-price API mapping in `SummaryApi`, pointing to `GET /api/customer/category-base-price`. This is a small integration correction, not a reason to restore any admin project-catalogue code.

---

## 3. Service catalogue and purchase model

### Admin side

- The admin creation route is `/admin-panel/website-management/services/add` and the page title/action is `Add Service`.
- `AdminCreateServicePage.js` is the active service form. The older Add Plan creation flow is not the active creation path.
- The existing list/route still uses some legacy internal `plans` names (`AdminPlanProductsPage.js`, `/website-management/plans`); it manages reusable service catalogue entries and is not a project catalogue.

### Service types

- A service can be `one_time` or `recurring` through `productModel.servicePlan.purchaseType`.
- Services remain reusable `productModel` catalogue entries; a purchase creates its own order snapshot.
- Standalone and project-linked purchase paths both use the existing payment/invoice sources of truth.

### File-limit enforcement is real

- The selected active upload service contributes `servicePlanSnapshot.filesLimit`.
- The customer modal uses that saved value as its file-count UI limit.
- `submitUpdateRequest.js` re-checks the same saved limit server-side before uploading, so the browser cannot bypass it.
- The route-level multer value is only the global safety ceiling. It does not replace a service's per-order limit.
- The controller also checks service capability, active status, and remaining per-cycle attempts before accepting an upload.

### Deferred service rule

The requested rule that an after-project-only service must not be listed during a project is still separate future work. Do not solve it by hiding rows in the UI; it needs a lifecycle/timing rule shared by catalogue selection, purchase validation, and activation.

---

## 4. Regression boundaries

- Do not restore admin project catalogue pages, routes, or hidden-project-product creation.
- Do not replace `projectSnapshot` with a new project collection or duplicate scope in `productModel`.
- Do not change admin direct client-project creation while restoring/fixing the customer flow.
- Do not convert customer custom projects into service catalogue entries.
- Do not treat the missing frontend base-price mapping as a reason to alter prices, payments, or the restored question flow.

---

## 5. Verification recorded for this working

- The restored Build and Customize page files matched their chosen Git source before the current documentation update.
- Backend syntax checks passed for the custom-project controller, category-base-price controller, and route index.
- Frontend Babel parsing passed for restored customer flow routes/pages and current service-label components.
- Customer controller audit confirmed no `new productModel(...)` write exists in the custom-project path.
- The active service upload modal and `submitUpdateRequest.js` both read the selected service snapshot's file limit; the controller is the authoritative enforcement point.
- `npm run build` was not run for this working, by owner instruction.

---

## 6. Backups

- `E:\merasoftware-new\backup\fix13` through `fix17`: customer-flow restoration and customer-facing terminology backups.
- `E:\merasoftware-new\backup\fix18`: documentation files before this handoff update.
