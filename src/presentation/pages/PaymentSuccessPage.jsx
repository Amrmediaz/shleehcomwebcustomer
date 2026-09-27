import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { GetChaletBookingDetailsUseCase, GetChaletDetailsUseCase } from '../../core/useCases/ChaletUseCases.js';
import { GetFlatBookingDetailsUseCase } from '../../core/useCases/BuildingUseCases.js';
import { PENDING_PAYMENT_KEY } from '../../core/network/keys.js';
import { getWilayatLabel, getGovernorateLabel, getDisplayName } from '../../core/utils/constants.js';
import { formatDdMmYyyy, formatCheckoutDdMmYyyy } from '../../core/utils/dateRange.js';
import { LoadingState } from '../components/Property/StateViews.jsx';
import './PaymentResult.css';

// The bank's payment page lives on its own domain — this route is where it
// sends the browser back to after a successful charge. That's a fresh page
// load with no React Router state, so booking context comes from whatever
// PaymentPage stashed in localStorage right before the redirect out.
export default function PaymentSuccessPage() {
    const { t, lang } = useTranslation();
    const [phase, setPhase] = useState('loading'); // loading | details | generic
    const [booking, setBooking] = useState(null);
    const [chalet, setChalet] = useState(null);
    const [isChalet, setIsChalet] = useState(true);

    useEffect(() => {
        const raw = localStorage.getItem(PENDING_PAYMENT_KEY);
        localStorage.removeItem(PENDING_PAYMENT_KEY);
        if (!raw) { setPhase('generic'); return; }

        let info;
        try { info = JSON.parse(raw); } catch { setPhase('generic'); return; }
        if (!info?.bookingId) { setPhase('generic'); return; }
        setIsChalet(Boolean(info.isChalet));

        (async () => {
            try {
                const useCase = info.isChalet ? GetChaletBookingDetailsUseCase : GetFlatBookingDetailsUseCase;
                const b = await useCase.execute(info.bookingId);
                if (!b) { setPhase('generic'); return; }
                setBooking(b);

                // Only chalets can be looked up directly by id here — flat
                // bookings only carry the flat's own id, not its parent
                // building, and there's no "get one flat" endpoint to
                // resolve it from that alone.
                if (info.isChalet && b.buildingID) {
                    try {
                        const c = await GetChaletDetailsUseCase.execute(b.buildingID);
                        setChalet(c);
                    } catch { /* best-effort, still show booking facts below */ }
                }
                setPhase('details');
            } catch {
                setPhase('generic');
            }
        })();
    }, []);

    const days = booking ? (isChalet ? booking.bookingDays : booking.hotelbuildingBookingDays) : null;
    const firstDay = days?.[0]?.day;
    const lastDay = days?.[days.length - 1]?.day;

    return (
        <div className="container payresult-page">
            <div className="card payresult-card">
                <div className="payresult-icon is-success"><i className="fa-solid fa-check"></i></div>
                <h1 className="payresult-title">{t('payment_success_title')}</h1>
                <p className="payresult-desc">
                    {phase === 'details' ? t('payment_success_desc') : t('payment_success_generic')}
                </p>

                {phase === 'loading' && <LoadingState />}

                {phase === 'details' && booking && (
                    <div className="payresult-details">
                        {chalet && (
                            <div className="payresult-property">
                                <img src={chalet.image || 'https://placehold.co/120x100?text=Shleeh'} alt={getDisplayName(chalet, lang)} />
                                <div>
                                    <h4>{getDisplayName(chalet, lang)}</h4>
                                    <p>{getWilayatLabel(chalet.state, lang)}, {getGovernorateLabel(chalet.governorate, lang)}</p>
                                </div>
                            </div>
                        )}
                        <div className="payresult-row">
                            <span>{t('booking_id')}</span>
                            <strong>#{booking.id}</strong>
                        </div>
                        {firstDay && (
                            <div className="payresult-row">
                                <span>{t('check_in')}</span>
                                <strong>{formatDdMmYyyy(firstDay, lang)}</strong>
                            </div>
                        )}
                        {lastDay && lastDay !== firstDay && (
                            <div className="payresult-row">
                                <span>{t('check_out')}</span>
                                <strong>{formatCheckoutDdMmYyyy(lastDay, lang)}</strong>
                            </div>
                        )}
                        {booking.current_paid && (
                            <div className="payresult-row">
                                <span>{t('amount_paid')}</span>
                                <strong>{booking.current_paid} {t('omr')}</strong>
                            </div>
                        )}
                        <div className="payresult-row payresult-total">
                            <span>{t('total_price')}</span>
                            <strong>{booking.coast} {t('omr')}</strong>
                        </div>
                    </div>
                )}

                {phase !== 'loading' && (
                    <div className="payresult-actions">
                        <Link className="btn btn-primary btn-block" to="/my-bookings">{t('view_my_bookings')}</Link>
                        <Link className="btn btn-outline btn-block" to="/">{t('back_to_home')}</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
