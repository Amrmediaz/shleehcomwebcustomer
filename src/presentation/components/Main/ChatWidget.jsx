import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { GetChaletDetailsUseCase } from '../../../core/useCases/ChaletUseCases.js';
import { GetBuildingDetailsUseCase } from '../../../core/useCases/BuildingUseCases.js';
import './ChatWidget.css';

// A "smart" chat widget that isn't actually AI — it's a decision tree of
// canned questions/answers, same category of thing as an IVR phone menu.
// What makes it feel smarter than a plain FAQ page is context: if the user
// has it open on a specific chalet/apartment page, answers are pulled from
// that property's real data (minDays, deposit policy, cancellation text,
// insurance amount) instead of generic copy. No LLM, no API cost, nothing
// running server-side — it's just JS reading data the site already fetches
// for the page itself.
const SUPPORT_PHONE = '96893866893';

// Matches exactly a chalet/building detail page (not /map, not /:id/book) —
// those are the only routes where we have one specific property in view.
function detectDetailRoute(pathname) {
    let m = pathname.match(/^\/chalets\/(\d+)$/);
    if (m) return { type: 'chalet', id: m[1] };
    m = pathname.match(/^\/buildings\/(\d+)$/);
    if (m) return { type: 'building', id: m[1] };
    return null;
}

export default function ChatWidget() {
    const { t, lang } = useTranslation();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [propertyCache, setPropertyCache] = useState({}); // keyed by "type:id"
    const [loadingAnswer, setLoadingAnswer] = useState(false);

    const detail = detectDetailRoute(location.pathname);

    const pushMessage = (msg) => setMessages((prev) => [...prev, msg]);

    const loadProperty = async () => {
        if (!detail) return null;
        const key = `${detail.type}:${detail.id}`;
        if (propertyCache[key]) return propertyCache[key];
        const item = detail.type === 'chalet'
            ? await GetChaletDetailsUseCase.execute(detail.id)
            : await GetBuildingDetailsUseCase.execute(detail.id);
        if (item) setPropertyCache((prev) => ({ ...prev, [key]: item }));
        return item;
    };

    const answerMinStay = async () => {
        if (!detail) return t('chat_a_min_stay_generic');
        const item = await loadProperty();
        if (!item) return t('chat_a_min_stay_generic');
        const n = Number(item.minDays ?? 0);
        if (n > 1) return t('chat_a_min_stay_specific', { n });
        return t('chat_a_min_stay_none');
    };

    const answerPayment = async () => {
        if (!detail) return t('chat_a_payment_generic');
        const item = await loadProperty();
        if (!item) return t('chat_a_payment_generic');
        const acceptsDeposit = detail.type === 'chalet' ? item.acceptDeposit : item.acceptDownPay;
        return acceptsDeposit ? t('chat_a_payment_deposit') : t('chat_a_payment_full');
    };

    const answerCancellation = async () => {
        if (!detail) return t('chat_a_cancellation_generic');
        const item = await loadProperty();
        if (!item) return t('chat_a_cancellation_generic');
        const text = detail.type === 'chalet'
            ? item.policy?.cancellation
            : (item.cancellationPolicyAr || item.cancellationPolicyEn);
        return text ? t('chat_a_cancellation_specific', { text }) : t('chat_a_cancellation_missing');
    };

    const answerInsurance = async () => {
        if (!detail || detail.type !== 'chalet') return t('chat_a_insurance_generic');
        const item = await loadProperty();
        if (!item) return t('chat_a_insurance_generic');
        const n = Number(item.insuranceAmount ?? 0);
        if (n > 0) return t('chat_a_insurance_specific', { n, omr: t('omr') });
        return t('chat_a_insurance_none');
    };

    const QUESTIONS = [
        { key: 'min_stay', label: t('chat_q_min_stay'), resolve: answerMinStay },
        { key: 'payment', label: t('chat_q_payment'), resolve: answerPayment },
        { key: 'cancellation', label: t('chat_q_cancellation'), resolve: answerCancellation },
        { key: 'insurance', label: t('chat_q_insurance'), resolve: answerInsurance },
    ];

    const askQuestion = async (q) => {
        pushMessage({ from: 'user', text: q.label });
        setLoadingAnswer(true);
        try {
            const answer = await q.resolve();
            pushMessage({ from: 'bot', text: answer });
        } catch {
            pushMessage({ from: 'bot', text: t('chat_a_min_stay_generic') });
        } finally {
            setLoadingAnswer(false);
        }
    };

    const whatsappHref = (() => {
        const message = lang === 'ar'
            ? 'السلام عليكم\nعندي استفسار بخصوص الحجز'
            : "Hi, I have a question about booking on ShleehCom";
        return `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`;
    })();

    return (
        <>
            <button
                type="button"
                className={`chat-fab ${open ? 'is-open' : ''}`}
                onClick={() => setOpen((v) => !v)}
                aria-label={t('chat_widget_title')}
            >
                <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-comment-dots'}`}></i>
            </button>

            {open && (
                <div className="chat-panel">
                    <div className="chat-panel-header">
                        <i className="fa-solid fa-comment-dots"></i>
                        <span>{t('chat_widget_title')}</span>
                    </div>

                    <div className="chat-panel-body">
                        <div className="chat-bubble bot">{t('chat_widget_greeting')}</div>
                        {messages.map((m, i) => (
                            <div key={i} className={`chat-bubble ${m.from}`}>{m.text}</div>
                        ))}
                        {loadingAnswer && (
                            <div className="chat-bubble bot chat-bubble-loading">
                                <span className="spinner" /> {t('chat_loading')}
                            </div>
                        )}
                    </div>

                    <div className="chat-panel-quick-replies">
                        {QUESTIONS.map((q) => (
                            <button key={q.key} type="button" className="chat-quick-reply" disabled={loadingAnswer} onClick={() => askQuestion(q)}>
                                {q.label}
                            </button>
                        ))}
                    </div>

                    <div className="chat-panel-footer">
                        <span>{t('chat_more_help')}</span>
                        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="chat-support-link">
                            <i className="fa-brands fa-whatsapp"></i> {t('chat_q_support')}
                        </a>
                    </div>
                </div>
            )}
        </>
    );
}
