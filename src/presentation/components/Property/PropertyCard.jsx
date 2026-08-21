import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { getWilayatLabel, getGovernorateLabel, getPropertyTypeLabel, getDisplayName } from '../../../core/utils/constants.js';
import './PropertyCard.css';

export default function PropertyCard({ item }) {
    const { t, lang } = useTranslation();
    const { isFavorite, toggleFavorite } = useFavorites();
    const navigate = useNavigate();
    const routerLocation = useLocation();
    const isChalet = item.type === 'chalet';
    const href = isChalet ? `/chalets/${item.id}` : `/buildings/${item.id}`;
    const price = isChalet ? item.rentFullDay : item.minimumRent;
    const fav = isFavorite(item.type, item.id);
    // Chalet names come as "arabic||english" in one field (confirmed live,
    // e.g. chalet 24); building names come as separate nameAr/nameEn but
    // always default to English. getDisplayName picks the right one for
    // the current UI language either way.
    const displayName = getDisplayName(item, lang);
    // For the favorite snapshot specifically, keep BOTH languages packed
    // into one "ar||en" string (same convention pickLocalizedText already
    // understands) instead of resolving to just the current language's
    // text — otherwise toggling the site language after favoriting would
    // permanently lose whichever language wasn't active at favorite-time.
    const bilingualName = item.nameAr || item.nameEn
        ? [item.nameAr, item.nameEn].filter(Boolean).join('||')
        : item.name;
    // stopBook (fully booked / owner paused it) — confirmed present on both
    // ChaletEntity and BuildingEntity's real API responses, so this applies
    // to both types. hasDiscount below stays chalet-only: that's a genuine
    // chalet-only field (fullDayDiscountEnabled/rentFullDayDiscount) —
    // BuildingEntity has no standing-discount equivalent, only Today's Offer.
    const soldOut = Boolean(item.stopBook);
    const hasDiscount = isChalet && item.fullDayDiscountEnabled
        && Number(item.rentFullDayDiscount) > 0
        && Number(item.rentFullDayDiscount) !== Number(item.rentFullDay);
    // "Today's Offer" (TODAY-OFFER-API-SPEC.md): owner-controlled percent
    // discount that only applies on days with no booking, computed
    // server-side into todayOfferActive. Works on both chalets and
    // buildings, unlike the old chalet-only offDayPrice fields it replaces.
    // Distinct from fullDayDiscountEnabled above — that's a standing promo,
    // this is specifically "empty today, so it's cheaper today." If both
    // are set, the time-sensitive one wins the badge/price display.
    const hasTodayOffer = !soldOut && item.todayOfferActive && item.todayOfferPercent > 0;
    const todayOfferPrice = hasTodayOffer
        ? Math.round(Number(price) * (1 - item.todayOfferPercent / 100))
        : null;

    return (
        <div className={`property-card ${soldOut ? 'is-sold-out' : ''}`}>
            <Link to={href} className="property-card-media">
                <img
                    src={item.image || 'https://placehold.co/480x320?text=Shleeh'}
                    alt={displayName}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/480x320?text=Shleeh'; }}
                />
                {/* Stacked in one flex column so the type badge and a
                    status/offer badge never sit on top of each other —
                    they used to be independently absolute-positioned at the
                    exact same spot, which meant whichever rendered second
                    (today/soldout/discount) visually covered the
                    chalet/building label entirely. */}
                <div className="property-card-badges">
                    <span className={`badge ${isChalet ? 'badge-chalet' : 'badge-building'}`}>
                        {isChalet ? t('chalets') : t('buildings')}
                    </span>
                    {soldOut && (
                        <span className="badge-soldout">
                            <i className="fa-solid fa-calendar-xmark"></i> {t('fully_booked')}
                        </span>
                    )}
                    {!soldOut && hasTodayOffer && (
                        <span className="badge-today">
                            <i className="fa-solid fa-bolt"></i> {t('today_offer_percent_off', { n: item.todayOfferPercent })}
                        </span>
                    )}
                    {!soldOut && !hasTodayOffer && hasDiscount && <span className="badge-discount">{t('special_offer')}</span>}
                </div>
                <button
                    type="button"
                    className={`fav-btn ${fav ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        // Flat snapshot per FAVORITES-API-SPEC.md — same
                        // shape the Flutter app's FavoriteItem already
                        // builds from a chalet/building object it has in
                        // memory, just built here instead. `name` and
                        // `location` store raw, re-translatable values
                        // (not text resolved to the current language) so
                        // FavoriteCard can re-derive the right language
                        // live when the site language is toggled later —
                        // see pickLocalizedText / getFavoriteLocationLabel.
                        const rawLocation = [item.state, item.governorate].filter(Boolean).join('||');
                        toggleFavorite({
                            type: item.type,
                            id: item.id,
                            name: bilingualName,
                            image: item.image,
                            price: String(price ?? ''),
                            location: rawLocation,
                            rating: item.rateAverage || null,
                        }, { navigate, location: routerLocation });
                    }}
                    aria-label="favorite"
                >
                    <i className={`fa-${fav ? 'solid' : 'regular'} fa-heart`}></i>
                </button>
            </Link>
            <Link to={href} className="property-card-body">
                <h3>{displayName}</h3>
                <p className="property-card-loc">
                    <i className="fa-solid fa-location-dot"></i> {getWilayatLabel(item.state, lang)}{item.state && item.governorate ? ', ' : ''}{getGovernorateLabel(item.governorate, lang)}
                </p>
                {Boolean(item.facts?.capacity || item.facts?.bedrooms || item.facts?.type || (!soldOut && item.minDays > 1)) && (
                    <div className="property-card-facts">
                        {Boolean(item.facts?.type) && (
                            <span><i className="fa-solid fa-house"></i> {getPropertyTypeLabel(item.facts.type, lang)}</span>
                        )}
                        {Boolean(item.facts?.capacity) && (
                            <span><i className="fa-solid fa-users"></i> {item.facts.capacity} {t('guests')}</span>
                        )}
                        {Boolean(item.facts?.bedrooms) && (
                            <span><i className="fa-solid fa-bed"></i> {item.facts.bedrooms}</span>
                        )}
                        {!soldOut && item.minDays > 1 && (
                            <span><i className="fa-solid fa-moon"></i> {t('min_nights', { n: item.minDays })}</span>
                        )}
                    </div>
                )}
                <div className="property-card-footer">
                    <div>
                        <span className="property-card-price">
                            {hasTodayOffer ? (
                                <>
                                    {t('from')} <s className="property-card-price-old">{price} {t('omr')}</s>{' '}
                                    <strong>{todayOfferPrice} {t('omr')}</strong> / {t('night')}
                                </>
                            ) : hasDiscount ? (
                                <>
                                    {t('from')} <s className="property-card-price-old">{price} {t('omr')}</s>{' '}
                                    <strong>{item.rentFullDayDiscount} {t('omr')}</strong> / {t('night')}
                                </>
                            ) : (
                                price ? <>{t('from')} <strong>{price} {t('omr')}</strong> / {t('night')}</> : '—'
                            )}
                        </span>
                        {/* Very important not to imply the whole stay is discounted —
                            the offer only ever covers the first night. */}
                        {hasTodayOffer && (
                            <p className="property-card-price-note">
                                <i className="fa-solid fa-circle-info"></i> {t('today_offer_first_night_only')}
                            </p>
                        )}
                    </div>
                    {Boolean(item.rateAverage) && (
                        <span className="property-card-rating">
                            <i className="fa-solid fa-star"></i> {item.rateAverage}
                        </span>
                    )}
                </div>
            </Link>
        </div>
    );
}
