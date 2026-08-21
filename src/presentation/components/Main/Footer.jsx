import { Link } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import './Footer.css';

export default function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="site-footer">
            <div className="container site-footer-inner">
                <div className="site-logo">
                    <i className="fa-solid fa-house-chimney"></i> {t('site_name')}
                </div>
                <nav className="site-footer-nav">
                    <Link to="/chalets">{t('nav_chalets')}</Link>
                    <Link to="/buildings">{t('nav_buildings')}</Link>
                    <Link to="/privacy">{t('privacy_title')}</Link>
                    <Link to="/login">{t('nav_login')}</Link>
                </nav>
                <div className="site-footer-copy">© {new Date().getFullYear()} {t('site_name')}. {t('footer_rights')}</div>
            </div>
        </footer>
    );
}
