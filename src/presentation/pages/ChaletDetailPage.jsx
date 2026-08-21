import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { GetChaletDetailsUseCase } from '../../core/useCases/ChaletUseCases.js';
import { LoadingState, ErrorState } from '../components/Property/StateViews.jsx';
import { getServiceLabel, getServiceIcon, getWilayatLabel, getGovernorateLabel, getPropertyTypeLabel, pickLocalizedText } from '../../core/utils/constants.js';
import { translateChaletFact } from '../../core/utils/chaletFacts.js';
import Lightbox from '../components/Property/Lightbox.jsx';
import GalleryPhoto from '../components/Property/GalleryPhoto.jsx';
import { isOfferBookable, msUntilMidnight, formatCountdown, applyOfferDiscount } from '../../core/utils/todayOffer.js';
import './DetailPage.css';

// Facts shown in the "Facts & details" grid — each [translationKey, factKey, icon].
// The last six (landscape onward) are chip-picker fields on both owner
// apps — chaletFactKeys below lists which of those get run through
// translateChaletFact() instead of shown as raw text.
const FACT_ROWS = [
    ['property_type', 'type', 'fa-house'],
    ['capacity', 'capacity', 'fa-users'],
    ['bedrooms', 'bedrooms', 'fa-bed'],
    ['bathrooms', 'bathrooms', 'fa-bath'],
    ['living_rooms', 'livingRooms', 'fa-couch'],
    ['landscape', 'landscape', 'fa-mountain-sun'],
    ['outdoor_space', 'outdoorSpace', 'fa-tree'],
    ['safety', 'safety', 'fa-shield-halved'],
    ['atmosphere', 'atmosphere', 'fa-cloud-sun'],
    ['best_season', 'bestSeason', 'fa-calendar-days'],
    ['area', 'area', 'fa-ruler-combined'],
    ['suitable_for', 'suitableFor', 'fa-people-group'],
];

// Chip-picker fields — sent as either an English key (web owner panel) or
// raw Arabic chip text (chaletowner mobile app) depending on which app the
// listing was last saved from. translateChaletFact() recognizes both and
// falls back to showing the raw value untouched if it matches neither.
const CHIP_FACT_KEYS = new Set(['landscape', 'outdoorSpace', 'safety', 'atmosphere', 'bestSeason', 'suitableFor']);

export default function ChaletDetailPage() {
    const { id } = useParams();
    const { t, lang } = useTranslation();
    const navigate = useNavigate();
    const [chalet, setChalet] = useState(null);
    const [status, setStatus] = useState('loading');
    const [lightboxIndex, setLightboxIndex] = useState(null);
    // Ticking countdown for the Today's Offer panel — only actually runs
    // (setInterval) while an offer is live, see the effect below.
    const [msLeft, setMsLeft] = useState(msUntilMidnight());

    const load = async () => {
        setStatus('loading');
        try {
            const data = await GetChaletDetailsUseCase.execute(id);
            if (!data) { setStatus('error'); return; }
            setChalet(data);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, [id]);

    const offerBookable = isOfferBookable(chalet);

    // Only ticks while there's an actual offer to count down for — no
    // pointless interval running on every chalet page.
    useEffect(() => {
        if (!offerBookable) return undefined;
        const timer = setInterval(() => setMsLeft(msUntilMidnight()), 1000);
        return () => clearInterval(timer);
    }, [offerBookable]);

    // No login wall here — guests can pick dates and see the price on the
    // booking page itself; we only ask them to log in at the final confirm
    // step, so nobody hits a login form before seeing any value. One single
    // flow now — the booking page itself figures out whether today's offer
    // applies (calendar defaults to today->tomorrow when there's a live
    // offer, and the discount shows automatically once check-in is today).
    const handleBook = () => navigate(`/chalets/${id}/book`);

    if (status === 'loading') return <div className="container detail-page"><LoadingState /></div>;
    if (status === 'error' || !chalet) return <div className="container detail-page"><ErrorState onRetry={load} /></div>;

    const gallery = chalet.images.length ? chalet.images : [chalet.image].filter(Boolean);
    const facts = FACT_ROWS.filter(([, key]) => Boolean(chalet.facts?.[key]));
    const hasPolicyFacts = chalet.policy?.cancellation || chalet.policy?.checkIn || chalet.policy?.checkOut || chalet.policy?.rules;
    // Some names come as "arabic||english" in one field (confirmed live via
    // GetBuildingData) instead of separate nameAr/nameEn fields.
    const displayName = pickLocalizedText(chalet.name, lang);

    return (
        <div className="container detail-page">
            {gallery.length > 1 ? (
                <div className="detail-gallery">
                    <div className="detail-gallery-main" onClick={() => setLightboxIndex(0)}>
                        <GalleryPhoto src={gallery[0]} alt={displayName} />
                    </div>
                    <div className="detail-gallery-side">
                        {gallery.slice(1, 5).map((src, i) => (
                            <div className="detail-gallery-thumb" key={i} onClick={() => setLightboxIndex(i + 1)}>
                                <GalleryPhoto src={src} />
                                {i === 3 && gallery.length > 5 && (
                                    <div className="detail-gallery-thumb-more">+{gallery.length - 5}</div>
                                )}
                            </div>
                        ))}
                    </div>
                    <button className="detail-gallery-viewall" onClick={() => setLightboxIndex(0)}>
                        <i className="fa-solid fa-images"></i> {t('view_all_photos')} ({gallery.length})
                    </button>
                </div>
            ) : (
                <div className="detail-gallery-single">
                    <GalleryPhoto
                        src={gallery[0] || 'https://placehold.co/1000x500?text=ShleehCom'}
                        alt={displayName}
                        onClick={() => gallery[0] && setLightboxIndex(0)}
                    />
                </div>
            )}

            <div className="detail-layout">
                <div>
                    <div className="detail-header">
                        <div>
                            <span className="badge badge-chalet">{t('chalets')}</span>
                            <h1>{displayName}</h1>
                            <p className="detail-loc">
                                <i className="fa-solid fa-location-dot"></i> {getWilayatLabel(chalet.state, lang)}, {getGovernorateLabel(chalet.governorate, lang)}
                            </p>
                        </div>
                        {Boolean(chalet.rateAverage) && (
                            <div className="detail-rating"><i className="fa-solid fa-star"></i> {chalet.rateAverage}</div>
                        )}
                    </div>

                    {facts.length > 0 && (
                        <div className="detail-section">
                            <h2>{t('facts_and_details')}</h2>
                            <div className="facts-grid">
                                {facts.map(([labelKey, key, icon]) => (
                                    <div className="fact-item" key={key}>
                                        <i className={`fa-solid ${icon}`}></i>
                                        <div>
                                            <div className="fact-label">{t(labelKey)}</div>
                                            <div className="fact-value">
                                                {key === 'capacity' ? `${chalet.facts[key]} ${t('guests')}`
                                                    : key === 'type' ? getPropertyTypeLabel(chalet.facts[key], lang)
                                                        : CHIP_FACT_KEYS.has(key) ? translateChaletFact(key, chalet.facts[key], lang, t)
                                                            : chalet.facts[key]}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {chalet.facts?.notes ? (
                        <div className="detail-section">
                            <h2>{t('additional_notes')}</h2>
                            <p>{chalet.facts.notes}</p>
                        </div>
                    ) : (!facts.length && chalet.description) ? (
                        // Fallback for listings where the description string
                        // didn't parse into any recognizable facts — just
                        // show it as free text so nothing gets lost.
                        <div className="detail-section">
                            <h2>{t('description')}</h2>
                            <p>{chalet.description}</p>
                        </div>
                    ) : null}

                    {chalet.services.length > 0 && (
                        <div className="detail-section">
                            <h2>{t('services')}</h2>
                            <div className="service-grid">
                                {chalet.services.map((s, i) => (
                                    <div className="service-chip" key={i}>
                                        <i className={`fa-solid ${getServiceIcon(s)}`}></i>
                                        {getServiceLabel(s, lang)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="detail-section">
                        <h2>{t('policies')}</h2>
                        {hasPolicyFacts ? (
                            <>
                                {(chalet.policy.checkIn || chalet.policy.checkOut) && (
                                    <div className="policy-box">
                                        <strong>{t('check_in')} / {t('check_out')}</strong>
                                        {chalet.policy.checkIn}{chalet.policy.checkIn && chalet.policy.checkOut ? ' – ' : ''}{chalet.policy.checkOut}
                                    </div>
                                )}
                                {chalet.policy.cancellation && (
                                    <div className="policy-box">
                                        <strong>{t('cancellation')}</strong>
                                        {chalet.policy.cancellation}
                                    </div>
                                )}
                                {chalet.policy.rules && (
                                    <div className="policy-box">
                                        <strong>{t('rules')}</strong>
                                        {chalet.policy.rules}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="policy-box">
                                <strong>{t('check_in')} / {t('check_out')}</strong>
                                {t('full_day')} · {t('min_days_notice', { min: chalet.minDays })}
                            </div>
                        )}
                    </div>
                </div>

                {offerBookable ? (
                    <div className="card booking-panel offer-flash-panel">
                        <div className="offer-flash-badge">
                            <i className="fa-solid fa-bolt"></i> {t('today_offer_flash_title')} · {t('today_offer_percent_off', { n: chalet.todayOfferPercent })}
                        </div>
                        <div className="booking-panel-price offer-flash-price">
                            <s>{chalet.rentFullDay} {t('omr')}</s>{' '}
                            {applyOfferDiscount(chalet.rentFullDay, chalet.todayOfferPercent)} {t('omr')}
                            <span>/ {t('full_day')}</span>
                        </div>
                        <p className="property-card-price-note">
                            <i className="fa-solid fa-circle-info"></i> {t('today_offer_first_night_only')}
                        </p>
                        <div className="offer-flash-savings">
                            {t('today_offer_you_save', { n: chalet.rentFullDay - applyOfferDiscount(chalet.rentFullDay, chalet.todayOfferPercent), omr: t('omr') })}
                        </div>
                        <div className="offer-flash-countdown">
                            <i className="fa-regular fa-clock"></i> {t('today_offer_ends_in')} <strong>{formatCountdown(msLeft)}</strong>
                        </div>
                        <button className="btn btn-primary btn-block offer-flash-cta" onClick={handleBook}>
                            <i className="fa-solid fa-bolt"></i> {t('today_offer_book_cta')}
                        </button>
                        <p className="offer-flash-note">{t('today_offer_price_note')}</p>
                    </div>
                ) : (
                    <div className="card booking-panel">
                        <div className="booking-panel-price">
                            {chalet.rentFullDay} {t('omr')} <span>/ {t('full_day')}</span>
                        </div>
                        {Boolean(chalet.rentHalfDay) && (
                            <div className="booking-panel-meta">{chalet.rentHalfDay} {t('omr')} / {t('half_day')}</div>
                        )}
                        <button className="btn btn-primary btn-block" onClick={handleBook}>{t('book_now')}</button>
                        <Link to={`/chalets/map?highlight=${chalet.id}`} style={{ display: 'block', marginTop: 14, fontSize: 13, color: 'var(--color-primary)', textAlign: 'center' }}>
                            <i className="fa-solid fa-map-location-dot"></i> {t('view_on_map')}
                        </Link>
                    </div>
                )}
            </div>

            {lightboxIndex !== null && (
                <Lightbox
                    images={gallery}
                    index={lightboxIndex}
                    onChange={setLightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
}
