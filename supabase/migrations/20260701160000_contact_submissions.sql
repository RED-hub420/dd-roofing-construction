create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) <= 120),
  phone text not null check (char_length(phone) <= 40),
  email text check (email is null or char_length(email) <= 160),
  city text not null check (char_length(city) <= 120),
  service text not null check (char_length(service) <= 160),
  contact_method text check (contact_method is null or char_length(contact_method) <= 60),
  message text not null check (char_length(message) <= 5000),
  source_page text check (source_page is null or char_length(source_page) <= 500),
  user_agent text check (user_agent is null or char_length(user_agent) <= 500),
  ip_address text check (ip_address is null or char_length(ip_address) <= 80),
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed', 'skipped')),
  resend_message_id text,
  email_error text,
  client_metadata jsonb not null default '{}'::jsonb
);

alter table public.contact_submissions enable row level security;

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

create index if not exists contact_submissions_email_status_idx
  on public.contact_submissions (email_status);

comment on table public.contact_submissions is 'Contact form estimate requests submitted from ddconstructiontx.com.';
comment on column public.contact_submissions.email_status is 'Tracks whether the Resend business notification was sent, failed, or skipped during private testing.';
