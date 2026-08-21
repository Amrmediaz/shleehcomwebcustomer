import { dictionary } from '../localization/dictionary.js';

// The six chalet "characteristics" fields (landscape, suitableFor,
// outdoorSpace, safety, atmosphere, bestSeason) are picked from a fixed
// chip list in BOTH owner-facing apps, but the two apps disagree on what
// they actually send to the backend:
//   - the web owner panel sends the clean English key ('coastal', 'winter', ...)
//   - the chaletowner Flutter app sends the raw Arabic chip label instead
//     ('جبلي (جبال وطبيعة)', 'الشتاء (بارد - الأفضل)', ...) — see
//     add_chalet.dart's *Options lists.
// So the same real field holds either format depending on which app a
// listing was last saved from, and the customer site has no control over
// that. This file provides a best-effort reverse lookup so recognizable
// values translate correctly regardless of UI language; anything that
// doesn't match a known key/label (older free-typed data) is left as-is,
// since there's no way to invent a translation for genuinely free text.
export const LANDSCAPE_KEYS = ['coastal', 'mountain', 'valley', 'desert'];
export const SUITABLE_FOR_KEYS = ['small_family', 'large_family', 'couples', 'friends_group', 'corporate'];
export const OUTDOOR_SPACE_KEYS = ['large_garden', 'medium_garden', 'small_yard', 'balcony_only'];
export const SAFETY_KEYS = ['very_safe_children', 'generally_safe', 'adults_only'];
export const ATMOSPHERE_KEYS = ['very_calm', 'calm_comfortable', 'lively'];
export const BEST_SEASON_KEYS = ['summer', 'winter', 'spring_autumn', 'year_round'];

const FIELD_KEYS = {
    landscape: LANDSCAPE_KEYS,
    suitableFor: SUITABLE_FOR_KEYS,
    outdoorSpace: OUTDOOR_SPACE_KEYS,
    safety: SAFETY_KEYS,
    atmosphere: ATMOSPHERE_KEYS,
    bestSeason: BEST_SEASON_KEYS,
};

// Extra raw-text variants seen in real data that don't exactly match this
// site's own dictionary ar/en labels for the same key — the chaletowner
// Flutter app defines its own slightly different Arabic wording instead of
// reusing the same strings as the web owner panel (extra words, different
// punctuation). Mapped here too so listings created/edited from mobile
// still translate. Also covers the Flutter app's raw default values for
// safety/atmosphere/bestSeason (sent as-is if the owner never touches the
// picker).
const EXTRA_VARIANTS = {
    landscape: {
        mountain: ['جبلي (جبال وطبيعة)'],
    },
    suitableFor: {
        small_family: ['عائلات صغيرة (2-4 أفراد)'],
        large_family: ['عائلات كبيرة (5+ أفراد)'],
        corporate: ['موظفين شركات'],
    },
    outdoorSpace: {
        large_garden: ['حديقة واسعة جداً'],
    },
    bestSeason: {
        winter: ['الشتاء'],
        year_round: ['طول السنة'],
    },
};

const reverseLookups = {};
function getReverseLookup(field) {
    if (reverseLookups[field]) return reverseLookups[field];
    const map = new Map();
    for (const key of FIELD_KEYS[field] || []) {
        map.set(key.toLowerCase(), key);
        const en = dictionary.en[`chalet_${key}`];
        const ar = dictionary.ar[`chalet_${key}`];
        if (en) map.set(en.trim().toLowerCase(), key);
        if (ar) map.set(ar.trim().toLowerCase(), key);
        for (const variant of EXTRA_VARIANTS[field]?.[key] || []) {
            map.set(variant.trim().toLowerCase(), key);
        }
    }
    reverseLookups[field] = map;
    return map;
}

// `raw` may be a single value or a comma-joined multi-value string
// (landscape/suitableFor/outdoorSpace all allow multiple picks in both
// owner-facing apps). Each part is looked up independently and translated
// via `t` if recognized; unrecognized parts pass through untouched.
export function translateChaletFact(field, raw, lang, t) {
    if (!raw) return '';
    const lookup = getReverseLookup(field);
    const parts = String(raw).split(',').map((p) => p.trim()).filter(Boolean);
    const translated = parts.map((part) => {
        const key = lookup.get(part.toLowerCase());
        return key ? t(`chalet_${key}`) : part;
    });
    return translated.join(lang === 'ar' ? '، ' : ', ');
}
