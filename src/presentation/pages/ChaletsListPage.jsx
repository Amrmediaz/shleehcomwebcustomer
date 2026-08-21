import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { GetChaletsPagedUseCase } from '../../core/useCases/ChaletUseCases.js';
import PropertyCard from '../components/Property/PropertyCard.jsx';
import { PropertyGridSkeleton } from '../components/Property/PropertyCardSkeleton.jsx';
import FilterBar from '../components/Property/FilterBar.jsx';
import { ErrorState, EmptyState } from '../components/Property/StateViews.jsx';
import './ListPage.css';

const PAGE_SIZE = 20;

export default function ChaletsListPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const initialWilayat = searchParams.get('state') || '';
    const [all, setAll] = useState([]);
    const [status, setStatus] = useState('loading');
    const [page, setPage] = useState(1);
    const [pageCount, setPageCount] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    // Sent straight through to /api/CustomerData/FilterBuildingListv2 (see
    // FilterBar.jsx's buildFilters()) — governorate/state/price/services/
    // chaletType/rate are all real server-side filters now, not client-side
    // ones. {} (not null) so GetChaletsPagedUseCase always takes the
    // filter() branch — both branches hit the same endpoint anyway
    // (chaletApiClient.list() posts to CHALETS_FILTER_URL too), so this
    // just means "always filter, even if the filter object happens to be
    // empty" instead of switching endpoints.
    const [filters, setFilters] = useState(initialWilayat ? { state: initialWilayat } : {});
    const [query, setQuery] = useState(searchParams.get('q') || '');

    // Debounce the search box before it hits the server — `name` is now a
    // real request field (see activeFilters below), not a client-side-only
    // filter, so every keystroke would otherwise fire a network request.
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    useEffect(() => {
        const id = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(id);
    }, [query]);

    const activeFilters = useMemo(
        () => (debouncedQuery ? { ...filters, name: debouncedQuery } : filters),
        [filters, debouncedQuery],
    );

    const load = async (pageNum) => {
        setStatus('loading');
        try {
            const { results, pageCount: pc } = await GetChaletsPagedUseCase.execute(activeFilters, pageNum, PAGE_SIZE);
            setAll(results);
            setPage(pageNum);
            setPageCount(pc);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    // Re-fetches page 1 from the server every time the filter bar, price
    // range, or search box changes. The endpoint is paged (10 results per
    // page by default) — fetching only page 1 here and never any page after
    // it used to mean anything past the first 10 matches was simply never
    // shown, no matter how many chalets actually matched. "Load more" below
    // fetches subsequent pages of the same filter set.
    useEffect(() => { load(1); }, [activeFilters]);

    const loadMore = async () => {
        setLoadingMore(true);
        try {
            const nextPage = page + 1;
            const { results, pageCount: pc } = await GetChaletsPagedUseCase.execute(activeFilters, nextPage, PAGE_SIZE);
            setAll((prev) => [...prev, ...results]);
            setPage(nextPage);
            setPageCount(pc);
        } catch {
            // Leave the list as-is on failure — the button stays put so the
            // guest can just press it again.
        } finally {
            setLoadingMore(false);
        }
    };

    // "Today's Offer" items float to the top of every browse list, not
    // just the homepage section — see TODAY-OFFER-API-SPEC.md's "Sort
    // order on the list endpoints". Backend will eventually do this sort
    // itself; doing it client-side too costs nothing and means it works
    // immediately regardless of API sort order.
    const sorted = useMemo(
        () => [...all].sort((a, b) => (b.todayOfferActive ? 1 : 0) - (a.todayOfferActive ? 1 : 0)),
        [all],
    );

    return (
        <div className="container list-page">
            <div className="section-heading-row">
                <div>
                    <h1 className="section-title">{t('chalets')}</h1>
                    <p className="section-subtitle">{t('hero_subtitle')}</p>
                </div>
                <Link to="/chalets/map" className="view-all-link">
                    <i className="fa-solid fa-map-location-dot"></i> {t('map_view')}
                </Link>
            </div>

            <div className="form-group" style={{ maxWidth: 360, marginBottom: 20 }}>
                <input
                    className="form-input"
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <FilterBar initialWilayat={initialWilayat} onApply={setFilters} onClear={() => setFilters({})} />

            {status === 'loading' && <PropertyGridSkeleton />}
            {status === 'error' && <ErrorState onRetry={() => load(1)} />}
            {status === 'ready' && sorted.length === 0 && <EmptyState text={t('no_chalets')} />}
            {status === 'ready' && sorted.length > 0 && (
                <>
                    <div className="property-grid">
                        {sorted.map((c) => <PropertyCard key={c.id} item={c} />)}
                    </div>
                    {page < pageCount && (
                        <div className="list-load-more">
                            <button className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
                                {loadingMore ? '…' : t('load_more')}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
