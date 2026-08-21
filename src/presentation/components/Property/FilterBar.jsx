import { useMemo, useState } from 'react';
import { useTranslation } from '../../context/LanguageContext.jsx';
import {
    GOVERNORATES, GOVERNORATES_AR, WILAYATS, WILAYATS_AR,
    CHALET_SERVICES, BUILDING_SERVICES, getServiceLabel, PROPERTY_TYPES,
} from '../../../core/utils/constants.js';
import DateRangeCalendar from '../Booking/DateRangeCalendar.jsx';
import './FilterBar.css';

// startDate/endDate are "YYYY-MM-DD" (DateRangeCalendar's own key format,
// always UTC-midnight-safe) — format for display without any local
// timezone drift.
function formatDateLabel(dateKey, lang) {
    const d = new Date(dateKey);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
}

// Builds the request body sent straight to /api/CustomerData/FilterBuildingListv2
// (see chaletApiClient.js's filter()) — keys here must match that schema
// exactly (fromPrice/toPrice/serviesList/chaletType, not the UI's own state
// names), and only ever include keys the guest actually set, so an
// empty/default value never gets sent as an explicit filter.
//
// landscape/bestSeason are deliberately NOT filterable here — the web owner
// panel sends clean English keys ('coastal', 'winter', ...) for them, but
// the chaletowner mobile app sends full Arabic label text instead (see
// add_chalet.dart), so the same real field holds two incompatible formats
// depending on which app a listing was created/edited from. A dropdown
// filtering by the English keys would silently exclude every mobile-created
// listing. Re-enable once the mobile app is fixed to send the same keys.
function buildFilters({
    governorate, wilayat, minPrice, maxPrice, services, chaletType,
    capacity, bedrooms, bathrooms, livingRooms, area, startDate, endDate,
}) {
    const f = {};
    if (governorate) f.governorate = governorate;
    if (wilayat) f.state = wilayat;
    if (minPrice) f.fromPrice = Number(minPrice);
    if (maxPrice) f.toPrice = Number(maxPrice);
    if (services.length) f.serviesList = services;
    if (chaletType) f.chaletType = chaletType;
    // capacity/bedrooms/bathrooms/livingRooms/area are all free text on the
    // backend (owners enter them inconsistently — see parseDescription.js),
    // so the schema types them as plain strings, not numbers. Sent as-is,
    // trimmed.
    if (capacity) f.capacity = capacity.trim();
    if (bedrooms) f.bedrooms = bedrooms.trim();
    if (bathrooms) f.bathrooms = bathrooms.trim();
    if (livingRooms) f.livingRooms = livingRooms.trim();
    if (area) f.area = area.trim();
    // Mirrors the mobile app's filter screen exactly: startDate/endDate are
    // only ever sent as a pair (both or neither) — chaletApiClient.filter()
    // switches to the BuildingListWithDates endpoint the moment `endDate`
    // is present in the body, same as chalet_remote_data_source.dart does.
    // "YYYY-MM-DD" -> Date parses as UTC midnight -> toISOString() gives a
    // clean, timezone-independent "...T00:00:00.000Z", matching the format
    // used elsewhere in this app for day values sent to this same backend
    // (see buildPriceCalcPayload in dateRange.js).
    if (startDate && endDate) {
        f.startDate = new Date(startDate).toISOString();
        f.endDate = new Date(endDate).toISOString();
    }
    return f;
}

export default function FilterBar({ onApply, onClear, initialWilayat = '', showChaletFields = true }) {
    const { t, lang } = useTranslation();
    // Chalets and buildings have separate, mostly non-overlapping service
    // lists in the owner add/edit forms (AddChaletModal.jsx's `services` vs
    // AddBuildingModal.jsx's `amenities` — see constants.js) — showing a
    // service no listing of that type can ever have makes the chip
    // meaningless, so pick the right set for whichever page this is on.
    const serviceOptions = showChaletFields ? CHALET_SERVICES : BUILDING_SERVICES;
    const [governorate, setGovernorate] = useState('');
    const [wilayat, setWilayat] = useState(initialWilayat);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [services, setServices] = useState([]);
    const [chaletType, setChaletType] = useState('');
    const [capacity, setCapacity] = useState('');
    const [bedrooms, setBedrooms] = useState('');
    const [bathrooms, setBathrooms] = useState('');
    const [livingRooms, setLivingRooms] = useState('');
    const [area, setArea] = useState('');
    // "YYYY-MM-DD" strings (DateRangeCalendar's own key format) — chalets
    // only, matching the mobile app: the buildings filter screen there has
    // no date picker at all.
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [datesOpen, setDatesOpen] = useState(false);
    // Same rule the mobile app's filter calendar uses (firstDate: today+1)
    // — today itself isn't a pickable start day here either.
    const minDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);
    // Everything except governorate/price lives behind this popup now — the
    // bar itself only ever shows the two filters most people actually use,
    // so it doesn't turn into a wall of dropdowns on every browse page.
    const [showMore, setShowMore] = useState(false);

    const toggleService = (code) => {
        setServices((prev) => (prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]));
    };

    const handleDatesSelect = (start, end) => {
        setStartDate(start);
        setEndDate(end);
    };

    const handleApply = () => {
        onApply(buildFilters({
            governorate, wilayat, minPrice, maxPrice, services, chaletType,
            capacity, bedrooms, bathrooms, livingRooms, area, startDate, endDate,
        }));
        setShowMore(false);
    };
    const handleClear = () => {
        setGovernorate(''); setWilayat(''); setMinPrice(''); setMaxPrice('');
        setServices([]); setChaletType('');
        setCapacity(''); setBedrooms(''); setBathrooms(''); setLivingRooms(''); setArea('');
        setStartDate(''); setEndDate('');
        onClear();
        setShowMore(false);
    };

    // Drives the "More filters (2)" count badge — lets a guest tell at a
    // glance whether anything's set behind the popup without opening it.
    const moreCount = (wilayat ? 1 : 0) + (chaletType ? 1 : 0) + (services.length ? 1 : 0)
        + (capacity ? 1 : 0) + (bedrooms ? 1 : 0) + (bathrooms ? 1 : 0) + (livingRooms ? 1 : 0)
        + (area ? 1 : 0);

    return (
        <div className="filter-bar card">
            <div className="filter-row">
                <div className="form-group">
                    <label className="form-label">{t('governorate')}</label>
                    <select className="form-select" value={governorate} onChange={(e) => setGovernorate(e.target.value)}>
                        <option value="">{t('all_governorates')}</option>
                        {GOVERNORATES.map((g) => (
                            <option key={g} value={g}>{lang === 'ar' ? GOVERNORATES_AR[g] : g}</option>
                        ))}
                    </select>
                </div>
                {showChaletFields && (
                    <div className="form-group filter-field-dates">
                        <label className="form-label">{t('select_dates')}</label>
                        <button type="button" className="form-input filter-dates-btn" onClick={() => setDatesOpen(true)}>
                            <i className="fa-solid fa-calendar-days"></i>
                            {startDate && endDate
                                ? `${formatDateLabel(startDate, lang)}  –  ${formatDateLabel(endDate, lang)}`
                                : t('select_dates')}
                        </button>
                    </div>
                )}
                <div className="form-group filter-field-price">
                    <label className="form-label">{t('price_range')} ({t('omr')})</label>
                    <div className="price-range-inputs">
                        <input className="form-input" type="number" min="0" placeholder= {lang === 'ar' ? "الحد الأدنى" : "Min"} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                        <span>–</span>
                        <input className="form-input" type="number" min="0" placeholder={lang === 'ar' ? "الحد الأعلى" : "Max"} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                    </div>
                </div>
                <div className="filter-actions">
                    <button type="button" className="btn btn-outline filter-more-btn" onClick={() => setShowMore(true)}>
                        <i className="fa-solid fa-sliders"></i> {t('more_filters')}
                        {moreCount > 0 && <span className="filter-more-count">{moreCount}</span>}
                    </button>
                    <button className="btn btn-primary" onClick={handleApply}>{t('apply_filters')}</button>
                    <button className="btn btn-outline" onClick={handleClear}>{t('clear_filters')}</button>
                </div>
            </div>

            {showMore && (
                <div className="filter-more-overlay" onClick={() => setShowMore(false)}>
                    <div className="filter-more-modal" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="filter-more-close" onClick={() => setShowMore(false)} aria-label="Close">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <h3 className="filter-more-title">{t('more_filters')}</h3>

                        <div className="filter-more-grid">
                            <div className="form-group">
                                <label className="form-label">{t('wilayat')}</label>
                                <select className="form-select" value={wilayat} onChange={(e) => setWilayat(e.target.value)}>
                                    <option value="">{t('all_wilayats')}</option>
                                    {WILAYATS.map((w) => (
                                        <option key={w} value={w}>{lang === 'ar' ? WILAYATS_AR[w] : w}</option>
                                    ))}
                                </select>
                            </div>
                            {showChaletFields && (
                                <div className="form-group">
                                    <label className="form-label">{t('property_type')}</label>
                                    <select className="form-select" value={chaletType} onChange={(e) => setChaletType(e.target.value)}>
                                        <option value="">{t('all_types')}</option>
                                        {/* Value is always the English key, regardless
                                            of display language — sending the Arabic
                                            word as the filter value returned nothing,
                                            since listings' stored chaletType is
                                            predominantly English even when the UI is
                                            showing Arabic. Only the visible label
                                            switches with lang. */}
                                        {PROPERTY_TYPES.map((pt) => (
                                            <option key={pt.en} value={pt.en}>
                                                {lang === 'ar' ? pt.ar : pt.en}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {showChaletFields && (
                                <div className="form-group">
                                    <label className="form-label">{t('capacity')}</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0"
                                        placeholder={lang === 'ar' ? 'مثال: 6' : 'e.g. 6'}
                                        value={capacity}
                                        onChange={(e) => setCapacity(e.target.value)}
                                    />
                                </div>
                            )}
                            {showChaletFields && (
                                <div className="form-group">
                                    <label className="form-label">{t('bedrooms')}</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0"
                                        placeholder={lang === 'ar' ? 'مثال: 3' : 'e.g. 3'}
                                        value={bedrooms}
                                        onChange={(e) => setBedrooms(e.target.value)}
                                    />
                                </div>
                            )}
                            {showChaletFields && (
                                <div className="form-group">
                                    <label className="form-label">{t('bathrooms')}</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0"
                                        placeholder={lang === 'ar' ? 'مثال: 2' : 'e.g. 2'}
                                        value={bathrooms}
                                        onChange={(e) => setBathrooms(e.target.value)}
                                    />
                                </div>
                            )}
                            {showChaletFields && (
                                <div className="form-group">
                                    <label className="form-label">{t('living_rooms')}</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="0"
                                        placeholder={lang === 'ar' ? 'مثال: 1' : 'e.g. 1'}
                                        value={livingRooms}
                                        onChange={(e) => setLivingRooms(e.target.value)}
                                    />
                                </div>
                            )}
                            {/* landscape/bestSeason filters intentionally removed — see
                                the comment on buildFilters() above for why. */}
                            {showChaletFields && (
                                <div className="form-group">
                                    <label className="form-label">{t('area')}</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        placeholder={lang === 'ar' ? 'مثال: 200' : 'e.g. 200'}
                                        value={area}
                                        onChange={(e) => setArea(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="filter-services-row">
                            <span className="filter-services-label">{t('services')}</span>
                            <div className="filter-service-chips">
                                {serviceOptions.map((code) => (
                                    <button
                                        type="button"
                                        key={code}
                                        className={`filter-service-chip ${services.includes(code) ? 'active' : ''}`}
                                        onClick={() => toggleService(code)}
                                    >
                                        {getServiceLabel(code, lang)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-more-footer">
                            <button className="btn btn-primary btn-block" onClick={handleApply}>{t('apply_filters')}</button>
                            <button className="btn btn-outline btn-block" onClick={handleClear}>{t('clear_filters')}</button>
                        </div>
                    </div>
                </div>
            )}

            {datesOpen && (
                <div className="filter-more-overlay" onClick={() => setDatesOpen(false)}>
                    <div className="filter-more-modal filter-dates-modal" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="filter-more-close" onClick={() => setDatesOpen(false)} aria-label="Close">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                        <h3 className="filter-more-title">{t('select_dates')}</h3>
                        <DateRangeCalendar
                            startDate={startDate}
                            endDate={endDate}
                            onSelect={handleDatesSelect}
                            minDate={minDate}
                            hideLegend
                        />
                        <div className="filter-more-footer">
                            <button className="btn btn-primary btn-block" onClick={() => setDatesOpen(false)}>{t('confirm')}</button>
                            <button className="btn btn-outline btn-block" onClick={() => { setStartDate(''); setEndDate(''); }}>{t('clear_filters')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
