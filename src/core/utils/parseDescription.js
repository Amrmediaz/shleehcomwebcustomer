// The backend packs structured facts into a single pipe-delimited string, e.g.
// "Type: شاليه | Capacity: 6 Guests | Bedrooms: 3 | ... | Notes: free text with: colons, too"
// Some listings additionally expose these as real top-level fields (chaletType,
// capacity, bedrooms, landscape, bathrooms, livingRooms, suitableFor, outdoorSpace,
// safety, atmosphere, bestSeason) and some don't — this parser is the fallback
// for whichever fields the API didn't break out on its own.
//
// Only the FIRST colon in each "Key: Value" segment is treated as the
// separator, so free-text values (like "Notes") that themselves contain a
// colon are preserved intact.
export function parseDescription(desc) {
    const out = {};
    if (!desc || typeof desc !== 'string') return out;

    const segments = desc.split('|').map((s) => s.trim()).filter(Boolean);
    for (const segment of segments) {
        const idx = segment.indexOf(':');
        if (idx === -1) continue;
        const key = segment.slice(0, idx).trim();
        const value = segment.slice(idx + 1).trim();
        if (key && value) out[key] = value;
    }
    return out;
}

// Pulls the leading integer out of strings like "6 Guests" -> 6.
export function extractNumber(value) {
    if (value === null || value === undefined || value === '') return '';
    const match = String(value).match(/\d+/);
    return match ? match[0] : '';
}

// Builds a normalized "facts" object for a chalet/building, preferring real
// top-level API fields and falling back to whatever the description string
// contains. Some listings have both, some have neither (handled gracefully
// with empty strings so callers can just check truthiness).
export function buildFacts(raw = {}, description = '') {
    const parsed = parseDescription(description);
    return {
        type: raw.chaletType || parsed['Type'] || '',
        capacity: raw.capacity || extractNumber(parsed['Capacity']) || '',
        bedrooms: raw.bedrooms || parsed['Bedrooms'] || '',
        bathrooms: raw.bathrooms || parsed['Bathrooms'] || '',
        livingRooms: raw.livingRooms || parsed['Living Rooms'] || '',
        landscape: raw.landscape || parsed['Landscape'] || '',
        suitableFor: raw.suitableFor || parsed['Suitable For'] || '',
        outdoorSpace: raw.outdoorSpace || parsed['Outdoor Space'] || '',
        safety: raw.safety || parsed['Safety'] || '',
        atmosphere: raw.atmosphere || parsed['Atmosphere'] || '',
        bestSeason: raw.bestSeason || parsed['Best Season'] || '',
        area: raw.area || parsed['Area'] || '',
        notes: parsed['Notes'] || '',
    };
}

// Same pipe/colon format is used for the `note` field ("Cancellation: ... |
// Check-in: ... | Check-out: ... | Rules: ...").
export function buildPolicy(note = '') {
    const parsed = parseDescription(note);
    return {
        cancellation: parsed['Cancellation'] || '',
        checkIn: parsed['Check-in'] || parsed['Check-In'] || '',
        checkOut: parsed['Check-out'] || parsed['Check-Out'] || '',
        rules: parsed['Rules'] || '',
        raw: note || '',
    };
}
