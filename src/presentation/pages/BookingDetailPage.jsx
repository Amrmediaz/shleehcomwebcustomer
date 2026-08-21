import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { GetChaletBookingDetailsUseCase, GetChaletDetailsUseCase } from '../../core/useCases/ChaletUseCases.js';
import { GetFlatBookingDetailsUseCase } from '../../core/useCases/BuildingUseCases.js';
import { getWilayatLabel, getGovernorateLabel, getDisplayName } from '../../core/utils/constants.js';
import { formatDdMmYyyy } from '../../core/utils/dateRange.js';
import { LoadingState } from '../components/Property/StateViews.jsx';
import { isPending, bookingName } from './MyBookingsPage.jsx';
import './PaymentResult.css';
import './MyBookingsPage.css';

// Single booking's full detail — reached by tapping a card on
// MyBookingsPage. `?type=chalet|building` in the URL (not a route param)
// mirrors the pattern already used for /buildings/:id/book?flatId=X, and
// keeps this page bookmarkable/refreshable (unlike the state-based
// /booking/pay navigation, which loses its data on a hard refresh).
export default function BookingDetailPage() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isChalet = searchParams.get('type') !== 'building';
    const { t, lang } = useTranslation();
    const navigate = useNavigate();

    const [status, setStatus] = useState('loading');
    const [booking, setBooking] = useState(null);
    const [property, setProperty] = useState(null);

    const load = async () => {
        setStatus('loading');
        try {
            const useCase = isChalet ? GetChaletBookingDetailsUseCase : GetFlatBookingDetailsUseCase;
            const b = await useCase.execute(id);
            if (!b) { setStatus('error'); return; }
            setBooking(b);

            // Only chalets can be looked up directly by id here — flat
            // bookings only carry the flat's own id, not its parent
            // building, and there's no "get one flat" endpoint to resolve
            // it from that alone (same limitation as PaymentSuccessPage).
            if (isChalet && b.buildingID) {
                try {
                    const c = await GetChaletDetailsUseCase.execute(b.buildingID);
                    setProperty(c);
                } catch { /* best-effort, still show booking facts below */ }
            }
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, isChalet]);

    if (status === 'loading') return <div className="container payresult-page"><LoadingState /></div>;
    if (status === 'error' || !booking) {
        return (
            <div className="container payresult-page">
                <div className="card payresult-card">
                    <p className="payresult-desc">{t('booking_not_found')}</p>
                    <div className="payresult-actions">
                        <Link className="btn btn-outline btn-block" to="/my-bookings">{t('back_to_bookings')}</Link>
                    </div>
                </div>
            </div>
        );
    }

    const days = isChalet ? booking.bookingDays : booking.hotelbuildingBookingDays;
    const firstDay = days?.[0]?.day;
    const lastDay = days?.[days.length - 1]?.day;
    const nights = booking.noOFDays ?? booking.noOfDays ?? 0;
    const pending = isPending(booking);
    const propertyName = bookingName(booking, lang)
        || (property ? getDisplayName(property, lang) : '')
        || `${t(isChalet ? 'chalets' : 'buildings')} #${booking.buildingID ?? booking.flatID ?? ''}`;
    const offerApplied = Boolean(booking.todayOfferApplied);

    return (
        <div className="container payresult-page">
            <div className="card payresult-card" style={{ textAlign: 'start' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <h1 className="payresult-title" style={{ margin: 0 }}>{t('booking_details_title')}</h1>
                    <span className={`booking-status-chip ${pending ? 'pending' : 'paid'}`}>
                        <i className={`fa-solid ${pending ? 'fa-clock' : 'fa-circle-check'}`}></i>
                        {pending ? t('booking_pending') : t('booking_paid')}
                    </span>
                </div>

                <div className="payresult-details">
                    {property && (
                        <div className="payresult-property">
                            <img src={property.image || 'https://placehold.co/120x100?text=Shleeh'} alt={propertyName} />
                            <div>
                                <h4>{propertyName}</h4>
                                <p>{getWilayatLabel(property.state, lang)}, {getGovernorateLabel(property.governorate, lang)}</p>
                            </div>
                        </div>
                    )}
                    {!property && (
                        <div className="payresult-row" style={{ paddingBottom: 10, marginBottom: 4, borderBottom: '1px dashed var(--color-border-light)' }}>
                            <span>{propertyName}</span>
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
                            <strong>{formatDdMmYyyy(lastDay, lang)}</strong>
                        </div>
                    )}
                    {nights > 0 && (
                        <div className="payresult-row">
                            <span>{t('nights_count', { n: nights })}</span>
                        </div>
                    )}

                    {booking.name && (
                        <div className="payresult-row">
                            <span>{t('full_name')}</span>
                            <strong>{booking.name}</strong>
                        </div>
                    )}
                    {booking.phone && (
                        <div className="payresult-row">
                            <span>{t('phone_number')}</span>
                            <strong>{booking.phone}</strong>
                        </div>
                    )}
                    {booking.customer_notes && (
                        <div className="payresult-row">
                            <span>{t('guest_notes')}</span>
                            <strong>{booking.customer_notes}</strong>
                        </div>
                    )}

                    {offerApplied && (
                        <div className="payresult-row" style={{ color: 'var(--color-primary)' }}>
                            <span><i className="fa-solid fa-bolt"></i> {t('today_offer_applied_note')}</span>
                            <strong>{t('today_offer_you_save', { n: booking.todayOfferDiscountAmount ?? 0, omr: t('omr') })}</strong>
                        </div>
                    )}
                    {Number(booking.insuranceamount) > 0 && (
                        <div className="payresult-row">
                            <span>{t('insurance')}</span>
                            <strong>{booking.insuranceamount} {t('omr')}</strong>
                        </div>
                    )}
                    {booking.current_paid && (
                        <div className="payresult-row">
                            <span>{t('amount_paid')}</span>
                            <strong>{booking.current_paid} {t('omr')}</strong>
                        </div>
                    )}
                    {Number(booking.remaining_paid) > 0 && (
                        <div className="payresult-row">
                            <span>{t('due_on_arrival')}</span>
                            <strong>{booking.remaining_paid} {t('omr')}</strong>
                        </div>
                    )}
                    <div className="payresult-row payresult-total">
                        <span>{t('total_price')}</span>
                        <strong>{booking.coast} {t('omr')}</strong>
                    </div>
                </div>

                <div className="payresult-actions">
                    {pending && (
                        <button
                            type="button"
                            className="btn btn-primary btn-block"
                            onClick={() => navigate('/booking/pay', { state: { bookingId: booking.id, isChalet } })}
                        >
                            {t('proceed_to_payment')}
                        </button>
                    )}
                    <Link className="btn btn-outline btn-block" to="/my-bookings">{t('back_to_bookings')}</Link>
                </div>
            </div>
        </div>
    );
}
