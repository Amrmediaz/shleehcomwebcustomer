import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { GetMyChaletBookingsUseCase } from '../../core/useCases/ChaletUseCases.js';
import { GetMyFlatBookingsUseCase } from '../../core/useCases/BuildingUseCases.js';
import { LoadingState, ErrorState, EmptyState } from '../components/Property/StateViews.jsx';
import './ListPage.css';
import './MyBookingsPage.css';

const PAGE_SIZE = 10;

// Raw fields straight off the AddBooking/GetBookings response — mirrors the
// real app's BookingModel.fromJson (booking_model.dart), which is why the
// keys below look inconsistent (backend typos: "gouvernate", "noOFDays",
// "crreatedDate", "bookingstatus" all lowercase-s). Neither platform has a
// dedicated booking-list entity that normalizes these; both read the raw
// keys directly. bookingstatus === 0 means "awaiting payment" — confirmed
// against the Flutter app's booking_list_widget.dart, the only place this
// status is actually used anywhere in either codebase.
export function isPending(b) {
    return Number(b.bookingstatus) === 0;
}

// paymentType from the booking API: 1 = normal online bank payment, 3 =
// QPay installments (same values sent to BookingPayment/BookingPaymentQpay
// when the booking was paid). Returns null for anything else (including
// missing/older bookings) — showing a guessed label would be worse than
// showing nothing.
export function paymentMethodLabel(b, t) {
    const type = Number(b.paymentType);
    if (type === 1) return t('payment_method_online');
    if (type === 3) return t('payment_method_qpay');
    return null;
}

export function bookingName(b, lang) {
    // The real app inconsistently picks buildingNameEn for chalets and
    // buildingNameAr for flats regardless of the app's language (looks like
    // an upstream bug, not a deliberate choice) — rather than copy that,
    // prefer whichever matches the current site language and fall back to
    // the other if it's empty, same pattern as getDisplayName elsewhere.
    const en = b.buildingNameEn || '';
    const ar = b.buildingNameAr || '';
    if (lang === 'ar') return ar || en;
    return en || ar;
}

function BookingCard({ b, index, isChalet, lang, t, navigate }) {
    const pending = isPending(b);
    const name = bookingName(b, lang) || `${t(isChalet ? 'chalets' : 'buildings')} #${b.buildingID ?? b.flatID ?? ''}`;
    const nights = b.noOFDays ?? b.noOfDays ?? 0;
    const total = b.coast ?? b.total ?? 0;

    // Carry the real paid/pending status along in the URL — the booking
    // DETAILS endpoint doesn't actually return `bookingstatus` (confirmed
    // against the Flutter app's BookingDetailsModel, which never parses
    // it), so without this every booking silently defaulted to "paid" on
    // the details page regardless of its real status. The list response
    // is the one place this field is reliably present, so it has to be
    // handed off here rather than re-derived on the details page.
    const openDetails = () => navigate(`/my-bookings/${b.id}?type=${isChalet ? 'chalet' : 'building'}&status=${b.bookingstatus}`);

    return (
        <div
            className={`booking-card is-clickable ${pending ? 'is-pending' : 'is-paid'}`}
            role="button"
            tabIndex={0}
            onClick={openDetails}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetails(); } }}
        >
            <div className="booking-card-top">
                <span className="booking-card-index">{index + 1}</span>
                <div className="booking-card-meta">
                    <span className="booking-card-id">#{b.id}</span>
                    <span className="booking-card-nights">{t('nights_count', { n: nights })}</span>
                </div>
                <span className={`booking-status-chip ${pending ? 'pending' : 'paid'}`}>
                    <i className={`fa-solid ${pending ? 'fa-clock' : 'fa-circle-check'}`}></i>
                    {pending ? t('booking_pending') : t('booking_paid')}
                </span>
            </div>

            <div className="booking-card-name">
                <i className={`fa-solid ${isChalet ? 'fa-house' : 'fa-building'}`}></i>
                {name}
            </div>

            {pending ? (
                <div className="booking-payment-box pending">
                    <div>
                        <span>{t('total_amount_due')}</span>
                        <strong>{total} {t('omr')}</strong>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        // Stop the click from bubbling up to the card's own
                        // onClick, which would open the details page instead
                        // of (or underneath) this navigation.
                        onClick={(e) => { e.stopPropagation(); navigate('/booking/pay', { state: { bookingId: b.id, isChalet } }); }}
                    >
                        {t('proceed_to_payment')}
                    </button>
                </div>
            ) : (
                <div className="booking-payment-box paid">
                    <i className="fa-solid fa-circle-check"></i>
                    <div>
                        <strong>{t('booking_paid')}</strong>
                        <span>{total} {t('omr')}</span>
                        {paymentMethodLabel(b, t) && (
                            <span className="booking-payment-method">{paymentMethodLabel(b, t)}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MyBookingsPage() {
    const { t, lang } = useTranslation();
    const navigate = useNavigate();
    const [tab, setTab] = useState('chalet');
    const [bookings, setBookings] = useState([]);
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [status, setStatus] = useState('loading');
    const [loadingMore, setLoadingMore] = useState(false);

    const load = async (which, pageNum = 1, append = false) => {
        if (append) setLoadingMore(true); else setStatus('loading');
        try {
            const useCase = which === 'chalet' ? GetMyChaletBookingsUseCase : GetMyFlatBookingsUseCase;
            const result = await useCase.execute(pageNum, PAGE_SIZE);
            setBookings((prev) => (append ? [...prev, ...(result.results || [])] : (result.results || [])));
            setPage(result.currentPage || pageNum);
            setPageCount(result.pageCount || 1);
            setStatus('ready');
        } catch {
            if (!append) setStatus('error');
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => { load(tab, 1, false); }, [tab]);

    const switchTab = (next) => {
        if (next === tab) return;
        setTab(next);
        setBookings([]);
        setPage(1);
        setPageCount(1);
    };

    return (
        <div className="container list-page">
            <h1 className="section-title">{t('my_bookings')}</h1>
            <div style={{ display: 'flex', gap: 10, margin: '18px 0 24px' }}>
                <button className={`btn ${tab === 'chalet' ? 'btn-primary' : 'btn-outline'}`} onClick={() => switchTab('chalet')}>{t('chalets')}</button>
                <button className={`btn ${tab === 'building' ? 'btn-primary' : 'btn-outline'}`} onClick={() => switchTab('building')}>{t('buildings')}</button>
            </div>

            {status === 'loading' && <LoadingState />}
            {status === 'error' && <ErrorState onRetry={() => load(tab, 1, false)} />}
            {status === 'ready' && bookings.length === 0 && <EmptyState text={t('no_bookings')} />}
            {status === 'ready' && bookings.length > 0 && (
                <>
                    <div className="booking-list">
                        {bookings.map((b, i) => (
                            <BookingCard
                                key={b.id ?? i}
                                b={b}
                                index={i}
                                isChalet={tab === 'chalet'}
                                lang={lang}
                                t={t}
                                navigate={navigate}
                            />
                        ))}
                    </div>
                    {page < pageCount && (
                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                            <button className="btn btn-outline" disabled={loadingMore} onClick={() => load(tab, page + 1, true)}>
                                {loadingMore ? <span className="spinner" /> : t('load_more')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
