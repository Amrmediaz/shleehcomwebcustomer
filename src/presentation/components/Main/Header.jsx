import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './Header.css';

export default function Header() {
    const { t, toggleLanguage } = useTranslation();
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate('/');
    };

    return (
        <header className="site-header">
            <div className="container site-header-inner">
                <Link to="/" className="site-logo" onClick={() => setMenuOpen(false)}>
                    <i className="fa-solid fa-house-chimney"></i>
                    {t('site_name')}
                </Link>

                <nav className={`site-nav ${menuOpen ? 'open' : ''}`}>
                    <NavLink to="/chalets" onClick={() => setMenuOpen(false)}>{t('nav_chalets')}</NavLink>
                    <NavLink to="/buildings" onClick={() => setMenuOpen(false)}>{t('nav_buildings')}</NavLink>
                    <NavLink to="/favorites" onClick={() => setMenuOpen(false)}>{t('nav_favorites')}</NavLink>
                    {isAuthenticated && (
                        <NavLink to="/my-bookings" onClick={() => setMenuOpen(false)}>{t('nav_bookings')}</NavLink>
                    )}
                    {isAuthenticated && (
                        <NavLink to="/profile" onClick={() => setMenuOpen(false)}>{t('nav_profile')}</NavLink>
                    )}
                    <div className="site-nav-mobile-actions">
                        <button className="lang-toggle" onClick={toggleLanguage}>
                            <i className="fa-solid fa-globe"></i> {t('switch_language')}
                        </button>
                        {isAuthenticated ? (
                            <button className="btn btn-outline btn-block" onClick={handleLogout}>{t('nav_logout')}</button>
                        ) : (
                            <>
                                <Link className="btn btn-outline btn-block" to="/login" onClick={() => setMenuOpen(false)}>{t('nav_login')}</Link>
                                <Link className="btn btn-primary btn-block" to="/register" onClick={() => setMenuOpen(false)}>{t('nav_register')}</Link>
                            </>
                        )}
                    </div>
                </nav>

                <div className="site-header-actions">
                    <button className="lang-toggle" onClick={toggleLanguage}>
                        <i className="fa-solid fa-globe"></i> {t('switch_language')}
                    </button>
                    {isAuthenticated ? (
                        <>
                            <Link className="btn btn-outline" to="/profile"><i className="fa-solid fa-user"></i> {t('nav_profile')}</Link>
                            <button className="btn btn-outline" onClick={handleLogout}>{t('nav_logout')}</button>
                        </>
                    ) : (
                        <>
                            <Link className="btn btn-outline" to="/login">{t('nav_login')}</Link>
                            <Link className="btn btn-primary" to="/register">{t('nav_register')}</Link>
                        </>
                    )}
                </div>

                <button className="menu-toggle" aria-label="Menu" onClick={() => setMenuOpen((o) => !o)}>
                    <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
                </button>
            </div>
        </header>
    );
}
