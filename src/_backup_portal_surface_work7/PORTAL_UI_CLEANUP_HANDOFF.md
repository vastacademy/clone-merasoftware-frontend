# Portal UI Cleanup — Handoff

**Pehli baar banaya**: 06-09-2026 · **Aakhri update**: 07-09-2026 (session 2)
**Halat**: Phase 0 aur 1 poore. Phase 2 chal raha hai — **8 / 22 pages**.

---

## 1. Kaam karne ke rules (ye pehle padho)

1. **Pehle samjho → approval lo → phir code likho.**
2. **Evidence ke bina koi claim nahi** — aur *evidence ka matlab code padhna hai, grep ka count nahi*. Pichhli session ki sabse badi seekh yahi hai; §7 aur §8 dekho.
3. **Screenshot maango**, dono modes ke.
4. **`npm run build` mat chalao.** Iske badle ye — wahi preset jo build use karta hai, do second mein:
   `NODE_ENV=development node -e "require('@babel/core').transformFileSync('<file>',{presets:[require.resolve('babel-preset-react-app')]})"`
5. **Backup pehle**: `_backup_<kaam>_workN`.
6. **Admin panel ko haath mat lagao.** Naye components opt-in hain; admin unhe import nahi karta.
7. **Sirf jo maanga hai wahi karo.**
8. **Docs update tab jab user "perfect" kahe.**

---

## 2. Ho chuka — Phase 0: tokens (`index.css`)

Sab kuch teeno themes (immersive / dark / light) mein maujood hai.

```
Geometry   --surface-radius (1rem)   --surface-radius-sm (.75rem)
           --surface-radius-panel (1.5rem)   --surface-radius-lg (2rem)   --surface-radius-pill
           --surface-blur   --surface-blur-strong        (light mein `none`)
Dialog     --backdrop-bg   --backdrop-blur
Badges     --badge-{success|pending|error|neutral}-{bg|fg|border}
Tiles      --metric-bg   --metric-border
Misc       --eyebrow-fg   --glow-accent   --glow-neutral
```

**Recipe classes** (`@layer components`): `.surface` + `-subtle/-strong/-sm/-panel/-lg/-pill/-metric/-dialog`, `.modal-backdrop`, `.badge` + 4 tones.

### Do faisle jo yaad rakhne layak hain

**Light mode mein page cards ka blur band hai.** `--page-decoration: none` hai aur ground flat `#e8edf3` — flat colour ko blur karne se wahi flat colour milta hai. Depth border + shadow se aati hai. **Lekin dialog ka blur light mein bhi chalta hai** (`.surface-dialog`), kyunki uske peeche page ka asli content hota hai.

**Blur tokens CSS classes se consume hote hain, Tailwind utility se nahi.** `--surface-blur` ka value `blur(16px) saturate(180%)` hai — spaces hain, aur nested v3.4.17 aisi arbitrary utility parse nahi karta (`backdrop-blur-[var(--surface-blur)]` chup-chaap kuch emit nahi karta). `var()` bina space ke theek hai — `bg-[var(--menu-bg)]`, `sm:rounded-b-[var(--surface-radius-lg)]` — ye asli v3 binary se probe karke verify kiya.

### FILL/BORDER RULE (user ne diya, naapkar confirm hua)

> Fill aur border hamesha **ek hi hue**. Border wahi rang **zyada ghana** — translucent fill par zyada alpha (`.15` → `.30`), opaque fill par darker shade (`-50` → `-200`).

Portal ke 92 fill+border pairs mein se **92 same hue** hain — zero exception. Rule `index.css` mein `THE FILL/BORDER RULE` heading ke neeche likha hai.

**Ikloti chhoot**: light mode ka neutral glass. White fill par white border `#e8edf3` page ke against **1.04:1** deta hai — koi kinaara nahi. Slate border **1.52:1** deta hai. Isliye light ke neutral surfaces white fill par slate border lete hain. Coloured tokens (badges, danger) light mein bhi rule follow karte hain.

---

## 3. Ho chuka — Phase 1: components

| Component | API |
|---|---|
| `Surface.js` | `tone` base/subtle/strong/metric · `size` **flush**(default)/card/compact · `radius` card/sm/panel/lg/pill · `sheen` · `as` |
| `Badge.js` | `tone` success/pending/error/neutral · `size` sm/md · `icon` |
| `Modal.js` | `eyebrow` `title` `footer` `size` sm/md/lg/xl · Escape + scroll-lock · mobile sheet |
| `GlassButton.js` | `variant` glass/primary · `size` sm/md/lg · `as` · `strong` |
| `OrderList` (`OrderListRow.js` mein) | poora list panel — frame, title bar, column header, rows, loading, empty state |

### Design decisions jo evidence se aaye

- **`Surface` ka default padding `flush` hai.** 121 card-shaped glass sites mein se **80 par koi `p-*` hai hi nahi** — unka padding andar ki rows par hai. Default padded rakhna do-tihai migrations par `size="flush"` likhwata.
- **`radius` mein `card` (1rem) aur `panel` (1.5rem) alag hain.** Portal mein hamesha do size the — 64 chhote cards `2xl`, 33 bade panels `3xl`/`[1.75rem]`/`[2rem]`. Ek hi radius rakhne se dashboard aur projects ka list panel alag ho gaya tha (user ne pakda).
- **`Modal` ka panel glass hai, solid nahi.** Ek draft mein solid `--menu-bg` kiya tha, ye soch kar ki page ka text ghost karega. Naapa: glass panel par body text **14.0:1 (dark) / 16.1:1 (light)** — AAA se dugna. Dalil galat thi.
- **`Modal` ka reference `WalletDetails` ka recharge panel hai** — 17 in-page dialogs mein se ikloti jo theek thi (eyebrow + title, header ke neeche koi divider nahi, `p-5 sm:p-7`, 2rem corner, mobile sheet). User ne ise pasand kiya, isliye ye reference hai.
- **`--backdrop-bg` alag token hai, `--scrim` nahi.** `--scrim` ka kaam BG.png ko darken karna hai aur wo dark/light mein `transparent` hai — uspar dialog backdrop banate to 3 mein se 2 themes mein invisible hota.

---

## 4. Ho chuka — Phase 2: 8 / 22 pages

```
DONE   WalletDetails · CustomerDashboard · ProjectsAndPlans · UserInvoices
       CustomerDocuments · Profile · ContactSupport · StartNewProject
```

### Shared components jo migration ke dauran nikle (plan mein nahi the)

Asli duplication pages ke andar nahi, **unke beech** thi:

- **`OrderList`** — dashboard aur projects, dono ka list panel alag likha tha (frame, title bar, `OrderListHeader`, divide wrapper, empty state — sab duplicate). Sirf rows share hote the. Isiliye corner alag ho gaya tha aur kisi ko dikha nahi jab tak user ne dono page saath na dekhe. **Ab UI ka koi hissa page mein nahi hai** — page sirf heading, toolbar aur empty-state ka text deta hai.
- **`GlassButton`** — 27 hand-written glass buttons, **8 alag paddings**. Dashboard aur projects ke Refresh button ek hi row mein baithe the aur padding, border syntax, hover colour — teenon par alag the.
- **`orderPresentation.js` ka `TONE_CLASS`** ab Badge tones deta hai, classes nahi. Tones 5 se 4 hue (`active` blue tha → `success`).
- **`PaymentStatusChip`** ab `Badge` use karta hai.

### Asli bugs jo migration ne khole

- **`--tint-rgb` kahin define hi nahi tha** — dashboard ka neutral glow **kabhi render hi nahi hua**. Ab `--glow-neutral`.
- **Loader overlay `--scrim` par tha** — dark aur light dono mein `transparent`, matlab loading par koi dim nahi. Ab `.modal-backdrop`.
- **`OrderStatusBadge` mein `bg-blue-500 text-[var(--text-primary)]`** — light mein `--text-primary` dark slate hai, yaani blue fill par dark text.
- **`PROJECT` chip: `text-emerald-100` on `bg-emerald-500/25`** — light mein **1.27:1**, dark mein 12.12:1. Isiliye kisi ko nahi dikha.
- **Focus rings `ring-emerald-50`** — white light panel par invisible. Aur `focus-within:bg-white` dark mode mein field safed kar deta tha.

### Colour ko meaning dena — jo hataya

`Wallet balance`, `Total added`, `Total spent` (raqam hain, status nahi) · `SERVICES` card ka green highlight ("koi active kaam nahi" success nahi hai) · document ka **kism** (proposal/follow-up/agreement — label hai, status nahi) · `100% COMPLETE` chip (status column mein `Completed` pehle se tha — ek hi row mein do baar wahi baat) · blue/violet/purple har jagah se.

---

## 5. Bacha hua kaam

### Pages — 13 (+1 jisme kuch nahi)

| Page | Lines | Cards | Raw | Modals |
|---|---|---|---|---|
| `ProjectDetails` | 1469 | 43 | 14 | 1 |
| `StartNewWebsiteCustomize` | 1015 | 20 | 17 | 2 |
| `DirectPayment` | 844 | 1 | 1 | 1 |
| `CompleteProfile` | 640 | 1 | 4 | 1 |
| `PlanDetails` | 560 | 11 | 7 | 1 |
| `ServicePlanDetail` | 528 | 17 | 1 | 2 |
| `InstallmentPayment` | 527 | 6 | 5 | 2 |
| `UserUpdateDashboard` | 487 | 4 | 5 | 1 |
| `TicketDetail` | 478 | 11 | 3 | 0 |
| `StartNewWebsiteBuild` | 469 | 10 | 7 | 0 |
| `InvoiceDetailPage` | 460 | 10 | 8 | 2 |
| `OrderPage` | 413 | 7 | 1 | 0 |
| `OrderDetailPage` | 394 | 13 | 7 | 1 |
| `StartNewProjectDetail` | 98 | 2 | 0 | 0 ← kuch nahi karna |

### Modal components — 10, **ek bhi nahi hua**

`RenewalModal` (480 lines, 25 white/gray, **18 blue**) · `YearlyPlanDetailsModal` (262, **31 white**) · `EditProfileModal` (240, 14, 9 blue) · `OrderDetailsModal` (194, 13) · `TransactionModal` (187, 16) · `QRModal` · `GuestLoginModal` · `ImagePopup` (chhote) · `UpdateRequestModal` + `DraftOrderSavedDrawer` (pehle se tokens par — sirf `Modal` shell chahiye).

Paanch modals ka **token count zero** hai — wo theme system mein hain hi nahi. Shape aisa hai:

```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 ...">
  <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
    <div className="bg-blue-600 text-white px-6 py-4 ...">
```

`bg-white` dark mein lit slab · blue portal ke palette mein hai hi nahi · `rounded-lg` (8px) vs pages ka 16-32px.

### Shared components — 6

`PortalHeader` (198, **25 raw**) · `OrderLifecycleTimeline` (151, 10 raw) · `ProjectServiceWorkspace` (112, 9 raw) · `CreateTicket` (159) · `MobileSidebarDrawer` (42, 5 raw) · `TicketsList`/`ProjectDetailView`/`GlassPageState` (halka)

---

## 6. Har page par kya karna hai (yahi 4 cheezein, har jagah)

1. **Status map → `Badge` tone.** Har page ne apna map likha hai, jaise `'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'`. `-200`/`-300` text dark ground ke liye chuna gaya tha; light page par ~1.5:1.
2. **Card containers → `Surface`.** `border + bg + shadow + backdrop-blur + rounded-[apna number]` hata kar `<Surface>`.
3. **Modals → `Modal`.**
4. **Colour ko meaning.** Rang sirf jab wo sach mein status ho.

### Files kahan hain

Sab kuch `E:/merasoftware-new/frontend/src/` ke andar:

```
index.css                        saare tokens + recipe classes (COLOUR KA SSOT)
components/Surface.js            card
components/Badge.js              status pill
components/Modal.js              dialog
components/GlassButton.js        secondary + primary button
components/OrderListRow.js       OrderListRow + OrderListHeader + OrderList (poora panel)
components/PaymentStatusChip.js  Badge par ban chuka
helpers/orderPresentation.js     TONE_CLASS — status ka meaning -> Badge tone
pages/                           portal pages
DOCS/CODEBASE_MAP.md             purana map — §11a ki 2 lines galat hain (§9 dekho)
```

### Migration ka tareeqa jo kaam karta hai (regressions se bacha)

Backup → container replace → **closing tags line-number se theek karo** → Babel compile → char check.

JSX nesting ka **andaza mat lagao**. Open tag regex se badalne ke baad closing `</div>` waise hi reh jaata hai — ye sabse aam galti thi. Indentation se dhoondo, phir line number se badlo.

Hand-written sheen divs hatao (`Surface sheen` deta hai). `AnimatedSection` jaise wrappers `as` prop se preserve karo, hataao mat.

**Har page ke baad ye char chalao** (`frontend/src/` se):

```bash
F=pages/OrderPage.js

# 1. compile — build se 100x tez, wahi preset
NODE_ENV=development node -e "require('@babel/core').transformFileSync('$F',{presets:[require.resolve('E:/merasoftware-new/frontend/node_modules/babel-preset-react-app')]})"

# 2. raw colours bache? (hits sirf comments mein hone chahiye)
grep -nE '\b(bg|text|border|ring)-(emerald|amber|red|rose|blue|sky|violet|purple)-(50|100|200|300)\b' $F

# 3. tag balance — open == close hona chahiye
for t in Surface Badge Modal GlassButton; do
  echo "$t: $(grep -oE "<$t[ >]" $F|wc -l) open / $(grep -c "</$t>" $F) close"
done

# 4. unused imports — mile to BACKUP se check karo ki pehle se to nahi tha
```

**CSS badalne ke baad** (`index.css`):

```bash
python - <<'PY'
import re,io
s=io.open('index.css',encoding='utf-8').read()
t=re.sub(r'/\*.*?\*/','',s,flags=re.S)
print("braces:",t.count('{')==t.count('}'))
refs=set(re.findall(r'var\((--[a-z0-9-]+)',t))
defs=set(re.findall(r'^\s*(--[a-z0-9-]+)\s*:',t,flags=re.M))
print("undefined vars:",sorted(refs-defs))
PY
```

Ye `undefined vars` check hi tha jisne `--tint-rgb` pakda — ek token jo kahin define nahi tha aur dashboard ka glow chup-chaap gayab kar raha tha. **Har CSS edit ke baad chalao.**

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
# grounds: light page (232,237,243) · dark page (2,6,23)
```

---

## 7. DO / DON'T — is chat ke tajurbe se

Har line yahan ki kisi asli galti ya asli kaamyabi se aayi hai, kisi aam salah se nahi.

### DON'T

| Mat karo | Kyun — kya hua tha |
|---|---|
| **Grep ke count par claim mat banao** | "267 cards" bola, asli 121 the. Non-cards aur pills bhi gin liye the. **`className` parse karo, count mat karo.** |
| **Naam dekhkar duplicate mat maano** | `DarkMetricCard` ko `MetricCard` ka duplicate keh diya — code padha to bilkul alag nikle (na glow, na icon, na hover). |
| **Grep hit ko "established pattern" mat maano** | `rounded-t-[2rem]` 3 files mein mila → "portal ka modal corner" keh diya. Kholne par 2 to **page headers** the. |
| **Component ka ek hi variant mat maano** | Ek `--surface-radius` rakha; portal mein hamesha do the (64 chhote / 33 bade). Isne user ka pehle se match karta hua pair todh diya. |
| **Naap ke khilaf cheez bina bole mat banao** | User ne white border maanga, naap kehta tha 1.04:1 (invisible). Bana diya. Nahi dikha. |
| **Jo kaam na kare uske upar apni cheez mat chipkao** | White border ke neeche bina poochhe dark ring add ki. Do lines, ek bekaar. **User ne khud ise patch pehchana.** |
| **Motai se contrast ki kami mat bharo** | Border 1px→2.5px kiya, phir bhi nahi dikha. Kami contrast ki thi. |
| **"Farak nahi dikh raha" par turant code mat shak karo** | Ek poora round zaya hua — code theek tha, dev server 5 din purana tha. |
| **`npm run build` mat chalao** | User ne mana kiya. Babel one-liner (§1) wahi kaam do second mein karta hai. |
| **Sirf container badalkar "migrated" mat kaho** | `CustomerDashboard` ko migrated bola, par uske badges shared components se aate the — wo purane hi rahe. Page tab tak poora nahi jab tak uske render path ka har hissa na ho. |
| **JSX ka closing tag andaze se mat badlo** | Sabse aam galti. Regex se open tag badla, closing `</div>` waise hi reh gaya → compile fail. |
| **`AnimatedSection` jaise wrappers mat hatao** | `ProjectsAndPlans` ka mount animation ek baar chala gaya tha. `as` prop se preserve karo. |

### DO

| Karo | Kyun |
|---|---|
| **Contrast naapo, phir bolo** | Har colour faisla — 1.27:1, 1.04:1, 14:1 — naap se saaf hua. Ek chhoti python script kaafi hai. |
| **Dono modes ka SS maango** | `PROJECT` chip light mein 1.27:1 tha, dark mein 12.12:1. Sirf ek mode dekhte to bug chhoot jaata. |
| **Har edit ke baad Babel se compile karo** | Har closing-tag galti isi se pakdi gayi, browser tak pahunchne se pehle. |
| **Migration ke baad char check chalao** | raw-colour grep · tag balance (open == close) · unused imports · Babel compile |
| **Unused import ko backup se verify karo** | `ContactSupport` ka `toast` mera regression laga — backup dekha, pehle se tha. |
| **Pehle poochho ki cheez shared honi chahiye ya nahi** | `OrderList` aur `GlassButton` isi sawaal se nikle. Asli duplication pages ke **beech** thi, andar nahi. |
| **Token ki wajah marte hi token hatao** | `--metric-border-width` white-border daur ka bacha tha; border theek hone par uski wajah khatam thi. |
| **Galat nikalne par claim wapas lo** | Do "corrections" maine khud wapas leen (`MetricCard` merge, solid modal panel). Galat claim par kaam karna usse aur mehnga karta hai. |

---

## 8. Wo paanch galtiyan, tafseel se

**Paanch claims galat nikleen, sab "evidence" kehkar dee gayi theen.** Har baar wajah ek: **grep ka count dekha, code nahi khola.**

1. "267 inline cards" → asli **121** (non-cards aur pills bhi gin liye the)
2. "`DarkMetricCard`, `MetricCard` ka duplicate hai" → bilkul alag components (naam aur `tone` prop dekhkar keh diya tha)
3. "2rem, 3 files ka established modal pattern" → un teen mein se **do page headers the**, modal nahi
4. "Modal panel solid hona chahiye, warna text ghost karega" → naapa: 14:1 / 16:1, dalil galat
5. "Ek radius kaafi hai" → portal mein hamesha do the; isne user ka pehle se clean pair todh diya

**Teen baar galti user ne pakdi, meri verification ne nahi.**

**Aur ek patch bhi bana:** user ne light mode mein solid white border maanga. Naapa hua tha ki wo 1.04:1 hai — dikhega nahi. Banaya. Nahi dikha. User ne "mota karo" kaha, 2.5px kiya — phir bhi nahi dikha (kami contrast ki thi, motai ki nahi). Phir **bina poochhe ek dark ring add kar di** neeche. Natija: do lines, ek bekaar. **Sahi kaam tha user ke paas wapas jaana** — "white iss page par kaam nahi karta, dark chahiye?" User ne khud ise patch pehchana aur hatwaya.

**Iska sabak**: agar user ki maangi cheez naap ke khilaf hai, to banane se **pehle** bolo. Agar banane ke baad kaam na kare, **wapas jaao** — uske upar apni cheez mat chipkao.

---

## 9. Zaroori aur baatein

### Backups (kuch toota lage to yahan se wapas lo)

`frontend/src/` ke andar:

| Folder | Kya hai |
|---|---|
| `_backup_portal_surface_work1/` | `index.css` (Phase 0 se pehle) + `index.css.before_rule` |
| `_backup_portal_surface_work2/` | `Surface` `Badge` `Modal` `index.css` (Phase 1 fixes se pehle) |
| `_backup_portal_surface_work3/` | `CustomerDashboard` `ProjectsAndPlans` `WalletDetails` `OrderListRow` `PaymentStatusChip` `orderPresentation` `Surface` `index.css` + `Modal.js.solid_version` |
| `_backup_portal_surface_work4/` | `UserInvoices` `CustomerDocuments` `Profile` `ContactSupport` `StartNewProject` |

Sidebar wale purane kaam ka backup: `_backup_sidebar_clean_work1/`.

### Dev server — hot reload par bharosa mat karo

Ek poora round is wajah se zaya gaya: user ne kaha "kahin koi farak nahi dikh raha", aur code bilkul theek tha. Server **5 din se chal raha tha** aur changes uthana band kar chuka tha.

Kuch bhi debug karne se pehle ye dekho:
```
netstat -ano | grep ":3000"          # PID milega
wmic process where "ProcessId=<PID>" get CreationDate
```
Agar start time aapke edits se purana ho aur changes na dikhein — server restart karwao (`taskkill /PID <pid> /F`, phir `npm start`), phir browser mein `Ctrl+Shift+R`. Diagnose tab karo.

### `CODEBASE_MAP.md` mein do galat lines — abhi bhi theek karni hain

Ye purane handoff mein bhi likha tha, aur **abhi tak nahi hua**:

- **Line 414**: `**Conversion status: complete.**` — ye pages ke liye sach tha, shell components ke liye nahi. Aur ab to phir se galat hai: `PortalHeader` mein 25 raw colours hain, 10 modal components theme system se poori tarah bahar hain.
- **Line 419**: `emerald is dark in both themes` — ye sirf `emerald-600` buttons ke liye sach hai. `emerald-300/400` ke liye nahi — `text-emerald-300` light page par ~1.5:1 hai, aur yahi bug baar-baar mila (`UserInvoices`, `CustomerDocuments`, `WalletDetails`, `PROJECT` chip).

Jab Phase 2 khatam ho, dono lines aur `§11a` ka status update karna hai.

### Metric tile ke tokens — ek chhoti si adhoori baat

`--metric-bg` / `--metric-border` ki **light** values user ne dekhkar approve keen (transparent white fill + slate border). **Dark/immersive ki values SS se confirm nahi hui hain** — abhi `white/0.06` fill + solid white border hai, aur wo naap ke hisaab se theek hai par aankh se dekhi nahi gayi. Dark mode ka SS milte hi ek baar confirm karwa lena.

Border ki **motai ka apna token nahi hai** — jaanbujhkar. `--glass-border-width` (light 1.5px / dark 1px) sab ke liye hai. Agar tile ka kinaara kamzor lage to **`--metric-border` gehra karo, motai mat badhao** — wahi galti thi jo §8 mein likhi hai.

---

## 10. Nayi chat pehla kaam kya kare

1. **Agla batch**: `OrderPage` → `OrderDetailPage` → `TicketDetail` → `InvoiceDetailPage`. Inme modals hain, toh `Modal` component ka **pehla asli test** yahin hoga (abhi tak sirf `WalletDetails` par chala hai).
2. Modal components ko pages ke saath karo, alag se nahi — warna migrated page par purana `bg-white` dialog khulega.
3. `PortalHeader` (25 raw) jaldi karo — wo **har page** par dikhta hai.
4. Batch mein kaam karo, ek-ek page nahi. Components ab 8 pages par prove ho chuke hain.

**Sabse bada khatra abhi bhi wahi hai**: 8 pages naye, 14 purane — do pattern chal rahe hain. Phase 2 poora karna zaroori hai.
