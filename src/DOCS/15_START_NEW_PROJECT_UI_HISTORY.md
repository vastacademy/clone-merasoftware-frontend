# Start New Project UI: Current State, Backups, and Design History

**Purpose**: Let an AI or developer understand the current `/start-new-project` UI, its design history, and where each backup design lives, without re-reading or re-auditing the component code.

**Status**: UI-only. No backend/API wiring for this feature. See `14_CODEBASE_AUDIT_INDEX.md` section 2 for the route/component map entry.

## 1. Active files

- `frontend/src/pages/StartNewProject.js` — list page at `/start-new-project`
- `frontend/src/pages/StartNewProjectDetail.js` — detail subpage at `/start-new-project/:projectId`
- `frontend/src/data/sampleStartNewProjects.js` — shared sample data (`SAMPLE_PROJECTS`, `formatPrice`); no backend fetch, hardcoded array
- `frontend/src/components/DashboardLayout.js` — sidebar quick link "Start New Project" points to `/start-new-project` (restored from a previously removed sidebar entry; see git history on this file for the original removal commit)
- `frontend/src/routes/customerRoutes.js` — registers both routes as `CustomerProtectedRoute`

## 2. Current design of `StartNewProject.js` (as of this writing)

- Whole page uses the same single-shell pattern as `ProjectsAndPlans.js`: one bordered `<section className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white/95 shadow-...">` containing, in order: header block (badge + title + description + a `Total: N` stat box), a tab row, then the content grid — all inside the same shell, not separate cards.
- Tabs: `All`, `Websites` (maps to `standard_websites` + `dynamic_websites`), `Cloud Software` (`cloud_software_development`), `App Development` (`app_development`). Filtering is local (`useMemo` over `SAMPLE_PROJECTS`), no API call.
- Card grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, light theme, white cards with `shadow-lg shadow-slate-300/50`.
- Each card, top to bottom: category icon in a small rounded square (`h-12 w-12 bg-slate-100`), title (`text-xl font-black`), description (`line-clamp-2`), a divider, "Who is it for?" label followed by a horizontal row of bullet-dot items (`perfectFor`; overflow items are simply clipped, no ellipsis — see section 4), then a bottom row with "Type: X (languages)" on the left (only the word "Type:" is bold) and a "View Details" button on the right that navigates to `/start-new-project/:id`.
- No price is shown on the list cards (explicitly removed per instruction).
- No product image/photo is used; category icon is the only visual identifier, deliberately small (icon-only, no image box).

## 3. Design iteration history and named backups

The card design went through several full-redesign iterations in one session. Two milestone designs were explicitly backed up by name at the user's request; earlier intermediate states were not separately preserved beyond those two.

| Backup folder | Design nickname | What it looks like | Files inside |
|---|---|---|---|
| `frontend/src/pages/backup_broad_card/` | **"Broad card"** | 2-column grid, square icon-box (`h-20 w-20`) top-left next to a large title+price, vertical "Who is it for?" checkmark list, bottom row with "Type: ..." and a dark rounded-square "View Details" button. This was the design immediately before the dark-theme experiment. | `StartNewProject.js.bak`, `sampleStartNewProjects.js.bak` |
| `frontend/src/pages/backup_long_card/` | **"Long card"** | Single/double-column, no icon at all, larger title, full description paragraph, vertical checkmark "Who is it for?" list, "Type"/"Languages" as separate labeled lines. This was the state right before reverting back to the broad-card design. | `StartNewProject.js.bak`, `sampleStartNewProjects.js.bak` |
| `frontend/src/pages/backup_20260720_StartNewProject/` | (unnamed, duplicate) | Identical content to `backup_broad_card/` — this was the first ad-hoc backup taken before the broad/long naming convention existed. Safe to treat as redundant with `backup_broad_card/`. | `StartNewProject.js.bak`, `sampleStartNewProjects.js.bak` |

None of these backup folders are imported or referenced by any route — they are dead code kept only as restore points. Do not delete them without the user's explicit permission.

### To restore a backup

Copy the `.bak` files over the active files, e.g.:
```
cp backup_broad_card/StartNewProject.js.bak StartNewProject.js
cp backup_broad_card/sampleStartNewProjects.js.bak ../data/sampleStartNewProjects.js
```

### Other rejected/reverted approaches (no backup needed, already fully reverted)

- A dark-theme card design (dark slate/navy gradient background, purple glow border, icon in a top-right corner badge, outlined pill "View Details" button) was built and then explicitly reverted back to a light theme in the same session. No trace remains in the active file.
- A `components/PerfectForRow.js` component using `ResizeObserver` to measure real text width and truncate the "Who is it for?" row with a native ellipsis exactly at the overflow point was built, then explicitly reverted/deleted at the user's request ("nahi sahi revert kardo"). It no longer exists anywhere in the codebase.
- A hardcoded fixed `...` (ellipsis) overlay `<span>` on the "Who is it for?" row (always visible regardless of actual overflow) was added as a quick patch, then explicitly removed for being non-clean "patch work." The current row now simply clips overflowing items with no ellipsis indicator at all — this is intentional per the user's last confirmed instruction, not an oversight.

## 4. Known intentional limitation

`project.perfectFor` items on the list-card "Who is it for?" row use `overflow-hidden` with no visual truncation indicator. If more items exist than fit on one line, the extra items are silently clipped (no "...", no fade). The user explicitly rejected both a hardcoded ellipsis and a JS-measured ellipsis solution as "patch work" / "jugad." If a future request asks for a truncation indicator here, re-confirm scope with the user first — do not silently reintroduce either rejected approach.

## 5. Layout/footer fix (related, same session)

Not specific to this page, but touches `DashboardLayout.js` used by it:

- `DashboardLayout.js` and `AdminLayout.js` sidebars were changed from `position: fixed` to `sticky` inside a `flex items-stretch` row with the content column, so the page footer runs full-width below both sidebar and content instead of only following content height.
- `Footer.js` desktop content wrapper now uses `mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8` (matching `AdminWorkspaceShell`'s wrapper) instead of its own independent `max-w-7xl mx-auto`, so footer columns align with sidebar-adjacent page content.

This is also recorded in `00_CURRENT_SYSTEM.md` and `14_CODEBASE_AUDIT_INDEX.md`.
