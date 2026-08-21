// Dev-only stand-in for the real bank payment gateway. Lets the popup +
// same-origin-polling detection in PaymentPage.jsx be tested end-to-end
// from localhost — without a live booking, a real bank charge, or the
// site being deployed. Only reachable via routes registered behind
// `import.meta.env.DEV` in App.jsx, so this never ships in a production
// build's routing.
export default function MockBankPage() {
    const go = (outcome) => {
        // A real, same-origin top-level navigation inside the popup —
        // exactly what the bank does, just pointed at a local route
        // instead of shleeh.com. This is what PaymentPage's polling loop
        // is watching for.
        window.location.href = outcome === 'success' ? '/__mock-bank/success' : '/__mock-bank/fail';
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <p style={styles.badge}>DEV ONLY — MOCK BANK GATEWAY</p>
                <h1 style={styles.title}>🏦 Simulated Payment Page</h1>
                <p style={styles.desc}>
                    This stands in for the real bank. In production, the browser would be here on the
                    bank's own domain, and our page couldn't read its address. Pick an outcome below to
                    simulate the bank redirecting back — this exercises the exact same detection code path.
                </p>
                <div style={styles.actions}>
                    <button type="button" style={{ ...styles.btn, background: '#1E8E5A' }} onClick={() => go('success')}>
                        Simulate Successful Payment
                    </button>
                    <button type="button" style={{ ...styles.btn, background: '#D64545' }} onClick={() => go('fail')}>
                        Simulate Failed Payment
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0b1220', padding: 20, fontFamily: '-apple-system, sans-serif',
    },
    card: {
        background: '#fff', borderRadius: 16, padding: '32px 28px', maxWidth: 420, width: '100%',
        textAlign: 'center', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.4)',
    },
    badge: {
        display: 'inline-block', background: '#FEF3E2', color: '#E08A2E', fontSize: 11, fontWeight: 700,
        letterSpacing: 0.5, padding: '4px 10px', borderRadius: 999, marginBottom: 14,
    },
    title: { fontSize: 20, margin: '0 0 10px', color: '#082659' },
    desc: { fontSize: 13.5, color: '#6b6b74', lineHeight: 1.6, margin: '0 0 24px' },
    actions: { display: 'flex', flexDirection: 'column', gap: 10 },
    btn: {
        border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 20px',
        borderRadius: 10, cursor: 'pointer',
    },
};
