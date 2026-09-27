import { chaletApiClient } from '../api/chaletApiClient.js';
import { ChaletEntity } from '../../core/entities/Chalet.js';
import { normalizeSpecialPrices } from '../../core/utils/dateRange.js';

// The list/filter endpoints wrap results as { status, message: { results, currentPage, pageCount } }
// — not a bare array under `message` (that shape is only used by the map endpoint).
function mapList(data) {
    const results = data?.message?.results;
    if (data?.status && Array.isArray(results)) {
        return results.map((c) => new ChaletEntity(c));
    }
    return [];
}

// Same response, but keeps currentPage/pageCount instead of discarding them
// — needed so ChaletsListPage.jsx can tell whether there's a next page to
// load. The plain array-returning methods above default to page 1 only
// (fine for the landing page's small "featured" pickers), so this is a
// separate method rather than a breaking change to their return shape.
function mapPagedList(data) {
    const message = data?.message || {};
    const results = Array.isArray(message.results) ? message.results : [];
    return {
        results: data?.status ? results.map((c) => new ChaletEntity(c)) : [],
        currentPage: message.currentPage || 1,
        pageCount: message.pageCount || 1,
    };
}

export const ChaletRepository = {
    async getChalets() {
        return mapList(await chaletApiClient.list());
    },
    async filterChalets(filters) {
        return mapList(await chaletApiClient.filter(filters));
    },
    async filterChaletsPaged(filters, page, pageSize) {
        return mapPagedList(await chaletApiClient.filter({ ...filters, page, pageSize }));
    },
    async getChaletDetails(id) {
        const data = await chaletApiClient.details(id);
        if (data?.status && data?.message) return new ChaletEntity(data.message);
        return null;
    },
    async getMapMarkers() {
        const data = await chaletApiClient.map();
        if (data?.status && Array.isArray(data?.message)) return data.message;
        return [];
    },
    async getBookedDays(buildingId) {
        const data = await chaletApiClient.bookedDays(buildingId);
        return Array.isArray(data?.message) ? data.message : [];
    },
    async calculatePrice(payload) {
        const data = await chaletApiClient.calculatePrice(payload);
        if (data?.status) return Number(data?.message?.total ?? 0);
        throw new Error(data?.message || 'Failed to calculate price');
    },
    async addBooking(payload) {
        const data = await chaletApiClient.addBooking(payload);
        if (data?.status) return data.message?.id ?? 0;
        throw new Error(data?.message || 'Failed to create booking');
    },
    async pay(payload) {
        const data = await chaletApiClient.pay(payload);
        if (data?.status) return data.message;
        throw new Error(data?.message || 'Failed to start payment');
    },
    async payQpay(payload) {
        const data = await chaletApiClient.payQpay(payload);
        if (data?.status) return data.message;
        throw new Error(data?.message || 'Failed to start QPay payment');
    },
    async sendQpayOtp(payload) {
        const data = await chaletApiClient.sendQpayOtp(payload);
        if (data?.status) return data.message;
        throw new Error(data?.message || 'Failed to send verification code');
    },
    async getQpayCards(payload) {
        const data = await chaletApiClient.getQpayCards(payload);
        if (data?.status) return data.message;
        throw new Error(data?.message || 'Failed to load cards');
    },
    async confirmQpay(payload) {
        const data = await chaletApiClient.confirmQpay(payload);
        if (data?.status) return data.message;
        throw new Error(data?.message || 'Failed to confirm payment');
    },
    async myBookings(page, pageSize) {
        const data = await chaletApiClient.myBookings(page, pageSize);
        const message = data?.message || {};
        return {
            results: message.results || [],
            currentPage: message.currentPage || 1,
            pageCount: message.pageCount || 1,
        };
    },
    async bookingDetails(id) {
        const data = await chaletApiClient.bookingDetails(id);
        return data?.message || null;
    },
    async getSpecialPrices(chaletId) {
        const data = await chaletApiClient.specialPrices(chaletId);
        return normalizeSpecialPrices(data?.message);
    },
};
