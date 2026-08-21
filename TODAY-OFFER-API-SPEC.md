# "Today's Offer" — spec for backend

**Quick summary, if you just want the checklist:**

1. Add 3 fields to chalets and buildings, on both the list and detail endpoints (below).
2. Change the two price-calculation endpoints so a day priced as "today" gets the percent
   discount applied internally, every other day stays at the normal rate — bookings can be
   multiple nights now, only the first night (today) is ever discounted. The response stays a
   single `total`, same shape as today — no breakdown fields.
3. On booking creation, accept whether the offer was used, the percent, and the discount
   amount directly from the client's request and store them as sent — the client already
   computes all three for its own display, so this is just persisting what it already knows.
4. Sort `todayOfferActive: true` items to the top of the list/filter responses.
5. Add two owner-panel endpoints: one to **update** `todayOfferEnabled` / `todayOfferPercent` /
   `todayOfferTriggerHour` (fire-and-forget, doesn't need to return the saved values), and a
   separate one to **retrieve** the owner's current settings (including `todayOfferActive`) so
   the panel can load them. (The trigger hour is owner-panel only — the customer-facing
   endpoints below never see it.)

Everything below explains why, with real endpoint names and example requests/responses.

---

## Why

Chalets and buildings currently have no way to advertise a cheaper price for a day that has
no booking. There's an existing `offDayPriceFullday`/`offDayPriceHalfday` field on chalets,
but it has real problems: it isn't returned by the list/filter endpoints (only the detail
endpoint), it has no owner-facing on/off switch, and it only supports a single fixed-length
booking. **This spec replaces it entirely** with a percentage-based discount that has a real
owner control, works on the list endpoints from day one, and supports a guest booking more
than just tonight.

Applies to **both chalets and buildings** — same shape on both, same as how `minDays`
already works identically on both types.

---

## Part 1 — New fields on chalets and buildings

Add the same 3 fields to each of these **five** existing endpoints — list, detail, and the
flats list, since that's exactly where the old field fell short:

**Chalet list/filter** — `POST /api/CustomerData/FilterBuildingListv2`
- `todayOfferEnabled` (bool) — owner's on/off switch for this feature.
- `todayOfferPercent` (number) — discount %, e.g. `20` = 20% off.
- `todayOfferActive` (bool) — computed fresh, per request. `true` only when enabled, past
  the owner's trigger hour, and today has no booking. This is the one field the app actually
  checks — see below.

**Chalet detail** — `GET /api/CustomerData/GetBuildingData`
- Same 3 fields as above.

**Building list/filter** — `POST /api/FlatsCustomer/FilterHotelBuildingList`
- Same 3 fields as above.

**Building detail** — `GET /api/FlatsCustomer/GetHotelBuildingData`
- Same 3 fields as above.

**Flat list** — `GET /api/FlatsCustomer/HotelBuildingFlatsList`
- Same 3 fields as above, copied down from the parent building so each flat card is
  self-contained (see `TODAY-OFFER-MODELS.md` section 3 for why).

Note what's **not** here: `todayOfferTriggerHour`. That field only matters for the owner
setting it and for backend computing `todayOfferActive` internally — the website/app never
reads it, so it doesn't need to be sent on any of these 5 endpoints. It only appears on the
owner-panel endpoint in Part 5.

### Why a percentage instead of a flat price

A flat price the owner types in goes stale the moment they change their normal rate — one
more field to remember to update. A percentage stays correct automatically. This is also how
booking platforms like Airbnb do last-minute discounts, so it's a familiar pattern.

### `todayOfferActive` must be computed server-side, never by a client

Only backend holds the real booking calendar, and "today" plus "is today booked" can change
between page loads — this has to be computed fresh, per request, every time. It also avoids
every list page making one extra booking-calendar call per card just to check "is today
free," which would be expensive at scale.

---

## Part 2 — Multi-night bookings: only the first night is discounted

**This is the main behavior change from the first draft of this spec.** A guest can now book
more nights than just today — the offer no longer has to be a single-night booking. The rule
is simple: whichever calendar day equals **today**, if it's included in the booking, gets the
percent discount. Every other night in the same booking is priced normally.

Since a guest can never book a day in the past, "today" (if included at all) is always the
first night of whatever range they pick — so in practice this is the same as saying "first
night is discounted, rest of the stay is normal price."

Example: a guest books 3 nights starting today, at a chalet with `rentFullday: 60` and
`todayOfferPercent: 25`.

- Night 1 (today): `60 * 0.75 = 45`
- Night 2: `60`
- Night 3: `60`
- Total: `165` (instead of `180` — a `15` saving)

### This removes a limitation from the first draft

The first version of this spec assumed the offer would only ever be a 1-night booking, which
meant it could only be turned on for properties with `minDays <= 1` (a 1-night booking can't
satisfy a longer minimum stay). **That restriction is no longer needed.** Since the guest can
now book as many nights as they want, `todayOfferActive` can be `true` on any property
regardless of its `minDays` — the guest just needs to book at least that many nights, same as
any normal booking. `minDays` doesn't need any special-case handling for this feature at all
anymore; it applies exactly like it always has.

### Interaction with other future bookings

If the property already has a booking starting in, say, 3 days, a guest using today's offer
can still only book up to 2 nights (today + tomorrow) before hitting that existing booking —
this is exactly the same overlap check that already applies to every normal booking, nothing
extra to build here. Today's offer only changes the *price* of the first night, never the
*availability* logic.

---

## Part 3 — Price-calculation endpoints need day-level discount logic

- Chalet price calc: `POST /api/CustomerData/CalculateBuldingPrices`
- Flat price calc: `POST /api/FlatsCustomer/CalculateFlatPrices`

Both currently take a list of booking days and return one lump total. To support Part 2,
each endpoint needs to price each day independently: for every day in the request, if that
day is **today's date** (server time) **and** `todayOfferActive` is currently `true` for this
property, charge that day's rate at `rate * (1 - todayOfferPercent / 100)`. Every other day
is priced exactly as it is now. Sum as usual.

**Request** (unchanged shape, shown for reference):

```json
{
  "buldingId": 24,
  "bookingDays": [
    { "day": "2026-08-14T00:00:00.000Z", "fullday": true },
    { "day": "2026-08-15T00:00:00.000Z", "fullday": true },
    { "day": "2026-08-16T00:00:00.000Z", "fullday": true }
  ]
}
```

**Response stays exactly as it is today — `total` only, no breakdown fields.** Both apps
already compute their own "you saved X" for display by working out the per-night split
client-side (same base rate + percent the property already returns), so the response doesn't
need to expose `todayOfferApplied`/`todayOfferDiscountAmount` here. What backend does need to
get right internally is the **total itself** — each day priced independently per the priority
order below, summed as usual — since that's the number actually charged.

```json
{
  "total": 165
}
```

### Price priority order — today's offer is one of four things that can set today's price

There are now **four** separate mechanisms that can affect what today costs, and they can
overlap on the same day. This is **not** a stack (they don't add on top of each other) — it's
a priority order. Whichever one applies first, top to bottom, is the one used; everything
below it is ignored for that day:

1. **Special price for this specific date** (existing feature —
   `GET /api/Owners/GetBuildingPrices` / `GET /api/Owners/GetFlatSpcialPrices`). If the owner
   set an exact price for today, that price is used exactly as set. Nothing else below this
   point gets checked.
2. **Today's Offer** (this spec). If there's no special price for today, and
   `todayOfferActive` is `true`, charge `rate * (1 - todayOfferPercent / 100)`, where `rate`
   is today's normal rate (see the weekend note below).
3. **Standing/general promo** (existing feature — `fullDayDiscountEnabled` +
   `rentFullDayDiscount` on the chalet). If neither of the above applies, and the owner has
   this standing promo turned on, use that discounted rate.
4. **Normal rate** (`rentFullday`/`rentHalfday`, or the flat's normal nightly rate). Used only
   if none of the three above apply.

**Why this order:** it goes from most specific/deliberate to most general. A special price is
the owner making an exact, manual decision for one date — nothing should override that.
Today's offer is automatic but still date-specific (only today, only when empty). The standing
promo is the most general — it's just "our current listed price" until something more specific
overrides it for a particular day.

**Where does the weekend rate (`rentWeekend`) fit?** It isn't one of the four priority tiers
above — treat it as which "normal rate" step 4 resolves to: if today is a weekend day, step 4
means the weekend rate instead of the regular rate. (Flagging this as an assumption — confirm
if weekend pricing should instead sit at its own priority level above the standing promo.)

---

## Part 4 — Store offer usage on the booking, for the owner's own records

- Chalet booking creation: `POST /api/CustomerData/AddBooking`
- Flat booking creation: `POST /api/FlatsCustomer/AddBookingHotel`

When a booking is created, the request body now includes these 3 fields — backend stores them
exactly as sent, no server-side recomputation needed:

| Field | Type | Meaning |
|---|---|---|
| `todayOfferApplied` | bool | Whether this booking's first night used the offer. |
| `todayOfferPercent` | number | The percentage that was actually used — a snapshot at booking time, since the owner could change their percentage later and old bookings should still show what was true when they happened. |
| `todayOfferDiscountAmount` | number | The actual OMR amount discounted on this booking. |

**Taken directly from the client's request** — the website already computes all three values
itself (it needs them anyway to show the guest "you saved X" before they book), so this is
just persisting what the client already knows rather than having backend redo the same
calculation. Sample request addition to `AddBooking`/`AddBookingHotel`:

```json
{
  "todayOfferApplied": true,
  "todayOfferPercent": 25,
  "todayOfferDiscountAmount": 15
}
```

This should surface wherever the owner already reviews their bookings (owner app / admin
panel booking list), so they can see which bookings came through this feature and how much
revenue they discounted overall — useful for deciding whether the feature is worth keeping
on.

---

## Part 5 — Owner-facing control: two dedicated endpoints

`todayOfferEnabled`, `todayOfferPercent`, and `todayOfferTriggerHour` need a control in
whatever panel chalet/building owners already use to manage their listing — a toggle, a
percentage input, and an hour picker, next to wherever `rentFullday`/`rentHalfday` are
already editable. `todayOfferTriggerHour` is a whole number from **1 to 24** (no minutes,
no 0 — 24 stands for midnight/end of day). Nothing in the customer-facing website or app can
turn this on; it's the owner's own choice, off by default. This needs **two separate
endpoints**, not one shared with the general chalet/building update:

**Confirmed live — 4 endpoints, chalets and buildings each get their own pair, but the two
update endpoints share one request DTO** (hence the `buildingOrHoteBuildinglId` field name —
generic enough to cover either, typo included):

**1a. Update, chalets** — `POST /api/Owners/UpdateTodayOffer`

Request:
```json
{
  "id": 0,
  "buildingOrHoteBuildinglId": 24,
  "todayOfferEnabled": true,
  "todayOfferPercent": 25,
  "todayOfferTriggerHour": 14
}
```
`id` is the request DTO's own id field — always `0` here, there's no separate "add" case (see
"Same endpoint handles both first-time save and later edits" below). `buildingOrHoteBuildinglId`
is the chalet's id. Response only needs a success/failure indicator (same
`{ "status": true, "message": "..." }` shape the rest of the API already uses) — it doesn't
need to echo the saved values back.

**1b. Update, buildings** — `POST /api/Owners/UpdateHotelBuildingTodayOffer`

Same request/response shape as 1a — `buildingOrHoteBuildinglId` here is the building's id.

**2a. Retrieve, chalets** — `GET /api/Owners/GetTodayOffer?BuldingId=24`

**2b. Retrieve, buildings** — `GET /api/Owners/GetHotelBuildingTodayOffer?BuldingId=24`
(confirmed: same query param name as the chalet endpoint, `BuldingId` — not
`hotelbuildingId`/`HotelbuildingId`, even though this is the buildings endpoint.)

**⚠️ Confirmed bug — `todayOfferActive` is currently missing from both retrieve responses.**
What both endpoints actually return right now:
```json
{
  "status": true,
  "message": {
    "id": 1,
    "buildingOrHoteBuildinglId": 38,
    "todayOfferEnabled": true,
    "todayOfferPercent": 79,
    "todayOfferTriggerHour": 16
  }
}
```
No `todayOfferActive` anywhere in `message`. This breaks the one thing the owner-panel retrieve
call actually needs beyond an echo of its own input — the whole point of Part 5's "also show
the owner `todayOfferActive`" is a live status the owner can't compute themselves (it depends on
today's booking state and the current time). **Needs to be added** — expected shape:
```json
{
  "todayOfferEnabled": true,
  "todayOfferPercent": 25,
  "todayOfferTriggerHour": 14,
  "todayOfferActive": true
}
```

**Also show the owner `todayOfferActive`** (returned by the retrieve endpoint above) in that
same panel — so they can tell right now whether the offer is actually live to customers today,
not just whether they turned the feature on in general. Something like "no booking today —
your offer is live" vs "you already have a booking today — offer is off." Without this the
owner sets it once and has no way to know if it's doing anything.

### Why a trigger hour

Without a cutoff, an empty day shows the discount from the moment it starts, which undercuts
a normal booking that might still come in at full price that morning. Letting the owner pick
their own hour — rather than one fixed system-wide time — means each owner decides, based on
how their own place usually books, when a day is realistically "not going to fill normally."
This hour only feeds backend's own `todayOfferActive` calculation — it's never sent to the
website or app.

---

## Part 6 — Sort order on the list endpoints

Items with `todayOfferActive: true` should sort to the **top** of the list/filter response,
ahead of everything else, on both the chalet and building list/filter endpoints. Everything
after that keeps its existing order. This makes offer properties surface first everywhere a
list is browsed, not just on the home page.

---

## Examples

**Chalet list item — offer active, no booking today, past the owner's trigger hour:**

```json
{
  "id": 24,
  "name": "استراحة لايتهاوس||lighthouse chalet",
  "rentFullday": "65",
  "rentHalfday": "45",
  "minDays": 0,
  "stopBook": false,
  "todayOfferEnabled": true,
  "todayOfferPercent": 25,
  "todayOfferActive": true
}
```

**Same property, but it already has a booking today (or it's before the trigger hour):**

```json
{
  "todayOfferEnabled": true,
  "todayOfferPercent": 25,
  "todayOfferActive": false
}
```

`todayOfferEnabled`/`todayOfferPercent` don't change — only `todayOfferActive` flips based
on today's booking state and the current time (and the owner's trigger hour, which backend
checks internally but never sends here).

**Building list item:**

```json
{
  "id": 7,
  "nameEn": "Sunset Apartments",
  "minimumRent": "25",
  "minDays": 0,
  "todayOfferEnabled": true,
  "todayOfferPercent": 20,
  "todayOfferActive": true
}
```

---

## Edge cases

- **Owner sets a percentage but leaves it disabled** — return `todayOfferEnabled: false`,
  `todayOfferActive: false`, and still return the stored percentage/hour, so re-opening the
  owner panel shows their last values instead of blank fields.
- **`stopBook` (owner paused the whole listing) is `true`** — `todayOfferActive` must be
  `false` regardless of the offer toggle. A paused listing isn't bookable at any price.
- **Percentage left at 0 while enabled** — treat as `todayOfferActive: false` (nothing to
  offer).
- **Today already has a special/discounted price set** — that wins; don't also apply the
  offer percentage or the standing promo on the same night (see Part 3's "Price priority
  order").
- **Today has no special price, but the standing/general promo is on** — if today's offer is
  also active, today's offer wins (it's higher up the priority order); otherwise the standing
  promo price is what shows (see Part 3's "Price priority order").
- **A booking that includes today plus future nights** — only today is discounted; every
  other night in the same booking is priced normally (see Part 2).
- **A future booking already exists a few days out** — a guest can still book today's offer,
  just capped at however many nights are free before that existing booking starts. No new
  logic needed here; the existing overlap check already covers it.
- **Guest starts checkout right before midnight** — both apps lock in "today's date" the
  moment checkout starts (before redirecting to payment), not when payment actually confirms,
  so a booking that started as today's offer stays correctly recorded even if payment confirms
  a minute or two into the next calendar day. Both apps also stop offering a *new* today's
  offer booking in the last ~30 minutes before midnight, to keep this edge case rare.
- **What the old `offDayPriceFullday`/`offDayPriceHalfday` fields should do** — can stay as
  dead fields or be removed; nothing on either client reads them for this feature anymore.

---

## What the website already does with this (no further frontend work needed)

The website is fully wired to all of the above: a green "Today's Offer" badge on property
cards, offer properties sorted to the top of the regular browse/list pages, and a booking flow
that always shows the same real, fully-editable calendar as any normal booking — there is no
separate "offer flow" to enter or exit. If a property currently has a live offer, the booking
page shows the offer badge and a live countdown to midnight and defaults the calendar to
today → tomorrow so the guest sees it immediately, but the guest is completely free to change
the dates. The discount simply shows up automatically whenever check-in stays on today's date
(same rule as Part 2 — only that first night is discounted, extra nights are normal price),
and disappears automatically if the guest picks a different check-in — no dead ends, no
separate page. The website already computes `todayOfferApplied`/`todayOfferPercent`/
`todayOfferDiscountAmount` client-side (it needs them for the "you saved X" display anyway)
and now sends them on `AddBooking`/`AddBookingHotel` per Part 4. All of it is live in the code
today, just waiting on these fields and the price-calc changes above — no further frontend
work needed once this ships. The Flutter app doesn't have any of this yet; happy to scope that
separately once this contract is confirmed.
