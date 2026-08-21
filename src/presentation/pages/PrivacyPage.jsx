import { useTranslation } from '../context/LanguageContext.jsx';
import { PRIVACY_URL } from '../../core/utils/externalLinks.js';
import './PrivacyPage.css';

export default function PrivacyPage() {
    const { t } = useTranslation();

    return (
        <div className="container privacy-page">
            <div className="privacy-page-header">
                <h1 className="section-title">{t('privacy_title')}</h1>
                <a className="btn btn-outline" href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> {t('privacy_open_new_tab')}
                </a>
            </div>
            <div className="privacy-frame-wrap">
                <iframe src={PRIVACY_URL} title={t('privacy_title')} />
            </div>
            <p className="privacy-note">{t('privacy_load_note')}</p>
        </div>
    );
}
