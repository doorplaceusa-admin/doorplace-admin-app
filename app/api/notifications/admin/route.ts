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

  const html = `
<div style="font-family: Arial, Helvetica, sans-serif; background:#f6f7f9; padding:24px;">
  <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e0e0e0;">

    <!-- Header -->
    <div style="background:#b80d0d; color:#ffffff; padding:16px 20px;">
      <h2 style="margin:0; font-size:20px;">🚨 TradePilot Admin Alert</h2>
    </div>

    <!-- Body -->
    <div style="padding:20px;">
      <p style="margin:0 0 8px 0; font-size:14px;">
        <strong>Event Type:</strong>
        <span style="text-transform:uppercase;">${payload.type}</span>
      </p>

      <p style="margin:0 0 16px 0; font-size:16px;">
        <strong>${payload.title}</strong>
      </p>

      ${
        payload.details
          ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:14px;">
            ${Object.entries(payload.details)
              .map(([key, value]) => {
                let displayValue = value ?? "";

                if (key === "email") {
                  displayValue = `<a href="mailto:${value}" style="color:#b80d0d; text-decoration:none; font-weight:600;">${value}</a>`;
                }

                if (key === "phone") {
                  displayValue = `<a href="tel:${value}" style="color:#b80d0d; text-decoration:none; font-weight:600;">${value}</a>`;
                }

                return `
                <tr>
                  <td style="padding:8px 6px; color:#555; width:40%; text-transform:capitalize;">
                    ${key.replace(/_/g, " ")}
                  </td>
                  <td style="padding:8px 6px; color:#000; font-weight:600;">
                    ${displayValue}
                  </td>
                </tr>
                `;
              })
              .join("")}
          </table>
          `
          : ""
      }

      <!-- Button -->
      <div style="margin-top:24px; text-align:center;">
        <a
          href="https://tradepilot.doorplaceusa.com/dashboard/leads"
          target="_blank"
          style="
            display:inline-block;
            background:#b80d0d;
            color:#ffffff;
            padding:12px 20px;
            border-radius:6px;
            text-decoration:none;
            font-weight:600;
            font-size:14px;
          "
        >
          View Lead
        </a>
      </div>

      <p style="margin-top:20px; font-size:13px; color:#666; text-align:center;">
        Log in to <strong>TradePilot</strong> to review full details.
      </p>
    </div>

  </div>
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
