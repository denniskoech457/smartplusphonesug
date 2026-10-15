# SmartPay Vercel + Supabase integration — TEST BUILD

This is a **test build**, not production approved. Original design and assets preserved. Frontend now uses Vercel `/api/marketplace` and `/api/auth` rather than PHP. Supabase Auth provides optional customer accounts; guest orders use a server-side insert after Cloudflare Turnstile verification. Price/deposit/installments are recalculated server-side using the product database, never trusted from the client. Payments are **not processed or verified**. Testimonials and team API currently return empty lists.

## Required Vercel variables
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (server only), `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. Configure Turnstile with your test hostname in Cloudflare. Never commit secret keys. Set `SUPABASE_SECRET_KEY` only in Vercel environment variables. In Supabase Auth, set your Site URL and allowed redirect URLs for the test domain. Enable email confirmation if desired.

## Supabase
Run existing phase 1 and phase 2 migrations (six tables). Do not grant public write access to `orders` or admin tables. Create admin user in Supabase Authentication and insert UUID into `admin_users`. Expose only public read tables. Check the product data is populated: migration creates tables but does not import the original phone records. The public product API only returns active phones with stock > 0.

## Limitations / before production
- Guest order CAPTCHA is required. For additional abuse resistance configure edge/WAF rate limiting; serverless in-memory counters are not reliable.
- Test auth, orders and admin against **your** Supabase test project; no live credentials were available for this local test.
- Dashboard is adapted to the old UI; notifications/payment history are placeholders until a payment ledger is implemented.
- Payment reference submissions return 501, intentionally. Never claim a payment is verified without payment-provider confirmation.
- Add strict HTML escaping for all user-generated text rendered in homepage templates before accepting untrusted content.
- Test all layouts and review field validation and delivery choices on real browsers.

## Install and test in order
1. In Supabase SQL Editor, run `03_optional_original_products.sql` **only if** your `products` table is empty; verify the imported prices and stock before using them.
2. Create Cloudflare Turnstile site widget for your **preview** domain. Add `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` to the preview Vercel project; do not put secret in GitHub.
3. Add the Supabase environment variables listed above and deploy to a **separate Vercel preview project**. `SUPABASE_SECRET_KEY` must be server-only.
4. Visit `/api/marketplace?action=health` and confirm active products in stock. Visit `/api/public` and check settings/hours.
5. Create a Supabase Auth customer; confirm sign-in and dashboard. Create a separate admin Auth user and add their UUID to `admin_users`, then test `/admin.html`.
6. Submit a **test** guest order and verify it appears in the `orders` table with `payment_status=pending`. Test incorrect colour and blank form fields.
7. Do not switch production traffic or collect deposits until end-to-end testing, WAF/rate limits, payment workflow, and security review are complete.

## Local checks performed
- Node syntax validation of all nine JavaScript files: passed.
- No legacy PHP endpoints in active customer JS: passed.
- Mocked guest order API: no-CAPTCHA rejection, invalid months, unavailable colour, authoritative pricing, successful guest insert, payment disabled: passed.
- Live Supabase/Vercel, browser/mobile, Cloudflare Turnstile and real payment tests: **not performed** (no authenticated test environment).
