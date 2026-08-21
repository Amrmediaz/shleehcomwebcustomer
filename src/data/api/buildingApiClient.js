import { httpClient } from './httpClient.js';
import {
    BUILDINGS_URL, BUILDINGS_FILTER_URL, BUILDING_DETAILS_URL, FLATS_URL, BUILDINGS_MAP_URL,
    FLAT_BOOKED_DAYS_URL, FLAT_CALCULATE_PRICE_URL, FLAT_BOOKING_URL, FLAT_PAYMENT_URL,
    FLAT_BOOKINGS_URL, FLAT_BOOKING_DETAILS_URL,
    SPECIAL_PRICES_BASE_URL, FLAT_SPECIAL_PRICES_URL,
} from '../../core/network/urls.js';

// Mirrors buildings_page.dart's _defaultFilterBody() — same shape as the
// chalets side.
const DEFAULT_BUILDINGS_BODY = { page: 1, pageSize: 10, heightolow: 1, rateheightolow: 0 };

export const buildingApiClient = {
    async list() {
        return httpClient.post(BUILDINGS_URL, { body: DEFAULT_BUILDINGS_BODY });
    },
    async filter(filters) {
        return httpClient.post(BUILDINGS_FILTER_URL, { body: { ...DEFAULT_BUILDINGS_BODY, ...filters } });
    },
    async details(id) {
        return httpClient.get(`${BUILDING_DETAILS_URL}?BuldingId=${id}`);
    },
    async map() {
        // Mirrors building_remote_data_source.dart's getBuildingsMap(): GET, no body.
        return httpClient.get(BUILDINGS_MAP_URL);
    },
    async flats(buildingId, page = 1, pageSize = 20) {
        return httpClient.post(FLATS_URL, { body: { page, pageSize, buildingId: Number(buildingId) } });
    },
    async bookedDays(flatId) {
        // Route params come in as strings — backend wants a real number
        // here (same 400-on-string issue as the chalets side).
        return httpClient.post(FLAT_BOOKED_DAYS_URL, { body: { buildingId: Number(flatId) } });
    },
    async calculatePrice(payload) {
        return httpClient.post(FLAT_CALCULATE_PRICE_URL, { body: payload });
    },
    async addBooking(payload) {
        return httpClient.post(FLAT_BOOKING_URL, { body: payload, auth: true });
    },
    async pay(payload) {
        return httpClient.post(FLAT_PAYMENT_URL, { body: payload, auth: true });
    },
    async myBookings(page, pageSize) {
        return httpClient.post(FLAT_BOOKINGS_URL, { body: { page, pageSize }, auth: true });
    },
    async bookingDetails(bookingId) {
        return httpClient.get(`${FLAT_BOOKING_DETAILS_URL}?bookingID=${bookingId}`, { auth: true });
    },
    async specialPrices(flatId) {
        // Same special/discounted-price feature as chalets, keyed by FlatID
        // instead of BuldingId. Best-effort, same as the app.
        try {
            return await httpClient.get(`${SPECIAL_PRICES_BASE_URL}${FLAT_SPECIAL_PRICES_URL}?FlatID=${flatId}`);
        } catch {
            return null;
        }
    },
};
