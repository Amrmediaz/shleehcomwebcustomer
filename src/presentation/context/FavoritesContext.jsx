import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useTranslation } from './LanguageContext.jsx';
import { GetFavoritesUseCase, ToggleFavoriteUseCase } from '../../core/useCases/FavoritesUseCases.js';
import './FavoritesToast.css';

const FavoritesContext = createContext();

// Client-side cap only — not enforced by the backend. Keeps the favorites
// list from growing unbounded and matches what was asked for on both
// platforms (see FavoritesCubit.maxFavorites on the Flutter side).
const FAVORITES_LIMIT = 15;

// A context, not a plain hook — favorites now come from a real API call
// (see FAVORITES-API-SPEC.md), and PropertyCard (one instance per card on
// every list page) needs to check favorite status. A plain per-instance
// hook like this used to be, back when it just read localStorage
// synchronously, would now mean every single card on a page firing its own
// duplicate GetFavorites request. One shared fetch, one shared list.
export function FavoritesProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const { t } = useTranslation();
    const [favorites, setFavorites] = useState([]);
    const [status, setStatus] = useState('idle'); // idle | loading | ready | error
    const [toast, setToast] = useState('');
    const toastTimer = useRef(null);

    const showToast = useCallback((message) => {
        setToast(message);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(''), 3000);
    }, []);

    const load = useCallback(async () => {
        if (!isAuthenticated) { setFavorites([]); setStatus('ready'); return; }
        setStatus('loading');
        try {
            const result = await GetFavoritesUseCase.execute();
            setFavorites(result);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    }, [isAuthenticated]);

    // Re-fetch on login/logout — a guest's empty list should flip to their
    // real one the moment they log in, and clear back out on logout instead
    // of leaking the previous user's favorites into the next session.
    useEffect(() => { load(); }, [load]);

    const isFavorite = useCallback(
        (type, id) => favorites.some((f) => f.type === type && f.id === id),
        [favorites]
    );

    // `snapshot` is the flat {type, id, name, image, price, location, rating}
    // shape from FAVORITES-API-SPEC.md — build it at the call site (e.g.
    // PropertyCard already has all these fields on the entity it's
    // rendering), not here, since this context has no idea what a chalet
    // vs. building's raw fields look like.
    const toggleFavorite = useCallback(async (snapshot, { navigate, location } = {}) => {
        if (!isAuthenticated) {
            // Favoriting requires an account (the API needs a token) —
            // send guests to log in instead of silently failing, same
            // pattern the booking flow uses at its own final confirm step.
            navigate?.('/login', { state: { from: `${location?.pathname ?? ''}${location?.search ?? ''}` } });
            return;
        }
        const wasFavorite = isFavorite(snapshot.type, snapshot.id);
        if (!wasFavorite && favorites.length >= FAVORITES_LIMIT) {
            showToast(t('favorites_limit_reached'));
            return;
        }
        // Optimistic flip so the heart icon responds instantly instead of
        // waiting on the network round trip; rolled back below on failure.
        setFavorites((prev) => (wasFavorite
            ? prev.filter((f) => !(f.type === snapshot.type && f.id === snapshot.id))
            : [snapshot, ...prev]));
        try {
            await ToggleFavoriteUseCase.execute(snapshot);
        } catch {
            setFavorites((prev) => (wasFavorite
                ? [snapshot, ...prev]
                : prev.filter((f) => !(f.type === snapshot.type && f.id === snapshot.id))));
        }
    }, [isAuthenticated, isFavorite, favorites.length, showToast, t]);

    useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

    return (
        <FavoritesContext.Provider value={{ favorites, status, isFavorite, toggleFavorite, reload: load }}>
            {children}
            {toast && <div className="favorites-toast">{toast}</div>}
        </FavoritesContext.Provider>
    );
}

export const useFavorites = () => useContext(FavoritesContext);
