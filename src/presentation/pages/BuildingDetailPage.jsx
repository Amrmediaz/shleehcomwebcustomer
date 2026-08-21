import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { GetBuildingDetailsUseCase, GetBuildingFlatsUseCase } from '../../core/useCases/BuildingUseCases.js';
import { LoadingState, ErrorState, EmptyState } from '../components/Property/StateViews.jsx';
import { getServiceLabel, getServiceIcon, getWilayatLabel, getGovernorateLabel, pickBilingual } from '../../core/utils/constants.js';
import Lightbox from '../components/Property/Lightbox.jsx';
import GalleryPhoto from '../components/Property/GalleryPhoto.jsx';
import { isOfferBookable, msUntilMidnight, formatCountdown, applyOfferDiscount } from '../../core/utils/todayOffer.js';
import './DetailPage.css';

export default function BuildingDetailPage() {
    const { id } = useParams();
    const { t, lang } = useTranslation();
    const navigate = useNavigate();
    const [building, setBuilding] = useState(null);
    const [flats, setFlats] = useState([]);
    const [status, setStatus] = useState('loading');
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [msLeft, setMsLeft] = useState(msUntilMidnight());

    const load = async () => {
        setStatus('loading');
        try {
            const [b, f] = await Promise.all([
                GetBuildingDetailsUseCase.execute(id),
                GetBuildingFlatsUseCase.execute(id),
            ]);
            if (!b) { setStatus('error'); return; }
            setBuilding(b);
            setFlats(f);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, [id]);

    // Today's Offer is checked per-flat, not per-building — two flats in
    // the same building can have different live status (one already booked
    // today, one not) even though they share the same enabled/percent
    // setting from their parent building. See TODAY-OFFER-MODELS.md
    // section 3.
    const anyFlatOfferActive = flats.some((f) => isOfferBookable(f));
    const offerPercent = flats.find((f) => isOfferBookable(f))?.todayOfferPercent || building?.todayOfferPercent || 0;

    useEffect(() => {
        if (!anyFlatOfferActive) return undefined;
        const timer = setInterval(() => setMsLeft(msUntilMidnight()), 1000);
        return () => clearInterval(timer);
    }, [anyFlatOfferActive]);

    // Same guest-friendly pattern as chalets: go straight to the booking
    // page, no login wall until the final confirm step. One single flow —
    // the booking page itself figures out whether today's offer applies.
    const handleBookFlat = (flatId) => navigate(`/buildings/${id}/book?flatId=${flatId}`);

    if (status === 'loading') return <div className="container detail-page"><LoadingState /></div>;
    if (status === 'error' || !building) return <div className="container detail-page"><ErrorState onRetry={load} /></div>;

    const gallery = building.images.length ? building.images : [building.image].filter(Boolean);
    // BuildingEntity keeps nameAr/nameEn separate (unlike chalets' single
    // pipe-joined field) but always defaults to English — pick the one
    // matching the current UI language instead.
    const displayName = pickBilingual(building.nameAr, building.nameEn, lang);
    const displayDescription = pickBilingual(building.descriptionAr, building.descriptionEn, lang);

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
                            <span className="badge badge-building">{t('buildings')}</span>
                            <h1>{displayName}</h1>
                            <p className="detail-loc">
                                <i className="fa-solid fa-location-dot"></i> {getWilayatLabel(building.state, lang)}, {getGovernorateLabel(building.governorate, lang)}
                            </p>
                        </div>
                    </div>

                    {displayDescription && (
                        <div className="detail-section">
                            <h2>{t('description')}</h2>
                            <p>{displayDescription}</p>
                        </div>
                    )}

                    {building.services.length > 0 && (
                        <div className="detail-section">
                            <h2>{t('services')}</h2>
                            <div className="service-grid">
                                {building.services.map((s, i) => (
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
                        <div className="policy-box">
                            <strong>{t('check_in')} / {t('check_out')}</strong>
                            {building.checkIn?.slice(0, 5)} – {building.checkOut?.slice(0, 5)}
                        </div>
                        {(building.cancellationPolicyEn || building.cancellationPolicyAr) && (
                            <div className="policy-box">
                                <strong>{t('cancellation_policy')}</strong>
                                {lang === 'ar' ? building.cancellationPolicyAr : building.cancellationPolicyEn}
                            </div>
                        )}
                    </div>

                    <div className="detail-section">
                        <h2>{t('available_flats')}</h2>
                        {flats.length === 0 && <EmptyState text={t('no_buildings')} />}
                        <div className="flats-list">
                            {flats.map((flat) => {
                                const flatOfferBookable = isOfferBookable(flat);
                                return (
                                    <div className="flat-row" key={flat.id}>
                                        <img src={flat.coverImg || flat.images[0] || 'https://placehold.co/200x160?text=Flat'} alt={flat.name} />
                                        <div className="flat-row-info">
                                            <h4>{flat.name}</h4>
                                            <div className="flat-meta">
                                                <i className="fa-solid fa-bed"></i> {flat.bedsNumber} · <i className="fa-solid fa-users"></i> {flat.visitorsCount} {t('guests')}
                                            </div>
                                        </div>
                                        <div className="flat-row-price">
                                            {flatOfferBookable ? (
                                                <>
                                                    <span className="offer-flash-badge offer-flash-badge-sm">
                                                        <i className="fa-solid fa-bolt"></i> {t('today_offer_percent_off', { n: flat.todayOfferPercent })}
                                                    </span>
                                                    <div>
                                                        <s style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>{flat.pricePerNight} {t('omr')}</s>{' '}
                                                        <strong>{applyOfferDiscount(flat.pricePerNight, flat.todayOfferPercent)} {t('omr')}</strong>
                                                    </div>
                                                    <p className="property-card-price-note" style={{ margin: '2px 0 0', fontSize: 10.5 }}>
                                                        <i className="fa-solid fa-circle-info"></i> {t('today_offer_first_night_only')}
                                                    </p>
                                                </>
                                            ) : (
                                                <strong>{flat.pricePerNight} {t('omr')}</strong>
                                            )}
                                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>/ {t('night')}</div>
                                            <button className="btn btn-primary" style={{ marginTop: 8, padding: '7px 16px', fontSize: 13 }} onClick={() => handleBookFlat(flat.id)}>
                                                {flatOfferBookable ? t('today_offer_book_cta') : t('book_now')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {anyFlatOfferActive ? (
                    <div className="card booking-panel offer-flash-panel">
                        <div className="offer-flash-badge">
                            <i className="fa-solid fa-bolt"></i> {t('today_offer_flash_title')} · {t('today_offer_percent_off', { n: offerPercent })}
                        </div>
                        <div className="offer-flash-countdown">
                            <i className="fa-regular fa-clock"></i> {t('today_offer_ends_in')} <strong>{formatCountdown(msLeft)}</strong>
                        </div>
                        <p className="property-card-price-note">
                            <i className="fa-solid fa-circle-info"></i> {t('today_offer_first_night_only')}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 10 }}>
                            {t('select_flat')} {t('available_flats').toLowerCase()} — {t('today_offer_price_note').toLowerCase()}.
                        </p>
                    </div>
                ) : (
                    <div className="card booking-panel">
                        <div className="booking-panel-price">
                            {building.minimumRent} – {building.maxRent} {t('omr')}
                        </div>
                        <div className="booking-panel-meta">{t('price_range')}</div>
                        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                            {t('select_flat')} {t('available_flats').toLowerCase()} {t('book_now').toLowerCase()}.
                        </p>
                        <Link to={`/buildings/map?highlight=${building.id}`} style={{ display: 'block', marginTop: 14, fontSize: 13, color: 'var(--color-primary)', textAlign: 'center' }}>
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
