type ContactPayload = {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  service?: string;
  message?: string;
  contact_method?: string;
  source_page?: string;
  company?: string;
  website?: string;
};

type SubmissionRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string;
  service: string;
  contact_method: string | null;
  message: string;
  source_page: string | null;
  user_agent: string | null;
  ip_address: string | null;
  client_metadata: Record<string, unknown>;
};

const DEFAULT_ALLOWED_ORIGINS = [
  "https://ddconstructiontx.com",
  "https://www.ddconstructiontx.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

const REQUIRED_FIELDS: Array<keyof ContactPayload> = ["name", "phone", "city", "service", "message"];

function getAllowedOrigins() {
  const raw = Deno.env.get("ALLOWED_ORIGINS");
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw.split(",").map((origin) => origin.trim()).filter(Boolean);
}

function getCorsHeaders(req: Request) {
  const requestOrigin = req.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();
  const allowOrigin = requestOrigin && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function trim(value: unknown, maxLength = 5000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function cleanOptional(value: unknown, maxLength = 500) {
  const cleaned = trim(value, maxLength);
  return cleaned.length ? cleaned : null;
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getClientIp(req: Request) {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

function getSupabaseServiceRoleKey() {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;

  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!secretKeys) return null;

  try {
    const parsed = JSON.parse(secretKeys) as Record<string, string>;
    return parsed.service_role || parsed.service_role_key || null;
  } catch (_error) {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBusinessFrom() {
  const businessName = Deno.env.get("BUSINESS_NAME") || "D&D Roofing & Construction";
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "notify@ddconstructiontx.com";
  return `${businessName} <${fromEmail}>`;
}

function buildBusinessEmail(row: SubmissionRow) {
  const submittedAt = new Date().toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const rows = [
    ["Name", row.name],
    ["Phone", row.phone],
    ["Email", row.email || "Not provided"],
    ["City / Area", row.city],
    ["Service Needed", row.service],
    ["Preferred Contact", row.contact_method || "No preference"],
    ["Source Page", row.source_page || "Unknown"],
    ["Submitted", `${submittedAt} CT`],
  ];

  const htmlRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-weight:700;width:170px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(value)}</td>
    </tr>
  `).join("");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;max-width:720px;">
      <h2 style="margin:0 0 12px;">New Estimate Request</h2>
      <p style="margin:0 0 18px;">A new contact form request was submitted from ddconstructiontx.com.</p>
      <table style="border-collapse:collapse;width:100%;border:1px solid #e5e7eb;margin-bottom:18px;">${htmlRows}</table>
      <h3 style="margin:18px 0 8px;">Project Description</h3>
      <div style="white-space:pre-wrap;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;">${escapeHtml(row.message)}</div>
    </div>
  `;

  const text = [
    "New Estimate Request - D&D Roofing & Construction",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Project Description:",
    row.message,
  ].join("\n");

  return { html, text };
}

function buildCustomerEmail(row: SubmissionRow) {
  const businessPhone = Deno.env.get("BUSINESS_PHONE") || "(817) 524-9927";
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:640px;">
      <h2 style="margin:0 0 12px;">We received your estimate request</h2>
      <p>Thanks for reaching out to D&amp;D Roofing &amp; Construction. We received your request and will follow up soon.</p>
      <p>For faster help, call or text <strong>${escapeHtml(businessPhone)}</strong>.</p>
      <p style="margin-top:22px;">— D&amp;D Roofing &amp; Construction</p>
    </div>
  `;

  const text = [
    `Hi ${row.name},`,
    "",
    "Thanks for reaching out to D&D Roofing & Construction. We received your estimate request and will follow up soon.",
    "",
    `For faster help, call or text ${businessPhone}.`,
    "",
    "— D&D Roofing & Construction",
  ].join("\n");

  return { html, text };
}

async function supabaseRest(path: string, init: RequestInit) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function insertSubmission(row: SubmissionRow) {
  const response = await supabaseRest("contact_submissions", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Could not save contact submission: ${errorText}`);
  }

  const data = await response.json();
  return Array.isArray(data) && data[0] ? data[0] : row;
}

async function updateEmailStatus(id: string, patch: Record<string, unknown>) {
  const response = await supabaseRest(`contact_submissions?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    console.error("Failed to update email status", await response.text());
  }
}

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  idempotencyKey: string;
}) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) throw new Error("Missing RESEND_API_KEY secret.");

  const body: Record<string, unknown> = {
    from: formatBusinessFrom(),
    to: [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text,
  };

  if (input.replyTo) {
    body.reply_to = [input.replyTo];
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : "Resend email failed.");
  }

  return data as { id?: string };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, { error: "Method not allowed." }, 405);
  }

  try {
    const origin = req.headers.get("origin");
    if (origin && !getAllowedOrigins().includes(origin)) {
      return jsonResponse(req, { error: "This request origin is not allowed." }, 403);
    }

    const payload = await req.json() as ContactPayload;

    // Honeypot: real users will never fill this hidden field, but bots often do.
    if (trim(payload.company, 200) || trim(payload.website, 200)) {
      return jsonResponse(req, { ok: true });
    }

    const missingField = REQUIRED_FIELDS.find((field) => !trim(payload[field], 5000));
    if (missingField) {
      return jsonResponse(req, { error: "Please complete all required fields before submitting." }, 400);
    }

    const email = cleanOptional(payload.email, 160);
    if (email && !looksLikeEmail(email)) {
      return jsonResponse(req, { error: "Please enter a valid email address or leave it blank." }, 400);
    }

    const row: SubmissionRow = {
      id: crypto.randomUUID(),
      name: trim(payload.name, 120),
      phone: trim(payload.phone, 40),
      email,
      city: trim(payload.city, 120),
      service: trim(payload.service, 160),
      contact_method: cleanOptional(payload.contact_method, 60),
      message: trim(payload.message, 5000),
      source_page: cleanOptional(payload.source_page, 500),
      user_agent: cleanOptional(req.headers.get("user-agent"), 500),
      ip_address: cleanOptional(getClientIp(req), 80),
      client_metadata: {
        referer: req.headers.get("referer"),
        origin: req.headers.get("origin"),
      },
    };

    await insertSubmission(row);

    const disableEmailSend = (Deno.env.get("DISABLE_EMAIL_SEND") || "").toLowerCase() === "true";
    if (disableEmailSend) {
      await updateEmailStatus(row.id, {
        email_status: "skipped",
        resend_message_id: null,
        email_error: "Email sending disabled by DISABLE_EMAIL_SEND=true.",
      });
      return jsonResponse(req, { ok: true, email_status: "skipped" });
    }

    const businessEmail = Deno.env.get("BUSINESS_CONTACT_EMAIL") || "dewayne@ddconstructiontx.com";
    const businessMessage = buildBusinessEmail(row);
    let businessSend: { id?: string };

    try {
      businessSend = await sendEmail({
        to: businessEmail,
        subject: `New Estimate Request - ${row.name}`,
        html: businessMessage.html,
        text: businessMessage.text,
        replyTo: row.email || undefined,
        idempotencyKey: `contact-business-${row.id}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resend email failed.";
      await updateEmailStatus(row.id, {
        email_status: "failed",
        email_error: message.slice(0, 1000),
      });
      throw error;
    }

    if (row.email) {
      const customerMessage = buildCustomerEmail(row);
      sendEmail({
        to: row.email,
        subject: "We received your estimate request",
        html: customerMessage.html,
        text: customerMessage.text,
        replyTo: businessEmail,
        idempotencyKey: `contact-customer-${row.id}`,
      }).catch((error) => console.error("Customer auto-reply failed", error));
    }

    await updateEmailStatus(row.id, {
      email_status: "sent",
      resend_message_id: businessSend.id || null,
      email_error: null,
    });

    return jsonResponse(req, { ok: true });
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Unknown error.";
    return jsonResponse(req, {
      error: "There was a problem sending your request. Please call or text (817) 524-9927.",
      details: message,
    }, 500);
  }
});
