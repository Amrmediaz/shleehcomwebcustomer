import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { ResetPasswordUseCase } from '../../core/useCases/AuthUseCases.js';
import { isValidOmaniPhone } from '../../core/utils/validators.js';
import './AuthLayout.css';

export default function ResetPasswordPage() {
    const { t } = useTranslation();
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!isValidOmaniPhone(phone)) {
            setError(t('required_field'));
            return;
        }
        setLoading(true);
        try {
            await ResetPasswordUseCase.execute(`968${phone}`);
            setSuccess(true);
        } catch {
            setError(t('server_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="card auth-card">
                <h1>{t('reset_password_title')}</h1>
                <p className="section-subtitle">{t('reset_password_subtitle')}</p>
                {error && <div className="form-banner-error">{error}</div>}
                {success ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-success)' }}>{t('reset_password_success')}</p>
                ) : (
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label className="form-label">{t('phone_number')}</label>
                            <input className="form-input" type="tel" placeholder="9xxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                            {loading ? <span className="spinner" /> : t('reset_password_button')}
                        </button>
                    </form>
                )}
                <div className="auth-switch">
                    <Link to="/login">{t('login_link')}</Link>
                </div>
            </div>
        </div>
    );
}
