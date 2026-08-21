import { toImageUrl } from '../utils/mediaUrl.js';

// Mirrors flat_model.dart / flat_details.dart — a rentable unit inside a Building.
export class FlatEntity {
    constructor(raw = {}) {
        this.id = raw.id ?? 0;
        this.buildingId = raw.hotelbuildingID ?? raw.buildingId ?? 0;
        this.nameAr = raw.nameAr ?? '';
        this.nameEn = raw.nameEn ?? '';
        this.name = this.nameEn || this.nameAr;
        this.flatNumber = raw.flatNumber ?? '';
        this.flatFloor = raw.flatFloor ?? '';
        this.descriptionAr = raw.descrptionAr ?? '';
        this.descriptionEn = raw.descrptionEn ?? '';
        this.description = this.descriptionEn || this.descriptionAr;
        this.pricePerNight = parseFloat(raw.price_per_night) || 0;
        this.weekendPricePerNight = parseFloat(raw.weekend_price_per_night) || 0;
        this.visitorsCount = raw.visitors_count ?? '0';
        this.bedsNumber = raw.bedsNumber ?? '0';
        this.bathroomsNumber = raw.bathroomsNumber ?? '0';
        this.balconiesNumber = raw.balconiesNumber ?? '';
        this.insuranceAmount = Number(raw.insurance_amount ?? 0);
        this.count = Number(raw.count ?? 0);
        this.status = raw.status ?? 'available';
        this.coverImg = toImageUrl(raw.coverimg || raw.cover_image || '');
        this.images = (raw.flatImages || raw.images || []).map((img) => toImageUrl(img.path || img.url || img));
        this.electronics = raw.electronic_devices || raw.electronics || [];
        this.typeId = raw.typeId ?? raw.value1 ?? '';
        // "Today's Offer" — copied down from the parent building
        // (todayOfferEnabled/todayOfferPercent are the same for every flat
        // in one building), but todayOfferActive is computed per-flat
        // server-side (booking state for THIS flat specifically), so two
        // flats in the same building can show different live status even
        // though they share the same enabled/percent. See
        // TODAY-OFFER-API-SPEC.md / TODAY-OFFER-MODELS.md section 3.
        this.todayOfferEnabled = Boolean(raw.todayOfferEnabled);
        this.todayOfferPercent = Number(raw.todayOfferPercent ?? 0);
        this.todayOfferActive = Boolean(raw.todayOfferActive);
        this.raw = raw;
    }
}
