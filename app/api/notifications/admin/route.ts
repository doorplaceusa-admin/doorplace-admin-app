import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
   SHARED SMTP TRANSPORT
====================================================== */
const transporter = nodemailer.createTransport({
  host: requireEnv("SMTP_HOST"),
  port: Number(requireEnv("SMTP_PORT")),
  secure: false,
  requireTLS: true,
  auth: {
    user: requireEnv("SMTP_USER"),
    pass: requireEnv("SMTP_PASS"),
  },
});

/* ======================================================
   EMAIL SENDER
====================================================== */
async function sendAdminEmail(payload: {
  type: string;
  title: string;
  details?: Record<string, any>;
}) {
  const SMTP_FROM = requireEnv("SMTP_FROM");
  const ADMIN_ALERT_EMAIL = requireEnv("ADMIN_ALERT_EMAIL");

  const rows = payload.details
    ? Object.entries(payload.details)
        .map(
          ([k, v]) => `
          <tr>
            <td style="padding:6px 10px;font-weight:bold;">${k}</td>
            <td style="padding:6px 10px;">${v ?? ""}</td>
          </tr>`
        )
        .join("")
    : "";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;">
      <h2 style="color:#b80d0d;">🚨 TradePilot Admin Alert</h2>
      <p><strong>Type:</strong> ${payload.type.toUpperCase()}</p>
      <p><strong>Summary:</strong> ${payload.title}</p>
      ${
        rows
          ? `<table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:12px;">${rows}</table>`
          : ""
      }
    </div>
  `;

  await transporter.sendMail({
    from: SMTP_FROM,
    to: ADMIN_ALERT_EMAIL,
    subject: `🚨 TradePilot — ${payload.title}`,
    html,
  });
}

/* ======================================================
   POST — DIRECT / TEST SEND
====================================================== */
export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-tp-secret");
    if (secret !== requireEnv("TP_NOTIFY_SECRET")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, title, details } = await req.json();

    if (!type || !title) {
      return NextResponse.json(
        { error: "type and title required" },
        { status: 400 }
      );
    }

    await sendAdminEmail({ type, title, details });

    return NextResponse.json({ status: "email_sent" });
  } catch (err) {
    console.error("ADMIN EMAIL ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ======================================================
   GET — PROCESS admin_alerts QUEUE
====================================================== */
export async function GET() {
  try {
    const { data: alerts, error } = await supabaseAdmin
      .from("admin_alerts")
      .select("*")
      .eq("email_sent", false)
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) throw error;

    for (const alert of alerts ?? []) {
      try {
        await sendAdminEmail({
          type: alert.type,
          title: alert.title,
          details: alert.payload,
        });

        await supabaseAdmin
          .from("admin_alerts")
          .update({ email_sent: true })
          .eq("id", alert.id);
      } catch (emailErr) {
        console.error("FAILED ALERT EMAIL:", alert.id, emailErr);
      }
    }

    return NextResponse.json({
      processed: alerts?.length ?? 0,
    });
  } catch (err) {
    console.error("ALERT QUEUE ERROR:", err);
    return NextResponse.json(
      { error: "Queue processing failed" },
      { status: 500 }
    );
  }
}
