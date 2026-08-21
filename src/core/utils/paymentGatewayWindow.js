import { PAYMENT_SUCCESS_URL, PAYMENT_FAIL_URL } from '../network/urls.js';

// The web equivalent of payment_bank_web_widget.dart's WebView interception
// (onNavigationRequest catching SUCCESS_URL/FAIL_URL before they render).
// Browsers give us no native "navigation started" hook into a popup/iframe
// on another origin, but they DO let us poll it: while the bank's payment
// page is open, reading popup.location.href throws (the browser blocking
// one origin's script from reading another origin's address — the same
// protection that stops any site from spying into another site's window).
// The instant the bank redirects the popup back to a shleeh.com URL, that
// read starts succeeding again, and we can react immediately — no backend
// involvement needed, and it never depends on what's actually served at
// that URL (even the current blank page is fine, we only ever read its
// address, never its content).
//
// This only works once this app is served from the exact same origin the
// bank redirects back to (shleeh.com for success, www.shleeh.com for
// fail — see the note in urls.js). Cross-origin reads stay blocked no
// matter what, same as if this were still a different site entirely.
//
// window.open must be called synchronously from a real user gesture (a
// click) or most browsers silently block it — this returns null in that
// case so the caller can fall back to a visible "tap to open" affordance.
export function openPaymentGateway(url, { onSuccess, onFail, onClosed, pollMs = 400 } = {}) {
    const popup = window.open(url, 'shleeh_payment', 'width=480,height=760');
    if (!popup) return null;

    const timer = setInterval(() => {
        if (popup.closed) {
            clearInterval(timer);
            onClosed?.();
            return;
        }
        let href;
        try {
            href = popup.location.href;
        } catch {
            return; // still cross-origin (on the bank's page) — keep waiting
        }
        if (href.startsWith(PAYMENT_SUCCESS_URL)) {
            clearInterval(timer);
            popup.close();
            onSuccess?.();
        } else if (href.startsWith(PAYMENT_FAIL_URL)) {
            clearInterval(timer);
            popup.close();
            onFail?.();
        }
    }, pollMs);

    // Caller-side cleanup handle (component unmount, resolved elsewhere, etc).
    return () => clearInterval(timer);
}
