import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

/* ======================================================
   RUNTIME CONFIG
====================================================== */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ======================================================
   ENV HELPERS
====================================================== */
function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/* ======================================================
   SHARED SMTP TRANSPORT (REUSED)
====================================================== */
const transporter = nodemailer.createTransport({
  host: requireEnv("SMTP_HOST"),
  port: Number(requireEnv("SMTP_PORT")),
  secure: false, // Gmail + 587
  requireTLS: true,
  auth: {
    user: requireEnv("SMTP_USER"),
    pass: requireEnv("SMTP_PASS"),
  },
});

/* ======================================================
   ADMIN EMAIL SENDER (EXPORTABLE)
====================================================== */
export async function sendAdminNotification(payload: {
  type: "lead" | "partner" | "order" | "system";
  title: string;
  details?: Record<string, string | number | undefined>;
}) {
  const SMTP_FROM = requireEnv("SMTP_FROM");
  const ADMIN_ALERT_EMAIL = requireEnv("ADMIN_ALERT_EMAIL");

  const rows = payload.details
    ? Object.entries(payload.details)
        .map(
          ([key, value]) => `
          <tr>
            <td style="padding:6px 10px;font-weight:bold;">${key}</td>
            <td style="padding:6px 10px;">${value ?? ""}</td>
          </tr>`
        )
        .join("")
    : "";

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000;">
    <h2 style="color:#b80d0d;">🚨 TradePilot Admin Alert</h2>

    <p><strong>Event Type:</strong> ${payload.type.toUpperCase()}</p>
    <p><strong>Summary:</strong> ${payload.title}</p>

    ${
      rows
        ? `<table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:12px;">${rows}</table>`
        : ""
    }

    <p style="margin-top:16px;">
      Log in to TradePilot to review details.
    </p>
  </div>
  `;

  await transporter.sendMail({
    from: SMTP_FROM,
    to: ADMIN_ALERT_EMAIL,
    subject: `🚨 TradePilot Alert — ${payload.type.toUpperCase()}`,
    html,
  });
}

/* ======================================================
   API ROUTE (POST)
====================================================== */
export async function POST(req: Request) {
  try {
    /* 🔐 SECRET CHECK (SUPABASE / INTERNAL ONLY) */
    const secret = req.headers.get("x-tp-secret");
    if (secret !== process.env.TP_NOTIFY_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, title, details } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "type and title are required" },
        { status: 400 }
      );
    }

    await sendAdminNotification({ type, title, details });

    return NextResponse.json({ status: "admin_notified" });
  } catch (err: any) {
    console.error("ADMIN NOTIFICATION ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
