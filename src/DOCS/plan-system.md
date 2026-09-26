# Plan System Rebuild — Working Context

**This file = what the owner decided and why.** Current code behaviour lives in `CODEBASE_MAP.md` (§5 plans, §5a legacy, §7a allowance, §6 payments, §4 admin workspace) — never restate it here.

Status: **design agreed, no code written.** Updated 2026-09-23.

---

## The goal

Admin can change anything on any client's plan. Client can buy more for themselves without rebuying the plan. Every change — cash and free grants included — leaves a payment record. Client pays by wallet or UPI only.

## The problem

Allowance is frozen at purchase with only a used-counter against it. Nobody can raise it, so running out means buying a whole new plan.

## Why this is urgent, not theoretical (live data, 2026-09-23)

- Only **3** upload-capable service orders exist — and **2 are exhausted right now**.
- The live plan "Starter Update Plan" grants **1 upload per month**. One upload and the client is blocked for the rest of the month, so top-up is needed *routinely*, not occasionally.
- **6 of 8** service orders have a deleted catalogue product; 3 of those also lack `servicePlanSnapshot.serviceName`. They still render, because `getOrderDisplayName()` falls back to `orderItems[].name` (§5) — but the catalogue row they were bought from is gone, so a top-up cannot be derived from the original plan's terms.
- **2 orders sit `paused`** with no way to resume them: the system has no un-pause control at all. A top-up on a paused plan is unusable, so this must be fixed alongside.
- Catalogue holds only 3 plans total. Everything here is small enough to change cleanly.

## The fix — allowance becomes a ledger

Not a number: entries. Granted by plan, granted by admin, bought by client, spent on upload, expired. What's left is the running balance of those entries.

**The client buys work, not balance** — "5 more uploads", consumed under the plan's own files-limit and rules. Never separate rules of its own.

## Decisions made (owner, 2026-09-23)

1. **Top-up has no expiry of its own** and is deliberately **cheap**. It does not die on the plan's cycle reset.
2. **Top-up cannot live without a plan.** It attaches to one plan, never to the account. Rationale: "3 uploads" is meaningless on its own — the plan defines files-per-upload, what the work is, and who does it. A client with no plan is not offered top-up at all.
3. **Plan ends → top-up sleeps, it is not burned.** Unused top-up stays dormant and wakes when the client has a live plan again. Burning it reads as theft and would kill repeat purchase; sleeping it gives the client a reason to come back.
4. **Spend order: plan allowance first, top-up second.** Plan allowance expires and top-up does not, so spending top-up first would waste the plan's.
5. **Sellable things can be owned by one client.** A top-up (and a plan) can be created either for the whole catalogue or **exclusively for one client**, with a one-way "make this public" switch. Owner's scope: this is a general rule for anything sellable, not a top-up-only feature.

## Still open

- **Refund on cancel** — is purchased top-up returned when a plan is cancelled?
- **Dormancy cap** — should sleeping top-up eventually expire (e.g. after N months), so a years-old balance cannot resurface?
- **Can admin edit already-spent history**, or only future allowance? (Recommended: only forward. A rewritable past makes the ledger worthless as evidence.)

## The exclusivity gap — why "hidden" is not enough

Today a product has only `isHidden`: a **lock that hides it from everyone**. What is needed is a **name on it** — ownership. Hidden means "don't list this"; it does not mean "this belongs to Ramesh". So a hidden item's URL still sells to anyone who finds it, and the admin cannot ask "what did I make for this client?" — nothing records the answer. `isCustomClientProject` exists on `productModel` but is **declared and never written by any controller** (verified), so even the project flow has no ownership record.

## Planned UI

**One form, two entrances.** Reuse the existing Add Service form (Plans page → Add Service). Add one question at the top: *who is this for* — everyone, or one client. Opened from the catalogue it defaults to everyone; opened from inside a client it is locked to that client. No second form.

**Admin — client workspace**
- A "create for this client" entrance on the client's Plans tab.
- A list: *things made exclusively for this client*, each with the one-way **make public** switch. Without this list, exclusive items become untrackable clutter.
- Inside a plan: the allowance ledger (plan / top-up / remaining), a **grant allowance** action (amount, reason, paid-or-free — free writes a ₹0 record, paid asks cash/wallet/UPI), and a **send top-up** action offering that client's own top-ups.

**Admin — Plans page**
- A third tab for client-exclusive items, so they do not pollute the catalogue list, with the owning client shown on each row.

**Client portal**
- Inside a plan: plan / top-up / remaining, instead of today's single figure.
- When allowance runs out, today's dead "Cycle limit used" state becomes the **buy-more** entry point — a closed door turned into a shop.
- Dormant top-up shown plainly: how much is asleep, and that a live plan wakes it.
- Payment is wallet (instant) or UPI (after approval) — the existing money rule, unchanged.

## Consequences to handle

- **Payments tab**: top-up needs its own payment identity, must stay outside the plan's own price total (renewals already work this way, same reason), and a free grant must not look like money received.
- **Two linked histories**: money (payments tab) and allowance (inside the plan), each knowing the other's record.
- **`limitScope`** is advertised but inert (§7a) — a ledger has to state how long allowance lives, so this surfaces whether we intend it or not.
- **Pricing risk (owner's call, flagged not blocked)**: if top-up is much cheaper than a plan, clients will buy the smallest plan and live on top-ups, reducing recurring revenue.

## Build order

1. Make plans visible to admin (§4 tab-split + the missing names) — nothing can be attached to a plan the admin cannot see.
2. Allowance ledger.
3. Admin grant / deduct.
4. Client top-up purchase.
5. Exclusive ownership + make-public switch.
6. Resume for paused plans.

## How the owner wants this built

- **Whole system, never a slice.** A narrow fix that leaves the rest inconsistent is a defect, not progress.
- **Evidence only.** Verify against code and live data before stating anything.
- **Propose, then wait.** Explain the understanding and the options first; the owner decides. Options at working/concept level — not file lists or change plans.
- **Answer only what was asked**, short and in points.

## For the next agent

- Nothing is built. Do not assume any of this exists in code.
- **Read `CODEBASE_MAP.md` §5a before modelling anything.** A dead legacy plan system is still wired through ~31 files, usually as the *fallback* branch, so it reads as live code. Build only on the service-plan shape (§5, §7a).
- Step 1 of the build order is a hard prerequisite, not a preference.
