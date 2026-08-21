import { useTranslation } from '../../context/LanguageContext.jsx';
import './WhatsAppButton.css';

// Real support channel from the app itself (SupportBtn / CommonFunctions.
// sendMessageToWhatsApp — +96893866893). Site-wide floating button so help
// is always one tap away, matching the "easiest system to book" goal:
// anyone stuck on dates, pricing, or a booking question doesn't have to dig
// for a contact page.
const SUPPORT_PHONE = '96893866893';

export default function WhatsAppButton() {
    const { t, lang } = useTranslation();
    const message = lang === 'ar'
        ? 'السلام عليكم\nعندي استفسار بخصوص الحجز'
        : "Hi, I have a question about booking on ShleehCom";
    const href = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`;

    return (
        <a
            className="whatsapp-fab"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('whatsapp_support')}
        >
            <i className="fa-brands fa-whatsapp"></i>
        </a>
    );
}
