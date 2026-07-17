# Client Activity Sorting and Node Update Audit

**Audit date**: 2026-07-17  
**Scope**: Admin client-list working-activity sorting and its project/node activity source  
**Status**: Activity read/sort layer implemented; node update write-path pending

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

## Required next implementation

1. Add the missing admin-authorized controller using the existing `orderProductModel`.
2. Register the route in `backend/routes/index.js`.
3. Validate `projectId` and `checkpointId`, confirm the order exists, and enforce admin authorization.
4. Persist `completed: true` and `completedAt` on the selected checkpoint.
5. Preserve existing model save middleware so `projectProgress`, `updatedAt`, and `lastUpdated` remain correct.
6. Make repeated completion idempotent; do not overwrite an existing completion timestamp without a verified new event.
7. Preserve the existing `order-details` response shape for both admin and customer portal.
8. Decide and verify whether node completion must be independently submittable or remain coupled to a project message; do not silently change this behavior.
9. After the write-path works, verify that the existing admin client endpoint reads the new checkpoint timestamp and moves the client to the top.

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
- Node write-path audit found the missing route/controller described above.

## Working history retained

Earlier experimental active-priority and isolated activity-endpoint approaches were removed from the active code path. The current design retains the existing admin clients endpoint and derives working activity from existing linked records. Backup history remains under the project `backup/` directory; do not treat backups as active code.
