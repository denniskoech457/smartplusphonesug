# Supabase client import fix

Fixed `Promise.resolve(...).then(...).createClient is not a function` by awaiting the dynamic import of `@supabase/supabase-js` in both `js/main.js` and `js/dashboard.js`. The Vercel build (`npm run build`) bundles the module into the local `*.bundle.js` scripts referenced by HTML. No esm.sh runtime import is needed.

Deployment: replace the existing project files with the contents of this ZIP, then redeploy on Vercel. Hard-refresh the browser (Ctrl+Shift+R) to avoid old cached scripts.

Validation: Node syntax checks and static tests passed. npm install / full bundling could not be executed in this environment, so check the Vercel build logs after deployment. This does not resolve the separate guest-order API error; obtain the Vercel function log for that.
