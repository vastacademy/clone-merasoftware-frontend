# Portal UI Cleanup — Handoff

**Aakhri update**: 16-09-2026 · **Halat**: Phase 0, 1 aur **2 — teeno poore.** 20/20 files migrate ho chuki.

**Bacha hua kaam — code ka kuch nahi.** §11 ke teen `CODEBASE_MAP.md` fixes bhi ho chuke.
Sirf ek cheez khuli hai: **§6 #2 — metric tile**, jiske liye user se **dark mode ka SS** chahiye
(light aur immersive approve ho chuke hain).

> Verification ke baare mein: har file ka contrast **naapa gaya** hai (composite over
> page/card/dialog-panel/chip, dono themes) — lekin naap markup ka hai, aankh ka nahi.
> Asli screen par teeno themes mein dekhna abhi baaki hai.

Ye doc ab *record* hai, to-do list nahi. §5 ka batch plan itihaas ke liye rakha hai —
usme jo "agla kaam" likha hai wo ho chuka; sach progress table hai.

**Post-cleanup consistency update (16-09-2026):** customer navigation ka `Profile` label ab
**Settings** hai, lekin established route `/profile` hi hai. Usi page ka login-free secure-upload
switch ab light page par bhi saaf dikhta hai: OFF state neutral opaque track + strong theme border,
ON state emerald, white thumb, keyboard focus ring, `role="switch"`, `aria-checked`, `aria-label`
aur saving ke waqt `aria-busy`. Shared `DashboardLayout` navigation source ke kaaran header aur
sidebar dono ek hi label render karte hain; koi parallel navigation/configuration nahi banayi gayi.

---

## 1. Rules (ye pehle padho)

1. **Pehle samjho → approval lo → phir code likho.** User Hinglish mein baat karta hai.
2. **Evidence = code padhna, grep ka count nahi.** Ye is project ki sabse mehngi galti rahi hai —
   §7 dekho. Kaam shuru karne se pehle hamesha poochho: *ise import kaun karta hai?*
3. **Screenshot maango, dono modes ke** (light aur immersive/dark). Ek mode ke bugs doosre mein
   nahi dikhte.
4. **`npm run build` mat chalao.** User ne mana kiya hai. Iske badle ye — wahi preset, do second mein:
   ```bash
   NODE_ENV=development node -e "require('@babel/core').transformFileSync('<file>',{presets:[require.resolve('E:/merasoftware-new/frontend/node_modules/babel-preset-react-app')]})"
   ```
5. **Backup pehle**: `frontend/src/_backup_<kaam>_workN/`.
6. **Admin panel ko haath mat lagao** — §3 mein kaun-si file admin ke saath share hoti hai wo likha hai.
7. **Sirf jo maanga hai wahi karo.**
8. **Docs update tab jab user "perfect" kahe** — ya jab wo khud bole.

---

## 2. System jo ban chuka hai (isi ko use karo, naya mat banao)

Sab kuch teeno themes (immersive / dark / light) mein maujood hai.

### Tokens — `index.css` (COLOUR KA SSOT)

```
Geometry   --surface-radius (1rem)   --surface-radius-sm (.75rem)
           --surface-radius-panel (1.5rem)   --surface-radius-lg (2rem)   --surface-radius-pill
           --surface-blur   --surface-blur-strong        (light mein `none`)
Dialog     --backdrop-bg   --backdrop-blur
Badges     --badge-{success|pending|error|neutral}-{bg|fg|border}
Tiles      --metric-bg   --metric-border
Misc       --eyebrow-fg   --glow-accent   --glow-neutral
```

**Recipe classes** (`@layer components`): `.surface` + `-subtle/-strong/-sm/-panel/-lg/-pill/-metric/-dialog`,
`.modal-backdrop`, `.badge` + 4 tones.

### Components

| Component | API | Kab use karo |
|---|---|---|
| `Surface.js` | `tone` base/subtle/strong/metric · `size` **flush**(default)/card/compact · `radius` card/sm/panel/lg/pill · `sheen` · `as` | har card / panel |
| `Badge.js` | `tone` success/pending/error/neutral · `size` sm/md · `icon` | har status pill |
| `Modal.js` | `open` `onClose` `eyebrow` `title` `footer` `size` sm/md/lg/xl · Escape + scroll-lock + mobile sheet | har dialog |
| `GlassButton.js` | `variant` glass/primary · `size` sm/md/lg · `as` · `strong` | har button |
| `OrderList` (`OrderListRow.js`) | `title` `icon` `toolbar` `actions` `items` `onOpen` `loading` `empty` `emptyIcon` `as` · **`columns`** · **`renderRow`** | koi bhi list panel |

**Prove ho chuke hain**: `Surface`/`Badge`/`GlassButton` 12 pages par · `Modal` 3 jagah (invoice ka
payment dialog, logout confirm, upload loader) · `OrderList` 3 list panels par.

### Do baatein jo bhoolne par waqt zaya hota hai

**Light mode mein page cards ka blur band hai** (`--page-decoration: none`, ground flat `#e8edf3`) —
flat colour ko blur karne se wahi flat colour milta hai; depth border + shadow se aati hai.
**Lekin dialog ka blur light mein bhi chalta hai** (`.surface-dialog`), kyunki uske peeche asli
content hota hai.

**Blur tokens CSS classes se consume hote hain, Tailwind utility se nahi.** `--surface-blur` ka
value `blur(16px) saturate(180%)` hai — spaces hain, aur nested v3.4.17 aisi arbitrary utility
parse nahi karta (`backdrop-blur-[var(--surface-blur)]` chup-chaap **kuch emit nahi karta**).
`var()` bina space ke theek hai: `bg-[var(--menu-bg)]`, `sm:rounded-b-[var(--surface-radius-lg)]`.

### Badge tones ka naap — 10-09-2026 ko theek hua

`index.css` ka comment daawa karta tha ki light ke `emerald-700`/`amber-700` foregrounds "clear
4.5:1 on their own tint". **Wo galat tha.** Wajah: badge sirf dialog par nahi baithta — card par
bhi baithta hai aur seedhe page par bhi, aur **page sabse gehra ground hai**. Teeno par naapa:

```
                  page    card   dialog
  emerald-700     4.23    4.70    4.91     <- page par fail
  amber-700       3.90    4.33    4.51     <- page AUR card dono par fail
  emerald-800     5.92    6.59    6.88     <- ab yahi hai
  amber-800       5.51    6.12    6.36     <- ab yahi hai
```

`--badge-success-fg` ab emerald-800, `--badge-pending-fg` ab amber-800. `error` aur `neutral` pehle
se teeno grounds par clear the — unhe chhua nahi. Dark/immersive blocks bilkul unchanged.

**Sabak**: koi bhi token naapte waqt **teeno grounds** par naapo — page, card, dialog. Ek ground par
pass hona kaafi nahi.

### FILL/BORDER RULE (user ne diya, naapkar confirm hua)

> Fill aur border hamesha **ek hi hue**. Border wahi rang **zyada ghana** — translucent fill par
> zyada alpha (`.15` → `.30`), opaque fill par darker shade (`-50` → `-200`).

**Ikloti chhoot**: light mode ka neutral glass. White fill par white border `#e8edf3` page ke
against **1.04:1** deta hai — koi kinaara nahi. Isliye light ke neutral surfaces slate border lete
hain. Coloured tokens (badges, danger) light mein bhi rule follow karte hain.

---

## 3. ADMIN SAFETY — ye galti mehngi padegi

Teen files **admin aur customer dono** render karti hain. Inme change karo to admin ka branch
chhuo mat:

| File | Kaise gate hota hai | Halat |
|---|---|---|
| `components/PortalHeader.js` | `c(adminClass, themedClass)` — `showThemeSwitch` prop se | ✅ customer side ho chuka |
| `components/MobileSidebarDrawer.js` | `c(adminClass, themedClass)` — `themed` prop se | ✅ ho chuka |
| **`pages/ProjectDetails.js`** | `g(adminClass, customerClass)` — **`isAdminView` prop se**, 93 jagah | ⏳ **pending** |
| **`components/OrderLifecycleTimeline.js`** | `dark` prop — par `ProjectDetails` ise `dark={!isAdminView}` deta hai, yaani ye bhi **admin/customer** switch hai, theme nahi | ⏳ **pending** |
| **`components/ProjectServiceWorkspace.js`** | `ProjectDetails` ke andar se hi render hota hai | ⏳ **pending** |

`ProjectDetails` `adminRoutes.js` par `isAdminView={true}` ke saath aur `customerRoutes.js` par
bina prop ke render hoti hai. `g()` ka **pehla argument admin ka hai — usse kabhi mat chhedo.**

**Admin-safety padhkar nahi, render karke prove karo.** Purani aur nayi file ko admin props se
SSR karke markup diff karo (class tokens sort karke), aur "identical: true" dekhkar hi aage badho.
Script ka dhaancha:

```js
// frontend/ ke andar se chalao (node_modules resolve hone ke liye)
const babel=require('@babel/core'),fs=require('fs'),Module=require('module'),path=require('path');
const preset=require.resolve('babel-preset-react-app');
const o=Module._extensions['.js'];
Module._extensions['.js']=function(m,f){ if(f.includes('node_modules'))return o(m,f);
  return m._compile(babel.transformSync(fs.readFileSync(f,'utf8'),{filename:f,presets:[preset],envName:'development'}).code,f);};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{MemoryRouter}=require('react-router-dom');
const norm=h=>h.replace(/class="([^"]*)"/g,(m,c)=>'class="'+c.trim().split(/\s+/).sort().join(' ')+'"');
// purani copy components/ ke andar temp naam se rakho taaki relative imports resolve hon
```
Chalane ke liye `NODE_ENV=development` chahiye.

---

## 4. Har file par kya karna hai — yahi 5 cheezein

1. **Status map → `Badge` tone.** Har page ne apna map likha hai, sab ek hi galat shape mein:
   `border-emerald-400/40 bg-emerald-500/20 text-emerald-300`. Ye dark page ke liye chuna gaya tha —
   **light page par 1.21:1 naapa gaya hai**, yaani text lagbhag gayab. Isiliye aaj tak report nahi hua.
2. **Card containers → `Surface`.** `border + bg + shadow + backdrop-blur + rounded-[apna number]`
   hatao. Hand-written sheen div bhi hatao — `Surface sheen` deta hai.
3. **Dialogs → `Modal`.** Aur uska scrim `.modal-backdrop`.
4. **Buttons → `GlassButton`.** Khaas taur par `bg-emerald-600 text-[var(--text-primary)]` aur
   `bg-red-600 text-[var(--text-primary)]` — light mode mein `--text-primary` dark slate hai, yaani
   **gehre fill par gehra text**. Ye har pending page par milega.
5. **Colour ko meaning do.** Rang sirf jab wo sach mein status ho — raqam, type, label, sender ki
   pehchaan par nahi. Status badge par **icon mat lagao**: portal ka canonical status badge
   (projects list) mein kabhi nahi tha.

### Migration ka tareeqa jo regressions se bachata hai

Backup → container replace → **closing tags line-number se theek karo** → Babel compile → 4 check.

**JSX nesting ka andaza mat lagao.** Open tag regex se badalne ke baad closing `</div>` waise hi
reh jaata hai — ye sabse aam galti hai. Indentation se dhoondho, phir line number se badlo.

`AnimatedSection` jaise wrappers **hataao mat** — `as` prop se preserve karo (ek baar mount
animation chala gaya tha).

**Har file ke baad ye 4 check** (`frontend/src/` se):

```bash
F=pages/PlanDetails.js
# 1. compile
NODE_ENV=development node -e "require('@babel/core').transformFileSync('$F',{presets:[require.resolve('E:/merasoftware-new/frontend/node_modules/babel-preset-react-app')]})"
# 2. raw colours bache? (hits sirf comments mein hone chahiye)
grep -nE '\b(bg|text|border|ring)-(emerald|amber|red|rose|blue|sky|violet|purple)-(50|100|200|300|400)\b' $F
# 3. tag balance
for t in Surface Badge Modal GlassButton; do echo "$t: $(grep -o "<$t" $F|wc -l) open / $(grep -o "</$t>" $F|wc -l) close"; done
# 4. unused imports — mile to BACKUP se check karo ki pehle se to nahi tha
```

**CSS badalne ke baad** (`index.css`) — ye check `--tint-rgb` pakad chuka hai, ek token jo kahin
define hi nahi tha aur dashboard ka glow chup-chaap gayab kar raha tha:

```bash
python - <<'PY'
import re,io
s=io.open('index.css',encoding='utf-8').read()
t=re.sub(r'/\*.*?\*/','',s,flags=re.S)
print("braces:",t.count('{')==t.count('}'))
refs=set(re.findall(r'var\((--[a-z0-9-]+)',t)); defs=set(re.findall(r'^\s*(--[a-z0-9-]+)\s*:',t,flags=re.M))
print("undefined vars:",sorted(refs-defs))
PY
```

**Contrast naapne ke liye** (koi bhi colour faisla lene se pehle):

```python
def lum(c):
    def f(x):
        x=x/255
        return x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4
    r,g,b=c; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    l1,l2=sorted([lum(a),lum(b)],reverse=True); return (l1+0.05)/(l2+0.05)
def over(fg,a,bg):   # translucent fg par bg
    return tuple(round(fg[i]*a+bg[i]*(1-a)) for i in range(3))
# grounds: light page (232,237,243) · dark page (2,6,23) · light card (249,250,252)
```

---

## 5. BACHA HUA KAAM — batch plan

Ginti 07-09-2026 ko scan se nikali hai. **status** = light mode mein tootne wale status colours,
**solid** = `bg-*-600/700` par `--text-primary`, **cards** = `Surface` par aane wale containers,
**dialogs** = `fixed inset-0` overlays.

### Pehle ye samajh lo: page file != screen

Kuch page apni UI khud nahi rakhte, component mein rakhte hain. Isliye "page migrate ho gaya" aur
"screen migrate ho gayi" ek baat nahi hai. Har pending page ka asli render path (10-09-2026 ko scan
kiya gaya):

| Page | Uske apne components jo abhi pending hain |
|---|---|
| `ProjectDetails` | `ProjectServiceWorkspace` · `OrderLifecycleTimeline` · `PaymentAlert` · `UploadedDataList` · `AddServiceModal` · `UpdateRequestModal` |
| `PlanDetails` | `UploadedDataList` · `UpdateRequestModal` |
| `UserUpdateDashboard` | `UpdateRequestModal` |
| `ServicePlanDetail` | `GlassPageState` |
| `StartNewProjectDetail` | `ProjectDetailView` ← **iski poori UI yahan hai** |
| `StartNewWebsiteCustomize` · `DirectPayment` · `CompleteProfile` · `InstallmentPayment` · `StartNewWebsiteBuild` | — apni UI khud rakhte hain |

Aur do component un pages ke hain jo **already ho chuke** — unke bina wo screens aaj aadhi nayi
aadhi purani hain:

| Component | Kiska hissa |
|---|---|
| `TicketsList` · `CreateTicket` | `ContactSupport` — page done tha, render path nahi. **Ab dono ho chuke (2A.1).** |

Isliye Phase 2 ka kaam shuru mein 10 pages ka nahi, **10 pages + 9 components** ka tha.
Aaj kya bacha hai — upar wali progress table dekho, wahi SSOT hai.

---

### Progress — 10-09-2026

| Batch | Files | Halat |
|---|---|---|
| 2A.1 support screen | 2 | ✅ ho chuka |
| 2A.2 start-new-project | 2 | ✅ ho chuka |
| 2A.3 simple pages | 3 | ✅ ho chuka |
| 2A.4 installment + updates + dialog | 3 | ✅ ho chuka |
| 2A.5 website customize | 1 | ✅ ho chuka |
| 2A.6 plan + service plan | 3 | ✅ ho chuka |
| 2B.1 PaymentAlert | 1 | ✅ ho chuka |
| 2B.2 ProjectServiceWorkspace | 1 | ✅ ho chuka |
| 2B.3 AddServiceModal | 1 | ✅ ho chuka |
| 2B.4 UploadedDataList | 1 | ✅ ho chuka (SSR diff pass) |
| 2B.5 OrderLifecycleTimeline | 1 | ✅ ho chuka (SSR diff pass) |
| 2B.6 ProjectDetails | 1 | ✅ ho chuka (SSR diff pass) |

**Ho chuka**: 20 files, 9,088 lines · **Baaki**: 0 — PHASE 2 KHATAM (15-09-2026).

*15-09-2026: poora Phase 2 ek session mein. Har file par contrast NAAPA gaya (composite over page/card/dialog-panel/chip, dono themes) — grep se nahi, kyunki grep batata hai token laga ya nahi, ye nahi ke wo token wahan kaam karta hai. Usi naap se 4 aise bug mile jo sirf padhne se nahi dikhte: `focus:border-emerald-400/60` = 1.42 light (focus ring gayab), `hover:text-rose-400` = 2.42, PDF icon `rose-300` = 1.84, Word icon `sky-300` = 1.62. Tool: scratchpad/contrast.js.

**2B ka SSR diff — jo seekha:** harness ko `.css`/image imports stub karne padte hain, aur `ProjectDetails` ko teen provider chahiye (redux, `OnlineStatusContext`, `DraftOrdersContext`). Sabse zaroori: **agar dono taraf render FAIL ho to output barabar aata hai aur "identical: true" ek jhootha pass ban jaata hai** — harness ab error par pass nahi deta. `ProjectDetails` ka customer control bhi jhootha barabar deta hai, kyunki bina `orderId` ke wo region mount hi nahi hota; asli proof string-count se liya: har customer-arg value badli, har admin-arg value (`text-amber-800`, `bg-amber-50`, `text-emerald-700`, `bg-emerald-100`, `text-emerald-800`, `border-amber-300`) count ke saath waisi ki waisi.

**SS-1 (Payment Pending banner) theek ho gaya** — `ProjectDetails.js:975-995`. **SS-2 (Upload Data dialog) 2A.4 mein theek hua.** §5a ke dono confirmed bug band.

**`OrderLifecycleTimeline` ka `dark` prop hataya nahi gaya** — wo abhi bhi admin/customer switch hai, sirf uske chaar toote chip `badge-*` par aa gaye aur paanch dead ternary (dono branch same string) hat gaye.*

2A aur 2B ke beech koi dependency nahi — dono saath chal sakte hain.

---

## PHASE 2A — customer-only files (14 files)

Ismein koi file admin ke saath share nahi hoti, isliye SSR diff ki zaroorat nahi. Tez chalega.

### 2A.1 — support screen ✅ HO CHUKA (10-09-2026)

`CreateTicket.js` → `Modal` par. Uska scrim `bg-[var(--glass-bg-subtle)]` tha — wo ek *surface fill*
hai, backdrop nahi, yaani peeche ka page kabhi dim hota hi nahi tha. "You already have an open
ticket" 1.03:1 se 4.51:1 par aaya.

`TicketsList.js` → `bg-yellow-100 text-yellow-800` / `bg-blue-100 text-blue-800` badges (opaque
patch, theme ignore karte the; blue palette mein hai hi nahi) ab `Badge` tones par — wahi map jo
`TicketDetail.js` mein hai. Panel → `Surface`, teen buttons → `GlassButton`.

**Yahan ek portal-wide bug nikla** — `index.css` ke do light badge tones naap par khare nahi utar
rahe the. §2 ka "Badge tones ka naap" dekho.

### 2A.2 — start-new-project screen ✅ HO CHUKA (10-09-2026)

`ProjectDetailView.js` → panel `Surface` par, teen buttons `GlassButton` par.

**Ek live bug mila**: feature selection ka state `border-emerald-500 bg-emerald-50/60` tha — ek
opaque light fill. Naapa: dark card par **6.63:1** (lit patch), light card par **1.00:1** — yaani
light mode mein customer ko dikhta hi nahi tha ki usne kya select kiya. Ab border + ring se aata
hai, jo dono grounds par kaam karta hai.

Package name ka `text-emerald-300` (light 1.46:1) hataya — wo naam hai, status nahi.

`StartNewProjectDetail.js` mein bhi kaam nikla — "Project not found" card + button. Plan kehta tha
"shayad kuch badalna na pade"; file kholne par nikla. **Page ko kabhi bina khole skip mat karo.**

### 2A.3 — simple pages, koi component dependency nahi (3 files, 1,953 lines)

| Page | File | Lines | status | solid | cards |
|---|---|---|---|---|---|
| Website build | `StartNewWebsiteBuild.js` | 469 | 19 | 0 | 9 |
| Complete profile | `CompleteProfile.js` | 640 | 9 | 6 | 0 |
| Direct payment | `DirectPayment.js` | 844 | 2 | 2 | 1 |

`CompleteProfile` aur `DirectPayment` dono payment/onboarding flow ke hain — saath karo.

### 2A.4 — installment + updates dashboard + update-request dialog (3 files, 1,531 lines)

| File | Lines | status | solid | dialogs |
|---|---|---|---|---|
| `pages/InstallmentPayment.js` | 527 | 9 | 8 | **2** |
| `pages/UserUpdateDashboard.js` | 487 | 7 | 6 | 1 |
| `components/UpdateRequestModal.js` | 517 | 6 | — | 2 |

**`UpdateRequestModal` teen pages use karte hain** — `UserUpdateDashboard`, `PlanDetails` (2A.6) aur
`ProjectDetails` (2B). Yahan isliye hai kyunki ye teeno mein sabse pehle aata hai; iske bina 2A.6
aur 2B ke migrated page par purana dialog khulega.

**Ye customer-only hai, admin-shared NAHI** — `ProjectDetails` ise `{updateModalOpen && !isAdminView && (...)}`
ke andar render karta hai, aur baaki do pages mein admin ka koi rasta hai hi nahi. Isliye ye 2A mein
hai, 2B mein nahi.

Iske scrims session 3 mein theek ho chuke hain (do the: `/60` aur `/30`). Bacha hua kaam: uska
**hardcoded dark gradient scene** — §6 ka faisla dekho, **bina poochhe mat badalna**.

`InstallmentPayment` ke do dialogs ke scrim alag hain (`/60` aur `/30`). Iska payment dialog
`InvoiceDetailPage.js` (done) wale se milta-julta hai — wahan ka `Modal` conversion reference hai.

### 2A.5 — website customize (1 file, 1,015 lines)

`StartNewWebsiteCustomize.js` — 34 status colours, 9 cards, 2 dialogs, **koi solid-fill bug nahi**.
Un 34 mein se 21 sirf `border-emerald-400/300` hain (selection state), toh kaam ginti se kam hai.

> User ka layout rule iss page par lagu hai: **frameless full-page glass sheet** (koi box nahi,
> `overflow-hidden` nahi taaki dropdown clip na ho) + responsive doc-grid + `border-t` sections.
> Ise todna mat.

### 2A.6 — plan + service plan (3 files, 1,121 lines)

| File | Lines | Note |
|---|---|---|
| `components/GlassPageState.js` | 33 | `ServicePlanDetail` isse use karta hai — pehle karo |
| `pages/ServicePlanDetail.js` | 528 | 12 cards, 2 dialogs |
| `pages/PlanDetails.js` | 560 | layout comment: "same skeleton as ProjectDetails.js" |

`PlanDetails` pehle karo, phir 2B mein `ProjectDetails` ko usse match karao — ulta karoge to do
baar kaam hoga.

**2A ke baad**: 22 mein se 21 pages done, sirf `ProjectDetails` ka gucchha bacha.

---

## PHASE 2B — admin-shared files (6 files)

**Yahan har file admin panel bhi render karta hai.** Rule #6 seedha lagu hota hai, aur har change ke
baad §3 wala SSR diff chalana hai. Isliye ye alag phase hai — tarika alag hai, raftaar alag hai.

### Admin kis raste se pahunchta hai (10-09-2026 ko verify kiya)

| File | Lines | Admin ka rasta | Apna gate |
|---|---|---|---|
| `pages/ProjectDetails.js` | 1469 | `adminRoutes.js` → `isAdminView={true}` | `g()`, **93 call sites** |
| `components/UploadedDataList.js` | 125 | **do raste** — `ProjectDetails` se, aur `AdminClientWorkspace` → `ClientSubmissionsPanel` se | `theme` prop: `'glass'` / `'light'` |
| `components/OrderLifecycleTimeline.js` | 151 | `ProjectDetails` se | `dark` prop |
| `components/ProjectServiceWorkspace.js` | 112 | `ProjectDetails` se | **koi nahi** — parent par bharosa |
| `components/PaymentAlert.js` | 90 | `ProjectDetails` se | **koi nahi** — parent par bharosa |
| `components/AddServiceModal.js` | 639 | `ProjectDetails` se | **koi nahi** — parent par bharosa |

### Teen files ka apna gate nahi hai — matlab kya

`ProjectServiceWorkspace`, `PaymentAlert` aur `AddServiceModal` mein `isAdminView`/`theme`/`dark`
jaisa kuch nahi hai. Ye **parent ke guard par chalte hain**, aur wo guard aaj kya hai:

| Component | ProjectDetails mein guard |
|---|---|
| `ProjectServiceWorkspace` | `shouldShowServiceWorkspace = !isAdminView && ...` |
| `AddServiceModal` (line ~812) | usi `shouldShowServiceWorkspace` block ke andar |
| `AddServiceModal` (line ~1451) | `{!isAdminView && (...)}` |
| `PaymentAlert` | `ProjectDetails` ke customer branch mein |

**Yaani teeno practically customer-only hain** — admin inhe aaj render karta hi nahi. Phir bhi ye 2B
mein hain, 2A mein nahi, do wajah se:

1. Ye guard `ProjectDetails` ke andar hai, component ke andar nahi. Agar kal koi guard hata de, ye
   seedhe admin par chale jayenge. Inka theek hona `ProjectDetails` ke saath bandha hua hai.
2. Inhe `ProjectDetails` se pehle chhoona matlab ek hi screen ko do baar chhedna.

**Iska faayda**: in teeno par SSR diff ki zaroorat nahi — admin inhe render hi nahi karta. Sirf
`ProjectDetails`, `UploadedDataList` aur `OrderLifecycleTimeline` par SSR diff lazmi hai.

### Kaam ki tarteeb

**2B.1 — `PaymentAlert`** ✅ HO CHUKA (10-09-2026)
90 lines mein sirf 1 token tha. `bg-blue-50` / `bg-amber-50` opaque fills the — dark page ke against
**18.5:1**, yaani lit slab. Ab `Surface tone="subtle"` + `badge badge-pending` icon tile.
Button `bg-amber-600` + `--text-primary` tha: light 5.60:1 par **dark 3.04:1** — ab `GlassButton`
primary. Dono states (verification pending / payment due) asli status hain, isliye rang raha —
sirf shakal badli.

**2B.2 — `ProjectServiceWorkspace` (112 lines)** ← 2B ka agla kaam
15 token pehle se hain, 4 opaque patch bache hain. SSR diff nahi chahiye (§ upar wali table).

**2B.3 — `AddServiceModal` (639 lines)**
49 token pehle se, 3 opaque patch, 1 dialog → `Modal` par. SSR diff nahi chahiye.
Ise `ProjectDetails` se pehle karna zaroori hai warna migrated page par purana dialog khulega.

**2B.4 — `UploadedDataList` (125 lines)** ⚠️ SSR DIFF LAZMI
`theme` prop `'glass'` (customer) vs `'light'` (admin) chunta hai, aur
`getRequestStatusMeta(attempt.status, theme)` bhi isi par chalta hai. **Sirf `'glass'` branch
badlo.** Ye ikloti 2B file hai jise admin apne alag rraste se (`ClientSubmissionsPanel`) render
karta hai, isliye yahan galti sabse mehngi hai.

**2B.5 — `OrderLifecycleTimeline` (151 lines)** ⚠️ SSR DIFF LAZMI
Iska `dark` prop **theme nahi hai** — `ProjectDetails` ise `dark={!isAdminView}` deta hai. Matlab
customer ko hamesha dark palette milta hai chahe usne light theme chuni ho, aur isiliye iske 4 chips
aaj light mode mein toote hue hain (1.23:1). Palette object aisa hai:
```js
tone: { light: 'text-emerald-700 bg-emerald-100', dark: 'text-emerald-300 bg-emerald-500/15' }
const tone = dark ? meta.tone.dark : meta.tone.light;
```
`Badge` tones par lao aur `{light, dark}` object hata do. Paanch jagah (**lines 80, 112, 116, 134,
139**) `dark ? A : B` ki dono branch same string hai — wo dead ternary hain.

**2B.6 — `pages/ProjectDetails.js` (1469 lines)** ⚠️ SSR DIFF LAZMI, SABSE AAKHIR
Jab uske paanchon component ho chuke hon. `g(adminClass, customerClass)` **93 jagah** —
**sirf doosra argument badlo**. Har change ke baad §3 wala SSR diff `isAdminView={true}` ke saath.

### 2B ke baad

Phase 2 khatam. §11 ke teen `CODEBASE_MAP.md` fixes karne hain.

---

## Do phase kyun, aur is tarteeb mein kyun

- **2A mein koi admin risk nahi.** 14 files, tez, har ek ke baad sirf 4 check.
- **2B ki chhe mein se teen par SSR diff lazmi hai** (`ProjectDetails`, `UploadedDataList`,
  `OrderLifecycleTimeline`) — baaki teen aaj customer-only guard ke peeche hain. Ise 2A ke saath
  milane se raftaar girti hai aur dhyaan bantta hai.
- **Dependency ki tarteeb**: `GlassPageState` → `ServicePlanDetail` (2A.6 ke andar), aur
  `PlanDetails` → `ProjectDetails` (2A.6 se 2B). Iske alawa 2A aur 2B ke beech koi dependency nahi —
  yaani 2A akele poora ho sakta hai.
- **2A ke baad 21/22 pages done ho jayenge** — yaani agar kaam beech mein ruka bhi, to sirf ek
  screen purani rahegi, 10 nahi.

---

## 5a. SS SE MILE ISSUES — user verify kar raha hai (session 5, 11-09-2026)

**Ye section abhi bhar raha hai.** User screenshots bhej raha hai, main naapkar yahan likh raha
hoon. **Iss section par abhi koi code nahi likhna** — user ne kaha "pehle SS dekh lo, then working
start karenge". Jab user bole tab batch plan (§5) ke saath merge karke tarteeb tay hogi.

Har entry mein: kaunsi screen · kaunsa mode · exact file:line · naapa hua contrast · wajah.

---

### SS-1 — Project Details: "Payment Pending" banner (light mode)

**Screen**: `/project-details/:id` — customer view, Light theme
**File**: `pages/ProjectDetails.js` lines **975–995** · batch **2B.6**

| Line | Element | Class (customer branch) | Light | Dark |
|---|---|---|---|---|
| 977 | "Payment Pending" heading | `text-amber-200` | **1.04:1** | 13.29:1 |
| 981 | Body text | `text-amber-100/90` | **1.15:1** | 12.25:1 |
| 991 | "Proceed for payment" link | `text-amber-200` | **1.04:1** | 13.29:1 |

Fill: `bg-amber-500/15` light page par `rgb(234 225 208)` banta hai. Uspar `amber-200` rakhna
matlab peele par peela — SS mein teeno lines gayab dikhti hain.

**Root cause — ye `g()` ka structural bug hai, sirf ek galat shade nahi:**

```js
g('...border-amber-300 bg-amber-50...',   '...border-amber-400/40 bg-amber-500/15...')
//  ^ arg1 = ADMIN                          ^ arg2 = CUSTOMER
```

`g()` **admin vs customer** switch hai, **light vs dark nahi**. Admin ko `amber-800 on amber-50`
milta hai = **6.84:1, theek hai**. Customer ko hamesha wo branch milti hai jo dark ke liye likhi
gayi thi — chahe usne Light theme chuni ho. Isiliye ye banner **sirf customer ke light mode mein**
tootta hai; admin panel mein wahi banner saaf padha jaata hai.

**Yahi 93 `g()` call sites ka pattern hai.** Fix = arg2 ko token-based karo (`badge badge-pending` /
`Surface tone="subtle"`), arg1 ko haath mat lagao.

---

### SS-2 — Upload Data dialog: hardcoded green scene (light mode)

**Screen**: `/project-details/:id` → "Upload Data" → `UpdateRequestModal`, Light theme
**File**: `components/UpdateRequestModal.js` line **266** · batch **2A.4**
**Note**: ye wahi cheez hai jo §6 ka faisla #1 hai. **Ab SS se confirm ho gaya ki ye sirf
"design choice" nahi, readability bug hai.**

Line 266 ka outer frame teeno themes mein ek hi hardcoded gradient hai:
```
bg-[radial-gradient(120%_120%_at_15%_0%, #1f6d54 0%, #143b3a 45%, #0d1b26 100%)]
```
Line 268 ka inner modal uspar `rgba(20,26,32,0.55)` — yaani inner fill banta hai `rgb(20 41 44)`,
lagbhag kaala. Wo **theme ke saath nahi badalta**, par uske andar ka saara text tokens se aata hai —
aur light theme mein wo tokens **dark slate** ho jaate hain.

| Token | Kahan dikhta hai | LIGHT | DARK/IMM |
|---|---|---|---|
| `--text-primary` `rgb(15 23 42)` | "Click to upload…", file ka naam, body | **1.18:1** | 15.18:1 |
| `--text-secondary` `rgb(51 65 85)` | "Only JPG images, PDF…", "Please provide clear instructions" | **1.47:1** | 10.23:1 |
| `--text-muted` `rgb(100 116 139)` | "UPLOAD FILES" / "UPLOADED FILES" / "INSTRUCTIONS" eyebrows | **3.19:1** | 5.92:1 |

**SS se match**: screenshot mein eyebrows (3.19) halke-se padhe ja rahe hain, par description lines
aur "Click to upload or drag and drop (1/20)" aur file ka naam `3G Digital brochure-1.pdf`
lagbhag gayab hain — wahi 1.18–1.47 wali lines hain.

**Ulta case — header**: `h3 "Upload Data"` saaf dikh raha hai (8.11:1) **sirf ittefaq se**. Uske
peeche line 270 ka sheen hai — `--glass-sheen` light mein `white/0.60` hai, jo inner fill ko
`rgb(163 178 175)` tak halka kar deta hai. Yaani header sheen ki wajah se bach gaya, baaki modal
nahi. **Isliye modal aadha padhne-layak aadha nahi dikhta.**

Do cheezein iske alawa:
- `Proceed to Confirmation` button (line ~500) apna solid green rakhta hai — wo dono modes mein
  theek hai, use chhedne ki zaroorat nahi.
- Close `X` button tokens par hai (`--glass-bg` + `--text-secondary`) — light mein wo bhi dark fill
  par dark icon ban raha hai.

**Faisla ho gaya (15-09-2026) — §6 #1**: scene **theme ke saath badlega**. Hardcoded gradient
hatega aur dialog `Modal` par aayega; force-dark tokens ka raasta reject. Aaj wala teesra raasta
(hardcoded scene + theme-following text) hi ye bug hai, aur `Modal` uska bana-banaya jawab hai.

---

## 6. Faisle jo user ke paas atke hain

1. ~~**`UpdateRequestModal` ka green gradient scene.**~~ ✅ **FAISLA HO GAYA (15-09-2026)**
   `bg-[radial-gradient(...#1f6d54, #143b3a, #0d1b26)]` — comment kehta tha "matches the mockup's
   .scene", yaani deliberate design tha. Problem: teeno themes mein ek jaisa dark rehta tha, toh
   **light mode mein safed page par dark slab khulta tha**, aur uske andar ka text tokens se aata
   tha — 1.18:1 (§5a SS-2).
   **User ka faisla: scene theme ke saath badlega.** Yaani hardcoded gradient hataya jayega, aur
   dialog `Modal` par aayega — wahi primitive jo ye sawal pehle hi hal kar chuka hai (`Surface
   tone="strong"`, glass panel, naapa hua: dark 14.0:1 / light 16.1:1). Force-dark tokens ka
   raasta **reject** — koi naya scene token nahi banana, `Modal` hi jawab hai.
   Kaam batch **2A.4** mein.

2. **Metric tile ke dark/immersive tokens.** `--metric-bg` / `--metric-border` ki light values user
   ne dekhkar approve keen. Immersive SS se confirm ho gaya. **Dark mode ka SS abhi nahi mila.**
   Agar tile ka kinaara kamzor lage to **`--metric-border` gehra karo, motai mat badhao** — border
   ki motai ka apna token jaan-boojh kar nahi hai (`--glass-border-width` sab ke liye hai), aur
   motai badhane wali galti pehle ho chuki hai (§7).

---

## 7. DO / DON'T — har line kisi asli galti se aayi hai

### DON'T

| Mat karo | Kya hua tha |
|---|---|
| **Grep ke count par claim mat banao** | "267 cards" bola, asli **121** the. "10 modal components pending" bola — kholne par **7 ka koi consumer hi nahi tha**. Ye galti is project mein baar-baar hui hai. **`className` parse karo / file kholo, count mat karo.** |
| **Naam dekhkar duplicate mat maano** | `DarkMetricCard` ko `MetricCard` ka duplicate keh diya — code padha to bilkul alag nikle (na glow, na icon, na hover). |
| **Grep hit ko "established pattern" mat maano** | `rounded-t-[2rem]` 3 files mein mila → "portal ka modal corner" keh diya. Kholne par 2 to **page headers** the. |
| **Naap ke khilaf cheez bina bole mat banao** | User ne light mode mein white border maanga; naap kehta tha **1.04:1** (invisible). Bana diya, nahi dikha. "Mota karo" par 2.5px kiya, phir bhi nahi dikha — kami **contrast** ki thi, motai ki nahi. **Motai se contrast ki kami nahi bharti.** |
| **Jo kaam na kare uske upar apni cheez mat chipkao** | Us white border ke neeche bina poochhe ek dark ring add kar di. Natija: do lines, ek bekaar. Sahi kaam tha user ke paas wapas jaana — "white iss page par kaam nahi karta, dark chahiye?" |
| **"Farak nahi dikh raha" par turant code mat shak karo** | Do baar dev server ki wajah se round zaya hua — §8 dekho. **Pehle server ki umar dekho.** |
| **Sirf container badalkar "migrated" mat kaho** | `CustomerDashboard` ko migrated bola, par uske badges shared components se aate the — wo purane hi rahe. Page tab tak poora nahi jab tak uske **render path ka har hissa** na ho. |
| **JSX comment `{cond && (` ke turant baad mat daalo** | Wahan JSX *expression* aata hai, comment nahi — `Unexpected token, expected ","`. Ye 10-09 ko do baar hua. Comment ko `{cond && (` se **upar** rakho. |
| **JSX ka closing tag andaze se mat badlo** | Sabse aam compile-fail. Regex se open tag badla, closing `</div>` waise hi reh gaya. |
| **`AnimatedSection` jaise wrappers mat hatao** | `ProjectsAndPlans` ka mount animation ek baar chala gaya tha. `as` prop se preserve karo. |
| **`npm run build` mat chalao** | User ne mana kiya. §1 ka Babel one-liner wahi kaam do second mein karta hai. |

### DO

| Karo | Kyun |
|---|---|
| **Contrast naapo, phir bolo** | Har colour faisla — 1.21:1, 1.04:1, 14:1 — naap se saaf hua. §4 ki chhoti script kaafi hai. |
| **Dono modes ka SS maango** | `PROJECT` chip light mein 1.27:1 tha, dark mein 12.12:1. Ek hi mode dekhte to bug chhoot jaata. |
| **Har edit ke baad Babel se compile karo** | Har closing-tag galti isi se pakdi gayi, browser tak pahunchne se pehle. |
| **Admin-safety render karke prove karo** | §3 ka SSR diff. `c()`/`g()` ke pehle argument ko aankh se check karna kaafi nahi. |
| **Unused import ko backup se verify karo** | `ContactSupport` ka `toast` mera regression laga — backup dekha, pehle se tha. |
| **Pehle poochho ki cheez shared honi chahiye ya nahi** | `OrderList` aur `GlassButton` isi sawaal se nikle. Asli duplication pages ke **beech** thi, andar nahi. |
| **Galat nikalne par claim wapas lo** | Galat claim par kaam karna usse aur mehnga karta hai. |

---

## 8. Dev server — hot reload par bharosa mat karo

**Do baar** iski wajah se round zaya hua hai:

- Server 6 din purana tha aur changes uthana band kar chuka tha. User ne kaha "kahin koi farak nahi
  dikh raha" — code bilkul theek tha.
- File delete karne ke baad Tailwind ne `ENOENT: ... ImagePopup.js` phenka. Wo **stale file-list
  cache** thi — Tailwind start hote waqt `src/**/*.js` scan karke list banata hai aur har rebuild
  par us list ki har file `stat` karta hai. Error `index.css` par aata hai, JS par nahi. Restart se
  gaya.

Kuch bhi debug karne se pehle:
```bash
netstat -ano | grep ":3000"                                    # PID
powershell -NoProfile -Command "Get-Process -Id <PID> | Select-Object StartTime"
```
Start time aapke edits se purana ho → `taskkill /PID <pid> /F`, `npm start`, phir `Ctrl+Shift+R`.
**Diagnose tab karo.**

---

## 9. Backups

`frontend/src/` ke andar:

| Folder | Kya hai |
|---|---|
| `_backup_portal_surface_work1/` | `index.css` (Phase 0 se pehle) + `index.css.before_rule` |
| `_backup_portal_surface_work2/` | `Surface` `Badge` `Modal` `index.css` (Phase 1 fixes se pehle) |
| `_backup_portal_surface_work3/` | `CustomerDashboard` `ProjectsAndPlans` `WalletDetails` `OrderListRow` `PaymentStatusChip` `orderPresentation` `Surface` `index.css` |
| `_backup_portal_surface_work4/` | `UserInvoices` `CustomerDocuments` `Profile` `ContactSupport` `StartNewProject` |
| `_backup_portal_surface_work5/` | `CustomerDashboard` `OrderListRow` `orderPresentation` `PortalHeader` |
| `_backup_portal_surface_work6/` | `OrderPage` `OrderDetailPage` `TicketDetail` `InvoiceDetailPage` `OrderListRow` |
| `_backup_portal_surface_work7/` | modal components + `DashboardLayout` `MobileSidebarDrawer` `SpinningLoader` `DraftOrderSavedDrawer` `UpdateRequestModal` + dono DOCS |
| `_backup_dead_code_work1/` | 7 delete kiye gaye orphan components (1,635 lines) |
| `_backup_portal_surface_work8/` | `CreateTicket` `TicketsList` `ProjectDetailView` `StartNewProjectDetail` `PaymentAlert` `index.css` (session 4 se pehle) |

---

## 10. Do cheezein jo delete/rakhne ke faisle ho chuke hain

- **WhatsApp ke teen file (`components/QRModal.js`, `components/socket.js`,
  `backend/helpers/whatsappService.js`) — KABHI DELETE MAT KARNA.** Unused lagti hain kyunki
  feature band hai, unwanted isliye nahi. Owner ko ye working wapas chahiye.
  Poori tafseel: **`CODEBASE_MAP.md` §14a**.
- **7 orphan components delete ho chuke** (07-09-2026, 1,635 lines) — `RenewalModal`,
  `YearlyPlanDetailsModal`, `EditProfileModal`, `OrderDetailsModal`, `TransactionModal`,
  `ImagePopup`, `WalletRecharge`. Inhe dhoondhna mat; `CODEBASE_MAP.md` §14a mein record hai.

---

## 11. Phase 2 khatam hone par

✅ **Teeno ho chuke (15-09-2026).**

- ~~`Conversion status: complete.`~~ → ab sach hai aur likha hai ki pehle kyun nahi tha (26 pages
  done the, par das pages ki UI un components mein thi jo convert hue hi nahi the). Saath mein
  ye bhi likha hai ki verification **naapkar** hui, grep se nahi — aur admin safety **render
  karke** prove hui, padhkar nahi, dono jhoothe-pass ke jaal samet.
- ~~`emerald is dark in both themes`~~ → theek kar diya. Wo daawa sirf `emerald-600` fill ke liye
  sach tha; `emerald-300/400` light card par ~1.3–1.8:1 hain. Ab saaf likha hai ki status ka rang
  `--badge-*` ka kaam hai aur filled action `rgb(var(--ink-rgb))` + `var(--page-bg)` ka.
- §11a ka status update ho gaya, aur ek aur deliberate literal darj hua: `ProjectDetails` ka
  loading backdrop (`bg-black/10`) — admin ke saath share hota hai, koi gate nahi, isliye chhoda.
