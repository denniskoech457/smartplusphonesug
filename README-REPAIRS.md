# SmartPay repair build — 15 October 2026

## Fixes
- Public product requests no longer wait for Supabase auth session initialization. The working marketplace API can render the catalogue independently of login.
- Admin authorization now distinguishes missing/expired session, missing admin role, and Supabase role lookup errors. Errors are logged to Vercel functions.
- Customer profile row is automatically created on first authenticated `/api/auth?action=me` request, using only `user_id` to avoid assumptions about optional profile columns. Existing accounts can sign in then refresh to create their profile.
- Admin API logs underlying server errors for diagnosis.

## Deploy
Upload all files to the existing Vercel project and redeploy. Vercel must run `npm run build` to produce `js/*.bundle.js`. Confirm `SUPABASE_SECRET_KEY` is configured as a server-only variable. Do not expose secret keys in browser scripts.

## Testing
1. Visit home page and confirm ten phones load.
2. Sign in as existing admin at `/admin.html`. If refused, copy only the error message and relevant redacted Vercel function log.
3. Sign in as a customer, then check `customer_profiles` table.
4. Guest order failures still require Vercel function logs; not claimed fixed.

Static syntax/API mock tests passed. Full npm install/build could not be completed in this environment, so validate the Vercel build after deployment.
