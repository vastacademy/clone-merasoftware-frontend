# Project-Bound Service Workspace

**Session date**: 2026-08-18

## Delivered behavior

- `GET /api/order-details/:orderId` now returns `linkedServices` when the requested order is a project. It queries service-plan orders by `linkedProjectOrderId` and, for customers, also applies the authenticated `userId` filter.
- The project route is the decision point: no linked services keeps the existing project-detail timeline; one or more linked services opens a project workspace.
- The workspace orders service rows by lifecycle state (active, waiting, paused, then inactive/expired) and keeps the original project as the final row.
- The service route is nested under its owner project: `/project-details/:projectOrderId/services/:serviceOrderId`. It reuses the established service detail screen and its Back action returns to the owner project's workspace.
- Selecting the original project uses `/project-details/:orderId?view=project`, which intentionally bypasses the workspace and preserves the existing timeline UI without duplicating it.
- A successful modal purchase refreshes both the wallet SSOT and the project-detail payload, so the newly purchased linked service appears in the same workspace immediately.

## Single source of truth

- `orderProductModel.linkedProjectOrderId` is the only project-to-service relationship. No mapping model, copied service list, or client-side inferred linkage was added.

## Scope boundary

- This change provides the project-contained navigation and presentation contract only. Upload enforcement, reminder delivery, activation timeline nodes, and recurring billing remain the separately documented service-engine work in `56_SERVICE_SYSTEM_REQUIREMENTS_AND_HANDOFF.md`.

---

## Session update (2026-08-25) — UI-only pass on `ProjectServiceWorkspace.js`

Component: `frontend/src/components/ProjectServiceWorkspace.js` (the workspace this doc describes, rendered by `ProjectDetails.js` when linked services exist). UI-only, no data/route/backend change — `onAddService`/`onBack`/`onOpenService`/`onOpenProject` props and `linkedProjectOrderId` linkage are all unchanged from Sections above.

**Before → after, in order of the changes made**:

1. **Width**: page container was `max-w-5xl`, narrower than every other portal page. Fixed to `max-w-7xl` to match `ProjectDetails.js`/`OrderPage.js`/`ProjectsAndPlans.js`'s standard width.
2. **Layout — single card with dividers**: the header, "Linked services" section, and "Original project" section were three separate bordered cards stacked with gaps. Merged into **one card**, sections separated by `border-t border-white/15` only (no nested boxes) — the Back button was pulled out of the header and made a standalone element above the card, matching the established detail-page template (`feedback_page_detail_ui_template.md`).
3. **"Original project" entry point moved into the header, then restyled to feel clickable**: the "Original project" section (a `BriefcaseBusiness`-icon card with the project name + progress, calling `onOpenProject`) was removed from the bottom of the page entirely. Its entry point is now the header's own title block — the whole eyebrow/title/description area is a `<button onClick={onOpenProject}>`, with the description line showing live progress (`"{progressProgress}% complete · open project timeline"`) and a trailing `ArrowRight` icon that slides on hover. After a follow-up correction ("iska click hone ka feel bhi aana chahiye"), the button was further restyled to match the "Linked services" row's own card look (`border border-white/15 bg-slate-950/25`, hover `border-emerald-300/50 bg-white/10`) instead of looking like plain header text.
4. **"Add a Service" button removed from this page**, per explicit instruction — no replacement entry point was wired elsewhere in this session; `onAddService` remains an accepted prop (harmless if a parent still passes it) but is no longer called from anywhere in this component. The `Plus` icon import was removed as it became unused.
5. **`BriefcaseBusiness` icon import removed** (was only used by the now-deleted bottom "Original project" section).

**Not changed**: `ProjectDetails.js`'s decision logic for when this workspace renders (Section "Delivered behavior" above), `linkedServices` data shape, the nested service-detail route, or any backend endpoint. This was a presentation-only pass.
