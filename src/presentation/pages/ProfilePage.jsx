import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { GetProfileUseCase, UpdateProfileUseCase, DeleteAccountUseCase } from '../../core/useCases/AuthUseCases.js';
import { LoadingState, ErrorState } from '../components/Property/StateViews.jsx';
import './ProfilePage.css';

export default function ProfilePage() {
    const { t } = useTranslation();
    const { profile, token, login, logout } = useAuth();
    const navigate = useNavigate();

    const [userProfile, setUserProfile] = useState(profile);
    const [status, setStatus] = useState(profile ? 'ready' : 'loading');
    const [firstName, setFirstName] = useState(profile?.firstName || '');
    const [lastName, setLastName] = useState(profile?.lastName || '');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const load = async () => {
        setStatus('loading');
        try {
            const p = await GetProfileUseCase.execute();
            if (!p) { setStatus('error'); return; }
            setUserProfile(p);
            setFirstName(p.firstName || '');
            setLastName(p.lastName || '');
            login(token, p);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => {
        if (!profile) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaveError('');
        setSaveSuccess(false);
        setSaving(true);
        try {
            await UpdateProfileUseCase.execute({
                id: userProfile.id,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                points: userProfile.raw?.points ?? 0,
            });
            const updated = { ...userProfile, firstName: firstName.trim(), lastName: lastName.trim() };
            setUserProfile(updated);
            login(token, updated);
            setSaveSuccess(true);
        } catch {
            setSaveError(t('profile_update_error'));
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm(`${t('logout_confirm_title')}\n${t('logout_confirm_desc')}`)) {
            logout();
            navigate('/');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`${t('delete_account_confirm_title')}\n${t('delete_account_confirm_desc')}`)) return;
        setDeleteError('');
        setDeleting(true);
        try {
            await DeleteAccountUseCase.execute(userProfile.id);
            logout();
            navigate('/');
        } catch {
            setDeleteError(t('delete_account_error'));
        } finally {
            setDeleting(false);
        }
    };

    if (status === 'loading') return <div className="container profile-page"><LoadingState /></div>;
    if (status === 'error' || !userProfile) return <div className="container profile-page"><ErrorState onRetry={load} /></div>;

    return (
        <div className="container profile-page">
            <h1>{t('profile_title')}</h1>

            <div className="card">
                <h2>{t('account_info')}</h2>
                <div className="profile-static-row">
                    <span>{t('phone_number')}</span>
                    <span>{userProfile.phone || '—'}</span>
                </div>
                <div className="profile-static-row" style={{ marginBottom: 18 }}>
                    <span>{t('email_address')}</span>
                    <span>{userProfile.email || '—'}</span>
                </div>

                {saveSuccess && <div className="form-success">{t('profile_update_success')}</div>}
                {saveError && <div className="form-banner-error">{saveError}</div>}

                <form onSubmit={handleSave} noValidate>
                    <div className="form-group">
                        <label className="form-label">{t('first_name')}</label>
                        <input className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('last_name')}</label>
                        <input className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={saving}>
                        {saving ? <span className="spinner" /> : t('save_changes')}
                    </button>
                </form>
            </div>

            <div className="card">
                <button className="btn btn-outline btn-block" onClick={handleLogout}>{t('nav_logout')}</button>
            </div>

            <div className="card danger-card">
                <h2>{t('danger_zone')}</h2>
                <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', margin: '4px 0 16px' }}>{t('delete_account_desc')}</p>
                {deleteError && <div className="form-banner-error">{deleteError}</div>}
                <button
                    className="btn btn-block"
                    style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
                    onClick={handleDelete}
                    disabled={deleting}
                >
                    {deleting ? <span className="spinner" /> : t('delete_account')}
                </button>
            </div>
        </div>
    );
}
