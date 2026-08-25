# Category Base Price + Feature Price Snapshot — Pricing Rework for "Create Project for Client"

**Session date**: 2026-08-04
**Scope**: Reworked the admin "Create Project for Client" form (`AdminClientWorkspace.js`, see `33_ADMIN_CREATE_PROJECT_FOR_CLIENT.md`) so price is no longer a manual admin-typed number. A new `Category Base Price` admin page/collection was added (fixed price per project category). Additional Features continue to be sourced from the existing `feature_upgrades`-category `productModel` products (confirmed via live DB read: 8 real products — Live Chat, Payment Gateway, User Management, WhatsApp Cloud API Integration, Product Inventory System, Dynamic Gallery, Dynamic Page with Panel, Add New Page) — **not** a new separate collection. `adminCreateProjectOrder.js` now re-derives base price and feature prices server-side instead of trusting client input, and saves a full name+price snapshot of selected features on the order's hidden product.
**Read this before touching**: `AdminClientWorkspace.js`'s `CreateProjectForClientForm`, `adminCreateProjectOrder.js`, `categoryBasePriceModel.js`, `productModel.js`'s new `clientProjectFeatures` field, `AdminCategoryBasePricePage.js`, `AdminLayout.js`'s new "Project Setup" sidebar section.
**Read alongside**: `33_ADMIN_CREATE_PROJECT_FOR_CLIENT.md` (the feature this session modifies, not replaces — starting node title, payment-type toggle, order-creation sequence, and `isCustomClientProject` product flag are all unchanged); `17_ADD_PROJECT_FORM_AND_PERFECT_FOR_AUDIT.md` (the `feature_upgrades` category/products this session's feature-source still reuses, unchanged).

## 1. Why this change — evidence gathered before any code was written

Before writing code, the existing `CreateProjectForClientForm` (`AdminClientWorkspace.js`) and `adminCreateProjectOrder.js` were read in full. Confirmed:

- `price` (base) and `sellingPrice` were both free-typed number inputs — no category-based pricing existed anywhere in the schema or backend.
- The "Additional Features" dropdown sourced from `SummaryApi.allProduct` filtered to `category === 'feature_upgrades'` — the same `productModel` collection and category the customer-facing storefront (`ProductDetails.js`'s "Customize Your Plan") uses.
- Selected features' total (`featuresTotal`) was computed and displayed in the UI but **never sent to or used by the backend** — `adminCreateProjectOrder.js` only ever used the admin-typed `price`/`sellingPrice`, and saved feature IDs (`additionalFeatures: featureIds`) that no invoice/order-detail page anywhere read back (confirmed via repo-wide grep before writing any code).
- Project Name was a free-text input; the resulting product's `serviceName` was whatever the admin typed.

User's new requirement: category alone should drive a DB-fixed base price (basic features included), the base+features total should be a reference for invoicing, and the admin sets Selling Price manually — the difference becomes the discount.

## 2. First attempt (built, then corrected in the same session) — do not repeat

The first pass also built a brand-new, separate `projectFeatureModel` collection plus a full CRUD admin page (`AdminProjectFeaturesPage.js`, route `/admin-panel/project-setup/features`) so features would have their own dedicated catalog independent of the customer-facing `feature_upgrades` products.

**This was corrected mid-session.** A live, read-only DB query (`productModel.find({ category: 'feature_upgrades' })`) confirmed 8 real, already-in-use feature products exist (Live Chat ₹4,999, Payment Gateway ₹9,999, User Management ₹25,999, WhatsApp Cloud API Integration ₹9,999, Product Inventory System ₹14,999, Dynamic Gallery ₹7,999, Dynamic Page with Panel ₹3,999, Add New Page ₹1,999 — all `sellingPrice` values). Building a second, empty, parallel feature catalog and asking the admin to re-type all of this data was the wrong call — user explicitly corrected: **reuse `feature_upgrades` products as-is, do not build a separate system.**

**Fully removed as part of the correction** (files deleted, not just unrouted): `backend/models/projectFeatureModel.js`, `backend/controller/admin/getProjectFeatures.js`, `createProjectFeature.js`, `updateProjectFeature.js`, `deleteProjectFeature.js`, `frontend/src/pages/AdminProjectFeaturesPage.js`. Their routes (`GET/POST /api/admin/project-features`, `PUT/DELETE /api/admin/project-features/:featureId`), `SummaryApi` entries (`projectFeatures`, `createProjectFeature`, `updateProjectFeature`, `deleteProjectFeature`), the `/admin-panel/project-setup/features` frontend route, and its "Project Features" sidebar sub-link were all removed in the same pass. **If you see any reference to `projectFeatureModel` or a "Project Features" management page in old context/memory, it is stale — this system does not exist.**

## 3. What actually shipped — Category Base Price (new) + `feature_upgrades` products (reused, unchanged source)

**`backend/models/categoryBasePriceModel.js`** (new file) — one document per project category:
```js
{ category: String (enum, unique), basePrice: Number }
```
Only the 4 project categories (`standard_websites`, `dynamic_websites`, `cloud_software_development`, `app_development`) are valid.

**Features**: still fetched exactly as before — `GET /api/get-product` (`SummaryApi.allProduct`), client-side filtered to `category === 'feature_upgrades'`. No new collection, no new fetch endpoint, no new management page. The **only** change on the feature side is what the backend does with the selected IDs at order-creation time (Section 4) — it now re-validates and snapshots them instead of trusting the client-submitted name/price.

**`backend/models/productModel.js`** — one new additive field, added directly after the pre-existing `isCustomClientProject`:
```js
clientProjectFeatures: [{ featureId: ObjectId (ref: product), name: String, price: Number }]
```
A snapshot, not just IDs — each selected feature's name and price *at the time of project creation* are copied in, so the order/invoice can display line-items later without a live join back (and without being affected if that `feature_upgrades` product's price changes afterward). `ref: 'product'` because features are still `productModel` documents. The pre-existing `additionalFeatures` field (also refs into `productModel`, used by the customer-facing feature flow) was **not touched or reused** — it remains exactly as it was; `clientProjectFeatures` is a parallel, admin-flow-specific field.

## 4. `adminCreateProjectOrder.js` — before vs after

**Before**: accepted `serviceName`, `price`, `sellingPrice`, and `additionalFeatures` (array of `{id, serviceName, sellingPrice}`) directly from the request body and trusted all of them.

**After**:
- `serviceName` is no longer accepted from the client — derived server-side from a `CATEGORY_LABELS` map (e.g. `standard_websites` → `"Standard Website"`).
- The request now sends `sellingPrice` and `featureIds` (an array of `feature_upgrades`-category `productModel` `_id`s) — no price data for base or features.
- The controller re-fetches the category's `basePrice` from `categoryBasePriceModel`, and re-fetches each requested feature ID from `productModel` **filtered to `category: 'feature_upgrades'`** (so an arbitrary/non-feature product ID can't be smuggled in) — neither base price nor feature price is trusted from the request body.
- `referenceTotal = basePrice + featuresTotal` is computed server-side and stored as the hidden product's `price` field (previously this held the admin-typed base price).
- `sellingPrice` (still admin-typed, by explicit user decision — see Section 5) becomes the order's actual `totalAmount`/`price`, exactly as before.
- The hidden product now also stores `clientProjectFeatures` (name+price snapshot) instead of the old `additionalFeatures: featureIds` write.

## 5. Explicit design decision: Selling Price stays fully manual, base+features is reference-only

User's explicit instruction: **"Sirf Selling Price manual rahegi, base+features sirf reference ke liye"** — Selling Price is never auto-filled or computed; it is purely an admin-typed number, exactly as before this session. The only change is what it's compared against for the Discount display: previously `Discount = price(typed) - sellingPrice`, now `Discount = referenceTotal(server-derived) - sellingPrice`.

## 6. Frontend — `CreateProjectForClientForm` (`AdminClientWorkspace.js`) changes

| Field | Before | After |
|---|---|---|
| Project Name | Free-text input, required | **Removed entirely** — no longer part of the form or submitted payload |
| Price (Base) | Free-number input, required | Read-only display box, auto-populated from `GET /api/admin/category-base-prices` the moment Category is selected |
| Additional Features | Dropdown-with-tags sourced from `SummaryApi.allProduct` filtered to `feature_upgrades` | **Unchanged** — same source, same `feature.serviceName`/`feature.sellingPrice` fields, same dropdown-with-tags interaction |
| Reference Total | Did not exist | New display-only line: `Reference Total (Base Price + Features): ₹X`, computed client-side as `basePrice + featuresTotal` for admin visibility — not submitted to the backend (the backend recomputes it independently, Section 4) |
| Selling Price + Discount | Discount compared against typed `price` | Unchanged UI, Discount now compares against `referenceTotal` instead of the old typed `price` field |
| Starting Node Title, Total Pages, Payment Type/Installments | — | **Unchanged**, not touched this session |

Submitted payload changed from `{ serviceName, price, sellingPrice, additionalFeatures: [...] }` to `{ startingNodeTitle, category, totalPages, sellingPrice, featureIds: [...], paymentType, installmentCount }` — `featureIds` is a plain array of the same `feature_upgrades` product `_id`s the dropdown always selected; the backend now re-derives the name/price for each instead of receiving them from the client.

## 7. New admin page and sidebar section

- `frontend/src/pages/AdminCategoryBasePricePage.js` (new) — a simple 4-row table (one row per project category), each with an editable price input and its own Save button. Route: `/admin-panel/project-setup/base-price`.
- Registered in `frontend/src/routes/adminRoutes.js`, admin-role-protected via the existing `ProtectedRoute` pattern.
- `frontend/src/components/AdminLayout.js` — a new, separate sidebar section, `"Project Setup"` (distinct from the pre-existing `"Website Management"` section that holds Projects/Plans), currently containing only this one page. **Explicit decision, asked and confirmed with the user**: does not belong under "Website Management" because that section is the customer-facing catalog (Projects/Plans a customer can browse), while Base Price is internal pricing config for the admin-only "Create Project for Client" flow — same separation-of-concerns principle already established in `33_...md`.

## 8. What was explicitly NOT changed

- `AdminCreateProjectPage.js` (the customer-catalog "Add Project" form) and its `additionalFeatures`/`feature_upgrades` sourcing — untouched.
- `productModel.js`'s pre-existing `additionalFeatures` field and everything that reads it on the customer-facing side (`ProductDetails.js`'s "Customize Your Plan") — untouched.
- The `feature_upgrades` products themselves (the 8 real ones) — not edited, not migrated anywhere. They remain the single source of truth for both the customer-facing feature flow and this admin flow.
- Starting Node Title, Total Pages, Payment Type/Installments UI and logic inside `CreateProjectForClientForm` — untouched.
- Invoice/Order-detail rendering of the new `clientProjectFeatures` snapshot as line-items — **not built this session**. The data is now saved in the right shape (name+price snapshot) for a future `OrderDetailPage.js`/`InvoiceDetailPage.js` change to render it, but no such rendering exists yet.
- Editing an already-created client project's category/base-price/features after creation — still not built (same deferred scope noted in `33_...md` Section 14).
- `npm run build` was not run, per standing user instruction across all sessions.
