import { buildingApiClient } from '../api/buildingApiClient.js';
import { BuildingEntity } from '../../core/entities/Building.js';
import { FlatEntity } from '../../core/entities/Flat.js';
import { normalizeSpecialPrices } from '../../core/utils/dateRange.js';

// Same wrapper shape as chalets: { status, message: { results, currentPage, pageCount } }.
function mapList(data) {
    const results = data?.message?.results;
    if (data?.status && Array.isArray(results)) {
        return results.map((b) => new BuildingEntity(b));
    }
    return [];
}

export const BuildingRepository = {
    async getBuildings() {
        return mapList(await buildingApiClient.list());
    },
    async filterBuildings(filters) {
        return mapList(await buildingApiClient.filter(filters));
    },
    async getBuildingDetails(id) {
        const data = await buildingApiClient.details(id);
        if (data?.status && data?.message) return new BuildingEntity(data.message);
        return null;
    },
    async getMapMarkers() {
        const data = await buildingApiClient.map();
        if (data?.status && Array.isArray(data?.message)) return data.message;
        return [];
    },
    async getFlats(buildingId) {
        const data = await buildingApiClient.flats(buildingId);
        const results = data?.message?.results;
        if (data?.status && Array.isArray(results)) {
            return results.map((f) => new FlatEntity(f));
        }
        return [];
    },
    async getBookedDays(flatId) {
        const data = await buildingApiClient.bookedDays(flatId);
        return Array.isArray(data?.message) ? data.message : [];
    },
    async calculatePrice(payload) {
        const data = await buildingApiClient.calculatePrice(payload);
        if (data?.status) return Number(data?.message?.total ?? 0);
        throw new Error(data?.message || 'Failed to calculate price');
    },
    async addBooking(payload) {
        const data = await buildingApiClient.addBooking(payload);
        if (data?.status) return data.message?.id ?? 0;
        throw new Error(data?.message || 'Failed to create booking');
    },
    async pay(payload) {
        const data = await buildingApiClient.pay(payload);
        if (data?.status) return data.message;
        throw new Error(data?.message || 'Failed to start payment');
    },
    async myBookings(page, pageSize) {
        const data = await buildingApiClient.myBookings(page, pageSize);
        const message = data?.message || {};
        return {
            results: message.results || [],
            currentPage: message.currentPage || 1,
            pageCount: message.pageCount || 1,
        };
    },
    async bookingDetails(id) {
        const data = await buildingApiClient.bookingDetails(id);
        return data?.message || null;
    },
    async getSpecialPrices(flatId) {
        const data = await buildingApiClient.specialPrices(flatId);
        return normalizeSpecialPrices(data?.message);
    },
};
