import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { PayChaletBookingUseCase } from '../../core/useCases/ChaletUseCases.js';
import { PayFlatBookingUseCase } from '../../core/useCases/BuildingUseCases.js';
import { LoadingState, ErrorState } from '../components/Property/StateViews.jsx';
import { PENDING_PAYMENT_KEY } from '../../core/network/keys.js';
import { openPaymentGateway } from '../../core/utils/paymentGatewayWindow.js';
import './BookingPage.css';

// Marks bookingId as "payment already launched" for this browser tab, so
// that landing back on this exact route (Back button, etc.) doesn't
// silently call the Pay API again and spin up a second payment session for
// the same booking. sessionStorage (not localStorage) is deliberate: it
// clears when the tab closes, so paying for the same booking in a fresh
// tab/session still starts normally.
function startedKey(bookingId) {
    return `shleeh_payment_started_${bookingId}`;
}

// status machine:
//   choose   -> let the user pick "pay now" (bank) or QPay (installments)
//   loading  -> fetching the bank gateway URL from our backend
//   ready    -> URL in hand, waiting on the user to tap "Pay"
//   opening  -> popup opened, polling it for the bank's return redirect
//   blocked  -> window.open() was blocked even from a real click
//   closed   -> the user closed the popup before finishing
//   error    -> couldn't get a payment URL at all
//   already  -> this booking's payment was already launched this session
export default function PaymentPage() {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingId, isChalet } = location.state || {};
    const [paymentUrl, setPaymentUrl] = useState(null);
    const [status, setStatus] = useState('choose');
    const cleanupRef = useRef(null);

    const resolvePayment = (outcome) => {
        if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
        localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify({ bookingId, isChalet }));
        navigate(outcome === 'success' ? '/payment-success' : '/payment-failed', { replace: true });
    };

    const launchGateway = (url) => {
        setStatus('opening');
        sessionStorage.setItem(startedKey(bookingId), '1');
        const cleanup = openPaymentGateway(url, {
            onSuccess: () => resolvePayment('success'),
            onFail: () => resolvePayment('fail'),
            onClosed: () => setStatus('closed'),
        });
        if (!cleanup) { setStatus('blocked'); return; }
        cleanupRef.current = cleanup;
    };

    // A same-tab fallback (window.location.href = paymentUrl) used to exist
    // here, but it's fundamentally broken now that this app is deployed
    // under shleeh.com/app/ instead of the domain root: a full top-level
    // navigation leaves this app entirely, and when the bank redirects back
    // it lands on the bank's fixed https://shleeh.com/RequestPay/Success —
    // a URL outside /app/ that this app has no way to intercept or react
    // to. The popup + polling flow below doesn't have this problem (see
    // paymentGatewayWindow.js — it only ever reads the popup's address, it
    // doesn't need anything real to be served there), so it's the only
    // supported path now. If the popup is blocked, the fix is allowing
    // popups for this site, not falling back to a same-tab redirect.

    const startPayment = async (force = false) => {
        if (!bookingId) { setStatus('error'); return; }
        if (!force && sessionStorage.getItem(startedKey(bookingId))) {
            setStatus('already');
            return;
        }
        setStatus('loading');
        try {
            const useCase = isChalet ? PayChaletBookingUseCase : PayFlatBookingUseCase;
            const url = await useCase.execute({ bookingId, paymentType: 1 });
            if (!url) { setStatus('error'); return; }
            setPaymentUrl(url);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    // No auto-start here anymore — the user now picks a payment method
    // first (see the 'choose' screen below); startPayment() only runs once
    // they tap "Pay now" (bank/card). Still clean up the popup poller on
    // unmount either way.
    useEffect(() => {
        return () => { if (cleanupRef.current) cleanupRef.current(); };
    }, []);

    const goToQpay = () => {
        navigate('/booking/pay/qpay', { state: { bookingId, isChalet } });
    };

    if (!bookingId) {
        return (
            <div className="container booking-page">
                <div className="card" style={{ textAlign: 'center' }}>
                    <p>{t('no_bookings')}</p>
                    <Link className="btn btn-primary" to="/">{t('back_to_home')}</Link>
                </div>
            </div>
        );
    }

    if (status === 'already') {
        return (
            <div className="container booking-page">
                <div className="card" style={{ textAlign: 'center' }}>
                    <p style={{ marginBottom: 18 }}>{t('payment_already_started')}</p>
                    <Link className="btn btn-primary btn-block" to="/my-bookings">{t('view_my_bookings')}</Link>
                    <button type="button" className="btn btn-outline btn-block" style={{ marginTop: 10 }} onClick={() => startPayment(true)}>
                        {t('try_again')}
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'choose') {
        return (
            <div className="container booking-page">
                <div className="card" style={{ textAlign: 'left' }}>
                    <h2 style={{ marginBottom: 6 }}>{t('choose_payment_method_title')}</h2>
                    <p style={{ marginBottom: 20, color: 'var(--color-text-secondary)' }}>
                        {t('choose_payment_method_sub', { id: bookingId })}
                    </p>

                    <button
                        type="button"
                        className="btn btn-primary btn-block"
                        style={{ textAlign: 'left', padding: '14px 18px', marginBottom: 12 }}
                        onClick={() => startPayment()}
                    >
                        <span style={{ display: 'block', fontWeight: 700 }}>{t('pay_now_bank_label')}</span>
                        <span style={{ display: 'block', fontWeight: 400, fontSize: 12.5, opacity: 0.9 }}>{t('pay_now_bank_desc')}</span>
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline btn-block"
                        style={{ textAlign: 'left', padding: '14px 18px' }}
                        onClick={goToQpay}
                    >
                        <span style={{ display: 'block', fontWeight: 700 }}>{t('pay_qpay_label')}</span>
                        <span style={{ display: 'block', fontWeight: 400, fontSize: 12.5, opacity: 0.8 }}>{t('pay_qpay_desc')}</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container booking-page">
            <div className="card" style={{ textAlign: 'center' }}>
                {/* Dev only — lets the popup + polling detection be tested
                    from localhost against a fake bank, since the real bank
                    always redirects to shleeh.com, which localhost can
                    never read cross-origin. Gone entirely from production
                    builds (import.meta.env.DEV is a build-time constant). */}
                {import.meta.env.DEV && (
                    <div style={{ marginBottom: 16, padding: '10px 12px', background: '#FEF3E2', borderRadius: 8, fontSize: 12.5, textAlign: 'left' }}>
                        <strong>Dev only:</strong> test the popup-detection flow against a fake bank —{' '}
                        <button
                            type="button"
                            onClick={() => launchGateway('/__mock-bank')}
                            style={{ textDecoration: 'underline', color: '#5850FF', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, padding: 0 }}
                        >
                            open mock bank
                        </button>
                    </div>
                )}

                {status === 'loading' && <LoadingState />}
                {status === 'error' && <ErrorState onRetry={() => startPayment()} />}

                {status === 'ready' && paymentUrl && (
                    <>
                        <p style={{ marginBottom: 18 }}>{t('payment_ready_note')}</p>
                        <button type="button" className="btn btn-primary btn-block" onClick={() => launchGateway(paymentUrl)}>
                            {t('proceed_to_payment')}
                        </button>
                    </>
                )}

                {status === 'opening' && (
                    <>
                        <LoadingState />
                        <p style={{ marginTop: 14 }}>{t('payment_window_open_note')}</p>
                    </>
                )}

                {status === 'blocked' && paymentUrl && (
                    <>
                        <p style={{ marginBottom: 18 }}>{t('popup_blocked_note')}</p>
                        <button type="button" className="btn btn-primary btn-block" onClick={() => launchGateway(paymentUrl)}>
                            {t('proceed_to_payment')}
                        </button>
                    </>
                )}

                {status === 'closed' && paymentUrl && (
                    <>
                        <p style={{ marginBottom: 18 }}>{t('payment_window_closed_note')}</p>
                        <button type="button" className="btn btn-primary btn-block" onClick={() => launchGateway(paymentUrl)}>
                            {t('try_again')}
                        </button>
                        <Link className="btn btn-outline btn-block" style={{ marginTop: 10 }} to="/my-bookings">{t('view_my_bookings')}</Link>
                    </>
                )}
            </div>
        </div>
    );
}
