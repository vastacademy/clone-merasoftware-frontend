# Client Activity Sorting and Node Update Audit

**Audit date**: 2026-07-17  
**Scope**: Admin client-list working-activity sorting and its project/node activity source  
**Status**: Activity read/sort layer implemented; legacy node write-path remains retired; canonical dynamic node schema/service and migrated-timeline-gated admin APIs are implemented

## Verified objective

The admin client list must move a client to the top when a working-related activity occurs. Sorting must not be based on client name, profile edits, or a generic customer `updatedAt` value.

## Current source of truth

- Customer records remain owned by the existing customer backend/database.
- The active read endpoint is `GET /api/admin/clients`.
- No separate admin backend, activity endpoint, activity collection, or duplicate source of truth was added.
- `backend/controller/user/getAdminClients.js` enriches each customer with `latestActivityAt` and `latestActivitySource`.

## Activity records currently read

The endpoint derives the latest timestamp from customer-linked records:

- New customer: `user.createdAt` fallback
- Purchase/order: order creation/update timestamps
- Project work: order `updatedAt`/`lastUpdated`
- Completed node/checkpoint: checkpoint `completedAt`, only when it is actually persisted
- Project messages: order message `timestamp`
- Dynamic node events: order `projectNodeEvents[].occurredAt`
- Update requests: request lifecycle and instruction/developer message timestamps
- Payments: submission time, approval `verificationDate`, or rejection `rejectedAt`
- Invoices: lifecycle update or paid date
- Tickets: creation, reply, and status-history timestamps

Customer profile `updatedAt` is intentionally excluded from business activity. The audit found repeated customer timestamps that do not reliably identify a working event.

## Frontend consumers

- `frontend/src/pages/AdminClientsPage.js` uses `latestActivityAt` for default latest-activity ordering and displays the latest activity source/date.
- `frontend/src/pages/AdminDashboard.js` uses the same field for its recent-client preview.
- Name sorting remains only as an explicit manual option; it is not the automatic source of order.

## Node update audit

### Verified frontend path

`frontend/src/components/admin/ProjectWorkspaceModal.js` calls:

```text
POST /api/update-project-progress
```

Current payload:

```text
{ projectId, checkpointId, name, completed: true }
```

The modal currently sends this request only inside the update/message flow and requires a message before submission.

### Verified backend state

- `frontend/src/common/index.js` defines `SummaryApi.updateProjectProgress`.
- `backend/routes/index.js` does not register `/api/update-project-progress`.
- No active matching backend controller was found.
- Therefore node completion is not currently persisted by this flow.
- `backend/models/orderProductModel.js` already has the required fields: `checkpoints[].completed`, `checkpoints[].completedAt`, `projectProgress`, `updatedAt`, and `lastUpdated`.
- `backend/controller/order/getOrderDetails.js` already reads checkpoint completion and exposes it to admin/customer project detail surfaces.

### Canonical dynamic node path

- `backend/models/orderProductModel.js` now contains order-owned `projectRuns`, `projectNodes`, and `projectNodeEvents` fields.
- `backend/helpers/projectNodeService.js` owns cumulative progress, idempotent starting-node initialization, soft delete, restore, visibility, and reset rules.
- `backend/controller/order/projectNodeController.js` and the `/api/admin/projects/:orderId/nodes...` routes provide admin-only operations.
- These new operations intentionally reject legacy timeline version `0` orders until controlled migration/initialization is completed.
- The old `SummaryApi.updateProjectProgress` path remains legacy and is not the canonical new-node contract.

## Required next implementation

1. Extend the existing Clients-style `Website Management > Projects` list UI with the approved product API.
2. Add the project-product create/edit form and validate the product Starting Node Title for all project categories.
3. Preserve customer listing, ProductDetails, DirectPayment, and approval contracts.
4. Wire approved project activation to idempotent 0% starting-node initialization.
5. Verify new node events move the correct client to the top through `GET /api/admin/clients`.
6. Migrate existing legacy project timelines only after the new-project path is proven.

## Regression guardrails

- Do not remove or replace `GET /api/admin/clients`.
- Do not create a parallel activity store or endpoint.
- Do not use profile `updatedAt` for working activity.
- Do not change payment, invoice, ticket, update-request, or customer portal response contracts.
- Do not use `findOneAndUpdate` if it bypasses required order save middleware; verify the chosen update method against model behavior.
- Do not run `npm run build` without explicit permission.

## Validation evidence already completed

- Read-only database invocation of `getAdminClients` returned real `latestActivityAt` and `latestActivitySource` values.
- The returned order placed a client with the latest invoice activity above older project activity and creation-date fallbacks.
- `node --check` passed for the activity endpoint and both admin consumers.
- No client portal code was changed by the activity sorting work.
- The legacy write-path audit found the missing old route/controller; the new canonical path is now present and gated to migrated timelines.

## Working history retained

Earlier experimental active-priority and isolated activity-endpoint approaches were removed from the active code path. The current design retains the existing admin clients endpoint and derives working activity from existing linked records. Backup history remains under the project `backup/` directory; do not treat backups as active code.
