# SmartPay Phones Uganda — Vercel migration starter

**Status: NOT a finished functional migration.** This ZIP is a static Vercel-deployable preview of the original UI, plus a starting Supabase schema. It is provided to preserve the original site design and assets. The old frontend still calls `api/*.php`; those endpoints have intentionally been excluded because Vercel does not execute them. Consequently login, admin editing, customer orders, and other dynamic features **will not work** in this preview. Do not launch it as a live business website or collect customer information with it.

## Deployment preview
1. Create a private GitHub repository and upload the extracted files.
2. Import the repository into Vercel. Framework preset: Other. Root: project root. No build command.
3. Deploy to view the static layout only.

## Supabase
`supabase/schema.sql` is an initial, incomplete PostgreSQL schema, not the original MySQL schema. Run it only if you are beginning a new Supabase database and understand that it does not implement orders, authentication, admin roles, payments, reviews, or leadership. Do not publish service-role/secret keys or your database password.

## Work still needed before production
- Replace `api/*.php` with Vercel Node.js API functions.
- Convert legacy MySQL tables and data to PostgreSQL.
- Implement Supabase Auth and admin role checks.
- Implement secure order submission, payment verification, admin CRUD, and media storage.
- Update frontend requests to call new endpoints.
- Test mobile layout, pricing calculations, orders, dashboard, and all admin settings including `site_name`.

The legacy code remains in the original uploaded ZIP, not this preview. 
