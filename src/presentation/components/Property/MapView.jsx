import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { getDisplayName } from '../../../core/utils/constants.js';

// Leaflet's default marker icon references image files by URL that Vite
// doesn't resolve automatically — point them at a CDN so pins render.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Salalah, Dhofar — Shleeh currently only operates in this governorate,
// so it's a sensible default center when nothing is highlighted.
const DEFAULT_CENTER = [17.0151, 54.0924];

export default function MapView({ markers, basePath, highlightId }) {
    const { t, lang } = useTranslation();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        mapRef.current = L.map(containerRef.current).setView(DEFAULT_CENTER, 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(mapRef.current);
        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const layerGroup = L.layerGroup().addTo(map);
        const validMarkers = (markers || []).filter((m) => m.lat && m.lng);

        validMarkers.forEach((m) => {
            const marker = L.marker([Number(m.lat), Number(m.lng)]).addTo(layerGroup);
            const popupNode = document.createElement('div');
            popupNode.innerHTML = `<strong>${getDisplayName(m, lang)}</strong><br/><a href="#" style="color:var(--color-primary)">${t('view_details')}</a>`;
            popupNode.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault();
                navigate(`${basePath}/${m.id}`);
            });
            marker.bindPopup(popupNode);
            if (String(m.id) === String(highlightId)) {
                marker.openPopup();
            }
        });

        if (highlightId) {
            const target = validMarkers.find((m) => String(m.id) === String(highlightId));
            if (target) map.setView([Number(target.lat), Number(target.lng)], 14);
        } else if (validMarkers.length > 0) {
            const bounds = L.latLngBounds(validMarkers.map((m) => [Number(m.lat), Number(m.lng)]));
            map.fitBounds(bounds, { padding: [40, 40] });
        }

        return () => layerGroup.remove();
    }, [markers, highlightId, basePath, navigate, t, lang]);

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
