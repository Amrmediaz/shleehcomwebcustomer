# Deploying to shleeh.com/app

The app itself is already deploy-ready — verified end-to-end (see "Verified" below).
This is what whoever deploys it needs to know.

## It's deployed under a subpath, not the domain root

`shleeh.com` (root) stays the existing .NET admin panel/API. This app lives at
**`shleeh.com/app/`** instead. That's controlled by three places that all have to
agree — if the subpath ever changes from `/app`, update all three:

- `vite.config.js` — the `BASE_PATH` constant
- `src/App.jsx` — `<Router basename="/app">`
- `public/web.config` / `public/.htaccess` — the rewrite rule targets

## Build

```
npm install
npm run build
```

Output goes to `dist/`. Deploy that folder's *contents* into whatever physical path
answers requests at `shleeh.com/app/` (see IIS notes below). `VITE_API_URL` is already
pinned to `https://www.shleeh.com` in `.env.production`, so no environment variables
need to be set at deploy time.

## Critical: the bank's payment return URLs need a small handoff at the domain root

The bank's two fixed return URLs are **root-level, not under `/app/`**, and can't be
changed (this is from the real app's `Constants.dart`):

- Success → `https://shleeh.com/RequestPay/Success` (no "www")
- Failure → `https://www.shleeh.com/RequestPay/Error` (with "www")

Since this app doesn't own the domain root, these two URLs need to redirect into the
app's own pages at `/app/payment-success` and `/app/payment-failed`. Two small,
dependency-free static HTML files already do exactly this — see
`standalone-fallback/README-deploy-instructions.md`. This is a **permanent** part of
the setup (not a temporary stopgap) as long as the app lives under `/app/` instead of
the domain root — hand that README to whoever manages the domain root alongside this
`dist/` folder.

## SPA routing (deep-link) config

This is a client-side-routed app — a fresh request to `/app/chalets/12` etc. isn't a
real file on disk, so the server must fall back to serving `/app/index.html` and let
React Router take over. A config file for this is already included for each common
host — pick whichever matches:

- **IIS** — `web.config` (included in `dist/`, requires the free "URL Rewrite" module —
  likely already installed if this is the same IIS box hosting the ASP.NET API). Its
  rewrite target is hardcoded to `/app/index.html`, matching the subpath above.
- **Apache** — `.htaccess` (included in `dist/`, requires `mod_rewrite` enabled).
  `RewriteBase` is set to `/app/`.
- **nginx** — see `nginx.conf.example` at the project root (not auto-applied; copy the
  relevant block into the real server config and adjust for the `/app/` prefix).
- **Netlify** / **Vercel** — `_redirects` / `vercel.json` are included but assume a
  root deployment; not the actual target here (backend is .NET/IIS) — only relevant if
  the hosting plan ever changes.

Without this, `/app/chalets/12`, `/app/payment-success`, etc. will 404 instead of
loading the app.

## IIS-specific notes (this is what we're actually using)

- Confirm the **URL Rewrite** module is installed on the IIS box — without it, the
  `<rewrite>` section in `web.config` is silently ignored and every deep link under
  `/app/` 404s.
- Deploy the *contents* of `dist/` into a folder that's reachable as `shleeh.com/app/`
  — either a plain subfolder under the existing site, or (cleaner, recommended) convert
  that subfolder into its own IIS **Application** via IIS Manager. Either way works;
  `web.config`'s rewrite rule uses an absolute `/app/index.html` target specifically so
  it resolves correctly under both setups.
- `web.config` excludes anything under `/api/` from the SPA fallback rule, as a safety
  net in case this app and the ASP.NET API ever end up sharing an IIS scope. In
  practice this app always calls the API via its full `https://www.shleeh.com/api/...`
  URL, never a relative `/api/` path, so this shouldn't ever actually get exercised —
  just don't be surprised it's there.
- Set up the root-level `/RequestPay/Success` and `/RequestPay/Error` handoff — see the
  "Critical" section above. This is separate from the `/app/` deployment itself and
  easy to forget since it lives outside this folder.

## What happens once this is live

- `/RequestPay/Success` and `/RequestPay/Error` (root) redirect to this app's own
  `/app/payment-success` and `/app/payment-failed` pages — no blank page, ever.
- The payment flow opens the bank gateway in a popup and detects completion
  automatically via same-origin polling (works the moment this app is live at
  `shleeh.com/app/` — see `src/core/utils/paymentGatewayWindow.js` for how).
- None of this requires any backend/API change beyond the small root-level redirect
  handoff above.

## Verified

- `npm run build` — clean, no errors, with `base: '/app/'` correctly baked into every
  asset reference (checked the built `dist/index.html` and JS/CSS chunk paths directly).
- `npm run lint` — no new issues introduced by this app (15 pre-existing errors / 8
  warnings from an established, intentional pattern; see comments at each site).
- Production bundle correctly bakes in the real `https://shleeh.com/RequestPay/Success`
  and `https://www.shleeh.com/RequestPay/Error` URLs (checked directly in the built
  output) — these are the bank-facing constants, unaffected by the app's own subpath.
- Dev-only test tooling (`/__mock-bank/*` routes, the mock-bank test button on the
  payment page) is fully absent from the production bundle.
- `_redirects`, `.htaccess`, `web.config`, and the PWA manifest/icons all confirmed
  present in `dist/` with `/app/`-prefixed paths after a real build.
