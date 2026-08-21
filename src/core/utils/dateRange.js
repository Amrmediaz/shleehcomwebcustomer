// Mirrors chaletbookingdatehelper.dart's day-counting convention: a stay
// from checkin -> checkout spans (checkout - checkin) nights; a single
// selected day (start === end) still counts as one night.

function pad(n) { return String(n).padStart(2, '0'); }

function eachDay(start, end) {
    const days = [];
    const cur = new Date(start);
    const loopEnd = start.getTime() === end.getTime()
        ? new Date(end.getTime() + 86400000)
        : end;
    while (cur < loopEnd) {
        days.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return days;
}

export function buildPriceCalcPayload({ id, isChalet, startDate, endDate, isFullDay }) {
    const days = eachDay(startDate, endDate).map((d) => ({
        day: d.toISOString(),
        fullday: isFullDay,
    }));
    return {
        [isChalet ? 'buldingId' : 'flatID']: id,
        bookingDays: days,
    };
}

export function buildBookedDaysPayload({ startDate, endDate, isFullDay }) {
    return eachDay(startDate, endDate).map((d) => ({
        day: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
        isFullDay,
    }));
}

export function countDays(startDate, endDate) {
    return eachDay(startDate, endDate).length;
}

// Formats a 'YYYY-MM-DD' string for display, e.g. "12 Aug 2026" / "12 أغسطس 2026".
export function formatDate(dateStr, lang) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function isRangeAvailable(startDate, endDate, bookedDates = []) {
    return !bookedDates.some((str) => {
        const parts = String(str).split('/');
        if (parts.length !== 3) return false;
        const [d, m, y] = parts.map(Number);
        const booked = new Date(y, m - 1, d);
        return booked > startDate && booked < endDate;
    });
}

// Parses the API's 'dd/MM/yyyy' date format (used everywhere across booked
// days and special prices) into a real Date, or null if malformed.
export function parseDdMmYyyy(str) {
    const parts = String(str).split('/');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
}

// Formats the API's 'dd/MM/yyyy' date format for display, e.g.
// "12 Aug 2026" / "12 أغسطس 2026" — same output style as formatDate() above,
// just for the other date format the booking-days/detail endpoints use.
// Falls back to the raw string if it doesn't parse.
export function formatDdMmYyyy(str, lang) {
    const d = parseDdMmYyyy(str);
    if (!d || Number.isNaN(d.getTime())) return str;
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

// Normalizes the special/discounted-price API response (an array of
// { startDate, endDate, price, type } with 'dd/MM/yyyy' strings — mirrors
// chalet_booking_date_widget.dart's SpecialPriceModel) into a simpler
// { start, end, price } shape with real Date objects, dropping anything
// that fails to parse instead of throwing (this is a best-effort feature
// in the app itself, never something that should block booking).
export function normalizeSpecialPrices(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((r) => ({
            start: parseDdMmYyyy(r.startDate),
            end: parseDdMmYyyy(r.endDate),
            price: Number(r.price ?? 0),
        }))
        .filter((r) => r.start && r.end);
}
