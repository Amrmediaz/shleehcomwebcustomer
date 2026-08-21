import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { LoginUseCase, GetProfileUseCase } from '../../core/useCases/AuthUseCases.js';
import { isValidOmaniPhone } from '../../core/utils/validators.js';
import './AuthLayout.css';

export default function LoginPage() {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    // If we got here from a "book now" flow, land back on that exact page
    // (dates included) instead of the homepage — the whole point of
    // letting guests browse/select dates first is to not lose that work.
    const redirectTo = location.state?.from || '/';
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const e = {};
        if (!isValidOmaniPhone(phone)) e.phone = t('required_field');
        if (!password) e.password = t('required_field');
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        setServerError('');
        if (!validate()) return;
        setLoading(true);
        try {
            const { token } = await LoginUseCase.execute(`968${phone}`, password);
            if (!token) throw new Error(t('invalid_credentials'));
            login(token, null);
            try {
                const profile = await GetProfileUseCase.execute();
                if (profile) login(token, profile);
            } catch { /* profile fetch best-effort */ }
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setServerError(err.message === 'Server connection error' ? t('server_error') : t('invalid_credentials'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="card auth-card">
                <h1>{t('login_title')}</h1>
                <p className="section-subtitle">{t('login_subtitle')}</p>
                {serverError && <div className="form-banner-error">{serverError}</div>}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label className="form-label">{t('username_or_phone')}</label>
                        <input
                            className="form-input"
                            type="tel"
                            placeholder="9xxxxxxx"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        {errors.phone && <div className="form-error">{errors.phone}</div>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('password')}</label>
                        <input
                            className="form-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {errors.password && <div className="form-error">{errors.password}</div>}
                    </div>
                    <div className="auth-forgot">
                        <Link to="/reset-password">{t('forgot_password')}</Link>
                    </div>
                    <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                        {loading ? <span className="spinner" /> : t('login_button')}
                    </button>
                </form>
                <div className="auth-switch">
                    {t('no_account')} <Link to="/register" state={location.state}>{t('register_link')}</Link>
                </div>
            </div>
        </div>
    );
}
