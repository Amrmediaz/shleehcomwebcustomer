import { API_URL } from '../network/urls.js';

// Mirrors the Flutter app's pattern (chalet_card.dart etc: `BASE_URL + chalet.image`)
// — cover-image fields come back from the API as paths relative to the
// backend, not full URLs. Gallery image entries (buldingImages[].path) are
// already absolute in some responses, so this only prefixes when needed —
// safe either way.
export function toImageUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
    return API_URL + (path.startsWith('/') ? path : `/${path}`);
}
