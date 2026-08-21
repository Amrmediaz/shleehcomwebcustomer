import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import './BookingPage.css';

export default function BookingSuccessPage() {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { bookingId, isChalet } = location.state || {};

    if (!bookingId) {
        return (
            <div className="container booking-page">
                <div className="card" style={{ textAlign: 'center' }}>
                    <p>{t('no_bookings')}</p>
                    <Link className="btn btn-primary" to="/">{t('back_to_home')}</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container booking-page">
            <div className="card" style={{ textAlign: 'center' }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: 56, color: 'var(--color-success)', marginBottom: 16 }}></i>
                <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>{t('booking_success_title')}</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 20 }}>{t('booking_success_desc')}</p>
                <p style={{ fontSize: 14, marginBottom: 26 }}>
                    <strong>{t('booking_id')}:</strong> #{bookingId}
                </p>
                <button
                    className="btn btn-primary btn-block"
                    // replace: true — once the user moves on to pay, this
                    // confirmation screen shouldn't reappear via Back.
                    onClick={() => navigate('/booking/pay', { state: { bookingId, isChalet }, replace: true })}
                >
                    {t('proceed_to_payment')}
                </button>
                <Link to="/" style={{ display: 'block', marginTop: 16, fontSize: 13.5, color: 'var(--color-text-secondary)' }}>
                    {t('back_to_home')}
                </Link>
            </div>
        </div>
    );
}
