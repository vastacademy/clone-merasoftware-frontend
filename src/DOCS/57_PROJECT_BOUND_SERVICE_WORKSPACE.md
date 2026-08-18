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
