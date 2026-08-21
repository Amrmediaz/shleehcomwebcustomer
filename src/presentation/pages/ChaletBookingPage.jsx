import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
    GetChaletDetailsUseCase, GetChaletBookedDaysUseCase, CalculateChaletPriceUseCase,
    CreateChaletBookingUseCase, GetChaletSpecialPricesUseCase,
} from '../../core/useCases/ChaletUseCases.js';
import { GetProfileUseCase } from '../../core/useCases/AuthUseCases.js';
import { buildPriceCalcPayload, buildBookedDaysPayload, countDays, isRangeAvailable, formatDate } from '../../core/utils/dateRange.js';
import { getWilayatLabel, getGovernorateLabel, pickLocalizedText } from '../../core/utils/constants.js';
import { LoadingState, ErrorState } from '../components/Property/StateViews.jsx';
import DateRangeCalendar from '../components/Booking/DateRangeCalendar.jsx';
import {
    getTodayTomorrowRange, isDateToday, isOfferBookable, msUntilMidnight, formatCountdown, splitOfferTotal,
} from '../../core/utils/todayOffer.js';
import './BookingPage.css';

// Same pattern the app itself validates against before it'll submit a
// booking — the backend's AddBooking endpoint requires a well-formed email
// and 400s with a generic "validation errors" message if it's missing or
// malformed, so we catch it client-side first with a clear message.
const EMAIL_REGEX = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;

export default function ChaletBookingPage() {
    const { id } = useParams();
    const { t, lang } = useTranslation();
    const { isAuthenticated, profile, login, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [chalet, setChalet] = useState(null);
    const [bookedDates, setBookedDates] = useState([]);
    const [specialPrices, setSpecialPrices] = useState([]);
    const [status, setStatus] = useState('loading');
    const [msLeft, setMsLeft] = useState(msUntilMidnight());
    // Whether this chalet currently has a live Today's Offer — derived fresh
    // from whatever chalet data is loaded, not from how the guest got to
    // this page. Same rule everywhere: enter normally, see the offer if one
    // exists, and it applies automatically once check-in lands on today.
    const offerActive = isOfferBookable(chalet);

    // Dates live in the URL (not just component state) so a guest who gets
    // sent to /login and back doesn't lose their selection.
    const [startDate, setStartDate] = useState(searchParams.get('start') || '');
    const [endDate, setEndDate] = useState(searchParams.get('end') || '');
    const [isFullDay, setIsFullDay] = useState(searchParams.get('half') !== '1');
    const [acceptDeposit, setAcceptDeposit] = useState(false);
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        if (startDate) next.set('start', startDate); else next.delete('start');
        if (endDate) next.set('end', endDate); else next.delete('end');
        if (!isFullDay) next.set('half', '1'); else next.delete('half');
        setSearchParams(next, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, isFullDay]);

    const [price, setPrice] = useState(null);
    const [priceLoading, setPriceLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [userProfile, setUserProfile] = useState(profile);

    const load = async () => {
        setStatus('loading');
        try {
            const [c, days, special] = await Promise.all([
                GetChaletDetailsUseCase.execute(id),
                GetChaletBookedDaysUseCase.execute(id),
                GetChaletSpecialPricesUseCase.execute(id).catch(() => []),
            ]);
            if (!c) { setStatus('error'); return; }
            setChalet(c);
            setBookedDates(days);
            setSpecialPrices(special);

            // If this chalet has a live offer and the guest hasn't already
            // picked dates (e.g. via a shared/back-navigated URL), default
            // to today -> tomorrow so the offer is visible immediately
            // instead of requiring them to go find today on the calendar.
            if (!startDate && !endDate && isOfferBookable(c)) {
                const { startDate: s, endDate: e } = getTodayTomorrowRange();
                setStartDate(s);
                setEndDate(e);
                setIsFullDay(true);
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

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

    useEffect(() => {
        if (status !== 'ready' || !offerActive) return undefined;
        const timer = setInterval(() => setMsLeft(msUntilMidnight()), 1000);
        return () => clearInterval(timer);
    }, [status, offerActive]);

    // The discount only actually applies while check-in is today — a guest
    // is completely free to pick different dates on the calendar below,
    // which simply means this booking is priced normally, like any other.
    const showOfferDiscount = offerActive && isDateToday(startDate);

    useEffect(() => {
        const calc = async () => {
            if (!startDate || !endDate || !chalet) { setPrice(null); return; }
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end < start) { setFormError(''); setPrice(null); return; }
            if (!isRangeAvailable(start, end, bookedDates)) {
                setFormError(t('select_at_least_one_day'));
                setPrice(null);
                return;
            }
            setFormError('');
            setPriceLoading(true);
            try {
                const payload = buildPriceCalcPayload({ id: chalet.id, isChalet: true, startDate: start, endDate: end, isFullDay });
                const total = await CalculateChaletPriceUseCase.execute(payload);
                setPrice(total);
            } catch {
                setPrice(null);
            } finally {
                setPriceLoading(false);
            }
        };
        calc();
    }, [startDate, endDate, isFullDay, chalet, bookedDates]);

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
        if (chalet.minDays > days) {
            setFormError(t('min_days_notice', { min: chalet.minDays }));
            return;
        }
        if (price == null) { setFormError(t('error_loading')); return; }

        const trimmedEmail = email.trim();
        if (!trimmedEmail) { setFormError(t('email_required')); return; }
        if (!EMAIL_REGEX.test(trimmedEmail)) { setFormError(t('email_invalid')); return; }

        if (showOfferDiscount) {
            // Last check, right at the moment of booking — closes the race
            // where the offer ended (booked by someone else, owner turned
            // it off, or the midnight cutoff passed) while this guest was
            // filling in the form. If it's no longer valid, don't submit —
            // just drop the discount and let them review the updated price
            // and confirm again, instead of a jarring full-page dead end.
            try {
                const fresh = await GetChaletDetailsUseCase.execute(id);
                if (!fresh || !isOfferBookable(fresh)) {
                    setChalet(fresh || chalet);
                    setFormError(t('today_offer_expired_desc'));
                    return;
                }
                setChalet(fresh);
            } catch {
                setFormError(t('error_loading'));
                return;
            }
        }

        setSubmitting(true);
        try {
            // The booking payload needs the profile's id/name/phone. It's
            // normally already loaded by the time the button is clickable,
            // but that fetch runs in the background after status flips to
            // "ready" — if it hasn't resolved yet (fast clicker, slow
            // network), customerId would come through as undefined and get
            // silently dropped by JSON.stringify, and the backend 400s on
            // the missing field. Make sure we actually have it before
            // building the request.
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

            const insurance = chalet.insuranceAmount || 0;
            // NOTE: only the first night is discounted, and only if it's
            // still today — see splitOfferTotal's doc comment. Backend now
            // stores todayOfferApplied/Percent/DiscountAmount exactly as
            // sent here (TODAY-OFFER-API-SPEC.md Part 4) rather than
            // recomputing them itself, since we already have to compute
            // this split for the "you saved X" display anyway.
            const nightBaseRate = isFullDay ? chalet.rentFullDay : chalet.rentHalfDay;
            const offerSplit = showOfferDiscount
                ? splitOfferTotal(price, nightBaseRate, chalet.todayOfferPercent)
                : null;
            const total = offerSplit ? offerSplit.finalTotal : price;
            let paidAmount = total;
            let remaining = 0;
            if (!showOfferDiscount && chalet.acceptDeposit && acceptDeposit) {
                paidAmount = Math.ceil(total * 0.25);
                remaining = total - paidAmount;
            }
            const bookingData = {
                bookingDays: buildBookedDaysPayload({ startDate: start, endDate: end, isFullDay }),
                coast: paidAmount,
                insuranceamount: String(insurance),
                paidamount: `${Math.ceil(paidAmount)} من ${Math.ceil(remaining)}`,
                current_paid: String(Math.ceil(paidAmount)),
                remaining_paid: String(Math.ceil(remaining)),
                noOFDays: days,
                buildingID: chalet.id,
                customerId: currentProfile.id,
                name: currentProfile.firstName || '',
                note: chalet.rentWeekend ?? '',
                phone: currentProfile.phone || '',
                state: '',
                gouvernate: '',
                customer_email: trimmedEmail,
                customer_notes: notes.trim(),
                todayOfferApplied: Boolean(offerSplit),
                todayOfferPercent: offerSplit ? chalet.todayOfferPercent : 0,
                todayOfferDiscountAmount: offerSplit ? offerSplit.savings : 0,
            };

            const bookingId = await CreateChaletBookingUseCase.execute(bookingData);
            // replace: true — once a booking exists, hitting Back shouldn't
            // land the user on this already-submitted form again (and risk
            // a duplicate submission). Back instead skips straight to the
            // chalet page beneath it.
            navigate('/booking/success', { state: { bookingId, isChalet: true }, replace: true });
        } catch (err) {
            setFormError(err.message || t('error_loading'));
        } finally {
            setSubmitting(false);
        }
    };

    if (status === 'loading') return <div className="container booking-page"><LoadingState /></div>;
    if (status === 'error' || !chalet) return <div className="container booking-page"><ErrorState onRetry={load} /></div>;

    const displayName = pickLocalizedText(chalet.name, lang);

    return (
        <div className="container booking-page">
            <div className="card">
                <div className="booking-summary">
                    <img src={chalet.image || 'https://placehold.co/160x120?text=Shleeh'} alt={displayName} />
                    <div>
                        <h3>{displayName}</h3>
                        <p>{getWilayatLabel(chalet.state, lang)}, {getGovernorateLabel(chalet.governorate, lang)}</p>
                    </div>
                </div>

                {offerActive && (
                    <div className="offer-mode-summary">
                        <div className="offer-flash-badge">
                            <i className="fa-solid fa-bolt"></i> {t('today_offer_flash_title')} · {t('today_offer_percent_off', { n: chalet.todayOfferPercent })}
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
                <div className="daytype-toggle">
                    <button type="button" className={isFullDay ? 'active' : ''} onClick={() => setIsFullDay(true)}>{t('full_day')}</button>
                    <button type="button" className={!isFullDay ? 'active' : ''} onClick={() => setIsFullDay(false)}>{t('half_day')}</button>
                </div>

                <DateRangeCalendar
                    startDate={startDate}
                    endDate={endDate}
                    onSelect={(s, e) => { setStartDate(s); setEndDate(e); }}
                    bookedDates={bookedDates}
                    specialPrices={specialPrices}
                    minNights={chalet.minDays || 1}
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

                {!showOfferDiscount && chalet.acceptDeposit && (
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
                    const insurance = chalet.insuranceAmount || 0;
                    const nights = startDate && endDate ? countDays(new Date(startDate), new Date(endDate)) : 0;
                    const depositActive = !showOfferDiscount && chalet.acceptDeposit && acceptDeposit;
                    const dueNow = depositActive ? Math.ceil(price * 0.25) : Math.ceil(price);
                    const dueOnArrival = depositActive ? Math.ceil(price) - dueNow : 0;
                    const nightBaseRate = isFullDay ? chalet.rentFullDay : chalet.rentHalfDay;
                    const split = showOfferDiscount ? splitOfferTotal(price, nightBaseRate, chalet.todayOfferPercent) : null;
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
