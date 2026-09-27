// Mirrors lib/core/network/urls.dart from the Flutter customer app so this
// website hits the exact same backend endpoints.

export const API_URL = import.meta.env.VITE_API_URL || 'https://www.shleeh.com';

// AUTH
export const LOGIN_URL = '/api/CustomerData/Login';
export const REGISTER_URL = '/api/CustomerData/AddOwner';
export const PROFILE_URL = '/api/CustomerData/GetOwner';
export const UPDATE_USER_URL = '/api/CustomerData/UpdateOwner';
export const DELETE_USER_URL = '/api/CustomerData/RemoveCustomer';
export const CHECK_USER_EXISTS_URL = '/api/Owners/CheckUser';
export const SEND_OTP_URL = '/api/Support/SendMessage';
export const RESET_PASSWORD_URL = '/api/Owners/RestPassword';

// CHALETS (CustomerData)
export const CHALETS_URL = '/api/CustomerData/BuildingListv2';
export const CHALETS_FILTER_URL = '/api/CustomerData/FilterBuildingListv2';
export const CHALETS_FILTER_DATE_URL = '/api/CustomerData/BuildingListWithDates';
export const CHALET_DETAILS_URL = '/api/CustomerData/GetBuildingData';
export const CHALETS_MAP_URL = '/api/CustomerData/BuildingLatlog';
export const CHALET_BOOKED_DAYS_URL = '/api/CustomerData/GetBookingDays';
export const CHALET_CALCULATE_PRICE_URL = '/api/CustomerData/CalculateBuldingPrices';
export const CHALET_BOOKING_URL = '/api/CustomerData/AddBooking';
export const CHALET_PAYMENT_URL = '/api/CustomerData/BookingPayment';
// QPay (installment) payment — CONFIRMED against a real backend response
// (Amr, 23 Aug 2026): POST { bookingId, paymentType: 3, phoneNumber } ->
// { status, message: { plansList, principalId, paymentNumber } }. See
// QpayCheckoutPage.jsx for how the response is consumed. Same API_URL
// (shleeh.com) as every other endpoint above — no separate host/env for
// QPay. Backend test deploy expected 24 Aug 2026.
export const CHALET_PAYMENT_QPAY_URL = '/api/CustomerData/BookingPaymentQpay';
// QPay OTP — send/resend a verification code for an in-progress QPay
// application. CONFIRMED (Amr, 23 Aug 2026): POST { PaymentNumber, phoneNumber }
// -> { status, message: 'Otp Sended' }.
// CORRECTED (10 Sep 2026, per the real Swagger list): this is NOT shared
// with buildings/flats like CHALET_PAYMENT_QPAY_URL wrongly assumed — there
// is a separate /api/FlatsCustomer/HotelBookingQpayOTP for those, same as
// every other FlatsCustomer/CustomerData split in this file. See
// FLAT_QPAY_SEND_OTP_URL below.
export const QPAY_SEND_OTP_URL = '/api/CustomerData/BookingQpayOTP';
// QPay cards — verifies the OTP and returns the customer's saved QPay cards
// to choose from for the actual charge. CONFIRMED (Ahmed Younes, 24 Aug
// 2026): POST { paymentNumber, phoneNumber, otp } -> card list.
// CORRECTED (10 Sep 2026): also split by booking type, see
// FLAT_QPAY_CARDS_URL below — was wrongly treated as shared.
export const QPAY_CARDS_URL = '/api/CustomerData/BookingQpayCards';
// QPay confirm — the final step that actually charges the selected card.
// CONFIRMED (Ahmed Younes, 24 Aug 2026): POST { paymentNumber, phoneNumber,
// otp, PrincipalId, PlanId, account } — note PrincipalId/PlanId are
// PascalCase while everything else stays lowercase (CONFIRMED 10 Sep 2026).
// "account" is the identifier of the card chosen on the previous
// (BookingQpayCards) step.
// CORRECTED (10 Sep 2026): also split by booking type, see
// FLAT_QPAY_CONFIRM_URL below — was wrongly treated as shared.
export const QPAY_CONFIRM_URL = '/api/CustomerData/BookingQpayConfirm';
export const CHALET_BOOKINGS_URL = '/api/CustomerData/GetBookingList';
export const CHALET_BOOKING_DETAILS_URL = '/api/CustomerData/GetBookingDetailes';

// FAVORITES — new, backend-synced (previously local-only on both the app and
// this site — see FAVORITES-API-SPEC.md at the project root for the full
// spec handed to backend). Covers both chalets and buildings; not under a
// separate group since it's the same CustomerData auth pattern as everything
// above.
export const FAVORITES_URL = '/api/CustomerData/GetFavorite';
export const TOGGLE_FAVORITE_URL = '/api/CustomerData/ToggleFavorite';

// BUILDINGS / FLATS (FlatsCustomer)
export const BUILDINGS_URL = '/api/FlatsCustomer/HotelBuildingList';
export const BUILDINGS_FILTER_URL = '/api/FlatsCustomer/FilterHotelBuildingList';
export const BUILDINGS_FILTER_DATE_URL = '/api/FlatsCustomer/CheckFlatBookingDaysList';
export const BUILDING_DETAILS_URL = '/api/FlatsCustomer/GetHotelBuildingData';
export const BUILDINGS_MAP_URL = '/api/FlatsCustomer/HotelBuildingLatlog';
export const FLATS_URL = '/api/FlatsCustomer/HotelBuildingFlatsList';
export const FLAT_BOOKED_DAYS_URL = '/api/FlatsCustomer/GetFlatBookingDays';
export const FLAT_CALCULATE_PRICE_URL = '/api/FlatsCustomer/CalculateFlatPrices';
export const FLAT_BOOKING_URL = '/api/FlatsCustomer/AddBookingHotel';
export const FLAT_PAYMENT_URL = '/api/FlatsCustomer/HotelBookingPayment';
// QPay (installment) payment for flats — same placeholder-until-confirmed
// situation as CHALET_PAYMENT_QPAY_URL above.
export const FLAT_PAYMENT_QPAY_URL = '/api/FlatsCustomer/HotelBookingPaymentQpay';
// QPay OTP/cards/confirm for flats — CONFIRMED against the real Swagger
// listing (10 Sep 2026) as dedicated FlatsCustomer endpoints, mirroring
// FLAT_PAYMENT_QPAY_URL above. Same request/response shapes as their
// CustomerData counterparts (QPAY_SEND_OTP_URL/QPAY_CARDS_URL/
// QPAY_CONFIRM_URL) — only the host path differs.
export const FLAT_QPAY_SEND_OTP_URL = '/api/FlatsCustomer/HotelBookingQpayOTP';
export const FLAT_QPAY_CARDS_URL = '/api/FlatsCustomer/HotelBookingQpayCards';
export const FLAT_QPAY_CONFIRM_URL = '/api/FlatsCustomer/HotelBookingQpayConfirm';
export const FLAT_BOOKINGS_URL = '/api/FlatsCustomer/GetBookingList';
export const FLAT_BOOKING_DETAILS_URL = '/api/FlatsCustomer/GetBookingDetailes';

// SPECIAL / DISCOUNTED PRICE DAYS ("أسعار خاصة") — lives on a different
// subdomain (shleeh.com, no www) under /api/Owners, unlike everything else
// which is www.shleeh.com. Mirrors chalet_booking_date_widget.dart's
// _specialPricesBaseUrl + _fetchSpecialPrices().
export const SPECIAL_PRICES_BASE_URL = 'https://shleeh.com';
export const CHALET_SPECIAL_PRICES_URL = '/api/Owners/GetBuildingPrices';
export const FLAT_SPECIAL_PRICES_URL = '/api/Owners/GetFlatSpcialPrices';

// The bank's fixed return URLs — mirrors SUCCESS_URL/FAIL_URL in the
// Flutter app's Constants.dart, which the WebView intercepts on navigation.
// Note the inconsistent host between the two: success has no "www", fail
// does — that's from the real app, not a typo here. Both must be checked
// when watching for the popup gateway window to come back (see
// core/utils/paymentGatewayWindow.js).
//
// The popup-polling detection this powers only works when this app is
// served from the exact same origin the bank redirects back to — which is
// never true from localhost (the bank always redirects to the real
// shleeh.com, not wherever `npm run dev` happens to be running). So in dev
// builds only, these point at a local mock-bank route instead (see
// presentation/pages/dev/MockBankPage.jsx + App.jsx), same-origin with the
// dev server, so the whole popup + polling + redirect flow can be
// exercised end-to-end without a real bank or a deployed domain. Production
// builds always use the real URLs — this never affects what ships.
export const PAYMENT_SUCCESS_URL = import.meta.env.DEV
    ? `${window.location.origin}/__mock-bank/success`
    : 'https://shleeh.com/RequestPay/Success';
export const PAYMENT_FAIL_URL = import.meta.env.DEV
    ? `${window.location.origin}/__mock-bank/fail`
    : 'https://www.shleeh.com/RequestPay/Error';
