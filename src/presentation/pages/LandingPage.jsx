import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { GetChaletsUseCase } from '../../core/useCases/ChaletUseCases.js';
import { GetBuildingsUseCase } from '../../core/useCases/BuildingUseCases.js';
import PropertyCard from '../components/Property/PropertyCard.jsx';
import { PropertyGridSkeleton } from '../components/Property/PropertyCardSkeleton.jsx';
import { ErrorState } from '../components/Property/StateViews.jsx';
import { WILAYATS_AR } from '../../core/utils/constants.js';
import './LandingPage.css';

const POPULAR_WILAYATS = ['Salalah', 'Mirbat', 'Taqah'];

// "Featured" used to just mean "whatever the API happened to return first"
// (a plain .slice(0, 4)) — not actually featured by any real measure, which
// is exactly why it read as meaningless. This makes it mean something: the
// highest-rated available properties, sold-out chalets excluded (no point
// featuring something that can't be booked right now).
function pickFeatured(items) {
    return [...items]
        .filter((i) => !i.stopBook)
        .sort((a, b) => (Number(b.rateAverage) || 0) - (Number(a.rateAverage) || 0))
        .slice(0, 4);
}

export default function LandingPage() {
    const { t, lang } = useTranslation();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [chalets, setChalets] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [status, setStatus] = useState('loading');

    const load = async () => {
        setStatus('loading');
        try {
            const [c, b] = await Promise.all([
                GetChaletsUseCase.execute(),
                GetBuildingsUseCase.execute(),
            ]);
            setChalets(pickFeatured(c));
            setBuildings(pickFeatured(b));
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/chalets?q=${encodeURIComponent(search)}`);
    };

    return (
        <div className="landing-page">
            <section className="hero">
                <div className="hero-pattern"></div>
                <div className="container hero-inner">
                    <h1>{t('hero_title')}</h1>
                    <p>{t('hero_subtitle')}</p>
                    <form className="hero-search" onSubmit={handleSearch}>
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">{t('nav_chalets')}</button>
                    </form>
                    <div className="hero-cta-row">
                        <Link to="/chalets" className="btn btn-primary">{t('hero_cta_chalets')}</Link>
                        <Link to="/buildings" className="btn btn-outline hero-cta-outline">{t('hero_cta_buildings')}</Link>
                    </div>
                    <div className="hero-chips">
                        <span>{t('popular_destinations')}</span>
                        {POPULAR_WILAYATS.map((w) => (
                            <Link key={w} to={`/chalets?state=${encodeURIComponent(w)}`} className="hero-chip">
                                <i className="fa-solid fa-location-dot"></i> {lang === 'ar' ? WILAYATS_AR[w] : w}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="hero-wave">
                    <svg viewBox="0 0 1440 64" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0,32 C240,64 480,0 720,16 C960,32 1200,64 1440,32 L1440,64 L0,64 Z" fill="var(--color-bg-secondary)"></path>
                    </svg>
                </div>
            </section>

            <section className="container section-block">
                <div className="section-heading-row">
                    <div>
                        <h2 className="section-title">{t('featured_chalets')}</h2>
                    </div>
                    <Link to="/chalets" className="view-all-link">{t('view_all')} <i className="fa-solid fa-arrow-right"></i></Link>
                </div>
                {status === 'loading' && <PropertyGridSkeleton />}
                {status === 'error' && <ErrorState onRetry={load} />}
                {status === 'ready' && (
                    <div className="property-grid">
                        {chalets.map((c) => <PropertyCard key={c.id} item={c} />)}
                    </div>
                )}
            </section>

            <section className="container section-block">
                <div className="section-heading-row">
                    <div>
                        <h2 className="section-title">{t('featured_buildings')}</h2>
                    </div>
                    <Link to="/buildings" className="view-all-link">{t('view_all')} <i className="fa-solid fa-arrow-right"></i></Link>
                </div>
                {status === 'loading' && <PropertyGridSkeleton />}
                {status === 'ready' && (
                    <div className="property-grid">
                        {buildings.map((b) => <PropertyCard key={b.id} item={b} />)}
                    </div>
                )}
            </section>

            <section className="container section-block how-section">
                <h2 className="section-title section-title-center">{t('how_it_works')}</h2>
                <div className="how-steps">
                    <div className="how-step">
                        <div className="how-step-num">1</div>
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <h3>{t('how_step1_title')}</h3>
                        <p>{t('how_step1_desc')}</p>
                    </div>
                    <div className="how-step-connector"></div>
                    <div className="how-step">
                        <div className="how-step-num">2</div>
                        <i className="fa-solid fa-calendar-check"></i>
                        <h3>{t('how_step2_title')}</h3>
                        <p>{t('how_step2_desc')}</p>
                    </div>
                    <div className="how-step-connector"></div>
                    <div className="how-step">
                        <div className="how-step-num">3</div>
                        <i className="fa-solid fa-house-circle-check"></i>
                        <h3>{t('how_step3_title')}</h3>
                        <p>{t('how_step3_desc')}</p>
                    </div>
                </div>
            </section>

            <section className="why-section">
                <div className="container">
                    <h2 className="section-title section-title-center">{t('why_shleeh')}</h2>
                    <div className="why-grid">
                        <div className="why-card">
                            <i className="fa-solid fa-bolt"></i>
                            <h3>{t('why_instant_title')}</h3>
                            <p>{t('why_instant_desc')}</p>
                        </div>
                        <div className="why-card">
                            <i className="fa-solid fa-circle-check"></i>
                            <h3>{t('why_verified_title')}</h3>
                            <p>{t('why_verified_desc')}</p>
                        </div>
                        <div className="why-card">
                            <i className="fa-solid fa-headset"></i>
                            <h3>{t('why_support_title')}</h3>
                            <p>{t('why_support_desc')}</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
