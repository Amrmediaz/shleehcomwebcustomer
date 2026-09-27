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

// QPay (installments). payload: { bookingId, paymentType, phoneNumber } —
// CONFIRMED shape against a real BookingPaymentQpay response (23 Aug 2026).
// Resolves to { plansList, principalId, paymentNumber } on success — see
// QpayCheckoutPage.jsx.
export const PayChaletBookingQpayUseCase = {
    execute: (payload) => ChaletRepository.payQpay(payload),
};

// QPay OTP send/resend. payload: { PaymentNumber, phoneNumber } — CONFIRMED
// (23 Aug 2026). Resolves to a plain string message ("Otp Sended") on success.
export const SendQpayOtpUseCase = {
    execute: (payload) => ChaletRepository.sendQpayOtp(payload),
};

// QPay cards. payload: { paymentNumber, phoneNumber, otp } — CONFIRMED
// (Ahmed Younes, 24 Aug 2026). Resolves to the card list to charge.
export const GetQpayCardsUseCase = {
    execute: (payload) => ChaletRepository.getQpayCards(payload),
};

// QPay confirm — the final charge step. payload: { paymentNumber,
// phoneNumber, otp, principalId, planId, account } — CONFIRMED (Ahmed
// Younes, 24 Aug 2026).
export const ConfirmQpayUseCase = {
    execute: (payload) => ChaletRepository.confirmQpay(payload),
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
