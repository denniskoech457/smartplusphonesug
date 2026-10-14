Final guest-order flow:
- Customers can place an order without signing up or signing in.
- The 10-second verification screen remains.
- The order is saved as a guest order when there is no signed-in account.
- The post-order payment-reference submission form has been completely removed.
- Payment-reference forms have also been removed from the customer-facing order/dashboard UI.
- After submission, the customer uses Send application details to WhatsApp.
- Existing account/dashboard features remain available for customers who choose to sign in.
- IMPORTANT for an existing database: run docs/guest-order-migration.sql so orders.user_id accepts NULL.
