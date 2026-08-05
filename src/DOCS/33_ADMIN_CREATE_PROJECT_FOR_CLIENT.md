# Admin "Create Project for Client" — Client-Scoped Project Creation, Bypassing the Catalog/Purchase Flow

**Session date**: 2026-08-01
**Scope**: New admin-only capability to create a working, immediately-active project for one specific client directly from that client's workspace — no catalog product, no customer purchase/payment-approval wait. UI-only phase built first (form + modal, no save), then backend wiring added in the same session once the UI and data shape were confirmed. No changes to the public/customer-facing storefront (`ProductDetails.js`, `DirectPayment.js`, `createOrder.js`, `StartNewProject.js`, Cart) — this was an explicit, repeated user requirement because the public site is planned for future removal and nothing in this feature may depend on it.
**Read this before touching**: `frontend/src/pages/AdminClientWorkspace.js` (the Projects tab, `CreateProjectForClientForm`, `CompactWorkspaceCard`'s new `headerAction` prop), `backend/controller/order/adminCreateProjectOrder.js` (new), `backend/models/productModel.js`'s new `isCustomClientProject` field, `backend/routes/index.js`'s new `/admin/clients/:customerId/create-project` route.
**Read alongside**: `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md` (the existing catalog-product creation/approval flow this feature deliberately does NOT reuse), `17_ADD_PROJECT_FORM_AND_PERFECT_FOR_AUDIT.md` (`AdminCreateProjectPage.js`, the catalog-product form this new form borrows field patterns from but does not import from), `admin-nodes.md` (the dynamic project-node/timeline system this feature is the first caller of), `00_CURRENT_SYSTEM.md` (admin route map).

## 1. Why this is a new, separate system, not a reuse of the existing purchase flow

Verified via direct code read before any design decision:

- `backend/controller/order/createOrder.js` derives `userId` from `req.userId` (the logged-in session user) — there is no `targetUserId` override, so it cannot create an order on behalf of another user as-is.
- It unconditionally forces `orderVisibility: 'pending-approval'` (ignores whatever visibility value is passed in) — incompatible with the requirement that an admin-created project must be immediately active, no approval wait.
- It requires an existing `productId` from the reusable catalog (`productModel`) — there is no path in it for an admin-defined, one-off, client-specific project with no catalog entry.
- `frontend/src/pages/DirectPayment.js` (844 lines) has all of its payment-type/installment-split logic inline in the page component — no extracted hook or reusable sub-component exists to import.

**Explicit decision**: because the public storefront (`ProductDetails.js` → `DirectPayment.js` → `createOrder.js`) is planned for future deletion, this feature was built as a **fully independent, admin-only code path** that reuses only backend/model-layer pieces with zero dependency on customer-facing pages or the customer-purchase controller. This way, deleting the public site later cannot break this admin feature.

## 2. What is genuinely reused vs. newly built (evidence-based, decided before writing code)

**Reused as-is (backend, framework-agnostic, safe regardless of public-site removal):**
- `backend/helpers/projectNodeService.js`'s `initializeProjectTimeline` — confirmed via repo-wide grep to have **zero existing callers anywhere in the codebase** before this session (only match was its own definition). Pure function, no model/request coupling. This session is the **first time it is ever wired into a live code path**.
- `orderProductModel.js`'s existing payment fields (`isPartialPayment`, `paidAmount`, `remainingAmount`, `installments[]`, `paymentComplete`) — pure schema, no change needed.
- The admin-role-check + admin-scoped-controller pattern from `backend/controller/order/scanDeleteOrder.js`/`deleteOrder.js` — used as the structural template for the new controller (session user's role checked via `userModel.findById(req.userId).select("roles")`, `req.userRole !== "admin"` gate).

**Explicitly NOT reused (customer-facing, would create a future-removal dependency):**
- `createOrder.js` — not called, not imported. A new controller was written instead.
- `DirectPayment.js` — not imported. Its payment-type UI (Full/Partial toggle, installment display) has no extracted reusable piece, so the new admin form's payment section was hand-built independently, deliberately duplicating the simple two-choice UI rather than importing anything from this page.
- `AdminCreateProjectPage.js` — not imported. Its only genuinely reusable pieces (`PerfectForField`, `PackageSelect`, `RichTextEditor`) are exactly the marketing-only fields this new form drops (see Section 3). What's left in that file (name/category/price inputs) is inline JSX with local `useState`, not extracted components, so the new form's fields were copied-and-trimmed rather than imported.

## 3. Fields dropped from the catalog-product form, and why

Confirmed with the user explicitly: this form creates a **working project for one client**, not a catalog listing a future customer needs to be sold on. Fields that exist in `AdminCreateProjectPage.js` purely to market/describe a product to a browsing customer were dropped:

- Description/Specifications, "Who is it for?", "What's Included", Project Image — all customer-discovery/marketing fields, irrelevant when the client and scope are already known via direct conversation.
- Category is kept (needed for `isWebsiteProject`/node-timeline eligibility, see Section 5) but is not a "browse/filter" field here — just a classification the admin sets directly.

Fields kept, all because they're needed for either the working project itself or the invoice/billing record (not for a customer to evaluate a purchase decision):

- Project Name, Starting Node Title (required — this seeds the first project-timeline node), Total Pages (website categories only), **Price (Base)** and **Selling Price** (both kept, not just one — see Section 4), Additional Features/Upgrades (kept, but repurposed as a billing/invoice line-item selector rather than a customer upsell selector).

## 4. Price vs. Selling Price — kept as two separate fields for invoice/discount accuracy

Initial version had a single `price` field. User explicitly requested both `price` (base) and `sellingPrice` (what the client actually pays) be kept, so a discount amount (`price - sellingPrice`) can be shown/derived for invoicing. Implemented: two separate number inputs; when `sellingPrice < price`, the form shows a live `Discount: ₹{price - sellingPrice}` line directly under the Selling Price field. Both values are sent to the backend; the backend uses `sellingPrice` (falling back to `price` if not provided) as the order's actual `price`/`totalAmount`, while the underlying product record stores both `price` and `sellingPrice` for later reference.

## 5. Additional Features/Upgrades — reused for invoice completeness, not upsell

User flagged mid-session: the form was incomplete for invoicing purposes without a way to record which features/upgrades the client's project includes ("iske bina invoice sahi se nahi banega aur bill ko manual banaya jayega"). The exact dropdown-with-tags UI and data source from `AdminCreateProjectPage.js`'s Additional Features section (Section 2 of `17_ADD_PROJECT_FORM_AND_PERFECT_FOR_AUDIT.md`) was ported into the new form:

- Same data source: `SummaryApi.allProduct`, client-side filtered to `category === 'feature_upgrades'` — no new API call.
- Same dropdown-with-tags interaction (selected features shown as removable chips above the still-selectable list, dropdown stays open across multiple selections).
- New addition not present in the original: a live **"Features total: ₹N"** line shown under the dropdown once at least one feature is selected, summing each selected feature's `sellingPrice` — this is the piece that makes the form's captured data sufficient for manual invoice creation (base price + selling price + itemized features + their total, all in one submitted payload).

## 6. Payment type — simplified relative to the customer storefront flow, decided at creation time

User's own comparison: the existing customer flow is "ecommerce jaisa" (browse → select features → apply coupon → choose payment type) — this is overkill for an admin who already knows exactly what's being built and for whom. Confirmed explicitly dropped for the admin flow, with reasoning:

- **No coupon/promo code field** — the price is already admin-decided directly (via Price/Selling Price above), not something a client self-applies a discount code against.
- **No product-browsing step** — the admin is defining the project inline in this same form, there's nothing to "browse" first.
- **Payment type is chosen in the same single submit**, not a separate step/page — user's explicit correction after initially discussing a `DirectPayment.js`-style separate step: "ismein project submit ke time hi payment type select karna jaruri hona chahiye ke partial hai ya one time."

Implemented: a simple two-button toggle (One-time / Partial) inside the same form, directly below the features section. Choosing Partial reveals a bounded installment-count dropdown (2 or 3 — mirrors the `currentInstallment` schema field's existing `min:1, max:3` constraint on `orderProductModel.js`, confirmed before choosing this range). No coupon, no separate payment page, no product re-selection.

## 7. UI-only phase first, deliberately, before any backend decision

User's explicit instruction before any backend work started: "dheyan rahe backend fregmentation na ho issi liye pehle ui only working karo." The form was built and iterated (fields dropped, Price/Selling Price split, Features section added, payment-type simplified, modal-vs-subpage decided) entirely with a `console.log`-only submit handler across several rounds, before any controller/schema/route was written. This let the exact submitted data shape (what a real save call would need) get finalized through UI iteration first, so the backend controller (Section 9) could be written once, matching an already-confirmed shape, instead of being redesigned alongside UI changes.

## 8. UI placement: modal, not inline-in-tab or a new subpage/route

Initial version rendered the form inline in the Projects tab (replacing the list). User flagged this as wrong: "yeh form ya to subpage hona chahiye tan jo back karne par project par hi jaye ya popup mein aana chahiye" — i.e., either a real navigable subpage (browser back returns to the project list) or a popup, because an inline-swap-in-place has neither real back-navigation nor a modal's simplicity. Asked explicitly via `AskUserQuestion`; user chose **Popup/Modal**, matching the existing delete-confirmation modal already present in this same file (`deleteTarget ? (...) : null`, `fixed inset-0 bg-slate-950/60` overlay pattern).

Implemented: the Projects tab list is now **always rendered** (previously it toggled away when the form was open — this was corrected). A new `showCreateProjectForm` boolean state controls a separate modal overlay block (added right after the existing delete modal, same `fixed inset-0 z-50` pattern), so the list is always visible underneath and closing the modal requires no navigation, just closing the overlay. `CompactWorkspaceCard` (the shared list-card component also used by the Plans tab) gained a new optional `headerAction` prop specifically so the "Create Project for Client" button could sit in its header row without duplicating the card's title/subtitle JSX — this is a backward-compatible addition (`undefined` renders nothing, so the Plans tab's existing usage is unaffected).

## 9. The `productId`-required schema constraint, and the three options considered

`orderProductModel.js`'s `productId` field is `required: true` (schema-level) — confirmed before any design decision that **no order can be saved without a product reference**, full stop. Three options were explicitly discussed with the user:

1. **Make `orderProductModel.productId` optional** (schema change) — rejected. Confirmed via code search that many consumers (`OrderPage.js`, `ProjectDetails.js`, admin lists) access `order.productId.serviceName`/`order.productId.category` assuming it's always populated; making it optional would require auditing and defensively fixing every one of those call sites — directly against the user's explicit "no backend fragmentation" instruction.
2. **Add a new optional snapshot field on the order** (e.g. `customProjectSnapshot`) holding name/price/category directly on the order when there's no real product — floated as a lower-risk alternative to option 1, but still a schema addition with new downstream branches needed everywhere order data is read.
3. **Create a small, catalog-hidden `productModel` document per client project, and point the order at it normally** — chosen. Zero changes needed anywhere that already assumes `order.productId` is populated, because it always is; the "hidden-ness" is carried entirely by two boolean flags on the product itself.

**Explicit "won't this make `productModel` bulky/messy?" concern, and how it was resolved**: user raised that mixing one-off client projects into the same collection as reusable catalog templates conflates two different meanings of "product." Storage bulk itself was confirmed negligible (documents are small; the collection already holds catalog products at this scale) — the real concern was semantic, not storage. Resolved by adding a **second**, purpose-specific boolean (`isCustomClientProject`) alongside the pre-existing `isHidden`, rather than overloading `isHidden` alone: `isHidden: true` keeps it out of every catalog-listing query exactly like any other hidden product (no new query logic needed anywhere), while `isCustomClientProject: true` gives any future code an explicit, unambiguous way to select "only real catalog templates" vs. "only one-off client projects" without relying on the absence of other catalog-only fields as a heuristic.

**A second, explicitly-deferred requirement surfaced during this discussion**: the user wants client-specific projects to be usable later as an auto-populated public portfolio/showcase ("humne yeh project banaya, yeh features the") — i.e., "what have we built for clients" marketing cards, generated from the same data instead of manually re-entered. Confirmed explicitly: **no portfolio UI or feature is built in this session** — this is provisioning only. Because `isCustomClientProject: true` already gives a clean, purpose-built way to query "every client project ever created" with its full name/category/pages/features already in a structured shape, no additional schema work was judged necessary to keep that door open; a future portfolio feature can query `productModel.find({ isCustomClientProject: true, /* some future 'showInPortfolio' flag if ever added */ })` without any data re-entry or migration.

## 10. `backend/models/productModel.js` — schema change (the only schema change in this session)

One new field, added directly after the pre-existing `isHidden` field, matching its style exactly:

```js
isCustomClientProject: {
  type: Boolean,
  default: false
},
```

No other field on this schema was touched. `orderProductModel.js` received **zero schema changes** — every field the new controller writes to (`price`, `totalAmount`, `orderVisibility`, `status`, `isWebsiteProject`, `isPartialPayment`, `paidAmount`, `remainingAmount`, `installments`) already existed.

## 11. New backend controller — `backend/controller/order/adminCreateProjectOrder.js`

New route: `POST /api/admin/clients/:customerId/create-project`, registered in `backend/routes/index.js` directly after the existing `admin/delete-order` routes, same `authToken` middleware pattern, admin-role-gated inside the controller (mirrors `scanDeleteOrder.js`'s exact check: `userModel.findById(req.userId).select("roles")`, `req.userRole !== "admin" || !user.roles.includes("admin")` → 403).

**Sequence** (evidence-based, not guessed — each step was checked against the real schema/service files before being written):

1. Validate `customerId` is a real, existing user.
2. Validate required fields (`serviceName`, `startingNodeTitle`, `category`, `price`) and that `category` is one of the four project categories (`standard_websites`, `dynamic_websites`, `cloud_software_development`, `app_development`) — matches `PROJECT_CATEGORIES` from `AdminCreateProjectPage.js`, duplicated as a small local constant rather than imported (frontend/backend can't share a JS module across that boundary in this codebase's structure).
3. Compute `finalPrice` = `sellingPrice` if provided and greater than 0, else `price`.
4. Create the hidden product: `new productModel({ ...formFields, isHidden: true, isCustomClientProject: true })`, save it.
5. Build `orderData` with `productId` pointing at the just-created product, `orderVisibility: 'approved'`, `status: 'in_progress'` (immediately active — no pending-approval wait, matching the confirmed requirement that admin-created projects start working immediately), and **`isWebsiteProject: true` set explicitly at construction time**.
6. Construct `new orderModel(orderData)` (not yet saved).
7. Call `initializeProjectTimeline({ order, startingNodeTitle, actorId: req.userId })` on the **unsaved, in-memory** order object.
8. `await order.save()`.

**A real correctness issue found and fixed while writing this, not by assumption**: `initializeProjectTimeline` asserts `order.isWebsiteProject` must already be `true` (`assertProjectOrder`, throws otherwise) — but `orderProductModel.js`'s own `pre('save')` hook is what normally sets `isWebsiteProject` (by looking up the product's category), and that hook only runs during `.save()`, i.e. *after* the point where step 7 needs to read it. Verified this by reading `orderProductModel.js`'s pre-save hooks directly (lines ~526-555) before writing the controller. Fixed by setting `isWebsiteProject: true` explicitly in `orderData` at construction time (step 5) — safe here because the controller already validated `category` is one of the four project categories, so this is not a guess, it's pre-known to be correct by the time step 5 runs.

**If `paymentType === 'partial'`**: a local `buildInstallments(finalPrice, installmentCount)` helper (2-way 50/50 or 3-way 30/30/40 split, matching the bounded installment-count dropdown from Section 6) populates `orderData.installments` before the order is constructed. This is a **new, standalone copy** of the split-percentage logic — not imported from `createOrder.js`/`DirectPayment.js`, both of which have the equivalent math inline in customer-flow files that must not become a dependency (Section 1).

## 12. Frontend wiring — `AdminClientWorkspace.js`

- New `SummaryApi.adminCreateProjectOrder` entry (`POST`, base URL `${backendDomain}/api/admin/clients`, `:customerId/create-project` appended at call time — mirrors the existing `adminDeleteOrder`/`adminPaymentRecord` entries' base-URL-plus-suffix pattern already used in this file).
- `CreateProjectForClientForm`'s `handleSubmit` replaced its `console.log`-only body with a real `fetch` call, `isSubmitting` state disabling both Cancel and Submit buttons with a spinner ("Creating…") during the request, `sonner` toast on success/failure.
- On success: calls a new `onCreated` callback (passed down from `AdminClientWorkspace.js`) which closes the modal (`setShowCreateProjectForm(false)`) and bumps a new `workspaceRefreshKey` state, added as a dependency to the existing `loadWorkspace` `useEffect` — this re-runs the exact same workspace-fetch the page already does on mount/customerId-change, so the newly-created project appears in the Projects list immediately without a manual page reload or a second, duplicate fetch function.

## 13. Client-side visibility — confirmed, not newly built

Verified before writing the controller (not assumed): `OrderPage.js`/`ProjectsAndPlans.js`/`ProjectDetails.js` (customer-facing) determine what to show purely by reading fields already present on whatever order document the fetch API returns (`orderVisibility`, `status`, `projectProgress`, `isPartialPayment`, `installments`, etc.) — there is no gate anywhere in those files checking *how* the order was created. Because the new controller (Section 11) writes exactly the same field shapes a customer-purchased-and-approved order would have, **no changes were made to any customer-facing file** for the new project to appear correctly in the client's own Orders/Projects-and-Plans list, show correct payment/discount info, or support node/timeline updates through the existing admin project-node UI — this was a design goal confirmed against real code before Section 11 was written, not an assumption carried over unverified.

## 14. Explicitly out of scope / not built this session

- **Editing an already-created client project** (details or payment-type/amount) — confirmed as a required future capability ("baad mein ussi project ko woh edit karke payment type ya uski koi bhi information change kar payega") but explicitly deferred; no `adminUpdateProjectOrder.js` or any edit UI was built.
- **Client-side self-service custom project creation** — explicitly discussed and explicitly deferred as a separate, later feature ("ok thik hai isse hi proceed karte hain then client side project baad mein create karne wala system bna lenge"). Whether it would reuse `adminCreateProjectOrder.js` or need its own controller was explicitly left undecided until that feature is actually scoped — do not assume either answer.
- **Portfolio/showcase feature itself** — only the data-provisioning groundwork (`isCustomClientProject` flag) exists; no public page, no admin toggle to mark a project "show in portfolio," no query/endpoint for it.
- **Public-storefront removal** — discussed only as a constraint on *how* this feature was built (Section 1), not as work performed. No public-facing file was touched, deleted, or scheduled for deletion in this session.
- `npm run build` was not run at any point, per standing user instruction across all sessions.
