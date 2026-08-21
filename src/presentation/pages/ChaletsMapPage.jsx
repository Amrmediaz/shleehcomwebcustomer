import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { GetChaletsMapUseCase } from '../../core/useCases/ChaletUseCases.js';
import MapView from '../components/Property/MapView.jsx';
import { LoadingState, ErrorState } from '../components/Property/StateViews.jsx';
import './MapPage.css';

export default function ChaletsMapPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const highlightId = searchParams.get('highlight');
    const [markers, setMarkers] = useState([]);
    const [status, setStatus] = useState('loading');

    const load = async () => {
        setStatus('loading');
        try {
            const data = await GetChaletsMapUseCase.execute();
            setMarkers(data);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="container">
            <div className="map-page-header">
                <h1 className="section-title">{t('chalets_map_title')}</h1>
            </div>
            {status === 'loading' && <LoadingState />}
            {status === 'error' && <ErrorState onRetry={load} message={t('map_load_error')} />}
            {status === 'ready' && (
                <div className="map-page-canvas">
                    <MapView markers={markers} basePath="/chalets" highlightId={highlightId} />
                </div>
            )}
        </div>
    );
}
