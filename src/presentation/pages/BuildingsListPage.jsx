import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { GetBuildingsUseCase } from '../../core/useCases/BuildingUseCases.js';
import PropertyCard from '../components/Property/PropertyCard.jsx';
import { PropertyGridSkeleton } from '../components/Property/PropertyCardSkeleton.jsx';
import FilterBar from '../components/Property/FilterBar.jsx';
import { ErrorState, EmptyState } from '../components/Property/StateViews.jsx';
import './ListPage.css';

export default function BuildingsListPage() {
    const { t } = useTranslation();
    const [all, setAll] = useState([]);
    const [status, setStatus] = useState('loading');
    const [filters, setFilters] = useState(null);

    const load = async () => {
        setStatus('loading');
        try {
            const data = await GetBuildingsUseCase.execute();
            setAll(data);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        return all.filter((b) => {
            if (filters?.governorate && b.governorate !== filters.governorate) return false;
            if (filters?.state && b.state !== filters.state) return false;
            const min = Number(b.minimumRent) || 0;
            // Field names match what FilterBar.jsx now emits (fromPrice/
            // toPrice, matching the real chalets filter schema) — buildings
            // don't have a confirmed filter endpoint of their own yet, so
            // this stays client-side, just with the corrected key names.
            if (filters?.fromPrice && min < Number(filters.fromPrice)) return false;
            if (filters?.toPrice && min > Number(filters.toPrice)) return false;
            // serviesList: require every selected service to be present —
            // BuildingEntity.services is a real parsed array, unlike
            // rateAverage below, so this one's safe to actually apply.
            if (filters?.serviesList?.length && !filters.serviesList.every((s) => b.services.includes(s))) return false;
            return true;
        // Same "Today's Offer" top-sort as ChaletsListPage — see
        // TODAY-OFFER-API-SPEC.md.
        }).sort((a, b2) => (b2.todayOfferActive ? 1 : 0) - (a.todayOfferActive ? 1 : 0));
    }, [all, filters]);

    return (
        <div className="container list-page">
            <div className="section-heading-row">
                <div>
                    <h1 className="section-title">{t('buildings')}</h1>
                    <p className="section-subtitle">{t('hero_subtitle')}</p>
                </div>
                <Link to="/buildings/map" className="view-all-link">
                    <i className="fa-solid fa-map-location-dot"></i> {t('map_view')}
                </Link>
            </div>

            {/* No chaletType/capacity/bedrooms/etc facts on buildings — hide
                the chalet-only fields so the filter bar never shows a
                control that can't actually do anything. */}
            <FilterBar onApply={setFilters} onClear={() => setFilters(null)} showChaletFields={false} />

            {status === 'loading' && <PropertyGridSkeleton />}
            {status === 'error' && <ErrorState onRetry={load} />}
            {status === 'ready' && filtered.length === 0 && <EmptyState text={t('no_buildings')} />}
            {status === 'ready' && filtered.length > 0 && (
                <div className="property-grid">
                    {filtered.map((b) => <PropertyCard key={b.id} item={b} />)}
                </div>
            )}
        </div>
    );
}
