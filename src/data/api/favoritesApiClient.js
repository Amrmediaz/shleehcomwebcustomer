import { httpClient } from './httpClient.js';
import { FAVORITES_URL, TOGGLE_FAVORITE_URL } from '../../core/network/urls.js';

export const favoritesApiClient = {
    async list() {
        return httpClient.get(FAVORITES_URL, { auth: true });
    },
    // Per FAVORITES-API-SPEC.md, the full snapshot is sent, not just
    // {type, id} — the backend stores it as-is and echoes it back from
    // GetFavorites, same flat-snapshot approach the Flutter app already
    // uses (FavoriteItem), rather than backend joining against the
    // chalets/buildings tables on every read.
    async toggle(snapshot) {
        return httpClient.post(TOGGLE_FAVORITE_URL, { body: snapshot, auth: true });
    },
};
