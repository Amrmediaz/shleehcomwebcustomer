import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { pickLocalizedText, getFavoriteLocationLabel } from '../../../core/utils/constants.js';
import './FavoriteCard.css';

// A separate, lighter card just for the favorites list — mirrors the
// Flutter app's own _FavoriteCard widget, which is deliberately distinct
// from the full chalet/building cards for the same reason: a favorite is a
// flat snapshot (name/image/price/location/rating per FAVORITES-API-SPEC.md),
// not a full entity with facts/services/description, so it can't render
// the same fields the full PropertyCard expects.
export default function FavoriteCard({ item }) {
    const { t, lang } = useTranslation();
    const { toggleFavorite } = useFavorites();
    const navigate = useNavigate();
    const location = useLocation();
    const isChalet = item.type === 'chalet';
    const href = isChalet ? `/chalets/${item.id}` : `/buildings/${item.id}`;
    // Older favorites (saved before the "ar||en" pipe-name fix) may still
    // have raw un-split text stored — this keeps them displaying correctly
    // without needing to re-favorite.
    const displayName = pickLocalizedText(item.name, lang);
    // Same idea for location — new favorites store raw state/governorate
    // codes ("Salalah||Dhofar") so this re-translates live using the same
    // WILAYATS_AR/GOVERNORATES_AR tables as everywhere else; older
    // favorites with plain pre-translated text just pass through as-is.
    const displayLocation = getFavoriteLocationLabel(item.location, lang);

    return (
        <div className="favorite-card">
            <Link to={href} className="favorite-card-media">
                <img
                    src={item.image || 'https://placehold.co/200x200?text=Shleeh'}
                    alt={displayName}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x200?text=Shleeh'; }}
                />
                <span className="favorite-card-type">{isChalet ? t('chalets') : t('buildings')}</span>
            </Link>
            <div className="favorite-card-body">
                <Link to={href}>
                    <h3>{displayName}</h3>
                </Link>
                {displayLocation && (
                    <p className="favorite-card-loc"><i className="fa-solid fa-location-dot"></i> {displayLocation}</p>
                )}
                <div className="favorite-card-footer">
                    {item.price && (
                        <span className="favorite-card-price">{t('from')} <strong>{item.price} {t('omr')}</strong> / {t('night')}</span>
                    )}
                    {Boolean(item.rating) && (
                        <span className="favorite-card-rating"><i className="fa-solid fa-star"></i> {item.rating}</span>
                    )}
                </div>
            </div>
            <button
                type="button"
                className="favorite-card-remove"
                onClick={() => toggleFavorite(item, { navigate, location })}
                aria-label="remove from favorites"
            >
                <i className="fa-solid fa-heart"></i>
            </button>
        </div>
    );
}
