# Clean UI — Client Panel

> Ye file ek **chal rahi working ka context** hai, to-do list nahi.
> Naye chat mein AI ise padhkar wahi se kaam uthaye jahan pichhli chat ne chhoda tha —
> na koi cheez dobara samjhe, na dobara poochhe.
>
> Shuru hua: **16-09-2026**

---

## 1. Maksad — ek line mein

**Client panel par customer ko sirf wahi dikhe jo wo samajh sakta hai.**
System jo apne liye rakhta hai — wo system ke paas rahe, screen par nahi.

---

## 2. Rule 1 — sirf human-understandable text

Customer ke saamne aisa koi data nahi aayega jiska uske liye koi matlab nahi.

**Kya cheezein is daayre mein aati hain** (soch ka daayra, poori list nahi):

- database IDs, order/record ids, reference keys
- invoice number, bill number, transaction id, batch reference
- internal status strings / enum values jaise wo DB mein likhe hain
- counters aur system numbers jo sirf backend ke hisaab ke liye hain
- technical labels jo code se uthaye gaye hain, insaan ki zubaan se nahi

**Sabse zaroori baat — exception ka faisla AI ka nahi hai.**
"Ye cheez zaroori hai isliye dikhni chahiye" — ye **sirf owner** tay karega.
AI ko jahan lage ki koi cheez shayad zaroori ho, wo **poochhega**, khud nahi rakhega.

Isi tarah ulta bhi: AI apni marzi se koi cheez hata bhi nahi dega. Har hatana bhi approval se hoga.

---

## 3. Rule 2 — to-the-point text

Jo text dikhe, wo **utna hi ho jitna kaam ka hai**.

- ek baat ek baar, do jagah nahi
- lamba samjhaane wala paragraph nahi, jahan ek line kaafi ho
- filler wording nahi ("kindly note that…", "please be informed…" type)
- label wahi jo customer bolta hai, wo nahi jo code mein likha hai

---

## 3a. Rule 3 — system ki working nahi badlegi, sirf dikhawa badlega

**(owner ki instruction, 17-09-2026 — ye rule sabse zyada tootne wala hai, dhyaan se padho)**

Is poore kaam ka daayra **text aur display** hai. Jo cheez system chalati hai — hisaab ka tareeqa,
allowance, billing ka niyam, kaunsa button kya karta hai — **usme haath nahi lagega.**

Farak samajhna zaroori hai, kyunki dono ek jaise dikhte hain:

| Ye TEXT ka kaam hai (karna hai) | Ye SYSTEM ka kaam hai (nahi karna) |
|---|---|
| page galat jagah se value padh raha hai → sahi jagah se padhwana | value ka hisaab badalna |
| DB ki enum value jaisi hai waisi chhaap dena → insaan ki zubaan mein laana | status ka matlab badalna |
| ek hi baat teen jagah likhi hai → ek jagah rakhna | koi cheez screen se hatana jo kaam karti hai |
| number page mein hardcoded hai → data se lena | wo number badal dena |

**Jo screen par kaam karta hai use hatana = system change hai, text change nahi.**
Jaise ek "Pay now" button — use hatana billing ka rasta band karna hai, safai nahi.

---

## 4. Working ke rules (in par kaam chalega)

| Rule | Matlab |
|---|---|
| **Permission pehle** | koi file edit / code change bina owner ki haan ke nahi. Faisla owner ka. |
| **Pehle samajh, phir approval, phir code** | har kaam se pehle short review → haan → tab code |
| **Evidence based** | dava sirf code padhkar. Grep ka count ya andaza sabot nahi. |
| **Clean working** | patch / quick fix nahi. Jo theek karna hai, jad se theek hoga. |
| **Poori working dekho** | ek screen alag se nahi — us cheez ka poora rasta, taaki ek jagah theek aur doosri jagah toota na rahe |
| **Jo maanga wahi** | scope se bahar apni marzi se kuchh nahi |
| **`npm run build` nahi** | owner ne mana kiya hai |
| **Docs khud maintain honge** | AI apni samajh se ye file update karta rahega, har baar poochhega nahi (owner ki instruction, 16-09-2026) |

---

## 5. Scope

**Abhi sirf client (customer) panel.** Admin panel is kaam ke daayre mein nahi hai.

Kaunsi screen se shuru hoga — ye owner batayega.

---

## 5a. System ki samajh — jo padhkar verify hua

> Yahan wahi likha hai jo **code padhkar** confirm hua. Isse agle agent ko ye khoj dobara na karni pade.
> Jo verify nahi hua wo yahan nahi hai.

### Ek plan teen tarah ka hota hai (17-09-2026)

Ye is poore kaam ki sabse zaroori baat hai. `orderProductModel` par do flag hain, aur unse tay hota
hai ki **order ka allowance kahan rakha hai**. `backend/helpers/uploadType.js` ye faisla ek jagah
karta hai — teen jawab:

| Kism | Pehchaan | Allowance kahan rehta hai |
|---|---|---|
| **service** | `isServicePlan: true` | order par jama (frozen) `servicePlanSnapshot` — catalogue par nahi |
| **project** | `isWebsiteProject: true` | koi allowance nahi — unlimited, sirf project ki halat rokti hai |
| **legacy** | dono nahi | catalogue product par (`updateCount` / `validityPeriod`) |

Live data (jab CODEBASE_MAP likha gaya): 26 order = 18 project, 8 service, **0 legacy**.
Yaani **legacy ka rasta aaj mara hua hai** — koi order us kism ka nahi.

**Isse nikla sabaq**: agar koi client screen `productId.updateCount` jaisi cheez padh rahi hai,
to wo **legacy** ka field padh rahi hai. Aaj ke kisi bhi plan par uska jawab 0 aayega.
Ye "data khaali hai" nahi hai — **galat jagah se padha ja raha hai**.

### Allowance catalogue par kyun nahi, order par kyun (17-09-2026)

Jo customer ne khareeda wo **uske order par jama ho jaata hai** (`servicePlanSnapshot`,
`orderItems[]`). Catalogue ka plan sirf ek template hai, jise admin baad mein hata bhi sakta hai.
Isliye order hamesha apne baare mein khud bata sakta hai.

**Screen ko bhi yahi tarteeb rakhni chahiye**: pehle order ka jama kiya hua sach, phir catalogue.
Ulta karne par ek hataye gaye plan ki khareed screen par khaali dikhegi.

### Invoice ki halat ke DB naam (17-09-2026)

`invoiceModel.status` ki values: `unpaid` · `partially_paid` · `paid` · `overdue` · `cancelled`.
`invoiceType` ki values: `project` · `project_final` · `plan_renewal` · `service_statement`.

**Ye code ke shabd hain, customer ke nahi.** Jahan bhi ye seedhe screen par chhap rahe hain,
wo Rule 1 ka todna hai.

---

## 6. Faisle (decisions log)

Yahan wahi aayega jo **tay ho chuka** — kya hataya jayega, kya rahega, aur kyun.
Har entry apni tareekh ke saath, taaki baad mein pata rahe ki niyam kab bana.

| Tareekh | Faisla | Wajah |
|---|---|---|
| 16-09-2026 | Kaam ke do rule tay: (1) sirf human-understandable text, (2) to-the-point text | Customer ko system ki bhasha nahi, apni bhasha dikhni chahiye |
| 16-09-2026 | "Ye zaroori hai" ka faisla sirf owner ka — AI khud tay nahi karega | AI ka andaza customer ki zaroorat ka paimana nahi hai |
| 16-09-2026 | Ye file banayi gayi, context carry-over ke liye | Har nayi chat mein kaam zero se shuru na ho |
| 17-09-2026 | AI ye file apni samajh se update karta rahega, poochhe bina | Taaki agla agent ise padhkar kaam aage badha sake, dobara samjhe bina |
| 17-09-2026 | **Rule 3**: sirf text/display badlega, system ki working nahi — §3a | Owner ne saaf kaha: "system ki working mein koi changes nahi kiye jayenge" |
| 17-09-2026 | Pehli screen: **Plan Detail page** (`/plan-details/:orderId`) | Dashboard aur Projects-and-Plans saaf hain, Project Detail bhi saaf hai — sirf ye page pichhe reh gaya |
| 17-09-2026 | Donut **cycle ka hisaab** dikhayega, poore plan ka nahi | Plan ka allowance khud cycle-based hai (mahine mein 1), aur badge pehle se "Cycle limit used" kehta hai. Poore plan ka cumulative system kahin rakhta hi nahi — usse dikhana naya hisaab banana hota (Rule 3 ka todna) |
| 17-09-2026 | **System ke kaam roke gaye** — pehle poore client panel ki text-safai, uske baad system (§7c) | Text-safai ka kaam system ki marammat mein badal gaya tha. Owner: "yeh to main working se bahut bahar ho gaya... ab hum sirf extra text hatayenge bina system correction ke" |
| 17-09-2026 | Code padhte hue bug mile to **likh lo, theek mat karo** | Warna na safai poori hoti hai na marammat, aur saaf honi wali screen aur der se saaf hoti hai |
| 17-09-2026 | System ka kaam **ek-ek karke**, har kadam ke baad alag verification | Owner: "sabse pehle kisi ek kaam ko karte hain tan jo regression na aye" |
| 17-09-2026 | Kism ka faisla: **order ka apna flag pehle, catalogue sirf sahara** — dono helper mein | Order contract hai, catalogue template. 5 live orders ka catalogue hata diya gaya hai, phir bhi wo plan hain |
| 17-09-2026 | Frontend par teen-jawab wala naya kind-helper **nahi** banaya | Live data par nateeja bilkul wahi (0 orders par farak), par 8 call site chhuta. `ProjectsAndPlans` ke do tab hain — wahan do sawal chahiye hi |
| 17-09-2026 | "Agla cycle aayega ya nahi" ka jawab **cron ke niyam se** aayega, apna andaza nahi (§7i) | Screen aur cron ek hi baat kahen. Purani line 8 mein se 4 par jhooth thi |
| 17-09-2026 | Waqt **tareekh se nahi, bache hue waqt se** batao — din, aur 1 din se kam ho to ghante | Owner: "yeh over text hai". Tareekh "kab" batati hai, "kitni der" nahi |
| 17-09-2026 | Plan ka ant **mahine + din** mein, aur label `Plan expires in` — `Days left` nahi | Cycle aur plan ka ant do alag baatein hain; ek jaisa label dono ko gaddmadd karta tha |
| 17-09-2026 | Plan ka **jodd** (statement) list se nikalkar heading banega, uske hisse neeche (§7j) | Jodd aur uska hissa ek jaisi row mein do alag kharche lagte the — ₹2,980 ka plan ₹4,470 dikhta tha |
| 17-09-2026 | Statement ka remainder **baqaya nahi** — wo aksar bill hi nahi hua hota (§7j) | Naapa: har plan par issued bills ka baqaya ₹0, aur remainder theek utna jitne cycles ka bill nahi bana |
| 17-09-2026 | Billing section **rahega**, sirf shakal badlegi | Is page se customer payment kar sakta hai ("Pay now"). Use hatana chalta hua rasta band karna hai = system change. Paid bill dikhna bhi kaam ka hai — customer ko dikhe paisa pahunch gaya |
| 17-09-2026 | Projects and Plans ka approved subtitle: **`See the progress and details of your projects and plans.`** | "In one place" generic/ad jaisa laga; ye line seedhe customer ko page ka kaam batati hai |

---

## 7. Kahan tak pahunche (progress)

| Screen | Halat | Tareekh |
|---|---|---|
| Dashboard | saaf — owner ne confirm kiya | 17-09-2026 |
| Projects and Plans | saaf — owner ne confirm kiya | 17-09-2026 |
| Project Detail | saaf — owner ne confirm kiya | 17-09-2026 |
| **Plan Detail** (`pages/PlanDetails.js`) | **kaam ho gaya** — §7b dekho. Owner ki nazar se guzarna baaki | 17-09-2026 |
| **Orders** (`pages/OrderPage.js`) | **kaam ho gaya** — §7d. Category aur nakli invoice chhode gaye (§7c) | 17-09-2026 |
| **Order Detail** (`pages/OrderDetailPage.js`) | **kaam ho gaya** — §7d. Category aur nakli invoice chhode gaye (§7c) | 17-09-2026 |
| **Wallet** (`pages/WalletDetails.js`) | **kaam ho gaya** — §7e. Recharge ka modal isi page ke andar hai | 17-09-2026 |
| **My Invoices** (`pages/UserInvoices.js`) | text ho gaya (§7g) — **par page ki API backend mein nahi hai**, so khaali khulega | 17-09-2026 |
| **Invoice Detail** (`pages/InvoiceDetailPage.js`) | **kaam ho gaya** — §7g. Nakli invoice chhoda (§7c) | 17-09-2026 |
| **Installment Payment** | **kaam ho gaya** — §7g | 17-09-2026 |
| **Direct Payment** | **kaam ho gaya** — §7g. Aaj reachable nahi (0 rejected orders) | 17-09-2026 |
| **Website Customize** (`StartNewWebsiteCustomize.js`) | sirf Transaction ID hatayi (§7g). Baaki page scan mein saaf tha | 17-09-2026 |
| **Dashboard + Projects and Plans** ki rows | service plan ab plan ki tarah, asli allowance ke saath (§7h). Category baaki | 17-09-2026 |

---

## 7a. Plan Detail page — kya galat hai (17-09-2026)

Screen: `/plan-details/:orderId` · file: `pages/PlanDetails.js` (564 lines)
Owner ke screenshot + code padhkar nikala gaya. **Abhi tak sirf findings — koi code nahi badla.**

### A. Page galat jagah se padh raha hai (asli jad)

Page ka counter aur snapshot **legacy** ka field padhte hain (`product.updateCount`,
`plan.updatesUsed`) — jabki khula hua order ek **service plan** hai, jiska allowance
`servicePlanSnapshot.portalAccessCount` par hai (§5a dekho).

Natija screen par: `0 / 0 Updates Used` aur `Total updates granted — 0`, jabki plan ki apni
description kehti hai "1 website update per month".

**Mazedaar baat**: usi file ka `getPlanVisualStatus()` **sahi jagah se padhta hai** — wo
snapshot dekhta hai, isliye badge sahi aata hai (`Cycle limit used`). Yaani ek hi file mein do
alag raste hain, aur screen par teen cheezein teen alag kahani keh rahi hain:

| Screen par | Kya kehta hai | Kahan se padha |
|---|---|---|
| Badge | `Cycle limit used` | snapshot — **sahi** |
| Donut | `0 / 0` | legacy field — **galat** |
| Neeche ki line | `All updates used. Purchase a new plan.` | legacy ka faisla — **galat** |

Ye display ki galti hai, hisaab ki nahi — isliye Rule 3 ke andar hai.

### B. System ke shabd seedhe screen par

| Screen par dikhta hai | Kya hai |
|---|---|
| `INV-202609-0005`, `INV-202609-0004` | invoice number — system ka reference |
| `partially_paid`, `paid` | `invoiceModel.status` ki DB value, jaisi ki waisi |
| `Cycle 1 invoice` | "cycle" system ka concept hai |
| `Live Billing Statement` | `invoiceType: service_statement` ka technical naam |
| `service plan` (heading ke neeche) | category ka DB naam (`service_plan`), underscore hata kar |

### C. Ek line mein saara data thoos diya gaya

Billing line ka dhaancha: `naam · invoice number · ₹raqam · status` — ye **log line hai, UI nahi**.
Chaar cheezein dot se joddi hui, ek line mein.

### D. Ek hi baat kai jagah

- `Uploaded Data` (eyebrow) + `Everything you have sent on this plan` (heading) + `1 request`
  (counter) — teen jagah ek hi baat
- Donut khud `0 / 0` kehta hai, aur neeche `Total updates granted` phir wahi

### E. Number data se nahi, page se aa raha hai

`File limit per request — Up to 20 files, 5MB each` — ye `PlanDetails.js` mein **likha hua**
hai, plan se nahi aata. Plan ke snapshot mein `filesLimit` maujood hai.

### F. Heading jiske neeche uska kaam nahi

`Service controls` — uske neeche koi control nahi hai, sirf plan ki description hai.

### G. Waqt zaroorat se zyada baareek

Upload ki row par `11 Sept 2026, 14:42` — minute-level waqt customer ke kis kaam ka.
**Dhyaan do**: ye `PlanDetails.js` ka nahi, `components/UploadedDataList.js` ka hai — aur wo
component **char jagah** render hota hai: ye page, project page, My Updates page, aur
**admin workspace**. Yahan haath lagane se admin bhi badlega — §5 ka scope todega.

---

## 7b. Plan Detail — kya kiya gaya (17-09-2026)

Backup: `frontend/src/_backup_cleanui_work1/` (PlanDetails · InvoiceDetailPage · OrderDetailPage).
Har file Babel se compile hui. **`npm run build` nahi chalaya.**

### Naya: invoice ki zubaan ka SSOT

`frontend/src/helpers/invoicePresentation.js` — **naya**. Ab yahi tay karta hai ki invoice ka
status aur uska maqsad customer ko kin shabdon mein dikhega.

Kyun banaya: teen client page, teen alag bartav — `InvoiceDetailPage` aur `OrderDetailPage` dono
apni-apni copy rakhte the (ek "Full Invoice" kehta tha, doosra kuch aur), aur `PlanDetails` ke paas
koi nahi thi, isliye wo **DB ki value seedhi chhaap raha tha**. Teeno ab isi ek file se padhte hain.

| Screen par pehle | Ab |
|---|---|
| `partially_paid` | Part paid |
| `paid` / `unpaid` / `overdue` | Paid / Due / Overdue |
| `Live Billing Statement` | Summary |
| `Cycle 1 invoice` | plan ka apna naam + "plan" |

Isme ek hi rule bhi aa gaya jo dono page alag-alag likhte the: **statement kabhi "Due" ka badge
nahi pehnta** — warna customer ko lagta hai ek aur bada bill bacha hua hai.

### `PlanDetails.js` — kya badla

| # | Kya tha | Ab kya hai |
|---|---|---|
| A | Counter legacy field se padhta tha → `0 / 0` | Order ke jama kiye hue sach se — jo bacha hai wo bada, total chhota. Unlimited/reminder par "No limit" / "Reminders only" (pehle wo bhi `0/0` dikhta tha, jo "kuch nahi mila" padha jaata) |
| B | Billing ki ek run-on line: naam · invoice number · ₹ · DB status | Har bill ek line: **raqam** bada, neeche wo kis cheez ka hai, saath mein halat ka badge aur action |
| C | Heading "Service controls" jiske neeche control nahi tha | Heading hata di, plan ki baat seedhi |
| D | `File limit per request — Up to 20 files, 5MB each` (page mein likha hua) | Plan ke apne `filesLimit` se — "Files you can send at once". Na ho to line hi nahi |
| E | "Total updates granted" — donut ki baat dobara | Hata diya |
| F | Heading ke neeche `service plan` (DB category) | Hata diya. Project se juda ho to "Attached to your project" |
| G | `Uploaded Data` + heading + counter (teen jagah ek baat) | Ek heading: "What you have sent" + ginti |
| H | "All updates used. Purchase a new plan." | Service plan ke liye galat tha — uska allowance har cycle wapas aata hai. Ab: "You have used this cycle's updates. More on {date}." |
| I | Mobile par "Plan Status" + badge (upar wale badge ki naqal) | Plan ka naam |
| J | Mobile ki "Requests" tile — neeche ki ginti ki naqal | "Files at once" |
| K | Mobile par bina expiry wale plan par `null days` | "As long as you need" |

**Sab kuch Rule 3 ke andar**: kahin hisaab nahi badla, koi chalta hua rasta band nahi hua.
"Pay now" jahan tha wahin hai. Sirf ye badla ki page **kis khaane se padhta hai** aur
**kin shabdon mein bolta hai**.

### Saath mein do page chhue gaye

`InvoiceDetailPage.js` aur `OrderDetailPage.js` — inki apni status-copy hata kar naye helper par
laye gaye. Inki shakal nahi badli, sirf wording ka source badla. Ye Plan Detail ke saath isliye
kiya kyunki ek hi status do screen par do naam se nahi bolna chahiye.

### Ek cheez jaan-boojh kar chhodi

`PlanDetails.js` mein chaar cheezein bekaar padi hain — `List` aur `X` ke import,
`formatDateTime`, aur `timelineExpanded` state. **Backup se milaya: ye pehle se aise hi the**,
mere kaam se nahi bane. Scope se bahar, isliye haath nahi lagaya.

---

## 7d. Orders + Order Detail — kya kiya gaya (17-09-2026)

Backup: `frontend/src/_backup_cleanui_work2/`. Dono Babel se compile. **`npm run build` nahi chalaya.**
**Sirf text** — na koi hisaab, na koi rasta, na koi button chhua.

### Orders (`/order`)

| Kya tha | Ab | Kyun |
|---|---|---|
| Type do baar — naam ke upar badge, aur apna column | sirf column | ek hi shabd ek row mein do jagah |
| `Project purchase` / `Plan purchase` (Type ke neeche) | hata | "Project" ka matlab "Project purchase" batana — shabd ko khud se samjhana |
| `Purchased on` (tareekh ke neeche) | hata | column ka heading hi "Purchased" hai |
| `Price` (daam ke neeche) | hata | column ka heading hi "Price" hai |
| subtitle: *"Clean order records with price, purchase date, type, and current status. Detail pages stay unchanged."* | "Everything you have bought, and where each one stands." | ye banane wale ka note tha — table ke column ginwata tha, aur "Detail pages stay unchanged" development ki halat hai |
| `Total: 7` chip | hata | tab pehle se `All orders (7)` keh raha hai |

**Usool jo yahan bana**: column ka heading hi labelling ka kaam karta hai — row ke andar naam
dobara nahi likha jayega.

### Order Detail (`/order-detail/:orderId`)

| Kya tha | Ab | Kyun |
|---|---|---|
| `Plan Snapshot` | `Your plan` | "Snapshot" system ka apna lafz hai |
| `Invoice History` | `Your bills` | wahi baat, customer ke shabd mein |
| `Started 12 Jun 2026 · Installments (3) · Total ₹45,000` | `₹45,000 in total, paid in parts. Started 12 Jun 2026.` | teen baatein dot se juddi = log line. Aur "(3)" neeche chhapi list ki ginti dobara thi |
| `Verification Pending` | `Checking your payment` | customer ke liye system ki qatar ka naam bemaani hai |
| `Installments (3)` / `Full Payment` | `In parts` / `In full` | "Payment Method" poochhta hai kaise diya, kitne tukde nahi |
| label `Payment Method` | `How you paid` | wahi |
| invoice row par `INV-202604-0001` | bill kis cheez ka hai | number se customer ko kuch nahi milta |
| `Complete project invoice · download available` | `Everything charged on this order` | row khud document kholti hai — uska ailaan karne ki zaroorat nahi |

Invoice ka maqsad wale shabd `helpers/invoicePresentation.js` se aate hain — wahi jo Plan Detail
use karta hai, taaki ek hi bill do page par do naam se na bole.

### Jaan-boojh kar chhoda (dono page par)

- **Category** (`standard websites`) — text ka kaam hai, par uska saaf jawab §7c se juda hai
  (mapping pehle se maujood hai, aur 5 orders par category hai hi nahi → "Unknown type").
  Abhi badalte to portal par do zubaanein ho jatin.
- **Nakli invoice** (`DUMMY_INVOICES`) — text nahi, jhoothi jaankari hai, aur uski ek shaakh asli
  payment ke code ke andar hai. §7c ke saath jayega.

---

## 7e. Wallet — kya kiya gaya (17-09-2026)

Backup: `frontend/src/_backup_cleanui_work3/`. Babel se compile. **Sirf text.**

**Wallet ka ek hi page hai** — `/wallet` (`pages/WalletDetails.js`). Recharge ka koi alag page
nahi; wo isi page ke andar modal hai. (`components/WalletRecharge.js` **delete ho chuka hai**,
CODEBASE_MAP §14a mein darj — use dhoondhna mat.)

### System ke reference jo hataye

| Kya tha | Kahan | Kyun |
|---|---|---|
| `Transaction ID: TXN1726...` | QR ke neeche | page ka banaya hua reference. Customer na likhta hai na bolta hai — **wo ab bhi backend ko jaata hai**, sirf chhapna band hua |
| `UPI ref: 4821` | har row par, tareekh ke saath | reference ke **aakhri 4 ank** — aadha reference kisi kaam ka nahi |

### System ke shabd jo customer ki zubaan mein aaye

| Pehle | Ab |
|---|---|
| filter `credit` / `debit` | Money in / Money out |
| `Approved` / `Pending` (row ka badge) | Done / Being checked |
| `Payment approval` (card) | Your payments to us |
| `Approved` / `Waiting` (ginti) | Cleared / Being checked |
| `Pending approval` (tile) | Being checked |
| `Transaction history` | Your money |
| "Your deposits, payments and refunds in one place" | "Everything that came in and went out" |
| `Submit for approval` | Send for checking |
| "Request submitted / waiting for admin approval / update after verification" | "We have your payment. We are checking it now. Your balance will go up once it clears." |
| "Please enter a valid UPI transaction ID" | "That does not look like a valid payment reference" |

### Dohraav jo hataya

| Kya tha | Kyun |
|---|---|
| `Processing fee ₹0` + `Total` (recharge form) | teen line, ek hi number, aur beech mein ek fees jo hai hi nahi → ek line: "No fees — the full amount goes into your wallet" |
| `Payment mode` caption (mobile) | seedhe "UPI" ke upar baitha tha, jo apna naam khud hai |
| "Keep your balance ready for your next project" | neeche "Use your wallet balance for..." wahi baat dobara keh raha tha |
| `3 pending` badge | wahi ginti card ke andar teesri row mein bhi thi, aur upar tile par bhi |

### Sabse bada kaam — row ab batati hai paisa KIS cheez ka tha

**Ye pehli baar mein chhoot gaya tha.** Maine row ka waqt, reference aur status to saaf kar diya,
par **row ka title padha hi nahi.** Owner ne SS bhej kar pakda: `Payment (wallet) for invoice
INV-202609-0002`.

**Jo screen par tha (live data, 29 rows mein se 9):**
```
Payment (wallet) for invoice INV-202609-0002
Installment 1 (wallet) for order 6a952b7464002ecd93fc6743     <- kachchi database id
Payment (wallet) for service plan order 6a833dd4ff3d86b1e19e7a1b
First installment (wallet) for custom project order 6a82953c1892c07beca82790
```

**Wajah do hisson mein thi:**

1. **Backend aadha data bhejta tha.** `getWalletHistory.js` order ko saath laata tha par usme se
   sirf `productId` uthata tha. Order apna naam **chaar jagah** rakhta hai (§5a) — baaki teen
   (`projectSnapshot`, `servicePlanSnapshot`, `orderItems`) maange hi nahi jaate the. Jis order ka
   catalogue product hata diya gaya ho ya kabhi tha hi nahi (custom project, service plan), uska
   naam khaali aata tha.
2. **Frontend haar kar `transaction.description` chhaap deta tha** — wo line payment ke waqt
   **log ke liye** likhi jaati hai, customer ke liye nahi. **7 alag payment raste** apni-apni line
   likhte hain (`walletPayInstant.js`, `customerCreateCustomProjectOrder.js`,
   `customerCreateServicePlanOrder.js`, `payInstallment.js`, `createRenewalOrder.js` …) — isiliye
   kabhi invoice number aata tha, kabhi seedhi id.

**Theek kya kiya** — donon jagah, jad se:
- `getWalletHistory.js` ab order ke naam wale saare khaane bhejta hai
- `WalletDetails.js` ab `description` **kahin nahi** chhapta. Naam na mile to saaf "Payment"

**Naap kar verify kiya (live data, 29 rows)** — grep se nahi:

| Pehle | Ab |
|---|---|
| `Payment (wallet) for invoice INV-202609-0002` | `Portfolio Website` |
| `Installment 1 (wallet) for order 6a952b74...` | `College Website · 1st payment` |
| `Installment 3 (wallet) for order 6a903b92...` | `Ecommerce Website · 3rd payment` |
| `Payment (wallet) for service plan order 6a833d...` | `Website Update` |
| `Wallet recharge` | `Money added to wallet` |
| `Refund received` | `Refund for College Website` |

**Nateeja: 29/29 saaf. Ek bhi id, invoice number ya raw description nahi bacha. Ek bhi row bina
naam ke nahi rahi.**

**Kist ka number rakha gaya** — `1st payment` / `2nd payment`. Customer ek project kiston mein de
raha hai; kaunsi kist thi, ye uske kaam ki baat hai. Sirf `Installment #1` wala system ka lafz gaya.

**Search se bhi `description` hataya** — warna customer invoice number type karke wo row paa leta
jiski screen par wo likha hi nahi hai.

### Ek backend file chhui gayi — kyun, aur ye §7c se alag kyun hai

`backend/controller/user/getWalletHistory.js` (backup: `backend/_backup_cleanui_work4/`).

Rule 3 kehta hai system nahi badlega. **Yahan system badla bhi nahi** — na hisaab, na koi niyam,
na koi rasta. Sirf ek `select` mein teen khaane jode gaye, jo **pehle se order par likhe the**.

**§7c se farak**: wahan **hisaab galat** aa raha hai (0 of 0), theek karne ko row ka faisla badalna
padega. Yahan **naam maujood hai, bas maanga nahi ja raha tha** — aur uske bina invoice number ki
jagah kuch bhi nahi aa sakta tha, kyunki naam page tak pahunchta hi nahi.

### Jaan-boojh kar chhoda

- **`getTotalSpending()` / `getTotalAdded()`** — ye transaction ke `type` se hisaab lagate hain.
  **Hisaab hai, text nahi.** Agar kabhi galat lage to §7c ke saath dekhna.
- **Greeting** ("Good evening, Gaurav") — ye extra hai ya nahi, ye **design ka faisla** hai,
  safai ka nahi. Owner tay karega.

---

## 7g. §7f ke findings — verify karke kaam kiya (17-09-2026)

Backup: `frontend/src/_backup_cleanui_work5/`. Sab Babel se compile.
**Kaam se PEHLE har finding live data par verify kiya** — do galat nikle, ek ki priority giri.

### Verification ne kya badla

| Finding | Live data ne kya kaha |
|---|---|
| `ProjectServiceWorkspace` ka raw status | **GALAT alarm.** Live values sirf `active`/`paused`/`expired` — teeno handle hain, fallback kabhi chalta hi nahi. **Kaam nahi kiya.** |
| `TicketDetail` ka "No user ID or ticket ID available" | **GALAT alarm.** Ye `console.log` hai, screen par nahi. Page ke baaki saare message theek hain. **Kaam nahi kiya.** |
| `DirectPayment` ke 12+ jagah | **0 orders `payment-rejected` halat mein** — page aaj koi khol nahi sakta. Phir bhi kiya, kyunki owner ne "sabhi karo" kaha |

### Transaction ID — **chaar** jagah thi, teen nahi

Scan mein maine teen dhoondhi thin. Kaam ke baad ke sweep mein **chauthi** mili:
`WalletDetails` (§7e mein) · `InstallmentPayment` · `DirectPayment` · **`StartNewWebsiteCustomize`**

Chaaron par wahi line thi: `Transaction ID: {transactionId}`. **Id ab bhi backend ko jaati hai
aur UPI link ke andar bhi hai** — sirf chhapna band hua.

**Sabaq**: ek cheez ek jagah milne par maan lena ki bas wahi hai — galat hai. Payment ka UI
**9 files mein copy** hai (CODEBASE_MAP §6). Kuch bhi payment se juda mile to **saari copies**
mein dhoondho.

### Invoice number — heading par baitha tha

`InvoiceDetailPage` ka **poora heading** invoice number tha, aur us cheez ka naam jiske liye bill
hai wo neeche chhoti line mein. **Ulta tha** — number system pehchanta hai, naam customer.
Ab naam heading hai, number gaya. Payment dialog ke title se bhi gaya (`Pay Invoice INV-...`).

### `UserInvoices` (`/my-invoices`)

| Kya tha | Ab |
|---|---|
| heading par `INV-202609-0005` | bill kis cheez ka hai |
| `partially_paid` badge (9 invoices par) | Part paid |
| `Plan: N/A` | line hi hata di — `N/A` system ka khaali hai |
| `Billing Period` / `Invoice Date` / `Due Date` / `Paid On` | Covers / Sent / Pay by / Paid |
| `⚠️ OVERDUE` (caps + emoji) | `Past due` — portal ka koi badge chillata nahi |
| toast: "Payment feature will be available soon!" | "Paying from here is not ready yet — open the bill to pay it." |

> **Dhyaan do**: ye page `GET /api/my-invoices` maangta hai jo **backend mein registered nahi
> hai** (CODEBASE_MAP §14). Yaani text theek hone ke baad bhi page khaali khulega jab tak wo
> route na bane. Route banana **backend ka kaam** hai → §7c.
> Page **reachable hai** — `UserUpdateDashboard` se link jaata hai.

### `DirectPayment`

Screen par jaane wale 9 message badle. **`console.log` waale chhode** — wo debug ke liye hain,
customer unhe dekhta hi nahi.

| Kya tha | Ab |
|---|---|
| "after admin approval", "verification submitted" | "We have your payment... starts once it clears" |
| `Installment Information` | `Paying in parts` |
| `Current Installment: #2 (30%)` | `This payment — 2nd` |
| `Remaining Installments` | `Still to pay` |
| `Submit for Verification` | `Send for checking` |

**Ek asli bug bhi nikla**: `(30%)` **page mein likha hua** tha. Live orders par 30, 40 **aur 50**
teeno hain — yaani zyadatar par **galat number** chhap raha tha. Ab share dikhta hi nahi; raqam
neeche likhi hai, wahi asli baat hai.

### `InvoiceDetailPage` — `bank_transfer`

`{invoice.paymentMethod}` `capitalize` ke saath chhap raha tha → `Bank_transfer`.
Live values: `upi` · `wallet` · `cash` · `bank_transfer`.

### Helper mein teen cheezein aur aayin

`helpers/invoicePresentation.js` ab ye bhi rakhta hai:
- `getPaymentMethodText()` — WalletDetails ke paas apna adhoora map tha (sirf 3 entry, `cash` aur
  `bank_transfer` ka koi jawab nahi). Ab ek jagah, dono page use karte hain
- `getInstallmentPartText()` — `1st`/`2nd`/`3rd`. WalletDetails aur DirectPayment dono se

### Verify kiya (sweep, saare 22 client pages par)

- `Transaction ID: {...}` — **0**
- screen par `{invoice.invoiceNumber}` — **0**
- screen par raw `{x.status}` / `{x.paymentMethod}` — **0**

(Admin pages mein invoice number abhi bhi hai — wo scope mein nahi.)

---

## 7f. Poore client panel ka scan — kya baaki hai (17-09-2026)

24 customer pages (`routes/customerRoutes.js` se) chaar nazar se scan kiye: kachchi id,
DB ke enum shabd, system ke reference, aur system ki zubaan. **Ye sirf findings hain — inme se
kisi par abhi kaam nahi hua.** Har entry par likha hai kis file mein hai.

### Darja 1 — system ka reference customer ke saamne

| # | Kahan | Kya dikhta hai |
|---|---|---|
| 1 | `pages/UserInvoices.js:149` | `invoice.invoiceNumber` seedha — `INV-202609-0005` |
| 2 | `pages/UserInvoices.js:152` | `invoice.status` seedhi DB value — `partially_paid` |
| 3 | `pages/DirectPayment.js:802` | `Transaction ID: {transactionId}` — wahi jo Wallet se hataya |
| 4 | `pages/InstallmentPayment.js:481` | `Transaction ID: {transactionId}` — wahi cheez, teesri jagah |
| 5 | `pages/InvoiceDetailPage.js:335` | `{invoice.paymentMethod}` seedha — `upi` / `combined` |

**#1 aur #2 ka jawab pehle se bana hua hai** — `helpers/invoicePresentation.js` (§7b mein banaya).
`UserInvoices.js` use use nahi karta. **Lekin dhyaan do**: ye page `GET /api/my-invoices` maangta
hai jo **backend mein registered hi nahi hai** (CODEBASE_MAP §14) — yaani page aaj toota hua hai.
Text theek karne se pehle ye jaan lo.

**#3 aur #4 Wallet wali hi cheez hain.** Teen payment surface, teeno apni copy rakhte hain
(CODEBASE_MAP §6: "payment logic + modal markup 9 files mein copy hai"). Wallet par hataya,
baaki do par baaki hai.

### Darja 2 — system ki zubaan

| # | Kahan | Kya |
|---|---|---|
| 6 | `pages/DirectPayment.js` | "admin approval" / "verification" **12+ jagah** — poora page isi zubaan mein hai |
| 7 | `pages/DirectPayment.js:547,565` | `Installment Information`, `Installment #2 (30%)` |
| 8 | `pages/TicketDetail.js` | "No user ID or ticket ID available" — developer ka error customer ko |
| 9 | `components/ProjectServiceWorkspace.js:23` | anjaan status par `status.replace(/_/g,' ')` — DB value chhap jayegi |

**#9 ka khatra kam hai** — sirf tab chalta hai jab status un 5 mein se koi na ho. Par jis din
naya status banega, us din DB ka shabd screen par aa jayega.

### Darja 3 — pehle se darj, yahan dobara nahi

- **Category** (`standard websites`) — 4 live jagah: `OrderPage:130`, `OrderDetailPage:226`,
  `ProjectDetails:896`, `OrderListRow:63`. §7c/§8 mein pehle se.
- **Nakli invoice** (`DUMMY_INVOICES`) — `OrderDetailPage:63`, `InvoiceDetailPage:40`. §7c mein.
- **Upload ka waqt** (`14:42`) — `UploadedDataList.js`, admin ke saath share. §7a-G.

### Jin pages par is nazar se kuch nahi mila

`CustomerDocuments` · `ContactSupport` · `Profile` · `SetNewPassword` · `CompleteProfile` ·
`StartNewProject` · `StartNewProjectDetail` · `StartNewWebsiteBuild` · `StartNewWebsiteCustomize` ·
`UserUpdateDashboard` · `startproject`

**Iska matlab "poori tarah saaf" nahi** — matlab itna hai ki **is chaar-nazar ke scan** mein kuch
nahi aaya. Wallet ka sabak yaad rakho: wahan bhi grep saaf tha, par row ka title backend ke
`description` se aa raha tha. **Jo text data se aata hai, wo file mein nahi dikhta.**

---

## 7j. Payments section — jodd aur uske hisse alag (17-09-2026)

Backup: `frontend/src/_backup_cleanui_work8/`. Compile pass.

### Jo galat tha (owner ka SS)

Order par do invoice the, aur dono **ek hi list mein, ek hi shakal mein**:

| Row | Asal mein kya hai |
|---|---|
| ₹2,980 · "Total for this plan" · `Summary` | **poore plan ka hisaab** (`service_statement`) |
| ₹1,490 · "Starter Update Plan plan" · `Paid` | **ek asli bill** (pehle cycle ka) |

Ek **jodd** hai, doosra **uska hissa** — par ek jaise dikhne se do alag kharche lagte the.
**Rows jodd kar ₹4,470 bante the, jabki plan ₹2,980 ka hai.** (2 plans par aisa tha.)

Teen aur kharabiyan usi block mein:
- `Starter Update Plan plan` — "plan" do baar (naam mein pehle se tha, helper ne phir joda)
- `Total for this plan` likha tha par **sirf total** — kitna aaya, kitna baaki, dono gayab
- `Summary` us jagah baitha tha jahan neeche wali row par `Paid` hai — halat ki jagah, par halat nahi

### Pehla try — aur wo bhi reject hua (owner: "ui pasand nahi aya")

Maine statement ko heading bana diya aur bills ko list. Double-count to khatam ho gaya, **par UI
ab bhi galat tha**: paanch line ek ke neeche ek, poori chaudai ke band par, **dayan aadha page
khaali**, aur wahi raqam do baar — header mein `₹1,490 paid`, neeche row mein `₹1,490 · Paid`.

### Naapkar dekha, phir banaya

Design se pehle live data se apne hi daawe jaanche:

| Daawa | Jawab |
|---|---|
| "ek row ke liye list bekaar hai" | **sach** — kisi bhi plan par do bill nahi. 5 par ek, 3 par koi nahi. List **kabhi** kaam ki nahi thi |
| "ek hi raqam do baar chhapti hai" | **sach** — dono statement wale plans par |
| "baqaya asli khabar hai" | **sach** — dono par paisa baaki hai (₹1,490 aur ₹4,335.9) |
| "Pay now dikhega" | **GALAT** — ek bhi bill payable nahi, sab paid. Baqaya **statement** par hai |

Aur ek shakal nikli jo maine ginii hi nahi thi: **3 plans par koi invoice hi nahi** — wahan poora
block gayab.

### Ab kya hai — ek line

| Plan ki halat | Line |
|---|---|
| tenure bacha hai | **₹1,490 paid** of ₹2,980 for this plan. The rest is billed as the plan runs — next on 11 Oct 2026. |
| sab de diya | **₹2,500** for this plan — paid. |
| koi invoice nahi | kuch nahi (block render hi nahi hota) |

### Wording ek baar GALAT thi — owner ne pakdi

Pehli line thi: *"₹1,490 still to pay of ₹2,980 for this plan. Your next bill covers it."*
Owner: *"kya yeh line logically sahi hai?"* — **nahi thi.**

Naapkar dekha (live data, saare service plans):

| Cheez | Sach |
|---|---|
| Issued bills par baqaya | **₹0** — har plan par |
| Statement ka remainder | **theek utna jitne cycles ka abhi bill bana hi nahi** |
| Customer payment se peeche hai? | **NAHI**, ek bhi plan par |

**Do galtiyan ek line mein:**

1. **"still to pay"** — matlab customer ne paisa roka hua hai. Sach: usne jo bill mila **poora
   diya**. Baaki raqam ka **bill hi nahi bana** — wo 11 Oct ko banega. Ye baqaya nahi,
   **aage aane wala kharcha** hai.
2. **"Your next bill covers it"** — kehta hai agla bill us raqam ko cover karega. Sach: agla bill
   **wahi raqam hoga**. Cover karne wali koi alag cheez hai hi nahi.

**Ab line diye hue se shuru hoti hai**, aur baaki ko aane wala kharcha bataati hai — tareekh ke
saath (wo tareekh `servicePlanCycle.js` se aati hai, §7i wala hi jawab).

**Sabaq**: `partially_paid` DB mein **sahi** hai — plan ₹2,980 ka hai aur ₹1,490 aaya. System ka
hisaab theek tha. Galti sirf ye maan lene mein thi ki "kam aaya = baqaya". **Jo statement par
bacha hai wo aksar bill hi nahi hua hota.**

Daayein ek button: **Payment details**.

**16 line se 5 line** — aur har raqam ek hi baar.

### Teen faisle jo naapne se aaye

1. **List nahi banayi** — kyunki data kehta hai wo kabhi nahi bharegi. Heading over one row furniture hai
2. **`Pay now` nahi lagaya** — `InvoiceDetailPage:354` statement par payment jaan-boojh kar chhupata
   hai (statement collectable nahi, agla cycle ka bill hota hai). Button lagata to customer aise page
   par pahunchta jahan dene ko kuch nahi. Isliye likha: *"Your next bill covers it."*
3. **"₹1,490 still to pay — ₹1,490 of ₹2,980 received" bhi hataya** — aadha-bhara plan aam hai,
   aur wahan dono figure barabar hote hain. Ab: *"₹1,490 still to pay of ₹2,980"*

**Do button ek jaisa kaam kar rahe the** (`View summary` aur `View` — dono invoice page kholte the).
Ab ek.

**Mera apna regression saaf kiya**: `INVOICE_BADGE_CLASSES`, `isInvoicePayable`,
`getInvoicePurposeText` sirf us list ke liye the jo ab nahi hai — hata diye.

---

## 7i. Upload button ke neeche — "agla cycle kab?" (17-09-2026)

> **Owner ne screen par dekh kar approve kiya (17-09-2026).**

Backup: `frontend/src/_backup_cleanui_work7/`. Compile pass.
Naya: `frontend/src/helpers/servicePlanCycle.js`.

### Owner ki baat

> "days left sirf next cycle ke liye karo, aur agar koi cycle nahi hai tab aayega ke buy new plan
> ya plan consumed — jisse user samajh jaye ki usne saari service consume kar li hai"

### Jo galat tha

Allowance khatam hone par page **hamesha** likhta tha: *"You have used this cycle's updates.
More on {cycle end}"* — yaani har service ke liye maan leta tha ki agla cycle aayega.

Live data (8 service orders) kehta hai teen kism hain:

| Kism | Kitne | Agla cycle? |
|---|---|---|
| Fixed tenure (cycle ginti hai) | 2 | haan, aakhri tak |
| Recurring (koi ant nahi) | 2 | haan |
| **Ek-baar wala** (sirf validity) | **4** | **kabhi nahi** |

**Un 4 par purani line jhooth thi** — us tareekh ko kuch nahi hoga. Ek par cycle ka ant likha hi
nahi hai, wahan `N/A` chhapta.

### Faisla server ka hai, naya nahi

`cron/servicePlanRenewalCron.js` roz yahi tay karta hai:

```
serviceNextBillingDate <= aaj  wale nikalo
agar fixed tenure hai AUR ye aakhri cycle hai  -> expired, billing band
warna -> agla cycle bill karo
```

`helpers/servicePlanCycle.js` **wahi do sawal, usi tarteeb mein** poochhta hai — teen jawab:
`returns` / `finished` / `one_off`. Naya niyam nahi banaya; agar cron ka niyam kal badle to
ek hi jagah dekhni hai, aur wo comment mein likhi hai.

**`serviceCurrentCycleEnd` akela kaafi nahi** — ek-baar wale plan ke paas bhi ant ki tareekh hoti
hai, uske aage kuch nahi. Isliye faisla `serviceNextBillingDate` par hai, wahi jo cron dekhta hai.

### Ab kya likha aata hai

| Soorat | Sandesh |
|---|---|
| agla cycle aa raha hai | "You can send again **in 24 days**." |
| aakhri cycle tha | "This plan has delivered everything it was bought for. Buy a new plan to keep sending." |
| cycle system hai hi nahi | "You have used everything on this plan. Buy a new plan to keep sending." |

### Tareekh nahi, bacha hua waqt (owner, 17-09-2026)

Pehle likha tha *"You can send again from 11 Oct 2026."* Owner: **ye over-text hai** — chahiye
"kitne din bache", aur ek din se kam ho to **ghante**.

Wajah bhi wahi hai: tareekh "kab" batati hai, "kitni der" nahi. Padhne wale ko calendar par ginna
padta hai, aur aakhri din wo aisi lagti hai jaise kuch hone hi wala nahi.

`getTimeUntilText()` (usi `servicePlanCycle.js` mein — jahan cycle ka faisla rehta hai) paas aate
hi bareek hoti jaati hai:

| Kitna door | Kya likha aata hai |
|---|---|
| 30 din | in 30 days |
| theek 24 ghante | tomorrow |
| 23 ghante | in 23 hours |
| 1 ghanta ya kam | in less than an hour |
| nikal chuka | now |
| tareekh padhi hi nahi ja rahi | kuch nahi (caller chup rehta hai) |

**"now" kyun chahiye**: cron apne waqt par chalta hai, to cycle khatam hone aur renewal likhe jaane
ke beech ka waqt customer dekh sakta hai. Wahan "in 0 days" jhooth hota.

**Naapa gaya**: 40 din tak har 7 minute par chalakar — kabhi "in 0 days", kabhi "in 1 days",
kabhi bare number nahi aata. Live plans par aaj: `in 72 days` · `in 24 days` · `in 4 days` ·
**`in 7 hours`** (Website Update — ghante wali soorat sach mein maujood hai).

### Verify kiya (live data, 8 ke 8)

- purani line **4 par jhooth** thi — ab teeno soorat sach bolti hain
- **cron ke apne niyam se mismatch: 0**
- `Invalid Date` / `N/A` wali soorat band

### "Days left" tile — plan ka apna ant (owner, 17-09-2026)

Owner: *"jo neeche days left hai woh logically sahi nahi hai — wahan hona chahiye plan expired
in 1 month and days"*

**Do alag baatein ek jaisi dikh rahi thin.** Upload button ke neeche cycle ki baat hoti hai (kab
dobara bhej sakte ho), aur neeche tile par **poore plan** ka din-count tha — label sirf
`Days left`. Padhne wale ke liye dono ek jaisa dikhta tha.

| | Pehle | Ab |
|---|---|---|
| Label | `Days left` | **`Plan expires in`** (ya `Plan runs for` jab koi ant hi na ho) |
| Value | `55 days` / `164 days` | **`1 month 25 days`** / **`5 months 11 days`** |

`getTermRemainingText()` — usi `servicePlanCycle.js` mein, cycle wale jawab ke saath, taaki dono
ek jagah rahen aur phir se gadd-madd na hon.

**Mahine calendar ke hain, 30-din ke block nahi.** Customer ise apni kharid ki tareekh se milata
hai, aur 365/30 usi din par nahi girta.

**Ek bug pakda — verification se, padhne se nahi**: pehle maine "31 din se kam ho to din mein
batao" likha tha. Us se **theek ek mahine** wala plan `30 days` dikhata. Ab mahine **pehle** gine
jaate hain, aur jo bachta hai wahi din hai — `1 month` sahi aata hai.

| Kitna bacha | Kya likha aata hai |
|---|---|
| nikal chuka | ended |
| 1 din | 1 day |
| theek 1 mahina | 1 month |
| 55 din | 1 month 25 days |
| 164 din | 5 months 11 days |
| koi ant nahi | Plan runs for — As long as you need |

**Naapa gaya**: 3 saal ke **har din** par chalakar — kabhi `0 months`, `1 months` ya `1 days`
nahi aata. Live plans par: `2 months 12 days` · `5 months 11 days` · `1 month 25 days` · `ended`.

**Tile ka dhaancha badalna pada** (owner ne SS bheja): label aur value ek line mein baithe the
(`justify-between`), aur ye column **280px** ka hai. `Plan expires in` + `1 month 25 days` usme
fit nahi hote — **dono aadhe-aadhe toot gaye**. Ab label upar, value neeche. Neeche wali
"Files you can send at once" row bhi usi shakal mein laayi, warna do row do tarah dikhtin.

Mobile pehle se stacked tha; wahan sirf `Resets` ko `Resets on` kiya taaki dono layout ek zubaan
bolen.

### Abhi NAHI kiya (owner ne baad ke liye kaha)

- ~~"Days left" tile~~ — **ho gaya**, upar dekho
- **Kitne billing cycle bache** — Plan Detail par (tenure ka hissa ho gaya, cycle ki ginti baaki)
- **Orders + Projects-and-Plans par wahi jaankari** — par wahan "agla cycle kab" **nahi** aayega
  (owner ka saaf hukm)

**Agle agent ke liye**: ye kaam `servicePlanCycle.js` ke upar hi banega — us helper ke paas
`cycleNumber` aur `totalCycles` pehle se hain. **Par pehle §7h ka data check karo**: cycle/tenure
ke khaane sirf kuchh orders par bhare hain (totalCycles 2/8, tenure 2/8, planEnd 5/8), aur list
feed unme se **koi nahi** bhejti. Jo maujood nahi uske liye jhoothi ginti mat banao.

---

## 7h. §7c ka system kaam — HO GAYA (17-09-2026)

Backup: `backend/_backup_cleanui_work6/` + `frontend/src/_backup_cleanui_work6/`.
Sab compile. **Teen kadam, har ek ke baad alag verification** — owner ne regression se bachne
ko kaha tha, isliye ek waqt mein ek.

### Kadam 1 — feed allowance bhejti hai *(backend)*

`backend/helpers/orderSummary.js` ke `ORDER_SUMMARY_FIELDS` mein do khaane jode:
`servicePlanSnapshot` aur `serviceAccessUsedInCycle`.

**Pehle verify kiya ki data maujood hai ya banta hi nahi** — ye owner ka sawal tha:
- 8 ke 8 service orders par snapshot **likha hua hai** (limit, files, scope — sab)
- counter **chalta bhi hai** — do plans par `used=1`
- poori working maujood: likhne wala (`servicePlanPurchase.js`), badhane wala
  (`submitUpdateRequest.js`), rokne wala (wahi), reset karne wala (`serviceCycleSettlement.js`)

**Yaani working nahi, sirf get nahi karvayi ja rahi thi.**

Feed teen jagah use hoti hai. Dono doosri jagah (`getAdminUserWorkspace`, `getMyPaymentWorkspace`)
`servicePlanSnapshot` **pehle se hi** maangti hain — koi takraav nahi.

**Verified**: allowance aa raha hai · koi purana khaana nahi khoya · `orderState` 26/26 wahi ·
payload 42.7 KB.

### Kadam 2 — asymmetry theek *(frontend)*

`helpers/orderType.js`:

| Helper | Pehle | Ab |
|---|---|---|
| `isProjectItem` | order ka apna flag, phir catalogue | **badla nahi** |
| `isPlanItem` | **sirf catalogue** | order ka apna flag, phir catalogue |

**Yahi asli bug tha.** 8 mein se 5 service orders ka catalogue product hata diya gaya hai. Catalogue
hatate hi wo order **na plan bachta tha, na project** — dono sawalon ka jawab "nahi".

Natija: wo Plans filter se gayab, koi summary nahi, aur `PlanDetails.js` ka apna guard unhe
**Project page par bhej deta tha** kyunki wo "plan nahi" the.

**Naya teen-jawab wala helper jaan-boojh kar nahi banaya** — live data par uska aur is fix ka
nateeja **bilkul ek** nikla (0 orders par farak), aur wo 8 call site chhuta. Faayda sifar, khatra
poora. `ProjectsAndPlans` ke do tab hain, wahan sach mein do sawal chahiye.

### Kadam 3 — allowance sahi jagah se *(frontend)*

`helpers/orderPresentation.js` ka `getItemSummary()` service plan ke liye snapshot se padhta hai.
Wahi kaam jo Plan Detail par ho chuka (§7b).

**Aur ek dohraav hata**: `OrderListRow.js` wahi hisaab **dobara** likhta tha, aur nateeja **teen
jagah** chhapta tha — naam ke paas chip, tareekh ke neeche, aur dayein kinare. Ab sirf chip, jo
project ke progress chip ki jagah par baithta hai.

### Nateeja — live data par naapa, 26 orders

| Plan | Chip pehle | Chip ab | Khulta tha | Ab khulega |
|---|---|---|---|---|
| Support Portal - Single Update | (project row) | **1 of 1 left** | project page | **plan page** |
| Single Update Plan | (project row) | **2 of 2 left** | project page | **plan page** |
| Website Single Section Addition | (project row) | **1 of 1 left** | project page | **plan page** |
| Website Update | (project row) | **2 of 2 left** | project page | **plan page** |
| Social Media Marketing | (project row) | (koi chip nahi) | project page | **plan page** |
| Live Chat Feature | Plan details available | (koi chip nahi) | plan page | plan page |
| Starter Update Plan ×2 | Plan details available | **0 of 1 left** | plan page | plan page |

**"Koi chip nahi" jaan-boojh kar hai** — reminder-only aur unlimited plans ke paas ginne ko kuch
hai hi nahi. `0 of 0` unke liye jhooth hota.

### Regression guards (sab pass)

- project **aur** plan dono answer karne wale: **0**
- dono ko "nahi" kehne wale (har list se gayab): **0**
- project rows: **18 pehle, 18 baad** — bilkul achhoote
- legacy/monthly plan rows: **0** — un par koi asar pad hi nahi sakta

### §7c se jo kaam BACHA hai

**Category** — `standard websites` aur 5 orders par `Unknown type`.
Jawab pehle se maujood hai: `helpers/projectCategoryOptions.js` mein customer wale naam likhe hain,
par sirf admin ka ek page use karta hai. Usme 4 project category hain; `website_updates` /
`service_plan` **nahi** hain, aur "category hai hi nahi" ka bhi koi jawab nahi.

4 live jagah: `OrderPage:130` · `OrderDetailPage:226` · `ProjectDetails:896` · `OrderListRow:63`.
**`ProjectDetails` admin ke saath share hoti hai** — uska admin branch chhuna nahi.

---

## 7c. System ke kaam — jo mile the (17-09-2026)

> **Ab in par kaam HO CHUKA hai — §7h dekho.** Sirf category bachi hai.
> Neeche ka "haath mat lagao" us waqt ka hukm hai jab text-safai chal rahi thi.

> **Agle agent ke liye hukm: in par abhi haath mat lagao.**
> Ye saare **system** ke kaam hain, text ke nahi — yaani §3a (Rule 3) se bahar.
> Owner ka faisla: **pehle poore client panel ki text-safai, uske baad ye.**

### Ye yahan kaise aaye — aur ye sabaq zyada zaroori hai

Order page ka fix plan banate waqt main text ki safai se shuru hua aur system ke bugs tak pahunch
gaya. Owner ne roka: *"yeh to main working se bahut bahar ho gaya."* **Bilkul theek roka.**

**Sabaq**: code padhte hue bug milna lazmi hai — is codebase mein milenge hi. Unhe **likh lo, theek
mat karo.** Ek text-safai ka kaam system ki marammat mein badal jaye to na safai poori hoti hai,
na marammat — aur jo screen aaj saaf honi thi wo aur der se saaf hoti hai.

### Jo mila (live data se, 26 orders par — andaze se nahi)

Audit read-only tha, kuch likha nahi gaya.

**1. List feed service plan ka allowance bhejti hi nahi**
`ORDER_SUMMARY_FIELDS` (`backend/helpers/orderSummary.js`) mein `servicePlanSnapshot` aur
`serviceAccessUsedInCycle` hain hi nahi. Teeno list screen (Dashboard, Projects-and-Plans, Orders)
isi ek feed se chalti hain.

**2. 8 mein se 6 service row aaj galat dikh rahi hain**

| Screen par aata hai | Sach kya hai |
|---|---|
| project jaisi row (plan ki tarah nahi) | 1 of 1 left |
| project jaisi row | 2 of 2 left |
| "Plan details available" | 0 of 1 left |

Wajah: 8 mein se **5 service orders ka catalogue product hata diya gaya hai**. Row kism ka faisla
`productId.category` se karti hai, isliye product hatate hi service plan **project** ban jaata hai.
Feed `isServicePlan` **bhejti hai** — row use padhti hi nahi.

**3. 5 orders par category hai hi nahi → screen par "Unknown type" chhapta hai**

**4. Legacy plan ka rasta poori tarah mara hua hai — 0 orders.**
`productId.updateCount` wali har branch aaj kisi kaam ki nahi. **Chhedna nahi**, sirf jaan lo.

### Do daawe jo live data ne GALAT sabit kiye — yahan isliye taaki koi inhe dobara na uthaye

- ~~"orphan service orders ka naam list par toot jayega"~~ — **galat**. 5 orphan hain, sabka naam
  sahi aa raha hai; `orderItems` wala sahara kaam kar raha hai. Koi kaam nahi bacha.
- ~~"row par 0 update(s) left dikhega"~~ — **galat shakal**. Row unhe plan samajhti hi nahi, isliye
  plan wali line aati hi nahi.

**Isi liye grep kaafi nahi tha** — grep ne dono daawe "sach" dikhaye the. Live data ne dono kaate.

### Jab ye kaam uthe, tab teen cheezein chahiye (aur bas teen)

1. Feed do khaane bheje — `servicePlanSnapshot`, `serviceAccessUsedInCycle` *(backend)*
2. Row kism `isServicePlan` se poochhe, category se nahi — aur service ka allowance snapshot se
   padhe *(frontend)*
3. Category ka jawab "Unknown type" aur khaali ke liye bhi ho *(frontend)*

**Ek aur cheez jo pehle se maujood hai**: `helpers/projectCategoryOptions.js` mein customer wale
naam (`standard_websites` → "Standard Website") **already likhe hain** — sirf admin ka ek page unhe
use karta hai. Naya mapping mat banao, wahi client tak lao. Usme 4 project category hain;
`website_updates` / `service_plan` usme nahi hain.

---

## 7k. Client-panel audit — code se dekha hua (17-09-2026)

> Ye **read-only code audit** hai; screen par live customer data ke saath dekhna ab bhi baaki hai.
> Isliye yahan sirf wahi likha hai jo render path se pakka dikhta hai. Koi code nahi badla.

### Saaf ya pehle se sambhala hua

- Dashboard, Orders, Order Detail, Invoice Detail, Wallet, Documents, Profile, Complete Profile,
  Set New Password, start-project chooser aur project catalogue/detail flows mein is nazar se koi
  naya raw ID/DB-enum print milkar confirm nahi hua.
- Plan Detail ka allowance, cycle/term aur payment-summary wala kaam §§7b, 7i, 7j mein hai; usse
  dobara mat chhedo bina live screen review ke.
- My Invoices ka text helper se saaf hai, lekin endpoint na hone ki purani baat ab bhi sach hai.

### Text/display findings — approval ke baad hi badalne hain

1. **Projects and Plans** (`pages/ProjectsAndPlans.js`) — approved subtitle:
   **`See the progress and details of your projects and plans.`** `Total` / `Active` counters ko
   hatana confirmed requirement **nahi** hai; woh customer ke kaam ke hain ya extra, owner decide
   karega.
2. **Project Detail** (`pages/ProjectDetails.js`, customer branch) — unpaid banner invoice number
   seedha dikhata hai; refund line `referenceId` dikha sakti hai; copy mein "admin approval",
   "invoice" aur "Payment Pending" system ki zubaan hai. File admin ke saath share hai, isliye
   customer branch ke bahar kuch nahi chhedna.
3. **Support list + Ticket Detail** (`components/TicketsList.js`, `pages/TicketDetail.js`) — ticket
   ID heading/table mein, raw `ticket.category`, aur status-history ka raw `status.status` chhapta
   hai. Raw source confirmed hai, lekin ticket number/category/history customer ke kaam ke hain ya
   nahi ye owner tay karega; customer ka naam/email phir se dikhana bhi decision hai, automatic bug nahi.
4. **Profile** (`pages/Profile.js`) — "admin-generated", "credential verification" aur
   "login-free secure upload links" customer-facing technical wording hai. Toggle ka kaam nahi
   badalna; sirf zubaan ka owner-approved review chahiye.
5. **Service-plan purchase** (`pages/ServicePlanDetail.js`) aur **website purchase**
   (`pages/StartNewWebsiteCustomize.js`) — UPI reference input, "admin approval" /
   "verification" aur "billing cycles" text dikhta hai. UPI reference customer se lena payment
   ka kaam hai, isliye woh issue nahi aur input/flow hatana mana hai. Sirf visible wording simple
   karni hai ya billing-cycle explanation rakhni hai, ye owner approval wala decision hai.
6. **Customer Documents** minute-level timestamp dikhata hai. Upload-time ke §7a-G jaisa sawaal
   hai: date enough hai ya time bhi chahiye — owner ke bina badalna nahi.

### System/data findings — text-cleanup mein theek NAHI karne

1. **My Updates** (`pages/UserUpdateDashboard.js`) real order list fetch karta hai, par render
   `MOCK_PLANS` karta hai. Iska model legacy fields/product category par bhi nirbhar hai. Ye
   display-copy nahi, data wiring/system kaam hai; §7c ke baad alag se evidence ke saath uthana.
2. **My Invoices** (`pages/UserInvoices.js`) ka `GET /api/my-invoices` route ab bhi missing hai;
   page text saaf hone ke bawajood empty rahega.
3. **Dummy invoices** Order Detail aur Invoice Detail mein ab bhi hain — purana §8 rule jari hai.
4. **Chess page** customer route hai, par business client-panel clean-up ka hissa nahi maana gaya.
   Usme temporary `eruda` debug script aur room code/link hai; room code/link game chalane ke liye
   hai, isliye Rule 1 se hatana nahi. Debug script alag engineering issue hai.

### Audit complete kehne se pehle

- Har above finding ko actual customer data aur fresh dev server par dekho; static code raw backend
  text ko poori tarah prove nahi karta.
- Shared components ka customer path dekho: `OrderListRow`, `TicketsList`, `ProjectDetailView`,
  `UpdateRequestModal`, `UploadedDataList`.
- Text findings aur system/data findings ko ek patch mein mat milana.

---

## 7l. Verified client clean-up correction set (18-09-2026)

Backup: repository root `backup/fix21/` — har touched original file usme hai.
No `npm run build` chalaya.

### Evidence jis par kaam hua

- Read-only database check: **27 orders** — 19 projects, 8 services. Service snapshot distribution:
  6 upload-capable (`portalAccessCount > 0`) aur 2 `reminder_only`; isliye My Updates par har
  service dikhana jhooth hota.
- Real invoice records: 75 (`project`, `project_final`, `service_statement`). Backend mein
  `/api/my-invoices` route nahi, par authenticated `/api/my-payment-workspace` already monthly
  aur project invoices dono, ownership filter ke saath bhejta hai.
- Ticket model ke customer labels already plain hain (`Billing`, `Technical`, `Product`, `Account`,
  `Other`; `pending`, `open`, `closed`). Isliye ticket mapping ka naya helper **nahi** banaya.

### Kya badla

1. **Projects and Plans** ka owner-approved subtitle ab: *See the progress and details of your
   projects and plans.* Counters ko chhua nahi.
2. **Project Detail** ke existing payment-state gates bilkul waise hi hain. Sirf raw invoice number,
   refund reference aur `admin approval` wording customer text se hataayi; CTA ab `Pay now` hai.
3. **Category presentation**: service ke paas project category nahi hoti. Naya
   `getOrderCategoryLabel()` existing project-category SSOT se sirf projects ka label deta hai;
   service par category line render nahi hoti. `OrderPage`, `OrderDetailPage`, `OrderListRow`,
   `ProjectDetails` ek hi rule use karte hain.
4. **My Updates** ab fetched `/api/get-order` data render karta hai, mock rows nahi. Woh sirf
   upload-capable service orders dikhata hai; allowance snapshot/cycle counter se, aur cycle
   message stored renewal facts se aata hai. Iske liye summary feed mein existing service cycle
   fields bheje gaye—naya hisaab/API nahi.
5. **Your bills** (`UserInvoices`) ab missing endpoint ke bajaye existing
   `/api/my-payment-workspace` ka `data.invoices` use karta hai; project + plan bills dono aate
   hain, aur `View bill` canonical Invoice Detail kholta hai.
6. **DUMMY_INVOICES** Order Detail aur Invoice Detail se hata diye. Invoice na ho to koi nakli
   ₹/overdue row nahi dikhegi; unknown invoice URL truthful not-found state par jaayega.

### Validation

- frontend changed files Babel parse: **9/9 pass**
- backend `helpers/orderSummary.js`: `node --check` pass aur module load pass
- existing status-engine read-only real-record script: **40/40 pass**, kuch write nahi hua
- current summary-feed read-only check: 8 services mein 6 upload-capable cards ke liye aate hain;
  2 reminder-only jaan-boojh kar nahi. In 6 mein 3 ke paas next billing date aur 3 ke paas nahi,
  jo `returns` / `one_off` / fixed-tenure helper ke existing data shapes hain—koi nakli reset
  date nahi bani.
- screen-level real-session verification abhi baaki: Projects/Plans subtitle, service update cards,
  due/pending/cancelled project banners, bills list/detail.

---

## 7m. Vague client wording — confirmed follow-up list (18-09-2026)

Ye naya UI/design ka kaam nahi hai. Ye un client-facing jumlon ki list thi jinmein client ko ya to
**agla kaam** nahi pata chalta tha, ya system ke andar ka lafz use hota tha. Owner ne neeche ki
replacement wording approve ki aur isi focused text pass mein **apply kar di**. Payment, UPI,
invoice aur backend ka behavior nahi badla.

| Screen | Abhi ka text | Masla | Saaf replacement / decision |
|---|---|---|---|
| Project Details — payment due | `A payment of ₹X is due... Some actions will be available once it is paid.` | `Some actions` nahi batata client ko ab kya karna hai. | `₹X is due for this project. Pay now to continue.` |
| Project Details — payment received | `...are checking it. Some actions will be available once it is confirmed.` | Upar wale jaisa hi vague promise. | `We’re checking your payment. We’ll let you know when it is confirmed.` Amount ho to pehle sentence mein rahe. |
| Project Details — locked upload button | `Available once the due payment is recorded` / `Available after payment is approved` | `Available` ka target button hai, par sentence upload ko naam se nahi bolta. | `You can upload data after payment is received.` / `...after payment is confirmed.` |
| Project Details — timeline | `Click any checkpoint to open its record` | `record` internal/abstract lagta hai. | `Select a checkpoint to see its updates.` |
| Project Details — checkpoint details | `Textual Record`; `No textual record is linked to this node yet.` | Client-facing language nahi; `node` bhi technical hai. | `Updates`; `No updates have been added for this checkpoint yet.` |
| Project Details — empty timeline | `Timeline data is not available yet.` | System/data ka lafz hai, aur client ko situation clear nahi karta. | `Project updates will appear here when they are added.` |
| Service Plan Detail — payment submit | `Submit for Approval` | Kiski approval aur kya submit ho raha hai, clear nahi. | `Send payment for checking` (same terminology as existing clean-UI decision). |
| Service Plan Detail — pending payment | `Your payment is awaiting admin approval, usually within a few hours.` | `admin approval` internal hai; “usually” bina service commitment ke weak promise hai. | `We’re checking your payment. We’ll let you know when it is confirmed.` |
| Service Plan / custom-project UPI form | `enter your UPI transaction ID below`; `Submit for Verification` | `transaction ID` technical label hai aur CTA generic hai. Reference number field rehna zaroori hai, wording clearer ho sakti hai. | `Enter the UPI reference number from your payment app.`; `Send payment for checking`. |
| Support FAQ | `Our support team will review your ticket as soon as possible.` | `as soon as possible` no expectation deta hai. SLA/response time owner/backend se verified nahi hai. | Tabhi exact time likho jab real service commitment ho; warna `We’ll update your ticket when there is progress.` |

**Do not overcorrect:** invoice IDs, UPI reference number, payment amount aur payment status jahan
client ko kaam poora karne ke liye chahiye, unhe hatana nahi hai. Masla unke hone ka nahi, unke
saath unclear instruction ka hai. `₹X is due ... Pay now to continue.` owner-approved wording hai
aur ab code mein live client text hai.

**Applied files:** `pages/ProjectDetails.js`, `pages/ServicePlanDetail.js`,
`pages/StartNewWebsiteCustomize.js`, `pages/ContactSupport.js`.

**Validation:** 4/4 changed JSX files Babel parser se pass. Old client-facing phrases ka focused
search blank tha; `awaiting admin approval` sirf `ProjectDetails.js` ke developer comment mein
bacha hai, rendered UI mein nahi.

## 7n. Plan Detail — quarterly billing / monthly allowance root-cause and correction plan (18-09-2026)

**Owner screenshot ka exact order, read-only DB evidence:** `Starter Update Plan` 27 Aug 2026 ko
start hua. Iske frozen purchase contract mein `limitScope: per_month`, `portalAccessCount: 1`,
`filesLimit: 20`, **quarterly** billing (`₹4,335.90` every 3 months) aur **6 months** tenure hai.
Statement ₹8,671.80 ka hai, pehla ₹4,335.90 paid hai. Billing/current-cycle end aur next billing
date dono 27 Nov 2026 hain. 18 Sep ki local screen par us date tak `ceil(...)` = **71 days**;
isliye number ki arithmetic sahi hai.

### Asli problem — date nahi, do alag cheezon ko ek maana gaya

Customer promise `1 update per month` hai, par purchase code quarterly billing ko
`serviceCurrentCycleEnd` banaata hai. Upload guard `serviceAccessUsedInCycle` ko isi billing
cycle ke end par reset karta hai. Isliye current UI `You can send again in 71 days` bolta hai:
**billing period (3 months) ko update allowance period (1 month) bana diya gaya hai.**

**Important clarification:** quarterly payment choose karne par current code `1 × 3 = 3` advance
uploads **nahi** deta. Snapshot mein count ab bhi 1 hai aur upload guard bas us 1 se compare karta
hai; billing period se count multiply karne wala koi code nahi. Screenshot ke do Aug uploads
intended 3-updates allowance nahi hain — neeche wale initial-settlement reset bug ka result hain.

Ek aur live proof: is order par first upload 27 Aug 13:55 UTC hua, initial payment settlement
13:56 UTC par hua aur `serviceCycleSettlement` ne counter ko 0 reset kiya; second upload 29 Aug
ko allow ho gaya. Order history mein 2 uploaded requests hain, `serviceAccessUsedInCycle` 1 aur
`serviceAccessUsedTotal` 2 hai. Matlab current design monthly promise ko sirf late reset nahi
karta; initial settlement ke aas-paas ek extra use bhi de sakta hai.

### Recommended contract rule (implementation se pehle owner confirmation chahiye)

`per_month` ka matlab **har calendar-month anniversary par allowance reset** hona chahiye,
chahe customer monthly, quarterly, half-yearly ya yearly payment kare. Billing period sirf bill
aur next-payment date decide karega. Is exact plan ke liye next upload **27 Sep 2026** hona chahiye;
next payment **27 Nov 2026** hi rahe. Agar product ka asli promise "1 update per billing period"
hai to catalogue description aur purchase screen ko badalna hoga — current customer wording ke
saath ye recommended nahi hai.

### Root-correct implementation plan

1. **Billing aur allowance ko alag SSOT do.** Existing `serviceCurrentCycle*`,
   `serviceNextBillingDate`, `serviceBillingCycleMonths` invoice/billing ke liye waise hi rahen.
   Order par separate immutable allowance-period fields (start, end, period months, used count)
   add hon. `per_month = 1 month`; `per_year = 12 months`; `per_plan` reset nahi; `unlimited` /
   reminder-only par counter nahi. Existing ambiguous `serviceAccessUsedInCycle` ko silently
   reinterpret mat karna.
2. **Ek shared allowance helper banao.** Purchase, request submission, external-upload eligibility
   aur UI isi helper se current allowance period/remaining/reset date padhen. Monthly reset job
   idempotent ho aur delayed run par multiple missed periods ko calendar anchor se advance kare;
   request path mein atomic fallback ho, taaki cron delay ya simultaneous uploads quota bypass na
   kar saken.
3. **Initial payment boundary fix karo.** First payment settle hone se pehle upload allow na ho,
   ya pre-settlement reserved use ko settlement reset kabhi erase na kare. Exact policy existing
   payment gate ke saath verify karke tests mein prove karni hai.
4. **Existing service orders ke liye read-only preview, phir approved migration.** Har affected
   per-month order ka proposed allowance window, historical requests aur current entitlement
   report karo. Is screenshot wale order ke do Aug requests ko kaise honour karna hai owner
   decide karega; bina decision ke customer's already-used entitlement overwrite nahi hoga.
5. **Regression tests.** Monthly allowance + quarterly billing, final tenure period, overdue /
   cancelled plan, delayed reset job, first-payment timing, and concurrent two uploads. Billing
   invoice dates/amounts ko comparison mein unchanged prove karo.

### Plan details — screen plan (core fix ke baad)

Screenshot mein desktop 3-column grid ka right 360px column khaali hai. Naya layout banana nahi:
usi blank column mein client-readable **Plan details** render karo; mobile par wahi block usage
panel ke neeche, upload history ke upar aaye.

| Client ko dikhana hai | Exact source / example for this order |
|---|---|
| Plan name | frozen `servicePlanSnapshot.serviceName`: Starter Update Plan |
| Plan duration | `serviceTenureMonths` + start/end: 6 months, 27 Aug 2026 – 27 Feb 2027 |
| Updates included | allowance rule: 1 update each month, 6 total (after allowance fix) |
| Current monthly usage | separate allowance counter: current month `used of 1`; next upload date wahi field se |
| Files per update | frozen `filesLimit`: up to 20 |
| Billing schedule | `serviceCyclePrice` + billing months: ₹4,335.90 every 3 months, 2 payments |
| Total plan price | service statement: ₹8,671.80 |
| Next payment | billing-only `serviceNextBillingDate`: 27 Nov 2026 |

Top payment sentence ko bhi exact billing language mein badalna hai: `₹4,335.90 has been paid.
Your next payment of ₹4,335.90 is due on 27 November 2026.` Yeh "the rest is billed as the plan
runs" ko hataata hai, bina unbilled future cycle ko overdue debt bole.

**No code/data change in this section yet.** Yeh system/contract correction hai, text-only
clean-up nahi; owner ka `per_month independent of billing` confirmation aur live-data migration
decision pehle chahiye.

## 8. Agla kadam (current position)

**17-09-2026** — Text-safai: nau screen (§7b, §7d, §7e, §7g).
System ka kaam: §7c ke teen mein se **do ho gaye** (§7h) — feed ab allowance bhejti hai, aur
service plan list par plan ki tarah dikhta hai.

**Bacha hua kaam — ek**: category (`standard websites` / `Unknown type`), 4 live jagah.
Uska jawab §7h ke aakhir mein likha hai.

**Dev server purana ho to kuch nahi dikhega** — §9 ka teesra sabak.

### Abhi ka daayra — sirf itna

**Sirf extra text hatana. Koi system correction nahi.** (owner, 17-09-2026)
Jo bhi system ka kaam saamne aaye, wo §7c mein likho aur aage badh jao.

### Agli screens — text ki nazar se dekhi hi nahi gayi hain

Documents · Support · Profile · Start-new-project ke baaki screens · My Updates ·
Complete Profile · Set New Password

Ye §7f ke chaar-nazar wale scan mein saaf nikli thin, par **screen par dekhi nahi gayi**.

**Dekhte waqt ye chaar cheezein dhoondho** — teeno ho chuki screens par yahi milin:
1. **DB ke shabd** jo seedhe chhap rahe hain (`partially_paid`, `service_plan` jaise)
2. **System ke reference** — invoice/bill/transaction number, ids
3. **Ek hi baat kai jagah** — eyebrow + heading + counter, ya column ka naam row ke andar dobara
4. **Page mein likhe hue number** jo data se aane chahiye the

### Isi kaam mein jo NAHI karna

- **Category** — `standard websites` har jagah chhapti hai. Iska jawab §7c se juda hai, isliye
  poori text-safai ke baad, ek hi baar, saari screens par ek saath. **Ek screen par akela mat
  badlo** — warna portal par do zubaanein ho jayengi.
- **Nakli invoice** (`DUMMY_INVOICES` — Order Detail + Invoice Detail) — customer ko ₹3,000
  "overdue" dikhata hai jo hai hi nahi. Text nahi, **jhoothi jaankari** hai, aur uski shaakh
  asli payment code ke andar hai. §7c ke saath.
- **Layout/design badalna** — kaunse column hon, kaunsa card kahan ho. Ye safai nahi, naya design
  hai. Owner tay karega.
- **§7c ka koi bhi kaam.**

### Uske baad, tarteeb se

1. **Category** — ek hi baar, saari client screens par (§7c ka mapping istemal karke)
2. **§7c ke system kaam** — jab poori text-safai ho jaye
3. **§7a-G — upload ka waqt** — `components/UploadedDataList.js` mein hai, jise **admin bhi
   render karta hai**. Owner se poochhe bina mat karo.

**Agla agent ke liye do baatein:**
- §5a ka "plan teen kism ka hota hai" pehle padho — Plan Detail ka sabse bada bug yahi tha.
- §7c padhkar ye samajh lo ki **kya jaan-boojh kar roka gaya hai**, taaki tum use "chhoot gaya"
  samajh kar dobara na utha lo.

---

## 9. Is file ko kaise likhna hai

**Ye file live rakhni hai — owner ke poochhe bina** (owner ki instruction, 17-09-2026).
Maksad saaf hai: **agla AI agent ise padhkar kaam wahi se aage badha sake**, bina dobara samjhe,
bina dobara poochhe. Isliye:

- **Faisla hote hi** — §6 mein likho
- **Screen ka kaam poora hote hi** — §7 mein likho, kya badla wo saaf
- **Kaam beech mein ruke to** — §8 mein likho ki kahan ruka aur kis wajah se
- **Koi aisi samajh bane jo agle agent ko chahiye** — jaise ek hi text kai screens par aata ho,
  ya ek component se kai screens bante hon — wo bhi darj karo, warna agla agent wahi khoj dobara karega
- **"Kya karna hai" ke saath "kyun" bhi likho** — bina wajah wala niyam agla agent tod dega

- **Tareekh wahan jahan sach mein zaroori ho** — har line par nahi. Sirf faisla, halat ka badalna,
  ya kisi purani baat ke badalne par. Warna doc tareekhon se bhar jayega aur padhna mushkil ho jayega.

### Screen ko "ho gaya" kehne se pehle — teen galtiyan jo ho chuki hain (17-09-2026)

**1. Screen ka har shabd padho, sirf dhaancha nahi.**
Wallet par main waqt, reference, status, filter — sab saaf kar aaya, par **row ka title padha hi
nahi**. Owner ne SS bhejkar dikhaya ki wahan `Payment (wallet) for invoice INV-202609-0002` likha
hai — sabse badi cheez, seedhe beech mein. Dhaanche par kaam karte hue **jo likha hai wo padhna**
chhoot gaya. Har screen par pehle uska **har shabd** ginno, phir kaam shuru karo.

**2. Jo text backend se aata hai, wo bhi text hai.**
Wo title `transaction.description` se aa raha tha — ek line jo payment ke waqt likhi jaati hai.
Frontend mein wo dikhta hi nahi, isliye pehli nazar mein chhoot gaya. **Agar screen par koi shabd
hai jo file mein nahi mil raha, to wo data se aa raha hai — uska source dhoondho.**

**3. "Compile OK" ka matlab "screen par dikh gaya" nahi hai.**
Maine compile pass hote hi "screen par dekh lein" keh diya. Dev server **ek din purana** tha
(`16-09 01:25`, edits `17-09` ke) — kuch pahuncha hi nahi tha. Handoff doc §8 mein yahi galti do
baar darj hai. **Kaam poora kehne se pehle server ki umar dekho**:
`netstat -ano | grep ":3000"` → `Get-Process -Id <PID> | Select StartTime`
- **Purani baat badle to nayi tareekh ke saath likho**, purani mita mat do — taaki pata rahe ki
  pehle kya tha aur kab badla.
- **Ye file sach likhti hai, irada nahi.** Jo ho chuka wahi "ho chuka" hai. Jo tay hua par hua nahi,
  wo faisle mein rahega, progress mein nahi.
