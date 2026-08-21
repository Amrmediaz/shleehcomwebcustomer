import { useTranslation } from '../context/LanguageContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/Property/StateViews.jsx';
import FavoriteCard from '../components/Property/FavoriteCard.jsx';
import './ListPage.css';

export default function FavoritesPage() {
    const { t } = useTranslation();
    const { favorites, status, reload } = useFavorites();

    return (
        <div className="container list-page">
            <h1 className="section-title">{t('favorites')}</h1>
            {status === 'loading' && <LoadingState />}
            {status === 'error' && <ErrorState onRetry={reload} />}
            {status === 'ready' && favorites.length === 0 && <EmptyState text={t('no_favorites')} />}
            {status === 'ready' && favorites.length > 0 && (
                <div className="favorites-list">
                    {favorites.map((f) => (
                        <FavoriteCard key={`${f.type}-${f.id}`} item={f} />
                    ))}
                </div>
            )}
        </div>
    );
}
