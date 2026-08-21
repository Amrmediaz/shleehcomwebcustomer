import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { PENDING_PAYMENT_KEY } from '../../core/network/keys.js';
import './PaymentResult.css';

// Where the bank sends the browser back to when a charge fails or is
// cancelled. Same story as the success page — fresh load, no router state,
// so we read back whatever PaymentPage stashed before leaving. Unlike the
// success page we don't clear it here, since "Try again" needs it to
// re-launch payment for the same booking.
export default function PaymentFailPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [pending, setPending] = useState(null);

    useEffect(() => {
        const raw = localStorage.getItem(PENDING_PAYMENT_KEY);
        if (!raw) return;
        try {
            const info = JSON.parse(raw);
            if (info?.bookingId) setPending(info);
        } catch { /* ignore */ }
    }, []);

    const handleRetry = () => {
        // replace: true — don't leave this fail screen sitting behind the
        // retry attempt; Back from the new payment attempt should skip it.
        navigate('/booking/pay', { state: { bookingId: pending.bookingId, isChalet: pending.isChalet }, replace: true });
    };

    return (
        <div className="container payresult-page">
            <div className="card payresult-card">
                <div className="payresult-icon is-fail"><i className="fa-solid fa-xmark"></i></div>
                <h1 className="payresult-title">{t('payment_fail_title')}</h1>
                <p className="payresult-desc">{t('payment_fail_desc')}</p>

                <div className="payresult-actions">
                    {pending && (
                        <button className="btn btn-primary btn-block" onClick={handleRetry}>{t('try_again')}</button>
                    )}
                    <Link className="btn btn-outline btn-block" to="/">{t('back_to_home')}</Link>
                </div>
            </div>
        </div>
    );
}
