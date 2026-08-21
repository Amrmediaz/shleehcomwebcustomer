# Handing off shleeh.com/RequestPay/Success and /RequestPay/Error

## What's happening

`shleeh.com/RequestPay/Success` and `www.shleeh.com/RequestPay/Error` are the
bank's two **fixed** payment-gateway return URLs (`SUCCESS_URL`/`FAIL_URL` in
the Flutter app's `Constants.dart`) — they can't be changed, that's what's
registered with the bank. They currently live on the existing backend and
return a 200 with an empty body. They were never meant to be seen by a human:
the Shleeh mobile app opens the payment flow in an in-app WebView and
intercepts navigation to these exact URLs before they ever render, showing
its own in-app success/fail screen instead.

A real desktop/mobile web browser has no such interception — when the bank
redirects a paying customer back to this URL, they land on a genuinely blank
page.

## Why this is permanent, not a temporary patch

The customer site (this codebase) is deployed at **`shleeh.com/app/`**, not
the domain root — the root stays the existing .NET admin panel/API. That
means the app's own `/payment-success` and `/payment-failed` pages actually
live at `shleeh.com/app/payment-success` and `shleeh.com/app/payment-failed`.
The bank will only ever redirect to the fixed root-level paths above, never
to anything under `/app/`, so **something has to live permanently at the
domain root to bridge the two** — that's what these two files are for.

## What to do (2 files, ~1 minute)

Ask whoever has server/hosting access for `shleeh.com` to:

1. Serve **`RequestPay-Success-redirect.html`** at `/RequestPay/Success`
   (rename it to whatever the server expects for that route). It immediately
   redirects the browser to `https://shleeh.com/app/payment-success`.
2. Serve **`RequestPay-Error-redirect.html`** at `/RequestPay/Error` the same
   way — it redirects to `https://shleeh.com/app/payment-failed`.

Both files are fully self-contained (no build step, no dependencies) — plain
static HTML, drop in as-is. No new pages need to be added at the root beyond
these two; the real success/fail pages are the ones already deployed under
`/app/`.

## Keep in sync

If the app's subpath ever changes from `/app/` to something else, these two
files' redirect targets need updating to match (see `vite.config.js`'s
`BASE_PATH` in the main codebase, which is the single source of truth for
what that subpath currently is).
