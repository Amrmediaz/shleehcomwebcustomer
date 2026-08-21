import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
    GetBuildingDetailsUseCase, GetBuildingFlatsUseCase, GetFlatBookedDaysUseCase,
    CalculateFlatPriceUseCase, CreateFlatBookingUseCase, GetFlatSpecialPricesUseCase,
} from '../../core/useCases/BuildingUseCases.js';
import { GetProfileUseCase } from '../../core/useCases/AuthUseCases.js';
import { buildPriceCalcPayload, buildBookedDaysPayload, countDays, isRangeAvailable, formatDate } from '../../core/utils/dateRange.js';
import { LoadingState, ErrorState } from '../components/Property/StateViews.jsx';
import { pickBilingual } from '../../core/utils/constants.js';
import DateRangeCalendar from '../components/Booking/DateRangeCalendar.jsx';
import {
    getTodayTomorrowRange, isDateToday, isOfferBookable, msUntilMidnight, formatCountdown, splitOfferTotal,
} from '../../core/utils/todayOffer.js';
import './BookingPage.css';

// Same pattern the app validates against before it'll submit — the backend
// requires a well-formed email and 400s with a generic "validation errors"
// message if it's missing or malformed.
const EMAIL_REGEX = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;

export default function FlatBookingPage() {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const flatId = Number(searchParams.get('flatId'));
    const { t, lang } = useTranslation();
    const { isAuthenticated, profile, login, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [building, setBuilding] = useState(null);
    const [flat, setFlat] = useState(null);
    const [bookedDates, setBookedDates] = useState([]);
    const [specialPrices, setSpecialPrices] = useState([]);
    const [status, setStatus] = useState('loading');
    const [msLeft, setMsLeft] = useState(msUntilMidnight());
    // Today's Offer's enabled/percent are set once for the whole building
    // (owner control), but todayOfferActive is computed per-flat
    // server-side — two flats in the same building can differ (one already
    // booked today, one not). Checked against THIS flat specifically, not
    // the parent building — see TODAY-OFFER-MODELS.md section 3.
    const offerActive = isOfferBookable(flat);

    // Dates live in the URL too, so a guest sent to /login and back keeps
    // their selection instead of starting over.
    const [startDate, setStartDate] = useState(searchParams.get('start') || '');
    const [endDate, setEndDate] = useState(searchParams.get('end') || '');
    const [acceptDeposit, setAcceptDeposit] = useState(false);
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        if (startDate) next.set('start', startDate); else next.delete('start');
        if (endDate) next.set('end', endDate); else next.delete('end');
        setSearchParams(next, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate]);

    const [price, setPrice] = useState(null);
    const [priceLoading, setPriceLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [userProfile, setUserProfile] = useState(profile);

    const load = async () => {
        setStatus('loading');
        try {
            const [b, flats] = await Promise.all([
                GetBuildingDetailsUseCase.execute(id),
                GetBuildingFlatsUseCase.execute(id),
            ]);
            const targetFlat = flats.find((f) => f.id === flatId) || flats[0];
            if (!b || !targetFlat) { setStatus('error'); return; }
            setBuilding(b);
            setFlat(targetFlat);
            const [days, special] = await Promise.all([
                GetFlatBookedDaysUseCase.execute(targetFlat.id),
                GetFlatSpecialPricesUseCase.execute(targetFlat.id).catch(() => []),
            ]);
            setBookedDates(days);
            setSpecialPrices(special);

            // If this specific flat has a live offer and the guest hasn't
            // already picked dates, default to today -> tomorrow so the
            // offer is visible immediately instead of requiring them to go
            // find today on the calendar.
            if (!startDate && !endDate && isOfferBookable(targetFlat)) {
                const { startDate: s, endDate: e } = getTodayTomorrowRange();
                setStartDate(s);
                setEndDate(e);
            }

            setStatus('ready');
            if (!userProfile) {
                try {
                    const p = await GetProfileUseCase.execute();
                    if (p) { setUserProfile(p); login(token, p); }
                } catch { /* best-effort */ }
            }
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, flatId]);

    useEffect(() => {
        if (status !== 'ready' || !offerActive) return undefined;
        const timer = setInterval(() => setMsLeft(msUntilMidnight()), 1000);
        return () => clearInterval(timer);
    }, [status, offerActive]);

    // Same reasoning as the chalet flow: the guest is free to move the
    // dates anywhere on the calendar below — the discount only applies
    // while check-in stays on today.
    const showOfferDiscount = offerActive && isDateToday(startDate);

    useEffect(() => {
        const calc = async () => {
            if (!startDate || !endDate || !flat) { setPrice(null); return; }
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end < start) { setPrice(null); return; }
            if (!isRangeAvailable(start, end, bookedDates)) {
                setFormError(t('select_at_least_one_day'));
                setPrice(null);
                return;
            }
            setFormError('');
            setPriceLoading(true);
            try {
                const payload = buildPriceCalcPayload({ id: flat.id, isChalet: false, startDate: start, endDate: end, isFullDay: true });
                const total = await CalculateFlatPriceUseCase.execute(payload);
                setPrice(total);
            } catch {
                setPrice(null);
            } finally {
                setPriceLoading(false);
            }
        };
        calc();
    }, [startDate, endDate, flat, bookedDates]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
            return;
        }
        if (!startDate || !endDate) { setFormError(t('select_at_least_one_day')); return; }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = countDays(start, end);
        if (building.minDays > days) {
            setFormError(t('min_days_notice', { min: building.minDays }));
            return;
        }
        if (price == null) { setFormError(t('error_loading')); return; }

        const trimmedEmail = email.trim();
        if (!trimmedEmail) { setFormError(t('email_required')); return; }
        if (!EMAIL_REGEX.test(trimmedEmail)) { setFormError(t('email_invalid')); return; }

        if (showOfferDiscount) {
            // Last-second re-check, same reasoning as the chalet flow — if
            // it's no longer valid, drop the discount and let the guest
            // review the updated price instead of a hard dead end. Checked
            // against this specific flat (re-fetched from the flats list),
            // not the building — see the doc comment on `offerActive` above.
            try {
                const freshFlats = await GetBuildingFlatsUseCase.execute(id);
                const freshFlat = freshFlats.find((f) => f.id === flat.id);
                if (!freshFlat || !isOfferBookable(freshFlat)) {
                    if (freshFlat) setFlat(freshFlat);
                    setFormError(t('today_offer_expired_desc'));
                    return;
                }
                setFlat(freshFlat);
            } catch {
                setFormError(t('error_loading'));
                return;
            }
        }

        setSubmitting(true);
        try {
            // Same guard as the chalet flow: the profile fetch runs in the
            // background after the page becomes interactive, so make sure
            // it's actually resolved before relying on it for customerId —
            // otherwise it's silently dropped from the JSON body and the
            // backend 400s.
            let currentProfile = userProfile;
            if (!currentProfile?.id) {
                try {
                    currentProfile = await GetProfileUseCase.execute();
                    if (currentProfile) { setUserProfile(currentProfile); login(token, currentProfile); }
                } catch { /* handled by the guard below */ }
            }
            if (!currentProfile?.id) {
                setFormError(t('error_loading'));
                setSubmitting(false);
                return;
            }

            const insurance = flat.insuranceAmount || 0;
            // Same reasoning as the chalet flow: full payment now, no
            // deposit; only night 1 (today) is discounted, see
            // splitOfferTotal's doc comment. Backend now stores
            // todayOfferApplied/Percent/DiscountAmount exactly as sent here
            // (TODAY-OFFER-API-SPEC.md Part 4) rather than recomputing them
            // itself, since we already have to compute this split for the
            // "you saved X" display anyway.
            const offerSplit = showOfferDiscount
                ? splitOfferTotal(price, flat.pricePerNight, flat.todayOfferPercent)
                : null;
            const total = offerSplit ? offerSplit.finalTotal : price;
            let paidAmount = total;
            let remaining = 0;
            if (!showOfferDiscount && building.acceptDownPay && acceptDeposit) {
                paidAmount = Math.ceil(total * 0.25);
                remaining = total - paidAmount;
            }
            const bookingData = {
                hotelbuildingBookingDays: buildBookedDaysPayload({ startDate: start, endDate: end, isFullDay: true }),
                coast: Math.ceil(total),
                insuranceamount: String(insurance),
                paidamount: `${Math.ceil(paidAmount)} من ${Math.ceil(remaining)}`,
                current_paid: String(Math.ceil(paidAmount)),
                remaining_paid: String(Math.ceil(remaining)),
                noOFDays: days,
                flatID: flat.id,
                customerId: currentProfile.id,
                name: currentProfile.firstName || '',
                note: building.managementPhone || '',
                phone: currentProfile.phone || '',
                state: '',
                gouvernate: '',
                customer_email: trimmedEmail,
                customer_notes: notes.trim(),
                todayOfferApplied: Boolean(offerSplit),
                todayOfferPercent: offerSplit ? flat.todayOfferPercent : 0,
                todayOfferDiscountAmount: offerSplit ? offerSplit.savings : 0,
            };

            const bookingId = await CreateFlatBookingUseCase.execute(bookingData);
            // replace: true — same reasoning as the chalet flow: don't leave
            // an already-submitted form reachable via Back.
            navigate('/booking/success', { state: { bookingId, isChalet: false }, replace: true });
        } catch (err) {
            setFormError(err.message || t('error_loading'));
        } finally {
            setSubmitting(false);
        }
    };

    if (status === 'loading') return <div className="container booking-page"><LoadingState /></div>;
    if (status === 'error' || !flat) return <div className="container booking-page"><ErrorState onRetry={load} /></div>;

    const flatName = pickBilingual(flat.nameAr, flat.nameEn, lang);
    const buildingName = pickBilingual(building?.nameAr, building?.nameEn, lang);

    return (
        <div className="container booking-page">
            <div className="card">
                <div className="booking-summary">
                    <img src={flat.coverImg || 'https://placehold.co/160x120?text=Shleeh'} alt={flatName} />
                    <div>
                        <h3>{flatName}</h3>
                        <p>{buildingName}</p>
                    </div>
                </div>

                {offerActive && (
                    <div className="offer-mode-summary">
                        <div className="offer-flash-badge">
                            <i className="fa-solid fa-bolt"></i> {t('today_offer_flash_title')} · {t('today_offer_percent_off', { n: flat.todayOfferPercent })}
                        </div>
                        <div className="offer-flash-countdown">
                            <i className="fa-regular fa-clock"></i> {t('today_offer_ends_in')} <strong>{formatCountdown(msLeft)}</strong>
                        </div>
                        {!showOfferDiscount && (
                            <p className="offer-nights-hint">
                                <i className="fa-solid fa-circle-info"></i> {t('today_offer_keep_today_hint')}
                            </p>
                        )}
                    </div>
                )}

                <div className="booking-step-title">
                    <span className="booking-step-num">1</span>
                    <h2>{t('select_dates')}</h2>
                </div>

                <DateRangeCalendar
                    startDate={startDate}
                    endDate={endDate}
                    onSelect={(s, e) => { setStartDate(s); setEndDate(e); }}
                    bookedDates={bookedDates}
                    specialPrices={specialPrices}
                    minNights={building.minDays || 1}
                />

                <div className="date-summary">
                    <div>
                        <span>{t('check_in')}</span>
                        <strong>{formatDate(startDate, lang) || '—'}</strong>
                    </div>
                    <i className="fa-solid fa-arrow-right-long"></i>
                    <div>
                        <span>{t('check_out')}</span>
                        <strong>{formatDate(endDate, lang) || '—'}</strong>
                    </div>
                </div>

                {!showOfferDiscount && building.acceptDownPay && (
                    <label className="deposit-check">
                        <input type="checkbox" checked={acceptDeposit} onChange={(e) => setAcceptDeposit(e.target.checked)} />
                        {t('accept_deposit')}
                    </label>
                )}

                <div className="booking-step-title">
                    <span className="booking-step-num">2</span>
                    <h2>{t('your_details')}</h2>
                </div>

                <div className="form-group">
                    <label className="form-label">{t('email_address')}</label>
                    <input className="form-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    <p className="form-hint">{t('email_booking_note')}</p>
                </div>

                <div className="form-group">
                    <label className="form-label">{t('special_requests')}</label>
                    <textarea className="form-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                {priceLoading && (
                    <div className="price-box price-box-loading"><span className="spinner" /> {t('loading')}</div>
                )}
                {price != null && !priceLoading && (() => {
                    const insurance = flat.insuranceAmount || 0;
                    const nights = startDate && endDate ? countDays(new Date(startDate), new Date(endDate)) : 0;
                    const depositActive = !showOfferDiscount && building.acceptDownPay && acceptDeposit;
                    const dueNow = depositActive ? Math.ceil(price * 0.25) : Math.ceil(price);
                    const dueOnArrival = depositActive ? Math.ceil(price) - dueNow : 0;
                    const split = showOfferDiscount ? splitOfferTotal(price, flat.pricePerNight, flat.todayOfferPercent) : null;
                    return (
                        <div className={`price-box ${showOfferDiscount ? 'offer-price-box' : ''}`}>
                            {showOfferDiscount ? (
                                <>
                                    <div className="price-box-row">
                                        <span>{t('today_offer_night1_label')}</span>
                                        <span><s className="price-box-strike">{split.night1Original} {t('omr')}</s> {split.night1Discounted} {t('omr')}</span>
                                    </div>
                                    {nights > 1 && (
                                        <div className="price-box-row">
                                            <span>{t('today_offer_other_nights_label')} ({nights - 1})</span>
                                            <span>{split.restOfStay} {t('omr')}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="price-box-row">
                                    <span>{t('nights_count', { n: nights })}</span>
                                    <span>{price} {t('omr')}</span>
                                </div>
                            )}
                            {insurance > 0 && (
                                <div className="price-box-row">
                                    <span>{t('insurance')}</span>
                                    <span>{insurance} {t('omr')}</span>
                                </div>
                            )}
                            <div className="price-box-total">
                                <span>{t('total_price')}</span>
                                <span>{(showOfferDiscount ? split.finalTotal : price) + insurance} {t('omr')}</span>
                            </div>
                            {showOfferDiscount && (
                                <div className="price-box-row offer-price-savings">
                                    <span>{t('today_offer_you_save', { n: split.savings, omr: t('omr') })}</span>
                                </div>
                            )}
                            {depositActive && (
                                <>
                                    <div className="price-box-row price-box-due-now">
                                        <span>{t('deposit_today')}</span>
                                        <span>{dueNow} {t('omr')}</span>
                                    </div>
                                    <div className="price-box-row">
                                        <span>{t('due_on_arrival')}</span>
                                        <span>{dueOnArrival} {t('omr')}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })()}

                {formError && <div className="form-banner-error">{formError}</div>}

                <button className={`btn btn-primary btn-block ${showOfferDiscount ? 'offer-flash-cta' : ''}`} onClick={handleSubmit} disabled={submitting || price == null}>
                    {submitting ? <span className="spinner" /> : (isAuthenticated ? (showOfferDiscount ? t('today_offer_book_cta') : t('confirm_booking')) : t('login_button'))}
                </button>
                {!isAuthenticated && price != null && (
                    <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginTop: 10, textAlign: 'center' }}>
                        {t('continue_browsing_guest')}
                    </p>
                )}
            </div>
        </div>
    );
}
