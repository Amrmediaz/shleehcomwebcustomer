import Header from './Header.jsx';
import Footer from './Footer.jsx';
import WhatsAppButton from './WhatsAppButton.jsx';
import ChatWidget from './ChatWidget.jsx';

export default function Layout({ children }) {
    return (
        <div className="app-shell">
            <Header />
            <main>{children}</main>
            <Footer />
            <ChatWidget />
            <WhatsAppButton />
        </div>
    );
}
