# Service System — Full Requirements, Current State, and Implementation Handoff

**Status**: Requirement-gathering only. **No code has been written for anything in Sections 3–7 of this document.** Sections 1–2 record the requirement in the owner's own words; Section 3 records what actually exists today (verified against live code and the live database, not assumed); Sections 4–7 are what must be built.

**Purpose**: This file exists so a fresh session can pick this work up without re-deriving anything. Read this file, then `55_ADDON_SERVICE_SYSTEM_PHASE_1_TO_4.md` (what was built), then `plansystem.md` (the original design intent).

**Working rules for whoever continues this** (standing instructions from the owner):
- No code change, file edit, or `npm run build` without explicit permission.
- Answer questions first; do not start working while a question is open.
- Evidence-based only — verify against real code/DB, never assume.
- Clean implementation, no patch-work. Look at the whole flow, not a narrow scope.
- Backup before any file change.
- Answer only what is asked, in short well-formatted points.

---

## 1. The owner's requirements, verbatim

These are the owner's own words, unedited, in the order they were given. They are the source of truth for this system — everything below is interpretation of these.

### 1.1 The original concept

> user ike liye ek project banaya gya hai chahe admin ne banaya chahe customer ne banaya
> uss project ko start kiya to uss project ke liye user chahe to apne project ke liye add ons services select karva sakta hai jo project complete hone se pehle add ho sakti hai aur project complete hone ke baad bhi uss project ke liye futher servicing ke liye ho sakti hain
>
> iske liye system mein admin ki taraf se services create ki jayengi jinki priicing hogi specs hongi aur woh sab services apni tytpe ke according portal ko manage karengi
> kuchh services simple duration dikhane ke liye hongi aur remiinders bhejengi kujh services portal ke upload data section ko control karenngi
>
> services ka pattern hoga ke services apne charges monthly lengi ya one time ya yearly ya har 2 saal mein ek baar ya 3 saal mein ek baar ya 4 ya 5
> aur yeh service ka schedule kitni der chalega
> yani agar monthly hai to total kitne month tak chalegi ya kitne saalon tak chalegi
> agar yealy hai to kitne saalon tak
> agar every 2 year hai tab bhi

### 1.2 Payment rule for add-on services

> beshak project partial paymenty mein hai ya abhi incomplete hai lekin services buy ki ja sakti hon aur uski patyment full hi honi chahiye jab koi payment karega tab usski projecty ke sath woh service link ho jayegi
> fir chahe during project working ho chahe after project completion

### 1.3 Multi-service purchase

> to popup get karvao user chahe single ya multiple services add karke apne wallet ya upi ya combo se payment karke services add kar sakega

### 1.4 Service types — the core requirement

> dheyan dene wali baaten
> har service ki type ka bahut important role hai
> so services ki type banana jaruri hai
> jaise ke kuchh services project complete hone ke baad kaam karengi kuchh during project aur kuchh services sirf reminders hi dengi
>
> so agar koi service project complete hone ke baad kaam karengi to woh project 100% ciompklete hone ke baad ussi time active ho jayengi aur unka activation ussi progress page ko alag system ke sath actiive karega yani sab single souce mein hoga
>
> so service banane wala form aur uss service ki wporking ko manage karne wala system bhi sahi karna hoga

### 1.5 The four service shapes, spelled out

> services ka kaam samjho
>
> 1 service user ko portal mein data upload button ki limit degi jo ke kisi bhi project ke baad hi kaam karegi aur woh project ke sath kaam karegi yani uss perticular project mein uski history bhi banti jayegi aur usi project mein hi uss service ka kaam hoga
>
> 1 service ka kaam sirf reminders bhejne ka hoga woh portal mein upload data ko manage nahi karegi bas woh reminders hi bhejegi user ko
>
> 1 service during ya after peoject use hogi jo during project user ke poirtal mein upload data ko control nahi karegi lekin agar user uss service ko purchase karega to woh service portal ke upload data ko limit mein on karegi
>
> 1 service user ke liye bina kisi main project koi start kiye bhi as project work karegi aur yeh services reminders ke liye bhi ho sakti hai aur yeh upload data ke button ko bhi manage karegi
>
> so yeh services create karte time admin ki taraf se yeh option deni hogi ke konsi service during project wali hai konsi during+after wali hai aur konsi after project wali hai
>
> aur issi mein konsi services ko project par hi depended rakhna hai aur konsi services standalone + project ke sath work karne wali hongi
> then konsi service kitni limit files allow karegi aur kitne attempt degi upload ke liye
> service mein upload data dena bhi hai ya nahi aur service ki duration kya hai kitni hai kitni der kaam kalregi yeh sab service create karte time options honi chahiye

### 1.6 Where activation shows

> jo project ki nodes hain ussi mein status nazar aana start ho jayega?

### 1.7 Project click routing

> mere according project par click karne par ui aise behave kare ke agar kisi ka project complete ho gya hai lekin koi after service nahi li gyi to uska direct project hi open ho
> agar koi after service hai to uss project detail page mein timeline honi chahiye aur uss timeline mein uska detail page open ho
>
> yani project in progress ya 100% complete without any after service then direct abhi wala detail page
>
> agar after service hai aur project khatam ho gya hai to timeline list jismein completed project neeche hoga aur current active service list mein uppar
>
> user chahe completed project par click karke project detail page dekh ske chahe active service
>
> aise mein uss project related sabhi ka apna apna detaiul page show hota rahega

**Refinement agreed in discussion**: the trigger for showing the list is **"does this project have any linked service?"**, not "is the project complete?". The owner confirmed this ("haan sahi hai 2nd option hi") because it also covers during-project services, which the original wording would have missed.

---

## 2. What these requirements mean, decomposed

### 2.1 A service has THREE independent settings, not one

The single biggest correction to the current implementation. These are orthogonal — any combination must be expressible:

| Setting | Values | Meaning |
|---|---|---|
| **Timing** | `during` / `during_and_after` / `after` | When the service is allowed to be active relative to the project's lifecycle |
| **Dependency** | `project_required` / `standalone_or_project` | Whether it can exist without a project at all |
| **Capability** | upload-control: yes/no **AND** reminders: yes/no | What it actually does. **Two independent booleans, not one dropdown** — a service may do both, either, or (in principle) neither |

### 2.2 Purchase is not activation

An `after`-timing service bought while the project is at 45% must be **dormant**: paid for, visible, but not started. Its validity window and billing cycles must count **from activation**, not from purchase — otherwise a customer buying a 1-year service on a project that takes 3 months to finish silently loses 3 months.

### 2.3 Activation is triggered by project progress, in the node system

The owner was explicit: *"unka activation ussi progress page ko alag system ke sath actiive karega yani sab single souce mein hoga"* — activation happens where progress is already written (`projectNodeService.js`), **not** in a separate cron or activation service.

Edge case to handle: a customer buys an `after` service on a project that is **already** 100% — it should activate immediately.

### 2.4 Activation is visible in the project timeline

Confirmed in 1.6 — the service's activation appears as an entry in the same node timeline as the project's own milestones, so the project's whole story (built → delivered → serviced) is one list. Clicking it opens that service's own detail.

### 2.5 "Control" means unlock, not restrict

From 1.5, third service: *"during project ... upload data ko control nahi karegi lekin agar user uss service ko purchase karega to woh service portal ke upload data ko limit mein on karegi"*.

So the upload capability is **granted** by the service, not merely capped by it. Without a service, the upload action should not be available; buying one turns it on, with a limit.

### 2.6 Two separate numbers for upload

From 1.5: *"kitni limit files allow karegi aur kitne attempt degi upload ke liye"* —
- **files limit** — how many files per single upload
- **attempts** — how many uploads (per cycle)

`servicePlan.filesLimit` and `servicePlan.portalAccessCount` already model these two ideas. **Open question O4** below: confirm `portalAccessCount` is exactly the "attempts" concept before reusing it.

### 2.7 History lives inside the project

From 1.5, first service: *"uss perticular project mein uski history bhi banti jayegi aur usi project mein hi uss service ka kaam hoga"* — uploads made under a service belong to that project's record, not a separate area.

### 2.8 Reminder-only services need equal UI weight

Agreed in discussion. A reminder-only service changes no button and shows no counter, so without deliberate UI it looks like the customer paid for nothing. It needs: an activation node, a card showing next-reminder + validity, a list badge, and — importantly — a **history of reminders actually sent**, which is what makes it feel alive. That history has no schema today.

---

## 3. Current system — verified, not assumed

### 3.1 What exists and works

| Area | State |
|---|---|
| Admin can create a service | ✅ `/admin-panel/website-management/services/add` → `AdminCreateServicePage.js` → `POST /api/admin/services/create` → `createServicePlan.js`; admin selects one-time or recurring purchase |
| Plans list | ✅ `/admin-panel/website-management/plans` |
| Customer can browse | ✅ `/start-new-project` → "Service Plans" tab → `/service-plan-detail/:planId` |
| Customer can buy one (wallet/UPI/combined) | ✅ `customerCreateServicePlanOrder.js` |
| Customer can buy several (wallet only) | ✅ `customerCreateServicePlanOrdersBulk.js` + `AddServiceModal.js` |
| Add-on linkage to a project | ✅ `orderProductModel.linkedProjectOrderId` + `addedDuringProjectPhase`, ownership-verified server-side |
| Invoice + payment SSOT | ✅ Reuses `paymentRecording.js` / `transactionService.js`, follows docs 52/53 |
| Purchased plan appears in customer's Plans list | ✅ `helpers/orderType.js` already treats `service_plan` as a plan |

Full detail of all of the above: `55_ADDON_SERVICE_SYSTEM_PHASE_1_TO_4.md`.

### 3.2 Live data snapshot (read-only audit, current)

Run `backend/scripts/readOnlyAuditServicePlanReadiness.js` to refresh this.

- **1** service plan in the catalog: *"Website update plan Yearly"* — ₹9,000, quarterly billing, 365-day validity, **`serviceBehavior` not set** (it predates that field).
- **24** project orders; **21** eligible to show the Add-a-Service card (14 in progress, 7 completed); 3 excluded as not-confirmed sales.
- **0** add-on services purchased so far.

### 3.3 The relevant schema today

`productModel.servicePlan` (the template):
```
planType, limitScope, manualUnit, manualCount, portalAccessCount, filesLimit,
validityUnit, validityValue, validityInDays, billingCycle, serviceBehavior
```

`orderProductModel` (the purchased instance):
```
isServicePlan, servicePlanSnapshot{...}, servicePlanStartDate, servicePlanEndDate,
serviceCurrentCycleNumber, serviceCurrentCycleStart, serviceCurrentCycleEnd,
serviceAccessUsedInCycle, serviceAccessUsedTotal, serviceCycleHistory[],
servicePlanStatus, linkedProjectOrderId, addedDuringProjectPhase
```

### 3.4 The gaps — verified against live code

| # | Gap | Evidence |
|---|---|---|
| **G1** | `serviceBehavior` is a **single-choice enum** (`portal_access_control` \| `reminder_only`) — a service cannot do both | `productModel.js` ~line 212 |
| **G2** | **No timing field** — during / during+after / after does not exist anywhere | grep: no such field in either model |
| **G3** | **No dependency field** — project-required vs standalone-or-project does not exist | grep: no such field |
| **G4** | **Purchase = activation.** `servicePlanStartDate` is set to purchase time, `servicePlanStatus` defaults to `active`, and the first cycle starts immediately | `helpers/servicePlanPurchase.js`, `buildServicePlanOrderData()` |
| **G5** | **No activation engine.** Nothing activates a dormant service when a project hits 100% | `projectNodeService.js` has no service awareness |
| **G6** | **Upload button is not connected to services at all.** It is gated purely on payment | `ProjectDetails.js:583` — `isUploadLocked = Boolean(order.hasUnpaidInvoice) \|\| isOrderPendingApproval` |
| **G7** | **File limit is hardcoded 20 in two unrelated places**, plan-agnostic | `backend/routes/index.js:139` (`files: 20`), `UpdateRequestModal.js:23` (`maxFileCount = 20`) |
| **G8** | **No enforcement.** Nothing reads `serviceAccessUsedInCycle` against `portalAccessCount`; `submitUpdateRequest.js` is untouched | grep: no reader of those fields |
| **G9** | **No cycle engine.** `serviceCurrentCycleStart/End` are written once at purchase and never advanced; `serviceCycleHistory[]` is never appended to | grep: no writer after creation |
| **G10** | **No recurring billing.** Only the first payment is ever collected — cycle 2+ invoices do not exist | `plansystem.md` §6 is design only |
| **G11** | **No reminder delivery and no reminder record.** `emailService.js` / `whatsappService.js` exist but nothing calls them for services, and there is no schema to record what was sent | grep |
| **G12** | **Upload requests have no service linkage.** `updateRequestModel` has no reference to which service the upload was consumed from | `backend/models/updateRequestModel.js` |
| **G13** | **Multer's file-count limit is set once at boot**, so it can never be per-plan. Per-plan enforcement must happen inside the controller with multer's value acting only as a hard ceiling | `backend/routes/index.js:136-140`; also flagged in `plansystem.md` §5.3 |

---

## 4. What must be built

Ordered by dependency — each phase assumes the ones above it.

### Phase A — Schema (additive)

**`productModel.servicePlan`**
- `timing` — enum `during` / `during_and_after` / `after`
- `dependency` — enum `project_required` / `standalone_or_project`
- `controlsUpload` — Boolean
- `sendsReminders` — Boolean
- Decide the fate of `serviceBehavior` (**Open question O1**)

**`orderProductModel`**
- `servicePlanActivatedAt` — Date, null while dormant
- `servicePlanStatus` — add an `awaiting_activation` value (and stop defaulting to `active` for `after`-timing services)
- Mirror the new template fields into `servicePlanSnapshot`

### Phase B — Admin create form + server validation

`AdminCreateServicePage.js` and `createServicePlan.js` must change **together** — the server already re-validates everything the form does, and that must stay true.

- Timing dropdown; dependency dropdown
- Two checkboxes for capability, replacing the single behavior dropdown
- Files limit + attempts shown only when upload-control is on
- Validation: an `after`-timing service that is `standalone_or_project` is contradictory (**Open question O5**)

### Phase C — Activation engine

- In `projectNodeService.js`'s `appendProjectNode()`, when cumulative progress reaches 100%, activate that project's dormant `after` / `during_and_after` services: set `servicePlanActivatedAt`, flip status to `active`, and start cycle 1 **from that moment**.
- At purchase time, if the linked project is **already** 100%, activate immediately instead of leaving it dormant.
- Write a timeline node for the activation so it appears in the project's own story (see Open question O3 for the progress-value question).

### Phase D — Upload unlock, limits, and enforcement

The largest functional change, and the one that makes services actually mean something.

- `ProjectDetails.js`: the upload action becomes service-driven — locked with an "Add a Service" call to action when no upload-capable service is active; enabled with remaining-attempts and files-per-upload shown when one is.
- `submitUpdateRequest.js`: authoritative per-plan check inside the controller (multer stays a fixed hard ceiling, per G13/`plansystem.md` §5.3). Consume the attempt **atomically before** the Drive upload and release it if the upload fails — `plansystem.md` §5.3 flags both the race condition and the existing "counts as used even when all files failed" bug; do not reproduce them.
- `UpdateRequestModal.js`: read the limits from the active service instead of its hardcoded `20`.
- Link the upload record to the service that paid for it (G12).

### Phase E — Project click routing

- Where a project row is clicked (`ProjectsAndPlans.js`, `CustomerDashboard.js` — both already share `helpers/orderType.js` / `orderPresentation.js` / `OrderListRow.js`, so this belongs in the shared helper, not per page):
  - project has **no** linked service → open the project detail page exactly as today
  - project has **any** linked service → open a list: active services on top, waiting ones next, the project itself at the bottom; every row opens its own detail page
- The trigger is "has any linked service", **not** "is complete" (owner-confirmed).

### Phase F — Reminder services

- A schema to record reminders sent (none exists — G11)
- Delivery via the existing `emailService.js` / `whatsappService.js`
- Customer-facing: next-reminder card, reminder history, list badge — equal weight to upload services
- Depends on **Open questions O6, O7**

### Phase G — Cycle + recurring billing

The pre-existing, still-unbuilt work from `plansystem.md` §5.3 and §6. Read that document before starting: it contains a recommended approach (lazy roll-forward plus a nightly cron; a separate `servicePlanInvoiceModel`; a grace period; pause-not-cancel) and its own list of open questions.

---

## 5. Open questions — must be answered before building

| # | Question | Notes |
|---|---|---|
| **O1** | `serviceBehavior` already exists in the live schema. Replace it with the two new booleans, or keep it additively and derive? | Only 1 plan exists and it doesn't set the field, so replacement is cheap right now |
| **O2** | If two upload-capable services are active on one project, do their limits **add up** (5+5=10) or stay separate and get consumed in some order? | Affects both UI and enforcement |
| **O3** | The activation node in a 100%-complete project's timeline — what progress value does it carry? | `appendProjectNode()` enforces strictly increasing progress; a service activating does not advance project progress. Staying at 100% needs a deliberate exception |
| **O4** | Is "attempts" exactly the existing `portalAccessCount`, or a separate number? | Determines whether Phase A adds a field or reuses one |
| **O5** | Can a service be `after`-timing **and** `standalone_or_project`? "After" implies a project exists to be after | Probably an invalid combination the form should block |
| **O6** | Who writes reminder content — fixed text set by admin at service creation, per-customer, or system-generated? | Blocks Phase F |
| **O7** | When do reminders fire — on the billing cycle, or a separate schedule set per service? | Blocks Phase F |
| **O8** | Should the 1 existing catalog plan be backfilled with the new fields, or left for admin to edit by hand? | Only one row; a hand edit may be simpler than a migration |

---

## 6. Regression boundaries

- **Do not** touch the legacy plan-type system (`isWebsiteUpdate` / `isMonthlyRenewablePlan` / `isMonthlyLimitedPlan` and its ~20 backend files). It still runs one real customer's live plans. Coexist-then-migrate remains the standing approach (`27_...md` §5).
- **Do not** change the approval engine (`transactionApprovalController.js`) casually — docs 52/53 corrected it carefully. Bulk service purchase is wallet-only specifically to avoid touching it (`55_...md` §6b).
- **Do not** create a second timeline/node store. Activation belongs in `projectNodeService.js`.
- **Do not** raise multer's boot-time limit to solve per-plan file limits — it cannot be per-request (G13).
- Keep `order.projectProgress`, order status/visibility and payment response contracts intact.
- Every new read/write path keeps admin authorization and customer-ownership filtering.

---

## 7. Where things live

**Backend**
- `models/productModel.js` — service plan template (`servicePlan{}`)
- `models/orderProductModel.js` — purchased instance + `linkedProjectOrderId`
- `controller/product/createServicePlan.js` — admin create + server validation
- `controller/order/customerCreateServicePlanOrder.js` — single purchase (wallet/UPI/combined)
- `controller/order/customerCreateServicePlanOrdersBulk.js` — bulk purchase (wallet only)
- `helpers/servicePlanPurchase.js` — **SSOT** for price/validity/cycle/snapshot; both purchase paths use it
- `helpers/projectNodeService.js` — where activation must hook in (Phase C)
- `controller/user/submitUpdateRequest.js` — where enforcement must hook in (Phase D)
- `routes/index.js` — routes + the boot-time multer config

**Frontend**
- `pages/AdminCreateServicePage.js` — admin create form
- `pages/AdminPlanProductsPage.js` — admin plans list
- `pages/ServicePlanDetail.js` — standalone purchase page
- `components/AddServiceModal.js` — add-on picker opened from a project
- `pages/ProjectDetails.js` — Add-a-Service card, upload action, `isUploadLocked`
- `pages/PlanDetails.js` — purchased plan detail (has a Service Plan branch)
- `components/UpdateRequestModal.js` — upload modal with the hardcoded `20`
- `helpers/orderType.js`, `helpers/orderPresentation.js`, `components/OrderListRow.js` — shared list logic (Phase E belongs here)

**Read-only audit scripts** (safe to re-run, no writes)
- `backend/scripts/readOnlyAuditServicePlanReadiness.js` — catalog buyability + card eligibility
- `backend/scripts/readOnlyAuditOneOrderAddonGate.js <orderId>` — why one order does/doesn't show the card

**Docs to read in order**: this file → `55_ADDON_SERVICE_SYSTEM_PHASE_1_TO_4.md` → `plansystem.md` (§5.3, §6) → `26_SERVICE_PLAN_SYSTEM_PHASE_1.md` → `27_SERVICE_PLAN_RENAME_AND_LEGACY_MIGRATION.md`.
