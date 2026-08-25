# Start New Project UI: Current State, Backups, and Design History

**Purpose**: Let an AI or developer understand the current `/start-new-project` UI, its design history, and where each backup design lives, without re-reading or re-auditing the component code.

**Status**: Live-wired to real product data for the list page. Detail subpage still uses UI-only placeholder rendering and has no "Proceed to Payment" handler. See `14_CODEBASE_AUDIT_INDEX.md` section 2 for the route/component map entry.

## 1. Active files

- `frontend/src/pages/StartNewProject.js` — list page at `/start-new-project`; fetches real products via `SummaryApi.allProduct` (`GET /api/get-product`)
- `frontend/src/pages/StartNewProjectDetail.js` — detail subpage at `/start-new-project/:projectId`; fetches a single product via `SummaryApi.productDetails` (`POST /api/product-details`, body `{ productId }`) using the Mongo `_id` from the route param
- `frontend/src/components/CustomerWorkspaceTabs.js` — shared underline-style tab component (mirrors admin's `components/admin/AdminWorkspaceTabs.js`); used by `StartNewProject.js`, `ProjectsAndPlans.js`, `OrderPage.js`, `UserInvoices.js`
- `frontend/src/data/sampleStartNewProjects.js` — retired; no longer imported by either active page. Kept on disk only as a leftover artifact from the earlier UI-only iteration, not referenced by any route.
- `frontend/src/components/DashboardLayout.js` — sidebar quick link "Start New Project" points to `/start-new-project`
- `frontend/src/routes/customerRoutes.js` — registers both routes as `CustomerProtectedRoute`

## 2. Current data wiring

- List page fetches `GET /api/get-product` (public, already filters `isHidden: false` server-side in `backend/controller/product/getProduct.js`), then excludes `website_updates` and `feature_upgrades` categories client-side (these are plans/add-ons, not standalone projects — see `13_PROJECT_CREATION_AND_APPROVAL_PLAN.md`).
- Real `productModel` fields are mapped as: `serviceName` (title), `formattedDescriptions[0].content` (HTML description — stripped to plain text for the list-row preview via a local `stripHtml` helper, rendered as rich HTML via `dangerouslySetInnerHTML` on the detail page, matching the existing pattern in `ProductDetails.js`), `perfectFor` (as-is), `packageIncludes` (detail page "What's included"), `sellingPrice` (detail page only), `_id` (routing key, replacing the old sample-data `id` slug).
- Fields that existed only in the old sample data and have **no real-model equivalent** — `tech`, `criticalInfo`, `whatsIncluded` naming (real field is `packageIncludes`) — were dropped rather than invented. The card's former "Type: X (languages)" row is intentionally removed; do not reintroduce it without a confirmed backend field.
- Category tabs are `Websites` (`standard_websites` + `dynamic_websites`), `Cloud Software` (`cloud_software_development`), `App Development` (`app_development`); default active tab is `Websites` (there is no "All" tab — explicitly removed per instruction). Any product category not covered by these three gets an automatically generated extra tab (label derived from the category string via `toTitleCase`), so no product is silently hidden.
- No backend changes were made for this wiring; both endpoints (`/api/get-product`, `/api/product-details`) already existed and required no modification.

## 3. Current layout: list-row view (not card grid)

The card-grid layout (see section 4 for its full design history) was replaced with a list-row layout at the user's request, modeled on the same list pattern already used by `ProjectsAndPlans.js` (col-span-12 grid, header row with column labels, one full-width clickable row per item, alternating `bg-white`/`bg-slate-50`).

Current list-row columns: `Project` (icon + title + 2-line clamped description), `Who is it for?` (`perfectFor` bullet items, wrapped and capped at ~3 lines via `max-h-[4.5rem] overflow-hidden`), `Open` (View Details + arrow, right-aligned). Price is **intentionally not shown on the list row** per explicit instruction — this does not affect the price system elsewhere (product model, `ProductDetails.js`, `DirectPayment.js` are untouched); the `formatPrice` helper remains in the file, unused, kept for potential future use on this page.

Tabs use `CustomerWorkspaceTabs` (underline style: `border-b-2`, active = `border-emerald-500 text-emerald-700`, inactive = `text-slate-500`) instead of the earlier pill-style (`rounded-full`, solid `bg-emerald-600` fill) buttons. This same tab-style swap was also applied to `ProjectsAndPlans.js`, `OrderPage.js`, and `UserInvoices.js` in the same pass, for visual consistency across the customer portal. See `frontend/src/components/CustomerWorkspaceTabs.js`.

All body/label text on this page uses `text-black` rather than various `text-slate-500/600/700` shades, per explicit instruction. Category icon accent colors (blue/emerald/purple/orange per category) and the emerald active-tab/badge accents are intentionally left untouched — only plain body/label text was changed to black.

List-row cards previously (card-grid era) had their border/shadow strengthened for visibility (`shadow-xl shadow-slate-400/40`, later a `border-2 border-slate-300` was tried and reverted back to `border border-slate-200` for being too dark) — this shadow work is now moot since the card grid itself was replaced by the list-row layout, but the shadow-strength adjustment history is preserved here in case card view is ever restored.

## 4. Card-grid design iteration history and named backups (superseded)

The card-grid layout below is no longer active (see section 3) but its backups remain on disk as restore points.

The card design went through several full-redesign iterations in one session. Two milestone designs were explicitly backed up by name at the user's request; earlier intermediate states were not separately preserved beyond those two.

| Backup folder | Design nickname | What it looks like | Files inside |
|---|---|---|---|
| `frontend/src/pages/backup_broad_card/` | **"Broad card"** | 2-column grid, square icon-box (`h-20 w-20`) top-left next to a large title+price, vertical "Who is it for?" checkmark list, bottom row with "Type: ..." and a dark rounded-square "View Details" button. This was the design immediately before the dark-theme experiment. | `StartNewProject.js.bak`, `sampleStartNewProjects.js.bak` |
| `frontend/src/pages/backup_long_card/` | **"Long card"** | Single/double-column, no icon at all, larger title, full description paragraph, vertical checkmark "Who is it for?" list, "Type"/"Languages" as separate labeled lines. This was the state right before reverting back to the broad-card design. | `StartNewProject.js.bak`, `sampleStartNewProjects.js.bak` |
| `frontend/src/pages/backup_20260720_StartNewProject/` | (unnamed, duplicate) | Identical content to `backup_broad_card/` — this was the first ad-hoc backup taken before the broad/long naming convention existed. Safe to treat as redundant with `backup_broad_card/`. | `StartNewProject.js.bak`, `sampleStartNewProjects.js.bak` |
| `frontend/src/pages/backup_before_api_wiring/` | Pre-API-wiring snapshot | Card-grid layout using `SAMPLE_PROJECTS` hardcoded data, before the real-product API wiring described in section 2. | `StartNewProject.js.bak`, `StartNewProjectDetail.js.bak` |
| `frontend/src/pages/backup_before_tab_ui_change/` | Pre-tab-style-swap snapshot | List-row layout (already API-wired) but still using pill-style (`rounded-full`) tabs, before the underline-tab swap described in section 3. Covers all four pages touched by that change. | `StartNewProject.js.bak`, `ProjectsAndPlans.js.bak`, `OrderPage.js.bak`, `UserInvoices.js.bak` |

None of these backup folders are imported or referenced by any route — they are dead code kept only as restore points. Do not delete them without the user's explicit permission.

### To restore a card-grid backup

Copy the `.bak` files over the active files, e.g.:
```
cp backup_broad_card/StartNewProject.js.bak StartNewProject.js
cp backup_broad_card/sampleStartNewProjects.js.bak ../data/sampleStartNewProjects.js
```

### Other rejected/reverted approaches (no backup needed, already fully reverted)

- A dark-theme card design (dark slate/navy gradient background, purple glow border, icon in a top-right corner badge, outlined pill "View Details" button) was built and then explicitly reverted back to a light theme in the same session. No trace remains in the active file.
- A `components/PerfectForRow.js` component using `ResizeObserver` to measure real text width and truncate the "Who is it for?" row with a native ellipsis exactly at the overflow point was built, then explicitly reverted/deleted at the user's request ("nahi sahi revert kardo"). It no longer exists anywhere in the codebase.
- A hardcoded fixed `...` (ellipsis) overlay `<span>` on the "Who is it for?" row (always visible regardless of actual overflow) was added as a quick patch, then explicitly removed for being non-clean "patch work." The row simply clips overflowing items with no ellipsis indicator — this is intentional per the user's last confirmed instruction, not an oversight. In the current list-row layout this manifests as `overflow-hidden` with a fixed `max-h` instead of `line-clamp`, same underlying intent.
- A `border-2 border-slate-300` treatment on list/card items was tried to increase visual separation, then reverted to the lighter `border border-slate-200` after the user found it too dark — the shadow (`shadow-xl shadow-slate-400/40`) was kept as the primary depth cue instead.

## 5. Known intentional limitation

`project.perfectFor` items on the list-row "Who is it for?" column use `overflow-hidden` with no visual truncation indicator (currently height-capped at `max-h-[4.5rem]`, roughly 3 lines, instead of the card-era single-line clip). If more items exist than fit, the extra items are silently clipped (no "...", no fade). The user explicitly rejected both a hardcoded ellipsis and a JS-measured ellipsis solution as "patch work" / "jugad." If a future request asks for a truncation indicator here, re-confirm scope with the user first — do not silently reintroduce either rejected approach.

## 6. Known data-quality issue (not a code bug)

Some product `formattedDescriptions[0].content` values include a literal leading "Description:" word typed by the admin into the rich-text editor at content-creation time (e.g. "Blogging Website" product). This renders exactly as saved — it is a data-entry issue in that specific product record, not a frontend rendering bug, and should be fixed by editing the product's description in the admin panel, not by adding frontend string-stripping logic for an assumed prefix.

## 7. Layout/footer fix (related, earlier session)

Not specific to this page, but touches `DashboardLayout.js` used by it:

- `DashboardLayout.js` and `AdminLayout.js` sidebars were changed from `position: fixed` to `sticky` inside a `flex items-stretch` row with the content column, so the page footer runs full-width below both sidebar and content instead of only following content height.
- `Footer.js` desktop content wrapper now uses `mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8` (matching `AdminWorkspaceShell`'s wrapper) instead of its own independent `max-w-7xl mx-auto`, so footer columns align with sidebar-adjacent page content.

This is also recorded in `00_CURRENT_SYSTEM.md` and `14_CODEBASE_AUDIT_INDEX.md`.
