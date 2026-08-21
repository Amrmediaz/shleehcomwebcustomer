import { useTranslation } from '../../context/LanguageContext.jsx';

export function LoadingState() {
    const { t } = useTranslation();
    return (
        <div className="state-message">
            <div className="spinner" style={{ margin: '0 auto 14px' }} />
            {t('loading')}
        </div>
    );
}

export function ErrorState({ onRetry, message }) {
    const { t } = useTranslation();
    return (
        <div className="state-message">
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 28, color: 'var(--color-danger)', marginBottom: 10 }}></i>
            <p>{message || t('error_loading')}</p>
            {onRetry && <button className="btn btn-outline" onClick={onRetry}>{t('retry')}</button>}
        </div>
    );
}

export function EmptyState({ text }) {
    return (
        <div className="state-message">
            <i className="fa-regular fa-folder-open" style={{ fontSize: 28, color: 'var(--color-text-muted)', marginBottom: 10 }}></i>
            <p>{text}</p>
        </div>
    );
}
