WhatsApp fix:
- Apply form now visibly shows 'WhatsApp number *' and no longer says Optional.
- WhatsApp number is required by HTML, frontend JS, and backend PHP.
- Backend ensures orders.alternative_number exists before saving.
- Admin Customer Orders now has working Phone, WhatsApp, Device, Status and Action columns.
- Existing old orders will show — if they were created before a WhatsApp number was stored.
- Manual migration is included at docs/whatsapp-number-required-migration.sql if the hosting DB user cannot ALTER tables automatically.
