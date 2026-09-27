import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './presentation/components/Main/Layout.jsx';
import { useAuth } from './presentation/context/AuthContext.jsx';

import LandingPage from './presentation/pages/LandingPage.jsx';
import LoginPage from './presentation/pages/LoginPage.jsx';
import RegisterPage from './presentation/pages/RegisterPage.jsx';
import ResetPasswordPage from './presentation/pages/ResetPasswordPage.jsx';
import ChaletsListPage from './presentation/pages/ChaletsListPage.jsx';
import ChaletDetailPage from './presentation/pages/ChaletDetailPage.jsx';
import ChaletBookingPage from './presentation/pages/ChaletBookingPage.jsx';
import BuildingsListPage from './presentation/pages/BuildingsListPage.jsx';
import BuildingDetailPage from './presentation/pages/BuildingDetailPage.jsx';
import FlatBookingPage from './presentation/pages/FlatBookingPage.jsx';
import BookingSuccessPage from './presentation/pages/BookingSuccessPage.jsx';
import PaymentPage from './presentation/pages/PaymentPage.jsx';
import QpayCheckoutPage from './presentation/pages/QpayCheckoutPage.jsx';
import PaymentSuccessPage from './presentation/pages/PaymentSuccessPage.jsx';
import PaymentFailPage from './presentation/pages/PaymentFailPage.jsx';
import FavoritesPage from './presentation/pages/FavoritesPage.jsx';
import MyBookingsPage from './presentation/pages/MyBookingsPage.jsx';
import BookingDetailPage from './presentation/pages/BookingDetailPage.jsx';
import ChaletsMapPage from './presentation/pages/ChaletsMapPage.jsx';
import BuildingsMapPage from './presentation/pages/BuildingsMapPage.jsx';
import ProfilePage from './presentation/pages/ProfilePage.jsx';
import PrivacyPage from './presentation/pages/PrivacyPage.jsx';
import MockBankPage from './presentation/pages/dev/MockBankPage.jsx';
import MockBankResultPage from './presentation/pages/dev/MockBankResultPage.jsx';

const RequireAuth = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};

const GuestOnly = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) return <Navigate to="/" replace />;
    return children;
};

export default function App() {
    return (
        // basename must match vite.config.js's `base` (/app/) — every route
        // below is written as if the app were at the domain root; this is
        // the one place that maps them onto the real /app/... URLs.
        <Router basename="/app">
            <Layout>
                <Routes>
                    <Route path="/" element={<LandingPage />} />

                    <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
                    <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
                    <Route path="/reset-password" element={<GuestOnly><ResetPasswordPage /></GuestOnly>} />

                    <Route path="/chalets" element={<ChaletsListPage />} />
                    <Route path="/chalets/map" element={<ChaletsMapPage />} />
                    <Route path="/chalets/:id" element={<ChaletDetailPage />} />
                    {/* Booking page is open to guests too — dates & price are visible
                        without an account; login is only required at the final
                        "Confirm Booking" step, so we don't lose a browsing user's
                        intent behind a login wall before they've seen any value. */}
                    <Route path="/chalets/:id/book" element={<ChaletBookingPage />} />

                    <Route path="/buildings" element={<BuildingsListPage />} />
                    <Route path="/buildings/map" element={<BuildingsMapPage />} />
                    <Route path="/buildings/:id" element={<BuildingDetailPage />} />
                    <Route path="/buildings/:id/book" element={<FlatBookingPage />} />

                    <Route path="/booking/success" element={<BookingSuccessPage />} />
                    <Route path="/booking/pay" element={<PaymentPage />} />
                    {/* Installment payment (QPay) — a second payment method next
                        to the bank/card flow above, offered as a choice on
                        PaymentPage.jsx. */}
                    <Route path="/booking/pay/qpay" element={<QpayCheckoutPage />} />
                    {/* Our own branded result pages — this is where the bank-redirect
                        paths below send the browser on to. */}
                    <Route path="/payment-success" element={<PaymentSuccessPage />} />
                    <Route path="/payment-failed" element={<PaymentFailPage />} />
                    {/* Real bank-gateway redirect targets (SUCCESS_URL / FAIL_URL in the
                        Flutter app's Constants.dart, backend-controlled and not something
                        we can change) — the payment page sends the browser to the bank on
                        its own domain, and the bank redirects back to these exact paths on
                        ours once the charge resolves. We don't render anything at these
                        URLs directly; we immediately hand off to our own custom pages above
                        so the address bar (and everything the customer sees) is ours.
                        NOTE: now that this app is deployed at shleeh.com/app/ instead of
                        the domain root, the bank will never actually hit this route (it
                        always redirects to the fixed root-level /RequestPay/Success and
                        /RequestPay/Error, not /app/RequestPay/Success) — that hand-off is
                        done instead by the standalone-fallback/ redirect pages installed
                        at the domain root. Left in place as a harmless fallback in case
                        someone lands on /app/RequestPay/Success directly. */}
                    <Route path="/RequestPay/Success" element={<Navigate to="/payment-success" replace />} />
                    <Route path="/RequestPay/Error" element={<Navigate to="/payment-failed" replace />} />

                    {/* Dev-only stand-in for the real bank, so the popup +
                        same-origin polling in PaymentPage.jsx can be tested
                        from localhost — the real bank always redirects to
                        the actual shleeh.com, which localhost can never
                        read cross-origin. Stripped out of production
                        routing entirely (import.meta.env.DEV is a
                        build-time constant). */}
                    {import.meta.env.DEV && (
                        <>
                            <Route path="/__mock-bank" element={<MockBankPage />} />
                            <Route path="/__mock-bank/success" element={<MockBankResultPage status="success" />} />
                            <Route path="/__mock-bank/fail" element={<MockBankResultPage status="fail" />} />
                        </>
                    )}

                    {/* Favorites now needs an account — it's backend-synced (see
                        FAVORITES-API-SPEC.md), and the API requires a token.
                        Tapping the heart icon itself already redirects a guest
                        to /login (FavoritesContext.jsx), this just covers
                        someone navigating straight to the URL. */}
                    <Route path="/favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
                    <Route path="/my-bookings" element={<RequireAuth><MyBookingsPage /></RequireAuth>} />
                    {/* ?type=chalet|building — see the doc comment atop
                        BookingDetailPage.jsx for why this is a query param
                        rather than baked into the route path. */}
                    <Route path="/my-bookings/:id" element={<RequireAuth><BookingDetailPage /></RequireAuth>} />
                    <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                    <Route path="/privacy" element={<PrivacyPage />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </Router>
    );
}
