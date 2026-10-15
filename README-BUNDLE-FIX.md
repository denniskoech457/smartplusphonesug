# SmartPay bundle and sign-in fix

This ZIP fixes the browser error `Failed to fetch dynamically imported module: https://esm.sh/...` by bundling Supabase using esbuild during Vercel deployment. No esm.sh runtime dependency remains. Vercel must install npm dependencies and execute `npm run build`. Build creates `js/main.bundle.js`, `js/dashboard.bundle.js`, and `js/smartpay-admin.bundle.js` which the HTML pages now reference. These files do not exist in the source ZIP; they are generated on deployment.

## Deploy
Upload the complete ZIP contents to the project repository/root, including `package.json`, `scripts/build.mjs`, and `vercel.json`. Vercel should report `npm run build` in its build logs. Check that all three bundle files are served with HTTP 200 after deployment. If Vercel is configured with a custom Build Command or Output Directory, use `npm run build` and `.` respectively.

In Supabase Authentication > Providers > Email, disable Confirm email if immediate account login is intended. Existing unconfirmed users may need manual confirmation. The registration screen now distinguishes no-session/confirmation-required from signed-in registration, and will not silently sign out due to a failed profile refresh.

## Important
The separate guest application error `Request could not be completed` is NOT fixed by bundling. Retrieve the failed `/api/marketplace` invocation log in Vercel to diagnose its database/permission/Turnstile cause. Do not disable RLS or expose server secrets to the browser. Payment verification is still not implemented.

Local build was not run here because npm registry access was unavailable; Vercel must perform the dependency install/build.
