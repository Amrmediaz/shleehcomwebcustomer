# "Today's Offer" — model reference for backend

Companion to `TODAY-OFFER-API-SPEC.md` (that file has the full why/how — this one is just the
field-by-field model shape, ready to copy into whatever backend already has). Written as C#
since the rest of the API is .NET — rename/adjust to match the real class names, this is the
contract, not literal existing code.

---

## 1. Chalet model — add to whatever class backs `FilterBuildingListv2` and `GetBuildingData`

```csharp
// "Today's Offer" — owner-controlled discount for a day with no booking.
// See TODAY-OFFER-API-SPEC.md. Applies to BOTH the list and detail response
// for chalets — the old offDayPriceFullday/offDayPriceHalfday fields only
// lived on the detail response, which was the actual bug this replaces.
public class ChaletModel
{
    // ...existing fields (id, name, rentFullday, rentHalfday, minDays, stopBook, etc.)...

    /// <summary>
    /// The owner's own on/off switch for this feature. Set from an
    /// owner-panel control (see section 6). Stored, doesn't change often.
    /// </summary>
    public bool TodayOfferEnabled { get; set; }

    /// <summary>
    /// Discount percentage the owner chose, e.g. 25 = 25% off. Applied to
    /// whichever base rate is relevant (RentFullday/RentHalfday) — a
    /// percentage instead of a flat price so it stays correct automatically
    /// if the owner changes their normal rate later.
    /// </summary>
    public int TodayOfferPercent { get; set; }

    // NOTE: no TodayOfferTriggerHour here on purpose. It only feeds the
    // TodayOfferActive calculation below and the owner-panel form (section
    // 5) — the website/app never reads it, so don't send it on this
    // customer-facing model.

    /// <summary>
    /// NOT a stored column — compute this fresh on every single request:
    ///   TodayOfferEnabled
    ///   AND CurrentHour >= TodayOfferTriggerHour
    ///   AND StopBook == false
    ///   AND there is no booking covering today's date for this chalet
    /// This is the only field either app actually branches on to show the
    /// badge/discount. TodayOfferEnabled just reflects the owner's stored
    /// setting and can be true on a day the offer isn't actually showing.
    /// </summary>
    public bool TodayOfferActive { get; set; }
}
```

## 2. Building model — add to whatever class backs `FilterHotelBuildingList` and `GetHotelBuildingData`

```csharp
// Same fields, same meaning — the offer is set once per building
// (not per flat) and applies to whichever flat the guest ends up booking.
public class BuildingModel
{
    // ...existing fields (id, nameAr, nameEn, minimumRent, maxRent, minDays, etc.)...

    public bool TodayOfferEnabled { get; set; }
    public int TodayOfferPercent { get; set; }
    public bool TodayOfferActive { get; set; } // computed, same rule as chalets
    // No TodayOfferTriggerHour here either — same reasoning as ChaletModel above.
}
```

## 3. Flat model — add to whatever class backs `HotelBuildingFlatsList`

A chalet is its own bookable unit, so it just carries its fields directly. A building isn't
bookable by itself, though — the **flat** is what actually gets booked, so the flat list
response should carry the same fields directly too, not make the client cross-reference the
parent building separately every time it renders a flat card.

```csharp
// Same fields as Chalet/Building — just copied down from the parent
// building onto every flat in HotelBuildingFlatsList, so a flat card is
// self-contained the same way a chalet card already is. The owner still
// only sets this once, at the building level (section 2) — this is purely
// about not making the client join two responses together to show a badge.
public class FlatModel
{
    // ...existing fields (id, nameAr, nameEn, pricePerNight, bedsNumber, etc.)...

    /// <summary>Copied straight from the parent building's TodayOfferEnabled.</summary>
    public bool TodayOfferEnabled { get; set; }

    /// <summary>Copied straight from the parent building's TodayOfferPercent.</summary>
    public int TodayOfferPercent { get; set; }

    /// <summary>
    /// Same computed rule as Chalet.TodayOfferActive, but checked against
    /// THIS flat's own booking calendar — two flats in the same building
    /// can have different answers here (one might already be booked today
    /// while another isn't), even though they share the same
    /// TodayOfferEnabled/Percent from their parent building.
    /// </summary>
    public bool TodayOfferActive { get; set; }
}
```

## 4. Price-calculation response — `CalculateBuldingPrices` (chalets) and `CalculateFlatPrices` (flats)

Request and response shape are both **unchanged** — still a list of booking days in, a single
total out. No breakdown fields needed here; the client already computes its own "you saved X"
for display from the same base rate + percent the property already returns, so the response
doesn't need to expose it too.

```csharp
public class PriceCalculationResult
{
    /// <summary>Grand total for the whole stay — same as today, unchanged shape.</summary>
    public decimal Total { get; set; }
}
```

**Pricing rule to implement, in words:** for every day in the request, work out its price with
this priority order — first one that applies wins, they don't stack (see
`TODAY-OFFER-API-SPEC.md`'s "Price priority order" section for the full reasoning):

1. If today has a special price set (`GetBuildingPrices`/`GetFlatSpcialPrices`) — use it
   exactly as set.
2. Else if the day equals today's date (server time) AND `TodayOfferActive` is true — charge
   `rate * (1 - TodayOfferPercent / 100)`.
3. Else if the standing/general promo is on (`FullDayDiscountEnabled` +
   `RentFullDayDiscount`) — use that rate.
4. Else — the normal rate (weekend rate if today is a weekend day, otherwise the regular
   rate).

Only step 2 sets `TodayOfferApplied`/`TodayOfferDiscountAmount` on the response — steps 1, 3,
and 4 leave those `false`/`0`. Every day that isn't today is priced exactly as it already is
today (steps 1/3/4 only, step 2 never applies to a non-today day). Sum for `Total`.

## 5. Booking model — add to whatever class backs `AddBooking` (chalets) and `AddBookingHotel` (flats)

```csharp
// Sent by the client on the AddBooking / AddBookingHotel request body and
// stored as-is — the website already computes all three values itself (it
// needs them to show the guest "you saved X" before they book), so backend
// just persists what's sent instead of recomputing the same thing.
public class BookingModel
{
    // ...existing fields (buildingID/flatID, customerId, coast, bookingDays, etc.)...

    /// <summary>Whether this booking's first night used Today's Offer.</summary>
    public bool TodayOfferApplied { get; set; }

    /// <summary>
    /// The percentage that was actually used, as sent by the client at
    /// booking time. The owner's live setting can change later — old
    /// bookings should keep showing what was true when they happened, not
    /// today's value.
    /// </summary>
    public int? TodayOfferPercent { get; set; }

    /// <summary>
    /// The OMR amount actually discounted on this booking, as sent by the
    /// client, so the owner's reporting view never has to recalculate it.
    /// </summary>
    public decimal TodayOfferDiscountAmount { get; set; }
}
```

Surface these three fields wherever the owner already reviews their bookings, so they can see
which bookings came through the offer and how much revenue it cost them overall.

## 6. Owner-panel — two dedicated endpoints per property type (update + retrieve)

Confirmed live: `UpdateTodayOffer`/`GetTodayOffer` (chalets) and
`UpdateHotelBuildingTodayOffer`/`GetHotelBuildingTodayOffer` (buildings) — not one shared with
the general chalet/building update, so the update side doesn't need to echo anything back, and
the panel can load current values without fetching the entire chalet/building record.

**Update request** — the two update endpoints share one request DTO (hence the generic field
name below, typo included) — request body only, response is just a standard success/failure
result (whatever shape the rest of the API already uses for that, e.g. `{ Status, Message }`):

```csharp
public class UpdateTodayOfferRequest
{
    /// <summary>The request DTO's own id — always 0 for this feature, there's
    /// no separate "add" case (see TODAY-OFFER-API-SPEC.md Part 5).</summary>
    public int Id { get; set; }

    /// <summary>The chalet's id when posted to UpdateTodayOffer, or the
    /// building's id when posted to UpdateHotelBuildingTodayOffer — same
    /// DTO shared by both endpoints.</summary>
    public int BuildingOrHoteBuildinglId { get; set; }

    public bool TodayOfferEnabled { get; set; }
    public int TodayOfferPercent { get; set; }

    /// <summary>Whole hour, 1–24 (no minutes; 24 = midnight/end of day).</summary>
    public int TodayOfferTriggerHour { get; set; }
}
```

**Retrieve response** — a small, dedicated read model, not the full chalet/building payload.
⚠️ **`TodayOfferActive` is confirmed missing from both live retrieve responses right now** — see
TODAY-OFFER-API-SPEC.md Part 5 for the exact response currently coming back. Everything else
below matches what's live today:

```csharp
public class TodayOfferSettingsResponse
{
    public bool TodayOfferEnabled { get; set; }
    public int TodayOfferPercent { get; set; }

    /// <summary>Whole hour, 1–24 (no minutes; 24 = midnight/end of day).</summary>
    public int TodayOfferTriggerHour { get; set; }

    /// <summary>
    /// MISSING from the live response — needs to be added. Computed the
    /// same way as everywhere else (see section 1) — lets the owner tell
    /// whether the offer is actually live right now, not just whether they
    /// turned the feature on in general.
    /// </summary>
    public bool TodayOfferActive { get; set; }
}
```

Needs a toggle, a percentage input, and an hour picker in the owner panel, next to wherever
`RentFullday`/`RentHalfday`/`MinimumRent` are already editable, backed by these two endpoints
instead of the general chalet/building update/detail endpoints.

---

Field names above match the JSON shape in `TODAY-OFFER-API-SPEC.md` exactly (camelCase on the
wire — `todayOfferEnabled`, `todayOfferPercent`, etc.) — the PascalCase here is just the C#
convention, assuming standard camelCase JSON serialization like the rest of the API already
uses.
