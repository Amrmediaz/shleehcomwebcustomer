import { toImageUrl } from '../utils/mediaUrl.js';
import { buildFacts, buildPolicy } from '../utils/parseDescription.js';

// Mirrors the fields used across the Flutter customer app's Chalet /
// ChaletDetails models (chalet_model.dart, chalet_details.dart).
export class ChaletEntity {
    constructor(raw = {}) {
        this.id = raw.id ?? 0;
        this.type = 'chalet';
        this.name = raw.name ?? raw.nameEn ?? raw.nameAr ?? '';
        this.description = raw.buldingDescrption ?? raw.buildingDescription ?? '';
        this.state = raw.state ?? '';
        this.governorate = raw.gouvernate ?? raw.governorate ?? '';
        // Cover image is a relative path from the API (same as the app's
        // `BASE_URL + chalet.image`); gallery paths already come back
        // absolute — toImageUrl() is a no-op for those.
        this.image = toImageUrl(raw.image ?? raw.coverimg ?? '');
        this.images = (raw.buldingImages || []).map((img) => toImageUrl(img.path || img.url || img));
        this.rentFullDay = Number(raw.rentFullday ?? raw.rentFullDay ?? 0);
        this.rentFullDayDiscount = raw.rentFulldayDisCount ?? raw.rentFullDayDiscount ?? '';
        this.rentHalfDay = Number(raw.rentHalfday ?? raw.rentHalfDay ?? 0);
        this.rentHalfDayDiscount = raw.rentHalfdayDisCount ?? raw.rentHalfDayDiscount ?? '';
        // Kept as a raw string (matches the Dart model's `String rentweekend`)
        // — the AddBooking request sends this straight through as the
        // "note" field, and posting a JSON number there where the backend
        // expects a string 400s the request.
        this.rentWeekend = raw.rentweekend ?? '';
        // "Today's Offer" — owner-controlled discount for days with no
        // booking (TODAY-OFFER-API-SPEC.md). Replaces the old, deprecated
        // offDayPriceFullday/offDayPriceHalfday fields on purpose — those
        // only existed on the detail endpoint and had no owner enable/
        // disable flag. todayOfferActive is computed server-side (booking
        // state + owner's trigger hour), so the client just trusts it and
        // derives the shown price as rentFullDay * (1 - percent / 100).
        this.todayOfferEnabled = Boolean(raw.todayOfferEnabled);
        this.todayOfferPercent = Number(raw.todayOfferPercent ?? 0);
        this.todayOfferTriggerHour = Number(raw.todayOfferTriggerHour ?? 12);
        this.todayOfferActive = Boolean(raw.todayOfferActive);
        this.rateAverage = Number(raw.rateAverage ?? 0);
        this.minDays = Number(raw.minDays ?? 1);
        this.lat = raw.lat ?? '';
        this.lng = raw.lng ?? '';
        this.note = raw.note ?? '';
        this.acceptDeposit = Boolean(raw.acceptDeposit);
        this.breakfastEnabled = Boolean(raw.breakfastenabled);
        this.fullDayDiscountEnabled = Boolean(raw.fulldayDiscountenabled);
        this.fullDayDiscountEnabledText = raw.fulldayDiscountenabledText ?? '';
        this.insuranceAmount = Number(raw.insuranceamount ?? 0);
        this.stopBook = Boolean(raw.stopBook);
        this.isActive = raw.isActive ?? true;
        this.services = (raw.buldingService || []).map((s) => s.serviceName || s);

        // Structured facts: some listings already have chaletType/capacity/
        // bedrooms/landscape/etc. as real fields, others only have them
        // embedded in `buldingDescrption` as "Key: Value | Key: Value" text.
        // `buildFacts` prefers the real field and falls back to parsing the
        // description, so both cases render the same way.
        this.facts = buildFacts(raw, this.description);
        this.chaletType = this.facts.type;
        this.capacity = this.facts.capacity;
        this.bedrooms = this.facts.bedrooms;
        this.landscape = this.facts.landscape;

        // Cancellation/check-in/check-out/rules, packed the same way inside `note`.
        this.policy = buildPolicy(this.note);

        this.comments = raw.buldingComment || [];
        this.raw = raw;
    }
}
