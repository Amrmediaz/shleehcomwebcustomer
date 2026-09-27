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

// QPay (installments) for flats — same payload shape as the chalet side,
// see PayChaletBookingQpayUseCase in ChaletUseCases.js.
export const PayFlatBookingQpayUseCase = {
    execute: (payload) => BuildingRepository.payQpay(payload),
};

// QPay OTP/cards/confirm for flats — dedicated FlatsCustomer endpoints
// (CORRECTED 10 Sep 2026: these were previously wired to the shared
// CustomerData/chalet endpoints, which 400s for a flat booking's
// paymentNumber). Same payload shapes as the chalet-side equivalents in
// ChaletUseCases.js, just a different URL under the hood.
export const SendFlatQpayOtpUseCase = {
    execute: (payload) => BuildingRepository.sendQpayOtp(payload),
};

export const GetFlatQpayCardsUseCase = {
    execute: (payload) => BuildingRepository.getQpayCards(payload),
};

export const ConfirmFlatQpayUseCase = {
    execute: (payload) => BuildingRepository.confirmQpay(payload),
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
