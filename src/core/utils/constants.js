// Mirrors lib/core/util/Constants.dart — Shleeh currently only operates in
// the Dhofar governorate.
export const GOVERNORATES = ['Dhofar'];
export const GOVERNORATES_AR = { Dhofar: 'ظفار' };

export const WILAYATS = [
    'Salalah', 'Mirbat', 'Sadah', 'Shalim', 'Thumrait',
    'Maqusht', 'Dalkut', 'Rakhyut', 'AL mazyona', 'Taqah',
];
export const WILAYATS_AR = {
    Salalah: 'صلالة', Mirbat: 'مرباط', Sadah: 'سدح', Shalim: 'شليم', Thumrait: 'ثمريت',
    Maqusht: 'مقشن', Dalkut: 'ضلكوت', Rakhyut: 'رخيوت', 'AL mazyona': 'المزيونة', Taqah: 'طاقة',
};

// The API returns `state`/`gouvernate` as these same English keys (that's
// how FilterBar's request payload already works — it sends the English key
// straight through as the filter value). But list/detail cards print that
// raw value directly, so in Arabic mode a listing shows a Latin-script
// wilayat name sitting inside otherwise-Arabic text. These translate it the
// same way FilterBar's dropdown already does; unrecognized values (or ones
// that already happen to be Arabic) just pass through unchanged, so this
// can never show blank or worse than before.
export function getWilayatLabel(value, lang) {
    if (!value) return '';
    return lang === 'ar' ? (WILAYATS_AR[value] || value) : value;
}

export function getGovernorateLabel(value, lang) {
    if (!value) return '';
    return lang === 'ar' ? (GOVERNORATES_AR[value] || value) : value;
}

// Favorite snapshots store the raw state/governorate codes joined by "||"
// (e.g. "Salalah||Dhofar", built in PropertyCard) instead of pre-translated
// text, specifically so a favorite's location re-translates when the site
// language is toggled — reusing these exact same WILAYATS_AR/GOVERNORATES_AR
// tables, not a separate copy. Favorites saved before this fix have plain
// text with no "||" and just pass through unchanged (can't be retroactively
// re-derived without the original raw codes).
export function getFavoriteLocationLabel(value, lang) {
    if (!value || typeof value !== 'string') return value ?? '';
    if (!value.includes('||')) return value;
    const [state, governorate] = value.split('||').map((s) => s.trim());
    return [getWilayatLabel(state, lang), getGovernorateLabel(governorate, lang)]
        .filter(Boolean).join(' ');
}

// Some backend fields (chalet/building `name`, confirmed live via
// GetBuildingData, e.g. "استراحة لايتهاوس||lighthouse chalet") pack both
// languages into one string separated by "||" instead of exposing separate
// nameAr/nameEn fields. Splits and picks the half matching the current UI
// language; values without "||" (the common case) pass through unchanged,
// so this is safe to apply everywhere a name is rendered.
export function pickLocalizedText(value, lang) {
    if (!value || typeof value !== 'string') return value ?? '';
    if (!value.includes('||')) return value;
    const [ar, en] = value.split('||').map((s) => s.trim());
    return lang === 'ar' ? (ar || en || '') : (en || ar || '');
}

// Buildings/flats expose separate nameAr/nameEn fields instead of the
// chalets' single pipe-joined `name` (see pickLocalizedText above) — but
// BuildingEntity/Flat entity currently always prefer English regardless of
// the UI language. This picks the one matching the current language,
// falling back to whichever exists.
export function pickBilingual(ar, en, lang) {
    return lang === 'ar' ? (ar || en || '') : (en || ar || '');
}

// Unified name picker for anywhere that renders both chalets and buildings
// generically (PropertyCard, FavoriteCard) — ChaletEntity only has a single
// `name` (possibly pipe-joined, see pickLocalizedText), BuildingEntity has
// separate nameAr/nameEn. Prefers nameAr/nameEn when present (buildings),
// otherwise falls back to splitting `name` (chalets).
export function getDisplayName(item, lang) {
    if (!item) return '';
    if (item.nameAr || item.nameEn) return pickBilingual(item.nameAr, item.nameEn, lang);
    return pickLocalizedText(item.name, lang);
}

// Mirrors lib/core/util/Constants.dart's serviceKeyToValue / servicesEnglishToArabicBuilding
// maps — the API returns bare codes like "wifi" / "noSmoking" as `serviceName`,
// and the source app only ever had Arabic labels for these (no English map
// existed at all, which is why English mode was showing raw codes). English
// labels below are original translations since the app itself has none.
const SERVICE_LABELS = {
    sec_24: { ar: 'حراسة 24/7', en: '24/7 Security', icon: 'fa-shield-halved' },
    wifi: { ar: 'واي فاي', en: 'WiFi', icon: 'fa-wifi' },
    parking: { ar: 'مواقف', en: 'Parking', icon: 'fa-square-parking' },
    elevator: { ar: 'مصعد', en: 'Elevator', icon: 'fa-elevator' },
    ac: { ar: 'تكييف الهواء', en: 'Air Conditioning', icon: 'fa-wind' },
    gym: { ar: 'صالة رياضية', en: 'Gym', icon: 'fa-dumbbell' },
    pool: { ar: 'مسبح', en: 'Swimming Pool', icon: 'fa-person-swimming' },
    power: { ar: 'مولد كهرباء', en: 'Power Backup', icon: 'fa-bolt' },
    cctv: { ar: 'كاميرات مراقبة', en: 'CCTV', icon: 'fa-video' },
    menPool: { ar: 'مسبح رجال', en: "Men's Pool", icon: 'fa-person-swimming' },
    womenPool: { ar: 'مسبح نساء', en: "Women's Pool", icon: 'fa-person-swimming' },
    childPool: { ar: 'مسبح أطفال', en: "Kids' Pool", icon: 'fa-person-swimming' },
    grill: { ar: 'شواية', en: 'BBQ Grill', icon: 'fa-fire-burner' },
    volleyBall: { ar: 'كرة طائرة', en: 'Volleyball', icon: 'fa-volleyball' },
    football: { ar: 'كرة قدم', en: 'Football', icon: 'fa-futbol' },
    animals: { ar: 'حيوانات', en: 'Pets Allowed', icon: 'fa-paw' },
    games: { ar: 'ألعاب', en: 'Games', icon: 'fa-gamepad' },
    childGames: { ar: 'ألعاب أطفال', en: "Kids' Games", icon: 'fa-shapes' },
    noSmoking: { ar: 'ممنوع التدخين', en: 'No Smoking', icon: 'fa-smoking-ban' },
};

// Splits "noSmoking" -> "No Smoking" as a last-resort label for any service
// code the backend adds later that isn't in SERVICE_LABELS yet, so it never
// falls back to showing the raw camelCase/snake_case string as-is.
function humanizeServiceCode(code) {
    return String(code)
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, (c) => c.toUpperCase());
}

// The building owner web panel (AMENITY_SERVICE_MAP in
// shleeh_com_building/src/core/utils/Constants/building_constants.js) does
// NOT send short codes like "ac"/"sec_24" for buildings — it sends the full
// English display string itself ("Air Conditioning", "Security 24/7",
// "CCTV", "WiFi", ...) as the service value, so SERVICE_LABELS[code] never
// matches for buildings and Arabic mode was showing the raw English string.
// This maps those exact display strings back to the short codes above so
// both chalets (short codes) and buildings (display strings) translate
// correctly. Case-insensitive since API casing isn't always consistent.
const BUILDING_SERVICE_DISPLAY_TO_KEY = {
    'security 24/7': 'sec_24',
    'wifi': 'wifi',
    'parking': 'parking',
    'elevator': 'elevator',
    'air conditioning': 'ac',
    'gym': 'gym',
    'swimming pool': 'pool',
    'power backup': 'power',
    'cctv': 'cctv',
};

function resolveServiceKey(code) {
    if (SERVICE_LABELS[code]) return code;
    const mapped = BUILDING_SERVICE_DISPLAY_TO_KEY[String(code).toLowerCase().trim()];
    return mapped || null;
}

export function getServiceLabel(code, lang) {
    const key = resolveServiceKey(code);
    const entry = key ? SERVICE_LABELS[key] : null;
    if (entry) return lang === 'ar' ? entry.ar : entry.en;
    return humanizeServiceCode(code);
}

export function getServiceIcon(code) {
    const key = resolveServiceKey(code);
    return (key && SERVICE_LABELS[key]?.icon) || 'fa-circle-check';
}

// Same story as SERVICE_LABELS above, but for the free-text "Type" fact
// (e.g. "Type: استراحة" in buldingDescrption, or raw.chaletType). Data here
// is inconsistent across listings — some have the type already in English
// ("Chalet"), some only ever had the Arabic word ("استراحة") — so unlike
// SERVICE_LABELS this needs a lookup that works starting from *either*
// language and returns the other, not just Arabic -> English. English keys
// are matched case-insensitively since manual data entry isn't consistent
// about casing. Unrecognized values fall back to the raw string in both
// languages — safe, since owners can type anything here and we can't
// invent a translation for a word we don't recognize.
export const PROPERTY_TYPES = [
    { ar: 'شاليه', en: 'Chalet' },
    { ar: 'استراحة', en: 'Resthouse' },
    { ar: 'فيلا', en: 'Villa' },
    { ar: 'منتجع', en: 'Resort' },
    { ar: 'شقة', en: 'Apartment' },
    { ar: 'بيت', en: 'House' },
    { ar: 'مزرعة', en: 'Farm' },
    { ar: 'كوخ', en: 'Cabin' },
    { ar: 'دوبلكس', en: 'Duplex' },
    { ar: 'قصر', en: 'Palace' },
];
const PROPERTY_TYPE_LOOKUP = new Map();
PROPERTY_TYPES.forEach((entry) => {
    PROPERTY_TYPE_LOOKUP.set(entry.ar, entry);
    PROPERTY_TYPE_LOOKUP.set(entry.en.toLowerCase(), entry);
});

export function getPropertyTypeLabel(value, lang) {
    if (!value) return '';
    const trimmed = value.trim();
    const entry = PROPERTY_TYPE_LOOKUP.get(trimmed) || PROPERTY_TYPE_LOOKUP.get(trimmed.toLowerCase());
    if (entry) return lang === 'ar' ? entry.ar : entry.en;
    return trimmed;
}

// Mirrors ChaletCharacteristicsSection.jsx's LANDSCAPE/BEST_SEASON constants
// in the owner web panel (shleeh_com_building) exactly — these are the only
// literal keys owners can ever actually send for `landscape`/`bestSeason`
// (chip-picker there, not free text), so the customer-site filter must
// offer the same fixed choices and send the same English keys, not a
// free-text box that can never match anything real.
export const LANDSCAPES = ['coastal', 'mountain', 'valley', 'desert'];
export const BEST_SEASONS = ['summer', 'winter', 'spring_autumn', 'year_round'];

// SERVICE_LABELS above stays comprehensive (used for rendering whatever
// service badges an existing listing actually has, including older/one-off
// codes) — but the FILTER's service picker must only offer services a
// chalet/building can actually be given in the first place, otherwise a
// guest can "select" a service no listing will ever match. These two lists
// mirror the literal, real add/edit-form service lists in the owner web
// panel exactly (chalets and buildings use separate, mostly non-overlapping
// sets there — only 'wifi' is shared):
//   - chalets:   AddChaletModal.jsx's `services` array
//   - buildings: AddBuildingModal.jsx's `amenities` array
export const CHALET_SERVICES = ['wifi', 'menPool', 'womenPool', 'childGames', 'games', 'noSmoking', 'grill', 'animals'];
export const CHALET_SERVICES_AR = Object.fromEntries(Object.entries(SERVICE_LABELS).map(([k, v]) => [k, v.ar]));

export const BUILDING_SERVICES = ['sec_24', 'wifi', 'parking', 'elevator', 'ac', 'gym', 'pool', 'power', 'cctv'];
export const BUILDING_SERVICES_AR = CHALET_SERVICES_AR;
