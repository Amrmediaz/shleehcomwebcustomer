import { ChaletRepository } from '../../data/repositories/ChaletRepository.js';

export const GetChaletsUseCase = {
    execute: (filters) => (filters ? ChaletRepository.filterChalets(filters) : ChaletRepository.getChalets()),
};

export const GetChaletsPagedUseCase = {
    execute: (filters, page, pageSize) => ChaletRepository.filterChaletsPaged(filters, page, pageSize),
};

export const GetChaletDetailsUseCase = {
    execute: (id) => ChaletRepository.getChaletDetails(id),
};

export const GetChaletBookedDaysUseCase = {
    execute: (buildingId) => ChaletRepository.getBookedDays(buildingId),
};

export const CalculateChaletPriceUseCase = {
    execute: (payload) => ChaletRepository.calculatePrice(payload),
};

export const CreateChaletBookingUseCase = {
    execute: (payload) => ChaletRepository.addBooking(payload),
};

export const PayChaletBookingUseCase = {
    execute: (payload) => ChaletRepository.pay(payload),
};

export const GetMyChaletBookingsUseCase = {
    execute: (page, pageSize) => ChaletRepository.myBookings(page, pageSize),
};

export const GetChaletBookingDetailsUseCase = {
    execute: (id) => ChaletRepository.bookingDetails(id),
};

export const GetChaletsMapUseCase = {
    execute: () => ChaletRepository.getMapMarkers(),
};

export const GetChaletSpecialPricesUseCase = {
    execute: (chaletId) => ChaletRepository.getSpecialPrices(chaletId),
};
