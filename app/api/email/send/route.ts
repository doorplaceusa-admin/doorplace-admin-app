// app/api/email/send/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SegmentKey =
  | "all"
  | "login_users"
  | "no_login"
  | "email_not_verified"
  | "ready_for_activation"
  | "welcome_email_not_sent_login"
  | "pending"
  | "active";

  type FromKey = "partners" | "support" | "info";


function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const FROM_MAP: Record<FromKey, string> = {
  partners: `"Doorplace USA Partners" <partners@doorplaceusa.com>`,
  support: `"Doorplace USA Support" <support@doorplaceusa.com>`,
  info: `"Doorplace USA" <info@doorplaceusa.com>`,
};


function parseEmails(input: string) {
  // supports commas, semicolons, spaces, newlines
  return Array.from(
    new Set(
      (input || "")
        .split(/[,;\s]+/g)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.toLowerCase())
    )
  );
}

function applyPartnerSegment(query: any, segment: SegmentKey) {
  switch (segment) {
    case "login_users":
      return query.not("auth_user_id", "is", null);

    case "no_login":
      return query.is("auth_user_id", null);

    case "email_not_verified":
      return query.eq("email_verified", false);

    case "pending":
      return query.eq("status", "pending");

    case "active":
      return query.eq("status", "active");

    case "ready_for_activation":
      return query
        .not("auth_user_id", "is", null)
        .eq("email_verified", true)
        .eq("status", "pending");

    case "welcome_email_not_sent_login":
      return query
        .not("auth_user_id", "is", null)
        .eq("status", "pending")
        .eq("welcome_email_sent", false);

    case "all":
    default:
      return query;
  }
}

function getTransporter() {
  const SMTP_HOST = requireEnv("SMTP_HOST");
  const SMTP_PORT = Number(requireEnv("SMTP_PORT"));
  const SMTP_USER = requireEnv("SMTP_USER");
  const SMTP_PASS = requireEnv("SMTP_PASS");

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendSingleEmail({
  transporter,
  to,
  subject,
  html,
  fromKey,
}: {
  transporter: nodemailer.Transporter;
  to: string;
  subject: string;
  html: string;
  fromKey: FromKey;
}) {
  return transporter.sendMail({
    from: FROM_MAP[fromKey],
    to,
    subject,
    html,

    // ✅ Replies always go back to support
    replyTo: "support@doorplaceusa.com",
  });
}


export async function POST(req: Request) {
  try {
    const body = await req.json();

    const mode = body?.mode as "manual" | "segment";
    const toRaw = (body?.to || "") as string; // manual
    const segment = (body?.segment || "all") as SegmentKey; // segment
    const subject = (body?.subject || "") as string;
    const html = (body?.html || "") as string;
    const fromKey = (body?.from || "support") as FromKey;


    const delayMs =
      typeof body?.delayMs === "number" ? Math.max(0, body.delayMs) : 2000;

    if (!subject.trim()) {
      return NextResponse.json({ error: "subject required" }, { status: 400 });
    }
    if (!html.trim()) {
      return NextResponse.json({ error: "html required" }, { status: 400 });
    }
    if (mode !== "manual" && mode !== "segment") {
      if (!["partners", "support", "info"].includes(fromKey)) {
  return NextResponse.json(
    { error: "invalid from address" },
    { status: 400 }
  );
}

      return NextResponse.json({ error: "invalid mode" }, { status: 400 });
    }

    const transporter = getTransporter();

    let recipients: string[] = [];

    if (mode === "manual") {
      recipients = parseEmails(toRaw);
      if (recipients.length === 0) {
        return NextResponse.json(
          { error: "No recipient emails provided." },
          { status: 400 }
        );
      }
    } else {
      let q = supabaseAdmin.from("partners").select("email_address");
      q = applyPartnerSegment(q, segment);

      const { data, error } = await q;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      recipients = Array.from(
        new Set(
          (data || [])
            .map((r: any) => (r?.email_address || "").toLowerCase().trim())
            .filter(Boolean)
        )
      );

      if (recipients.length === 0) {
        return NextResponse.json({
          status: "ok",
          mode,
          segment,
          count: 0,
          results: [],
        });
      }
    }

    const results: { email: string; status: "sent" | "failed"; error?: string }[] =
      [];

    for (let i = 0; i < recipients.length; i++) {
      const email = recipients[i];

      try {
        await sendSingleEmail({
  transporter,
  to: email,
  subject,
  html,
  fromKey,
});
        results.push({ email, status: "sent" });
      } catch (err: any) {
        results.push({
          email,
          status: "failed",
          error: err?.message || "send failed",
        });
      }

      if (i < recipients.length - 1 && delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      status: "ok",
      mode,
      segment: mode === "segment" ? segment : null,
      count: recipients.length,
      sent,
      failed,
      results,
    });
  } catch (err: any) {
    console.error("EMAIL SEND ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
