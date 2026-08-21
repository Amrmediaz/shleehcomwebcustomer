import { httpClient } from './httpClient.js';
import {
    CHALETS_FILTER_URL, CHALETS_FILTER_DATE_URL, CHALET_DETAILS_URL, CHALET_BOOKED_DAYS_URL, CHALETS_MAP_URL,
    CHALET_CALCULATE_PRICE_URL, CHALET_BOOKING_URL, CHALET_PAYMENT_URL,
    CHALET_BOOKINGS_URL, CHALET_BOOKING_DETAILS_URL,
    SPECIAL_PRICES_BASE_URL, CHALET_SPECIAL_PRICES_URL,
} from '../../core/network/urls.js';

// Mirrors chalets_page.dart's _defaultFilterBody(): the app's "plain"
// chalets list is not a bodyless GET/POST — it's always a call to
// FilterBuildingListv2 with these four fields. CHALETS_URL (BuildingListv2)
// is dead code in the current app (chalet_remote_data_source.dart's URL
// ternary always resolves to CHALETS_FILTER_URL), so we match that exactly
// rather than the endpoint name that looks like the "default" one.
const DEFAULT_CHALETS_BODY = { page: 1, pageSize: 10, heightolow: 1, rateheightolow: 0 };

export const chaletApiClient = {
    async list() {
        return httpClient.post(CHALETS_FILTER_URL, { body: DEFAULT_CHALETS_BODY });
    },
    async filter(filters) {
        // filters may itself carry page/pageSize (see filterPaged in
        // ChaletRepository.js) to override the page-1/size-10 default below
        // — that's how "load more" fetches page 2, 3, ... of the same
        // filter set instead of being stuck on the first 10 results forever.
        const body = { ...DEFAULT_CHALETS_BODY, ...filters };
        // Mirrors chalet_remote_data_source.dart's getChalets(): whenever a
        // date range is part of the filter, the request goes to a totally
        // different endpoint (BuildingListWithDates) instead of the plain
        // FilterBuildingListv2 — the mobile app picks it by checking whether
        // the body contains "endDate" at all, so we key off the same field.
        const url = body.endDate ? CHALETS_FILTER_DATE_URL : CHALETS_FILTER_URL;
        return httpClient.post(url, { body });
    },
    async details(id) {
        return httpClient.get(`${CHALET_DETAILS_URL}?BuldingId=${id}`);
    },
    async map() {
        // Mirrors chalet_remote_data_source.dart's getChaletsMap(): GET, no body.
        return httpClient.get(CHALETS_MAP_URL);
    },
    async bookedDays(buildingId) {
        // buildingId comes from the route param (a string) in some call
        // sites — the backend expects a real JSON number here (matches
        // CommonApi.getBookedDates(int buildingId, ...) in the Flutter app)
        // and 400s on a string.
        return httpClient.post(CHALET_BOOKED_DAYS_URL, { body: { buildingId: Number(buildingId) } });
    },
    async calculatePrice(payload) {
        return httpClient.post(CHALET_CALCULATE_PRICE_URL, { body: payload });
    },
    async addBooking(payload) {
        return httpClient.post(CHALET_BOOKING_URL, { body: payload, auth: true });
    },
    async pay(payload) {
        return httpClient.post(CHALET_PAYMENT_URL, { body: payload, auth: true });
    },
    async myBookings(page, pageSize) {
        return httpClient.post(CHALET_BOOKINGS_URL, { body: { page, pageSize }, auth: true });
    },
    async bookingDetails(bookingId) {
        return httpClient.get(`${CHALET_BOOKING_DETAILS_URL}?bookingID=${bookingId}`, { auth: true });
    },
    async specialPrices(chaletId) {
        // Special/discounted-price date ranges ("أسعار خاصة") — lives on
        // shleeh.com (no www), unlike everything else on this client.
        // Best-effort by design in the app itself: never blocks booking if
        // it fails, so we don't throw here either.
        try {
            return await httpClient.get(`${SPECIAL_PRICES_BASE_URL}${CHALET_SPECIAL_PRICES_URL}?BuldingId=${chaletId}`);
        } catch {
            return null;
        }
    },
};
