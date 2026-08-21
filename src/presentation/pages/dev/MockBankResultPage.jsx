// Where MockBankPage "redirects" to for each outcome. This page rendering
// at all is really just a safety net — PaymentPage's polling loop should
// catch the popup landing on this URL and close it within ~400ms, well
// before a person reads anything here.
export default function MockBankResultPage({ status }) {
    const isSuccess = status === 'success';
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isSuccess ? '#E9F8F1' : '#FDEDED', fontFamily: '-apple-system, sans-serif',
            flexDirection: 'column', gap: 8,
        }}>
            <div style={{ fontSize: 40 }}>{isSuccess ? '✅' : '❌'}</div>
            <p style={{ color: isSuccess ? '#1E8E5A' : '#D64545', fontWeight: 700 }}>
                Mock {isSuccess ? 'success' : 'failure'} redirect — closing window…
            </p>
        </div>
    );
}
