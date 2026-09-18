# Clean UI — Admin Panel

> **Live handoff document.** Is file ko padhkar next agent bina purani chat padhe current
> decision, proof aur next action samajh sake.
>
> Shuru hua: **18-09-2026** — client panel ka kaam complete hone ke baad
> (dekho [cleanui.md](cleanui.md) — client panel ka apna doc, frozen/complete)

---

## 1. Maksad aur scope

**Admin panel par har screen ka text human-understandable aur professional ho.** Yahi do rule
client panel wale — sirf audience badal gayi hai:

1. **Human-understandable text** — koi number ya id screen ya document (PDF) par nahi rahega.
   Ye sirf software ke kaam ki cheez hai, insaan ke nahi — chahe dekhne wala admin hi kyun na ho.
   Sirf: naam, raqam, tareekh, status, method.
2. **To the point** — ek baat ek baar; system ke internal lafz (`N/A`, DB enum, "endpoint",
   "route") client jaisa hi yahan bhi customer/admin ke samajhne wale shabd banenge.

**Scope:** sirf admin panel (`/admin-panel/*`). Client panel is kaam ka hissa nahi — wo complete
hai, [cleanui.md](cleanui.md) mein frozen.

**Rule 3 wahi hai jo client panel mein thi:** sirf text/display badlega. Hisaab, permission, action
flow — in mein koi change system/contract correction hai, text-safai nahi. Bug mile to likh lo,
theek mat karo — jab tak owner na kahe.

---

## 2. Non-negotiable rules (client panel se wahi, carry-forward)

| Rule | Matlab |
|---|---|
| Zero numbers/IDs to humans | Koi bhi id, invoice number, order id, transaction reference — screen ya PDF par kahin nahi. Ye faisla owner ka hai, is poore kaam ke liye already confirm ho chuka (18-09-2026). |
| To the point | Ek baat ek baar; system/internal lafz nahi (`N/A`, raw enum, developer notes). |
| Owner approval | Text/display/code change owner ki haan ke baad hi. |
| Evidence first | Code + real data se proof; grep count ya assumption evidence nahi. |
| Scope control | Default kaam text/display hai. Billing/permission/action-flow change alag se uthega. |
| No build | `npm run build` nahi chalana. |
| Docs live | Is file ko current truth ke saath update karo. |

---

## 3. Owner decisions

| Date | Decision |
|---|---|
| 18-09-2026 | Admin panel ka naya phase shuru — client panel complete hone ke baad. |
| 18-09-2026 | **Koi bhi number/id kahin nahi rahega** — screen aur PDF dono. Sirf software ke kaam ki cheez hai, insaan ke nahi. |
| 18-09-2026 | Invoice PDF generator (`generateInvoiceDocumentPdf.js`) — client aur admin dono ke liye SINGLE generator hai. Isse chhedna dono taraf asar karega — is scope mein shamil, owner-approved. |

---

## 4. Admin panel — poora naksha (analysis, 18-09-2026)

Sidebar se 9 top-level destination, Client Workspace ke andar 8 tabs.

```
Dashboard
Leads          → Lead Detail
Clients        → Client Workspace (8 tabs) → Payment Record Detail
                                            → Project Details (admin view)
Services ▸ Plans → Add Service
Project Setup ▸ Category Base Price
               ▸ Features
Trash
```

Client Workspace ke 8 tabs: Projects · Plans · **Payments** · Deleted Projects · Documents ·
Upload Links · Account & Access · Overview.

---

## 5. Progress

| Screen | Halat | Tareekh |
|---|---|---|
| **Payments tab + sub-screen + Invoice PDF** | **done, owner confirmed "perfect"** — §6 dekho | 18-09-2026 |
| **Client Workspace baaki 7 tabs + `AdminPaymentRecordDetail.js` (standalone route)** | **done, owner confirmed "perfect"** — §6a dekho | 18-09-2026 |

---

## 6. Active work — Payments tab (Client Workspace)

Screen: Clients → Client Workspace → **Payments** tab, aur uski sub-screen (`Open payments`
click karne par), aur invoice PDF (download/share).

### Findings (code se, evidence ke saath)

**Screen 1 — Payments list** (`AdminClientWorkspace.js`, `PaymentInvoicesPanel`)

| # | Screen par | Masla |
|---|---|---|
| 1 | Header `CLIENT ID` pill — raw id | id, kaam ki nahi |
| 2 | `1 payment or invoice record` | do system-lafz jode hue |
| 3 | `15 records` chip | dohraav — har row apni ginti khud batati hai |
| 4 | `Latest activity 17/9/2026, 5:57:27 pm` | second-level waqt, over-precise |
| 5 | `Final Invoice · Fully Paid` | system-lafz `Final Invoice` |

Naam (`Ecommerce Website`, `Starter Update Plan`) pehle se sahi hain — `paymentLedger.js`
`getOrderDisplayName()` use karta hai, client side se wahi SSOT.

**Screen 2 — Sub-screen** (`PaymentOrderHistorySubpage`)

| # | Screen par | Masla |
|---|---|---|
| 1 | `Invoice INV-202609-0002` | raw invoice number |
| 2 | `Ref: 4f2a1` (`shortId()` — transactionId ke aakhri 5 ank) | id ka tukda |
| 3 | `upi` / `bank_transfer` raw | system value, `UPI` / `Bank transfer` chahiye |
| 4 | `Combined Invoice` / `Live Service Billing Statement` / `Full Project Statement` | ek hi cheez ke teen naam |
| 5 | `Payment type: One-time (Full)` / `Partial (Installments)` | client side pe `In parts`/`In full` ho chuka — yahan purana |
| 6 | Seconds wali dates (`12:00:00 am`) | over-precise |

**PDF** (`backend/helpers/generateInvoiceDocumentPdf.js`) — SSOT, client + admin dono

| # | PDF mein | Masla |
|---|---|---|
| 1 | `Invoice: {invoiceNumber}` (statement layout) | raw invoice number |
| 2 | `Invoice number: {invoiceNumber}` (invoice layout) | raw invoice number |
| 3 | `Ref: {upiTransactionId \|\| transactionId}` (payment history row) | raw id |
| 4 | Download filename `Invoice-${invoiceNumber}.pdf` (frontend) | filename bhi number se bana |

Status/dates/amount PDF mein **rahenge** — ye number nahi, insaan-samajh cheez hai.

### Verification jo abhi baaki thi (evidence-first rule)

- Live DB se `paymentMethod`/`upiTransactionId` missing hone ki asal ginti — DB script permission
  se block hua, dobara try hoga.
- Sub-screen ka live screenshot abhi tak nahi mila — §8 ka checklist ("har shabd padho") isi liye
  ab tak "verified" nahi kaha gaya, sirf "code se pakka".

### Kya nahi badlega (Rule 3)

- Payment approve/reject logic, review flow, amount ka hisaab — kuch nahi
- Backend mein invoice number **store** hona band nahi hoga — sirf display (screen + PDF text) se

### Kiya gaya (18-09-2026) — owner confirmed "perfect"

Backup: `backup/admin-cleanui-work1/` (pehla pass) aur `backup/admin-cleanui-work2/` (grouping fix).

1. **Screen 1 (Payments list)**: `CLIENT ID` pill header se hataya (poore workspace header se —
   sirf is tab tak simit nahi). Records-count chip hataya. Seconds wali dates hataayi
   (`formatDateTime()` ab din/mahina/saal + ghanta:minute deta hai). `Final Invoice` label hataya.
2. **Screen 2 (sub-screen)**: `Invoice INV-...` sab jagah se hataya. `Ref: <id-tukda>` (`shortId()`)
   hataya, dead helper bhi hataya. Raw `upi`/`bank_transfer` → `getPaymentMethodText()` (client SSOT
   `invoicePresentation.js` se reuse). `Combined Invoice`/`Live Service Billing Statement`/`Full
   Project Statement` → ek naam (`Summary` / `Total for this project` / `Total for this plan`).
   `One-time (Full)`/`Partial (Installments)` → `In full`/`In parts`. Download/Share filename
   naam-based (`{project/plan name} - {label}.pdf`), invoice number kahin nahi.
3. **PDF (`backend/helpers/generateInvoiceDocumentPdf.js`)** — client+admin dono ke SSOT generator
   mein bhi invoice number aur transaction-reference lines hataayi. Raw status → human wording
   (chhota local map, frontend `invoicePresentation.js` jaisa hi).
4. **Installment-split grouping**: ek invoice jo do payments se settle hua ho (jaise part wallet +
   part UPI) pehle do alag "3rd Installment" card dikhata tha, bina ye bataye ki dono ek hi bill ke
   tukde hain. Ab ek group-card: upar jod ka total + "paid in N parts", neeche har leg apni
   compact row mein (method, tareekh, status, raqam, apna Review button). Ek Download group-header
   par (pehle do jagah tha). Single-payment invoices bilkul pehle jaisi dikhti hain — extra nesting
   nahi. Data-source/logic nahi badla, sirf render-grouping.

**Verify**: Babel parse pass (frontend), `node --check` pass (backend). Double-counting scope nahi
hai — evidence: ek invoice ya to sab-legs-transaction-linked hota hai ya bilkul nahi, kabhi mix
nahi (`combinedFromInvoices` ka code confirm karta hai). Owner ne live screen dekh kar "perfect"
kaha.

---

## 6a. Client Workspace — baaki 7 tabs + `AdminPaymentRecordDetail.js` (18-09-2026)

Backup: `backup/admin-cleanui-work3/`.

### Step 0 — `AdminPaymentRecordDetail.js` (naya, pehle analysis mein miss ho gaya tha)

**Zaroori sabak**: ye ek **standalone route** hai
(`/admin-panel/clients/:customerId/payments/:recordType/:recordId`), workspace se link nahi hota
par URL se live hai. Pehle analysis-pass mein sirf `AdminClientWorkspace.js` ke andar dekha gaya,
`adminRoutes.js` ke saare routes dobara list nahi hue — isliye ye poori file miss ho gayi thi.
**Agla agent ke liye**: har analysis mein `adminRoutes.js` se shuru karo, kisi ek file ke andar se
nahi.

Ismein bhi wahi pattern tha jo Payments-tab mein tha: `Invoice Number` label + raw value, `Reference`
= aadha transaction id (`shortId()`), raw `paymentMethod`, teen naam ek statement ke (`Live
cumulative statement` / `Service Billing Statement` / `Final Project Invoice`), `records` chip
dohraav, developer note (`Single ledger record from the customer backend source.`), invoice-number
wale PDF filenames. Sab theek kiya — `getPaymentMethodText()` reuse, `Summary`/`Total for this
project`/`Total for this plan` pattern reuse, filename naam-based, developer note hataya.

### Step 1 — `helpers/paymentLedger.js` (SSOT fix, sabse zyada asar)

`method`/`reference` fields raw the (`transaction.paymentMethod || "N/A"`,
`upiTransactionId || shortId(...) || "N/A"`) — sirf ek jagah display ke liye use hote the
(verify kiya: `led.method`/`led.reference` sirf Project Detail ke Payments-card mein). Ab `method`
→ `getPaymentMethodText()`, `reference` field poora hataya (jaisa Payments-tab mein kiya). Isi
fix se Project/Plan Detail sub-page ka Payments-card bhi apne aap saaf ho gaya.

**Verify kiya**: Cancel-modal ka `leg.method` **alag object hai** (`cancelSplitFor()` ka apna
structure), `paymentLedger.js` se koi rishta nahi — is fix se chhua nahi gaya, alag se (Step 6).

### Step 2 — Project/Plan Detail sub-page (workspace)

`Method:`/`Reference:` labels hataye (ab sirf `{led.method}` — pehle se saaf text — aur date).
`{count} records` chip hataya. Plans-tab ka developer-handoff "Notes" block poora hataya
(*"This is the workspace subpage version for projects/plans..."*) — `notesText` prop bhi dead ho
gaya tha, poori tarah hataya (destructure + dono caller se).

### Step 3 — Overview tab

`SSOT customer data loaded from the existing backend APIs.` hataya. `Data Snapshot` → `Summary`.
Pipe-separated (`Orders: 5 | Invoices: 12 | ...`) → alag chhoti lines. `Latest customer data
loaded` hataya (sirf loading-state dikhta hai ab).

### Step 4 — Deleted Projects tab

`Paid by {method}` — `group.deletedProjectPaymentMethod` (raw snapshot field, alag source se
`paymentLedger.js`) → `getPaymentMethodText()`. `{count} payment or invoice record{s}` chip
hataya (dohraav — facts line mein already info hai).

### Step 5 — Projects/Plans list subtitle

`Auto-sorted by activity. Latest active records stay on top and completed records stay at the
end. ...` (developer-explanation) → chhota: `Active projects first. Last updated {date}.` /
`Active plans first. {N} total.`

### Step 6 — Cancel-project modal payout legs

`leg.method.replace("_", " ")` (teen jagah) → `getPaymentMethodText(leg.method)`.

**Verify**: Babel parse pass teeno files (`AdminClientWorkspace.js`, `AdminPaymentRecordDetail.js`,
`paymentLedger.js`). Grep se confirm — koi `invoiceNumber`/`shortId` display-use nahi bacha
(sirf functional conditions, jaise button dikhana ya nahi). Owner ne live screen dekh kar "perfect"
kaha (18-09-2026).

### Jaan-boojh kar chhoda (Rule 3 — system issue, text nahi)

**Plans list — `plan.currentMonthUpdatesRemaining ?? "N/A"`**: yahi legacy-vs-service-plan allowance
bug jo client panel mein tha (cleanui.md §3). Ye display ki galti nahi, **galat jagah se allowance
padhna** hai — system-correction chahiye, is text-pass mein theek nahi kiya. Jab uthega,
`servicePlanSnapshot`/order-flag se padhna hoga, catalogue field se nahi.

### Is pass mein jaan-boojh kar chhoda (scope/priority)

- **Admin-only project-management console** (checkpoint/node editor — `Add Node`, `Cumulative
  Progress`, `Reset history`, message templates): customer kabhi nahi dekhta, functional admin
  tool hai. Low priority, chhua nahi.
- **`ClientSubmissionsPanel`**: `{count} records` chip halka dohraav hai, baaki saaf — is pass mein
  nahi uthaya.
- **`AdminProjectCheckpointDetail`**: `"Unknown"` sender fallback, `Related Records`/`Node Records`
  labels — admin-console ka hissa, wahi priority-call.
- **"legacy payment record" wording** (`AdminPaymentRecordDetail.js`) — functional description,
  is pass mein nahi chhua.

---

## 7. Agla agent ke liye

**Client Workspace poora ho chuka hai** (Payments tab + baaki 7 tabs + standalone
`AdminPaymentRecordDetail.js`) — owner ne dono pass "perfect" confirm kiye (18-09-2026).

**Agla kaam** — §4 ka naksha dekho: Dashboard, Leads, Lead Detail, Clients list, Trash, Plans
(catalogue), Add Service, Category Base Price, Features, aur Project Details ka **admin branch**
(client ke saath shared file, sirf admin-only hissa chhuna) — inme se koi bhi abhi tak nahi uthaya.

- Client panel ka doc [cleanui.md](cleanui.md) padhna zaroori nahi hai kaam shuru karne ke liye,
  par usmein SSOT helpers (`invoicePresentation.js`, `orderPresentation.js`,
  `paymentLedger.js`) already bane hain — naya mat banao, wahi laao.
- **Har analysis `adminRoutes.js` se shuru karo**, kisi ek file ke andar se nahi — Payments ke
  pehle pass mein `AdminPaymentRecordDetail.js` isi wajah se miss ho gayi thi (§6a mein likha).
- Har screen ka poora render path padho, sirf grep count par faisla mat karo.
- Ek screen/page = ek step.
- **Khula system-issue**: Plans list ka `currentMonthUpdatesRemaining ?? "N/A"` — legacy-vs-
  service-plan allowance bug (client panel jaisa hi), §6a ke end mein likha. Text-pass mein
  chhuna nahi, jab uthe to alag se, evidence ke saath.
