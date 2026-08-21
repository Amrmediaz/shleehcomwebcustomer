import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
    CheckUserExistsUseCase, SendOtpUseCase, RegisterUseCase, GetProfileUseCase,
} from '../../core/useCases/AuthUseCases.js';
import { isValidOmaniPhone, isValidPassword, isValidEmail } from '../../core/utils/validators.js';
import './AuthLayout.css';

function generateOtp() {
    return String(Math.floor(1000 + Math.random() * 9000));
}

export default function RegisterPage() {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from || '/';

    const [step, setStep] = useState('form'); // form | otp
    const [fields, setFields] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [otp, setOtp] = useState('');
    const [pendingOtp, setPendingOtp] = useState('');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);

    const setField = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

    const validateForm = () => {
        const e = {};
        if (!fields.firstName.trim()) e.firstName = t('required_field');
        if (!fields.lastName.trim()) e.lastName = t('required_field');
        if (!isValidEmail(fields.email)) e.email = t('required_field');
        if (!isValidOmaniPhone(fields.phone)) e.phone = t('required_field');
        if (!isValidPassword(fields.password)) e.password = t('required_field');
        if (fields.confirmPassword !== fields.password) e.confirmPassword = t('required_field');
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSendOtp = async (ev) => {
        ev.preventDefault();
        setServerError('');
        if (!validateForm()) return;
        setLoading(true);
        try {
            const exists = await CheckUserExistsUseCase.execute(fields.phone);
            if (exists) {
                setServerError(t('phone_already_used'));
                return;
            }
            const code = generateOtp();
            setPendingOtp(code);
            await SendOtpUseCase.execute(`968${fields.phone}`, code);
            setStep('otp');
        } catch {
            setServerError(t('server_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndRegister = async (ev) => {
        ev.preventDefault();
        setServerError('');
        if (otp !== pendingOtp) {
            setServerError(t('invalid_otp'));
            return;
        }
        setLoading(true);
        try {
            const { token } = await RegisterUseCase.execute({
                firstName: fields.firstName,
                lastName: fields.lastName,
                email: fields.email,
                phone: `968${fields.phone}`,
                password: fields.password,
            });
            if (!token) throw new Error('register_failed');
            login(token, null);
            try {
                const profile = await GetProfileUseCase.execute();
                if (profile) login(token, profile);
            } catch { /* best-effort */ }
            navigate(redirectTo, { replace: true });
        } catch {
            setServerError(t('server_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="card auth-card">
                <h1>{t('register_title')}</h1>
                <p className="section-subtitle">{t('register_subtitle')}</p>
                {serverError && <div className="form-banner-error">{serverError}</div>}

                {step === 'form' && (
                    <form onSubmit={handleSendOtp} noValidate>
                        <div className="form-group">
                            <label className="form-label">{t('first_name')}</label>
                            <input className="form-input" value={fields.firstName} onChange={setField('firstName')} />
                            {errors.firstName && <div className="form-error">{errors.firstName}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('last_name')}</label>
                            <input className="form-input" value={fields.lastName} onChange={setField('lastName')} />
                            {errors.lastName && <div className="form-error">{errors.lastName}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('email_address')}</label>
                            <input className="form-input" type="email" value={fields.email} onChange={setField('email')} />
                            {errors.email && <div className="form-error">{errors.email}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('phone_number')}</label>
                            <input className="form-input" type="tel" placeholder="9xxxxxxx" value={fields.phone} onChange={setField('phone')} />
                            {errors.phone && <div className="form-error">{errors.phone}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('password')}</label>
                            <input className="form-input" type="password" value={fields.password} onChange={setField('password')} />
                            {errors.password && <div className="form-error">{errors.password}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('confirm_password')}</label>
                            <input className="form-input" type="password" value={fields.confirmPassword} onChange={setField('confirmPassword')} />
                            {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                        </div>
                        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                            {loading ? <span className="spinner" /> : t('send_otp')}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form onSubmit={handleVerifyAndRegister} noValidate>
                        <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                            {t('otp_sent_to')} 968{fields.phone}
                        </p>
                        <div className="form-group">
                            <label className="form-label">{t('otp_code')}</label>
                            <input className="form-input" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} />
                        </div>
                        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                            {loading ? <span className="spinner" /> : t('verify_and_continue')}
                        </button>
                    </form>
                )}

                <div className="auth-switch">
                    {t('have_account')} <Link to="/login" state={location.state}>{t('login_link')}</Link>
                </div>
            </div>
        </div>
    );
}
