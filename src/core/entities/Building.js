import { toImageUrl } from '../utils/mediaUrl.js';

// Mirrors building_model.dart / building_details.dart from the Flutter app
// (the "buildings"/flats side — apartments rented per flat, as opposed to
// whole chalets).
export class BuildingEntity {
    constructor(raw = {}) {
        this.id = raw.id ?? 0;
        this.type = 'building';
        this.nameAr = raw.nameAr ?? '';
        this.nameEn = raw.nameEn ?? '';
        this.name = this.nameEn || this.nameAr;
        this.descriptionAr = raw.buldingDescrptionAr ?? '';
        this.descriptionEn = raw.buldingDescrptionEn ?? '';
        this.description = this.descriptionEn || this.descriptionAr;
        this.additionalDetailsAr = raw.additional_detailsAr ?? '';
        this.additionalDetailsEn = raw.additional_detailsEn ?? '';
        this.state = raw.state ?? '';
        this.governorate = raw.gouvernate ?? '';
        this.location = raw.location ?? '';
        this.lat = raw.lat ?? '';
        this.lng = raw.lng ?? '';
        this.minimumRent = raw.minimumRent ?? '';
        this.maxRent = raw.maxRent ?? '';
        // Building-level minimum stay (Flutter ground truth: building_details.dart
        // parses this from GetHotelBuildingData, then flats_view_widget.dart
        // copies it onto each Flat — individual flats don't carry their own
        // minDays). Enforced the same way as chalets' minDays in the booking flow.
        this.minDays = Number(raw.minDays ?? 0);
        // "Today's Offer" — same feature as chalets, see TODAY-OFFER-API-SPEC.md.
        // Buildings use a single todayOfferPercent off minimumRent (no
        // full/half-day split — flat booking is always full-day already).
        this.todayOfferEnabled = Boolean(raw.todayOfferEnabled);
        this.todayOfferPercent = Number(raw.todayOfferPercent ?? 0);
        this.todayOfferTriggerHour = Number(raw.todayOfferTriggerHour ?? 12);
        this.todayOfferActive = Boolean(raw.todayOfferActive);
        this.totalFloor = Number(raw.totalFloor ?? 0);
        this.totalFlats = Number(raw.totalFlats ?? 0);
        this.image = toImageUrl(raw.coverimg ?? '');
        this.images = (raw.buldingImages || []).map((img) => toImageUrl(img.path || img.url || img));
        this.services = (raw.buldingService || []).map((s) => s.serviceName || s);
        this.isExclusive = Boolean(raw.isExclusive);
        this.isActive = raw.isActive ?? true;
        // Confirmed present on the real GetHotelBuildingData response
        // (owner-paused flag, same meaning as ChaletEntity.stopBook) —
        // PropertyCard.jsx used to assume this was chalet-only.
        this.stopBook = Boolean(raw.stopBook);
        this.checkIn = raw.check_In ?? '14:00:00';
        this.checkOut = raw.check_Out ?? '11:00:00';
        this.buildingPolicyAr = raw.buildingPolicyAr ?? '';
        this.buildingPolicyEn = raw.buildingPolicyEn ?? '';
        this.cancellationPolicyAr = raw.cancelation_policyAr ?? '';
        this.cancellationPolicyEn = raw.cancelation_policyEn ?? '';
        this.managementPhone = raw.managmentPhone ?? '';
        this.workerPhone = raw.workerPhone ?? '';
        this.onlinePay = Boolean(raw.onlinePay);
        this.acceptDownPay = Boolean(raw.acceptDownPay);
        this.raw = raw;
    }
}
