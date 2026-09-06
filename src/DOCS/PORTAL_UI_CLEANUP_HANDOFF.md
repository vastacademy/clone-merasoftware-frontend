# Portal UI Cleanup — Handoff

**Banaya**: 06-09-2026
**Kis liye**: Customer portal ke pages ka UI clean karna — sidebar ka kaam ho chuka hai, ab pages bache hain.
**Kis chat se**: Sidebar cleanup wali chat. Wahan ka kaam poora ho chuka hai (neeche "Ho chuka hai" dekho).

---

## 1. Kaam karne ke rules (ye pehle padho)

Ye rules pichhli chat mein banke test ho chuke hain. Inhe follow karna hai:

1. **Pehle samjho → approval lo → phir code likho.** Koi bhi coding se pehle chhota review likhkar user se approval maango.
2. **Evidence ke bina koi claim nahi.** Har baat grep/code/SS se verify karo. "Shayad aisa hoga" par kaam nahi.
3. **Screenshot maango.** Colour/contrast ka koi bhi faisla SS dekhe bina mat lo. Aur **dono modes** ke SS lo — light aur immersive/dark. Pichhli chat mein `text-red-200` badalne wala tha, dark ke SS ne bacha liya (wo dark mein bilkul theek tha, sirf light mein toota tha).
4. **`npm run build` mat chalao.** User ne mana kiya hai — time waste hota hai.
5. **Backup pehle.** Numbered folder: `_backup_<kaam>_work1`, `work2`...
6. **Admin panel ko haath mat lagao.** Ye binding hai. Shared components mein `themed`/`c()`/`isGlass` props se opt-in hota hai — admin wo prop pass nahi karta. Naye components bhi isi tarah opt-in hone chahiye.
7. **Sirf jo maanga hai wahi karo.** Extra abstraction mat banao. Pichhli chat mein "nav config unify karo" aur "sections-from-data" plan se **nikaal diye** the kyunki wo aaj ki koi problem hal nahi kar rahe the.
8. **Docs update tab jab user "perfect" kahe** — phir bina poochhe kar do.

---

## 2. Ho chuka hai — sidebar (dobara mat karo)

**Files badli**: `components/DashboardLayout.js`, `components/MobileBottomNav.js`, `index.css`
**Nayi file**: `components/SidebarNavItem.js`
**Backup**: `_backup_sidebar_clean_work1/`

Kya kiya:
- `SidebarNavItem` component bana — nav item ka look ab ek jagah tay hota hai. `variant="primary"|"secondary"` sirf **resting** look badalta hai, selected look dono mein ek hi hai.
- Selection ab dono lists mein solid green (header se match karta hai). Pehle Quick Links solid green tha aur More sirf halka glass — jo light mein lagbhag invisible aur dark mein kamzor tha.
- Sidebar ka page-title badge **hata diya** (user ka faisla) — wo wahi baat keh raha tha jo header pill aur selected nav item already keh rahe the. Uske saath `getPageTitle()` bhi dead ho gaya tha, wo bhi hata diya.
- Avatar tile se emerald tint hataya → neutral glass.
- Logout button, logout modal, loading skeleton — sab tokens par.

**Naye tokens** (`index.css`, teeno themes mein):
```
--nav-active-bg, --nav-active-fg, --nav-active-shadow
--danger-fg, --danger-bg, --danger-border, --danger-bg-hover
```
Light mode mein `--nav-active-bg` = `emerald-600` (`#059669`), dark mein `emerald-500` (`#10b981`) — `emerald-500` light page par glare karta hai aur uspar white text 4.5:1 se neeche gir jaata hai.

**Verify ho chuka**: CSS mein dono values compile hui, saatoen utility classes generate hui. Tailwind v3 ka `bg-[var(--x)]` wala trap hit nahi hua.

**Abhi bhi pending**: user ne sidebar ka final SS confirm nahi kiya. Nayi chat shuru karte waqt ek baar pooch lena ki sidebar theek laga ya nahi.

---

## 3. Asli problem — pages (yahan se kaam shuru hota hai)

### Diagnosis

Portal mein consistency ka problem **colour ka nahi hai** — colour to tokens se aa raha hai. Problem ye hai ki **har page apna card aur badge khud gadhta hai**.

| Cheez | Shared use | Inline (har page ka apna) |
|---|---|---|
| Glass card | `.glass-panel` — **15** | `bg-[var(--glass-bg)]` — **167** |
| Badge/chip | `PaymentStatusChip` — **2** | inline pills — **81** |

Yaani **92% cards** aur **97% badges** haath se likhe hue hain. Shared recipe maujood hai par koi use nahi karta.

Nateeja — card ke corner ke **9 alag values**:
```
1519  rounded-2xl
 481  rounded-xl
 295  rounded-[1.5rem]
 181  rounded-[2rem]
  77  rounded-[1.75rem]
  67  rounded-3xl
  51  rounded-[1.25rem]
   1  rounded-[1.35rem]   ← akela, saaf batata hai ki aankh se number daala gaya
   1  rounded-[1.2rem]
```
Aur blur ke **4 alag values**: `blur-md` (127), `blur-2xl` (91), `blur-sm` (37), `blur-xl` (3).

### Light mode ka glass ek dikhawa hai

Ye user ne khud pakda tha, aur sach hai:

- Blur ko frost karne ke liye peeche kuch hona chahiye. Dark/immersive mein `BG.png` hai — blur usse frost karta hai, glass sach mein glass lagta hai.
- Light mode mein `--page-decoration: none` hai. Peeche sirf flat `#e8edf3`. **Flat colour ko blur karo to wahi flat colour milta hai.**
- Upar se card ka fill `white/0.72` hai aur page `#e8edf3` — dono lagbhag ek jaise. Isliye card ke kinare gayab ho jaate hain.

Pages mein **122 jagah** `backdrop-blur` likha hai jo light mode mein kuch nahi karta, sirf browser se kaam karwata hai.

**Faisla jo lena hai**: light mode mein glass chhod do — depth border aur shadow se aaye, film se nahi. Dark/immersive mein glass rahega kyunki wahan wo sach mein kaam karta hai. Ek hi component, values alag.

### Badge ka pattern

Light-fill + same-hue-text (light mode mein padha nahi jaata):
- emerald: **12** jagah
- amber: **8** jagah
- red: **5** jagah

Ye wahi galti hai jo sidebar ke badge mein thi. Har jagah alag se likhi gayi hai, isliye har jagah alag se dohrayi gayi.

### SS mein jo dikha (Dashboard, Orders, Wallet — light mode)

1. Cards ke kinare gayab — page se mushkil se alag dikhte hain
2. Green tint bewajah — `SERVICES` card, `WALLET BALANCE`, `TOTAL ADDED` sab halke green. Ye status nahi hain, phir green kyun?
3. `100% COMPLETE`, `Completed`, `Paid`, `All clear` — sab light-green fill par green text, ek hi screen par 5-6 jagah
4. `PROJECT` badge Dashboard mein light-green, Orders mein kaala — ek cheez, do look
5. Status column mein `Expired`/`Paused` plain hain par `Completed` green pill mein — ek column, do styles
6. Wallet ke teen stat cards teen alag colour (green/plain/amber) bina kisi saaf karan ke

**In 6 mein se 4 dono modes ki problem hain** (design ki galtiyan). Sirf 2 light-specific hain (kinare gayab, green-on-green). Fix tokens se hoga — ek component, values per-theme alag. Dark ke liye alag kaam nahi karna.

---

## 4. Plan

### Phase 1 — Components banao
- **`Surface`** — poora card de: fill, border, shadow, corner, padding. `.glass-panel` isliye fail hui kyunki wo sirf fill/border/shadow deti hai, corner aur padding har page ko khud likhna padta hai. Light mode mein blur off, dark mein on.
- **`Badge`** — `tone` prop (success/pending/error/neutral). Har tone ki value token se, taaki light-fill+same-hue-text wali galti dobara likhi hi na ja sake.
- **Corner/blur ko token banao** — 9 values ki jagah 2-3 (card, chhota card, pill).

### Phase 2 — Page-by-page migration
Ek page migrate karo → dono modes ke SS lo → user se confirm → agla page. **Ek saath sab nahi.**

### Phase 3 — Colour ko meaning do
Green sirf success/completion par. `SERVICES` card aur `TOTAL ADDED` jaise jagah se green hatao — tab jab green dikhega, wo kuch kahega.

### Tarteeb (sabse zyada dikhne wale pehle)
`CustomerDashboard.js` → `OrderPage.js` → `WalletDetails.js` → `ProjectsAndPlans.js` → baaki

---

## 5. Do khatre — inhe yaad rakhna

**1. Adhoora migration sabse bura nateeja hai.**
`Surface`/`Badge` banane ke baad bhi purana inline code chalta rahega. Agar migration beech mein chhoda to portal mein **do** patterns honge — aaj se buri halat, kyunki aaj kam se kam sab *ek jaise galat* hain. Ya poora karo, ya shuru mat karo.

**2. Light theek karte waqt dark toot sakta hai.**
Har change dono modes mein dekho. Pichhli chat ka sabak: `text-red-200` galat lag raha tha, par dark ke SS ne dikhaya ki wo wahan bilkul theek hai — sirf light mein toota tha. Agar bina dekhe badal dete to aadhi jagah sahi cheez kharab kar dete.

---

## 6. Zaroori technical baatein

- **Tailwind version trap**: `package.json` mein v4 likha hai par compile `react-scripts` ka nested **v3.4.17** karta hai. v3 mein `bg-[var(--x)]/10` **fail** hota hai — `bg-[rgb(var(--x)/0.1)]` likhо. Koi bhi `npm install` jo nested v3 hata de, saari CSS tod dega.
- **Token SSOT**: saari colour values sirf `index.css` mein. Component mein kabhi raw colour mat likho.
- **`--ink-rgb`**: inverted button token — `bg-[rgb(var(--ink-rgb))] text-[var(--page-bg)]`.
- **Purana doc**: `CODEBASE_MAP.md` §11a mein theme system likha hai. Uska "Conversion status: complete" **galat hai** — wo pages ke liye sach tha, shell components ke liye nahi (`DashboardLayout.js` mein 6 `text-black` mile the). Aur "emerald is dark in both themes" wali line sirf `emerald-600` buttons ke liye sach hai, `emerald-300/400` ke liye nahi. Ye dono lines theek karni hain.

---

## 7. Nayi chat pehla kaam kya kare

1. User se poochho ki sidebar ka kaam theek laga ya nahi (SS confirm pending hai)
2. Light mode ka glass wala faisla lo — blur hatana hai ya rakhna (§3 dekho). Ye poore plan ki disha tay karta hai.
3. `Surface` aur `Badge` ka design saamne rakho — kaun se props, kaun se tokens — approval lo
4. Phir Phase 1 shuru
