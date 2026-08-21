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
