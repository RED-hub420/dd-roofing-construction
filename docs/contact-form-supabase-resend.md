# Contact Form: Supabase + Resend Setup

This project has been updated so the D&D Roofing & Construction contact form submits to a Supabase Edge Function instead of Formspree.

## What was changed

- `contact.html`
  - Removed the Formspree endpoint.
  - Added JSON submit logic for Supabase Edge Functions.
  - Added a hidden honeypot field for simple bot protection.
  - Keeps the same success/error message behavior on the page.

- `supabase/migrations/20260701160000_contact_submissions.sql`
  - Creates the `public.contact_submissions` table.
  - Stores every estimate request as a lead record.
  - Tracks whether the Resend notification was sent.

- `supabase/functions/submit-contact/index.ts`
  - Validates the form submission.
  - Saves the lead to Supabase.
  - Sends the business notification email through Resend.
  - Sends a customer auto-reply if the customer provided an email address.

- `supabase/config.toml`
  - Sets `verify_jwt = false` for this public contact form function.

## Current configured business details

- Notification recipient: `dewayne@ddconstructiontx.com`
- Default sender email: `notify@ddconstructiontx.com`
- Business phone: `(817) 524-9927`
- Allowed production origins:
  - `https://ddconstructiontx.com`
  - `https://www.ddconstructiontx.com`

## Resend setup

1. Create/login to Resend.
2. Add and verify the domain: `ddconstructiontx.com`.
3. Add the DNS records Resend gives you.
4. Create a Sending access API key for `ddconstructiontx.com`.
5. Use `notify@ddconstructiontx.com` as the sender email.

## Supabase setup

From the repo root after linking your Supabase project:

```cmd
supabase db push && supabase secrets set DISABLE_EMAIL_SEND=true BUSINESS_CONTACT_EMAIL=YOUR_EMAIL_HERE RESEND_FROM_EMAIL=notify@ddconstructiontx.com BUSINESS_PHONE="(817) 524-9927" ALLOWED_ORIGINS=https://ddconstructiontx.com,https://www.ddconstructiontx.com && supabase functions deploy submit-contact --no-verify-jwt
```

The `contact.html` endpoint is already configured for this Supabase project:

```html
https://xhdhsctgzmssxadntyky.supabase.co/functions/v1/submit-contact
```

## Test command

After deployment, test the function directly. With `DISABLE_EMAIL_SEND=true`, this saves the lead to Supabase but sends no emails:

```cmd
curl -i -X POST "https://xhdhsctgzmssxadntyky.supabase.co/functions/v1/submit-contact" -H "Content-Type: application/json" -H "Origin: https://ddconstructiontx.com" -d "{\"name\":\"Test Lead\",\"phone\":\"817-524-9927\",\"city\":\"Weatherford\",\"service\":\"Roofing - Repair / Leak\",\"message\":\"Private setup test. Do not contact.\",\"contact_method\":\"Phone call\",\"source_page\":\"https://ddconstructiontx.com/contact.html\"}"
```

Expected result:

```json
{"ok":true,"email_status":"skipped"}
```

## Go-live checklist

- Resend domain `ddconstructiontx.com` is verified.
- Supabase migration has been pushed.
- Supabase Edge Function has been deployed with `--no-verify-jwt`.
- Supabase secrets are set.
- `contact.html` points to `https://xhdhsctgzmssxadntyky.supabase.co/functions/v1/submit-contact`.
- Submit one real test form from the live site.
- Confirm the lead appears in `public.contact_submissions`.
- Confirm `dewayne@ddconstructiontx.com` receives the notification email.


## Private testing / no emails

To test without sending any email to Dewayne or a customer, keep this secret set:

```cmd
supabase secrets set DISABLE_EMAIL_SEND=true
```

When you are ready for live email notifications, set the real Resend key and turn email sending on:

```cmd
supabase secrets set DISABLE_EMAIL_SEND=false RESEND_API_KEY=re_REPLACE_WITH_REAL_KEY BUSINESS_CONTACT_EMAIL=dewayne@ddconstructiontx.com RESEND_FROM_EMAIL=notify@ddconstructiontx.com && supabase functions deploy submit-contact --no-verify-jwt
```
