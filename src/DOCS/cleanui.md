# Clean UI — Client Panel

> **Live handoff document.** Is file ko padhkar next agent bina purani chat padhe current
> decision, proof aur next action samajh sake. Completed work ki full history archive mein hai.
>
> Shuru hua: **16-09-2026** · Last compacted: **18-09-2026**

---

## 1. Maksad aur scope

**Client panel par customer ko sirf wahi dikhe jo wo samajh sakta hai.** System ke IDs, internal
status, raw references aur duplicate/filler text screen par nahi aane chahiye.

**Scope:** sirf customer panel. Admin panel is kaam ka hissa nahi hai.

---

## 2. Non-negotiable rules

| Rule | Matlab |
|---|---|
| Human-understandable text | DB IDs, internal enums, raw invoice/transaction references aur technical labels client ko mat dikhao. Functional reference field zaroori ho to owner decision ke saath clear label mein rakho. |
| To the point | Ek baat ek baar; generic/ad-like ya unclear wording nahi. |
| Owner approval | Text/display/code change owner ki haan ke baad hi. Koi cheez rakhna ya hatana AI khud decide nahi karega. |
| Evidence first | Code + relevant real data se proof; grep count ya assumption evidence nahi. |
| Scope control | Default kaam text/display hai. Billing, allowance, permission ya action flow mein change ek separate system/contract correction hai. |
| No build | `npm run build` nahi chalana. Syntax/static checks allowed hain. |
| Docs live | Is file ko current truth ke saath update karo; full old history archive mein rakho. |

---

## 3. System facts — screens ko galat source se bachane ke liye

### Order type / allowance SSOT

| Kism | Pehchaan | Allowance source |
|---|---|---|
| Service | `isServicePlan: true` | Order ka frozen `servicePlanSnapshot` + order counters |
| Project | `isWebsiteProject: true` | No plan allowance; project state gates access |
| Legacy | dono flags false | Catalogue `updateCount` / `validityPeriod` |

Order customer ka purchased contract hai; catalogue mutable template hai. Display ke liye order snapshot
first, catalogue fallback only.

### Invoice language

`unpaid`, `partially_paid`, `paid`, `overdue`, `cancelled` aur invoice types internal values hain.
Client surface par `invoicePresentation` ke human labels use karo.

---

## 4. Owner decisions that still apply

| Date | Decision |
|---|---|
| 16-09-2026 | Client text human-understandable aur concise hoga. |
| 16-09-2026 | Any functional display/remove decision owner ka hai. |
| 17-09-2026 | Default work sirf text/display; discovered system issue ko evidence ke saath record karo, silently fix mat karo. |
| 17-09-2026 | Plan allowance display cycle-based source se aayega, legacy catalogue fields se nahi. |
| 17-09-2026 | Category label projects ke liye SSOT mapping se; services par project category mat dikhao. |
| 17-09-2026 | Approved Projects & Plans subtitle: `See the progress and details of your projects and plans.` |
| 18-09-2026 | Approved payment-due wording: `₹X is due for this project. Pay now to continue.` |
| 18-09-2026 | UPI label `UPI reference number`; submit CTA `Send payment for checking`. |

---

## 5. Completed, verified work

| Area | Current result | Evidence / validation |
|---|---|---|
| Projects and Plans | Approved subtitle; service rows no longer show project category. | Shared `getOrderCategoryLabel()` rule. |
| Project / Order / Order Detail | Client labels use readable category/payment wording; raw refund reference hidden. | Existing behavior/CTAs retained. |
| My Updates | Live order feed only; mock rows removed. Upload-capable services use frozen allowance snapshot. | Read-only DB audit: 8 services, 6 upload-capable, 2 reminder-only. |
| My Invoices / invoice details | Existing `/api/my-payment-workspace` endpoint used; `DUMMY_INVOICES` removed from Order Detail and Invoice Detail. | Real project + service invoices are surfaced; no fake overdue bill. |
| Plan Detail | Snapshot-based allowance, files limit and statement display applied. | **See active issue below:** monthly allowance currently coupled to billing. |
| Vague wording pass | Payment, timeline, UPI and support client text updated. | Babel parse passed for four changed JSX files; focused old-text search blank in rendered text. |

Earlier full screen-by-screen evidence, implementation notes and rejected attempts:
[cleanui-history-2026-09.md](archive/cleanui-history-2026-09.md).

---

## 6. Active root issue — Plan Detail monthly allowance vs quarterly billing

### Real evidence (18-09-2026)

Owner screenshot ka `Starter Update Plan` order:

| Contract / stored fact | Value |
|---|---|
| Allowance promise | `1 update per_month`, up to 20 files per request |
| Selected billing | Quarterly: ₹4,335.90 every 3 months |
| Total tenure / price | 6 months / ₹8,671.80 |
| First billing window | 27 Aug 2026 – 27 Nov 2026 |
| Current plan end | 27 Feb 2027 |
| Current counter | `serviceAccessUsedInCycle: 1`, total recorded uses: 2 |

`PlanDetails.js` says `You can send again in 71 days` because it reads 27 Nov. Arithmetic is correct:
on 18 Sep, 27 Nov is 71 days away. **The business rule is wrong:** quarterly billing date has been
used as the monthly update-reset date.

Current code does **not** grant 3 uploads upfront for a quarterly purchase. It compares a count of
1 with `serviceAccessUsedInCycle`; it never multiplies by the selected 3 billing months.

There is a second related bug: first upload was recorded before initial payment settlement;
`serviceCycleSettlement` then reset the counter to zero, letting a second August upload through.
Those two uploads are an accidental reset, not an intended three-update advance allowance.

### Recommended contract rule — owner confirmation required before implementation

If product promise is truly **1 update per month**, allowance must reset monthly regardless of
monthly/quarterly/half-yearly/yearly payment selection. For this order:

- Next upload: **27 Sep 2026**
- Next payment: **27 Nov 2026** (unchanged)

If the intended product is instead one update per billing period, catalogue/purchase wording must
change. Current customer wording supports the first interpretation.

### Root-correct implementation plan — do not partially patch

1. Preserve billing SSOT: `serviceCurrentCycle*`, `serviceNextBillingDate` and billing months
   remain invoice/payment fields.
2. Add separate allowance-period state on service orders: period start/end/months and a used
   counter. Do not silently reinterpret existing `serviceAccessUsedInCycle`.
3. Build one shared allowance helper used by purchase, update submission, external-upload
   eligibility, UI and an idempotent reset job. The request path needs an atomic fallback for a
   delayed cron and simultaneous uploads.
4. Make initial paid activation safe: no pre-settlement upload bypass, and settlement must not
   erase an already-reserved allowance use.
5. Run a read-only migration preview for every existing `per_month` service before any data write.
   Owner must decide how the two historical August uploads on this order are honoured.
6. Test monthly allowance + quarterly billing, final tenure, cancelled/overdue state, delayed job,
   payment timing, concurrent uploads, and unchanged invoice dates/amounts.

---

## 7. Active screen plan — Plan Details (`/plan-details/:orderId`)

### What is missing

Desktop grid already reserves a blank right 360px column. Do **not** redesign the page; use that
empty column for client-readable **Plan details**. On mobile, place the same block after usage and
before upload history.

| Client detail | Source | Example for active order |
|---|---|---|
| Plan name | `servicePlanSnapshot.serviceName` | Starter Update Plan |
| Plan duration | `serviceTenureMonths`, start/end | 6 months · 27 Aug 2026 – 27 Feb 2027 |
| Updates included | New allowance-period rule | 1 each month · 6 total |
| Current usage / reset | New allowance counter/date | `1 of 1 used` · next update date |
| Files per update | frozen `filesLimit` | Up to 20 |
| Billing schedule | `serviceCyclePrice`, billing months | ₹4,335.90 every 3 months · 2 payments |
| Total price | service statement | ₹8,671.80 |
| Next payment | billing-only next billing date | 27 Nov 2026 |

After core fix, replace the generic payment summary with:

> ₹4,335.90 has been paid. Your next payment of ₹4,335.90 is due on 27 November 2026.

Do not render `used of total monthly updates` until historical allowance migration is approved;
current `serviceAccessUsedTotal: 2` is affected by the initial-settlement bug.

---

## 8. Current verification / next-agent checklist

### Before any new change

1. Read this file and the relevant archive section only if more detail is needed.
2. Follow value from client screen → API → order/invoice data → writer/cron.
3. Use read-only live data to prove assumptions.
4. For code changes, make a dated backup under repository root `backup/` first.
5. Get owner approval for text, behavior or data changes.

### Current pending work

| Priority | Work | Status |
|---|---|---|
| P0 | Owner confirm `per_month` allowance independent from billing period. | Pending |
| P0 | Decide historic entitlement treatment for affected current plans. | Pending |
| P1 | Implement/test root allowance separation and migration preview. | Not started |
| P2 | Add Plan details into existing blank desktop column + mobile placement. | Depends on P1 |
| P2 | Fresh browser check: due/pending/cancelled project, My Updates, My Invoices, Plan Detail. | Pending |

### Never call a screen "done" only because code parses

- Read every displayed word, including backend-generated descriptions.
- Check the server is newer than the edited files before browser validation.
- Preserve functions/CTAs while cleaning wording.
- Record only verified facts here; planned work stays marked pending.

---

## 9. Archive and maintenance

The full pre-compaction document is preserved byte-for-byte at
[archive/cleanui-history-2026-09.md](archive/cleanui-history-2026-09.md).

- Move completed, long evidence narratives to archive; retain one verified outcome here.
- When an old decision becomes incorrect, retain it in archive and mark the current rule here as
  superseding it.
- The archive's previous §7i cycle explanation is **superseded by §6** of this live document:
  billing-cycle reset is not correct for a `per_month` promise.
- Keep this file below roughly 350 lines unless a genuinely active issue requires more.
