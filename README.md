# SmartPay Phones Uganda — Standalone cPanel Package

This is the requested editable **HTML, CSS, JavaScript, PHP, and MySQL** implementation for SmartPay Phones Uganda. It is separate from the managed React/Node project and is intended for cPanel hosting with PHP 7.4+, MySQL/MariaDB, PDO MySQL, sessions, and HTTPS.

The public site is `index.html`. The administrator workspace is `admin.html`. Front-end assets are in `css/style.css`, `js/main.js`, and `js/admin.js`. Server endpoints are in `api/`. Database setup and migration files are in `docs/`. Phone images are bundled in `assets/`.

The package supports customer registration and login, session-protected customer accounts, phone catalogue loading, order creation, MTN payment-reference submission, administrator authorization, product and stock editing, order status updates, manual payment settings, payment verification endpoints, customer reviews linked to completed orders, and an honest empty review state until genuine feedback is entered.

Use `docs/CPANEL_DEPLOYMENT.md` as the installation guide and `docs/API.md` as the endpoint reference. Never publish invented customer reviews, ratings, names, or purchase claims. Enter genuine customer feedback only with permission, and use the Admin Workspace after a real order is marked completed.

Before the first login, configure the database constants in `api/config.php`, import `docs/database-setup.sql`, register an account, and promote the intended administrator account with the SQL statement in the deployment guide. The package is deliberately free of Node.js and React dependencies.
