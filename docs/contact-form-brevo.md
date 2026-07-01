# D&D Roofing contact form - Brevo email setup

This patch switches the Supabase Edge Function email provider from Resend to Brevo.

Secrets used:

- BREVO_API_KEY
- BREVO_FROM_EMAIL=notify@ddconstructiontx.com
- BUSINESS_CONTACT_EMAIL
- DISABLE_EMAIL_SEND

The existing Supabase `contact_submissions.resend_message_id` column is reused to store the provider message id so no database migration is required.
