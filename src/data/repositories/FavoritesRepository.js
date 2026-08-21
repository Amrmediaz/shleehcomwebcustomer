import { favoritesApiClient } from '../api/favoritesApiClient.js';
import { toImageUrl } from '../../core/utils/mediaUrl.js';

// Per FAVORITES-API-SPEC.md, favorites are stored/returned as a flat
// snapshot (id, type, name, image, price, location, rating) — the same
// shape the Flutter app's FavoriteItem already uses — not full chalet/
// building entities. So no ChaletEntity/BuildingEntity parsing here, just
// light normalization in case a field comes back missing.
//
// Backend's `type` field is a numeric enum, confirmed with backend:
// 1 = chalet, 2 = building — no separate "flat" value, favoriting is at
// the building level like everywhere else. (An earlier round of testing
// was told 0/1 — that turned out to be wrong and is why favorited chalets
// were coming back with the account holder's name instead of the chalet's:
// sending 0 for chalet didn't match any real enum member server-side.)
// Converted here at the repository boundary only, so the rest of the app
// (Context, PropertyCard, FavoriteCard) keeps working with plain
// 'chalet'/'building' strings like it already does everywhere else.
const TYPE_TO_NUM = { chalet: 1, building: 2 };
const NUM_TO_TYPE = { 1: 'chalet', 2: 'building' };

function normalize(raw) {
    return {
        type: NUM_TO_TYPE[raw.type] ?? 'chalet',
        id: raw.id,
        name: raw.name ?? '',
        // The client always sends a full absolute URL when favoriting (see
        // ChaletEntity/BuildingEntity's toImageUrl() usage), but backend
        // has echoed back a bare relative path on GetFavorites for at
        // least one item — toImageUrl() is a no-op for already-absolute
        // URLs, so this is a safe defensive prefix either way, same as
        // every other image field in the app.
        image: toImageUrl(raw.image ?? ''),
        price: raw.price ?? '',
        location: raw.location ?? '',
        rating: raw.rating ?? null,
    };
}

export const FavoritesRepository = {
    async getFavorites() {
        const data = await favoritesApiClient.list();
        // Temporary debug logging — user reported that after a refresh,
        // the favorites list shows the account holder's name instead of
        // the chalet/building name, and no image. Logging both the raw
        // response and the normalized result makes it obvious whether
        // backend is sending the wrong `name`/`image` values, or whether
        // normalize() here is misreading a correct response. Remove once
        // diagnosed.
        console.log('[Favorites] raw GetFavorites response:', data);
        if (data?.status && Array.isArray(data?.message)) {
            const result = data.message.map(normalize);
            console.log('[Favorites] normalized list:', result);
            return result;
        }
        return [];
    },
    async toggleFavorite(snapshot) {
        // Per backend's FavoriteDTO schema, `rating` has no "nullable: true"
        // (unlike name/image/price/location, which all do) — it's a
        // non-nullable double server-side, so sending JSON null here would
        // fail to deserialize into it. Default to 0 instead, same as any
        // item with no rating yet.
        const payload = {
            ...snapshot,
            type: TYPE_TO_NUM[snapshot.type] ?? 1,
            rating: snapshot.rating ?? 0,
        };
        // Temporary debug logging — prints the exact JSON body sent to
        // POST ToggleFavorite, so it's easy to confirm the real name/image
        // being sent for a live favorite (vs. old manual Swagger test
        // entries). Remove once diagnosed.
        console.log('[Favorites] POST ToggleFavorite body:', payload);
        const data = await favoritesApiClient.toggle(payload);
        if (data?.status) return Boolean(data?.message?.isFavorite);
        throw new Error(data?.message || 'Failed to update favorite');
    },
};
