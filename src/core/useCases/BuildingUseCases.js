import { BuildingRepository } from '../../data/repositories/BuildingRepository.js';

export const GetBuildingsUseCase = {
    execute: (filters) => (filters ? BuildingRepository.filterBuildings(filters) : BuildingRepository.getBuildings()),
};

export const GetBuildingDetailsUseCase = {
    execute: (id) => BuildingRepository.getBuildingDetails(id),
};

export const GetBuildingFlatsUseCase = {
    execute: (buildingId) => BuildingRepository.getFlats(buildingId),
};

export const GetFlatBookedDaysUseCase = {
    execute: (flatId) => BuildingRepository.getBookedDays(flatId),
};

export const CalculateFlatPriceUseCase = {
    execute: (payload) => BuildingRepository.calculatePrice(payload),
};

export const CreateFlatBookingUseCase = {
    execute: (payload) => BuildingRepository.addBooking(payload),
};

export const PayFlatBookingUseCase = {
    execute: (payload) => BuildingRepository.pay(payload),
};

export const GetMyFlatBookingsUseCase = {
    execute: (page, pageSize) => BuildingRepository.myBookings(page, pageSize),
};

export const GetFlatBookingDetailsUseCase = {
    execute: (id) => BuildingRepository.bookingDetails(id),
};

export const GetBuildingsMapUseCase = {
    execute: () => BuildingRepository.getMapMarkers(),
};

export const GetFlatSpecialPricesUseCase = {
    execute: (flatId) => BuildingRepository.getSpecialPrices(flatId),
};
