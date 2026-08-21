// Shared helpers for the "Today's Offer" feature (TODAY-OFFER-API-SPEC.md).
// An offer booking always starts today (that's what makes the discount
// apply), but can extend for extra nights at the normal rate — only the
// first night (today) is discounted. These helpers keep that rule in one
// place instead of scattered across the two booking pages.

// No new Today's Offer booking in the last 30 minutes before midnight — a
// booking for a few minutes of "today" isn't useful to a guest anyway, and
// this makes the midnight-rollover race (start checkout right before
// midnight, pay right after) effectively impossible to hit instead of
// something we have to handle precisely.
const CUTOFF_MINUTES_BEFORE_MIDNIGHT = 30;

function pad(n) { return String(n).padStart(2, '0'); }

function toDateInputValue(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// { startDate, endDate } as 'YYYY-MM-DD' strings — today -> tomorrow (1
// night), matching what DateRangeCalendar/ChaletBookingPage already expect.
export function getTodayTomorrowRange() {
    return getOfferRange(1);
}

// Same idea, but for N nights starting today — check-out is N days after
// today, matching the app's existing "checkout - checkin = nights" rule
// (dateRange.js's countDays/eachDay).
export function getOfferRange(nights) {
    const n = Math.max(1, Number(nights) || 1);
    const today = new Date();
    const checkout = new Date(today);
    checkout.setDate(checkout.getDate() + n);
    return { startDate: toDateInputValue(today), endDate: toDateInputValue(checkout) };
}

export function msUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return midnight.getTime() - now.getTime();
}

export function isPastOfferCutoff() {
    return msUntilMidnight() <= CUTOFF_MINUTES_BEFORE_MIDNIGHT * 60 * 1000;
}

// Whether a 'YYYY-MM-DD' date-input string is today's date. The booking
// calendar already disables every date before today, so "does this booking
// actually get the offer discount" reduces to "is the selected check-in
// today" — the guest is always free to pick a later start instead, which
// simply means no discount applies, same as any other booking.
export function isDateToday(dateStr) {
    if (!dateStr) return false;
    return dateStr === toDateInputValue(new Date());
}

// Formats an ms duration as "Hh Mm" / "Mm Ss" for the countdown — hours
// shown once there's more than an hour left, seconds only in the final
// minute so it doesn't feel sluggish right when it matters most.
export function formatCountdown(ms) {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${pad(m)}m`;
    return `${pad(m)}:${pad(s)}`;
}

// Whether a property's offer is actually bookable right now — combines the
// server-computed flag with the client-side cutoff window. Both the initial
// page load AND the moment-of-submit check should call this fresh; never
// trust a value read earlier in the session.
export function isOfferBookable(item) {
    return Boolean(item?.todayOfferActive) && Number(item?.todayOfferPercent) > 0 && !isPastOfferCutoff();
}

export function applyOfferDiscount(basePrice, percent) {
    const p = Number(basePrice) || 0;
    const pct = Number(percent) || 0;
    return Math.max(0, Math.round(p * (1 - pct / 100)));
}

// Backend now bakes the Today's Offer discount into `Total` itself (it
// prices day 1 at the discounted rate, if the offer is live, then sums with
// the rest at the normal rate — see TODAY-OFFER-MODELS.md section 4's
// pricing rule). The price-calc endpoint still only returns that single
// `Total` number though (no breakdown fields, by design — see
// TODAY-OFFER-API-SPEC.md Part 3), so this purely reverse-engineers the
// "night 1 discounted, rest of stay" split for display ("you saved X").
// `finalTotal` is always exactly `backendTotal` — this never recomputes the
// amount actually charged, only how to present it. baseNightRate is
// chalet.rentFullDay/rentHalfDay or the flat's pricePerNight (used only to
// show the struck-through "was" price for night 1).
export function splitOfferTotal(backendTotal, baseNightRate, percent) {
    const total = Number(backendTotal) || 0;
    const base = Number(baseNightRate) || 0;
    const discountedNight1 = applyOfferDiscount(base, percent);
    // Subtract the DISCOUNTED night-1 amount (what's actually embedded in
    // `total`), not the undiscounted base — otherwise this undercounts
    // restOfStay by exactly the discount amount for any stay over 1 night.
    const restOfStay = Math.max(0, total - discountedNight1);
    return {
        night1Original: base,
        night1Discounted: discountedNight1,
        restOfStay,
        finalTotal: total,
        savings: base - discountedNight1,
    };
}
