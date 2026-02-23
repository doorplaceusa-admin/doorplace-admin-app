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
  return Array.from(
    new Set(
      (input || "")
        .split(/[,;\s]+/g)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

/* ======================================================
   TRANSPORTER WITH POOLING + SAFETY
====================================================== */

function getTransporter() {
  return nodemailer.createTransport({
    host: requireEnv("SMTP_HOST"),
    port: Number(requireEnv("SMTP_PORT")),
    secure: false,
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    rateDelta: 60000,
    rateLimit: 30, // max 30 per minute
    auth: {
      user: requireEnv("SMTP_USER"),
      pass: requireEnv("SMTP_PASS"),
    },
  });
}

/* ======================================================
   SEGMENT FILTER
====================================================== */

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
    default:
      return query;
  }
}

/* ======================================================
   ROUTE
====================================================== */

export async function POST(req: Request) {
  const startTime = new Date();

  try {
    const body = await req.json();

    const mode = body?.mode as "manual" | "segment";
    const subject = body?.subject || "";
    const html = body?.html || "";
    const segment = (body?.segment || "all") as SegmentKey;
    const toRaw = body?.to || "";
    const fromKey = (body?.from || "support") as FromKey;
    const delayMs =
      typeof body?.delayMs === "number" ? Math.max(0, body.delayMs) : 1000;

    if (!subject.trim()) {
      return NextResponse.json({ error: "subject required" }, { status: 400 });
    }

    if (!html.trim()) {
      return NextResponse.json({ error: "html required" }, { status: 400 });
    }

    console.log("====================================");
    console.log("🚀 EMAIL CAMPAIGN START");
    console.log("Time:", startTime.toISOString());
    console.log("Mode:", mode);
    console.log("Subject:", subject);
    console.log("====================================");

    const transporter = getTransporter();

    let recipients: string[] = [];

    if (mode === "manual") {
      recipients = parseEmails(toRaw);
    } else {
      let q = supabaseAdmin
        .from("partners")
        .select("email_address")
        .order("email_address", { ascending: true });

      q = applyPartnerSegment(q, segment);

      const { data, error } = await q;

      if (error) {
        console.error("❌ Segment query error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      recipients = Array.from(
        new Set(
          (data || [])
            .map((r: any) =>
              (r?.email_address || "").toLowerCase().trim()
            )
            .filter(Boolean)
        )
      );
    }

    console.log("📬 Total Recipients:", recipients.length);

    const results: any[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const email = recipients[i];

      console.log(`[${i + 1}/${recipients.length}] Sending to ${email}`);

      try {
        await transporter.sendMail({
          from: FROM_MAP[fromKey],
          to: email,
          subject,
          html,
          replyTo: "support@doorplaceusa.com",
        });

        console.log(`✅ SENT: ${email}`);
        results.push({ email, status: "sent" });
      } catch (err: any) {
        console.log(`❌ FAILED: ${email}`);
        console.log("Error:", err?.message);
        console.log("Response:", err?.response);
        results.push({
          email,
          status: "failed",
          error: err?.message,
        });
      }

      if (i < recipients.length - 1 && delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "failed").length;

    console.log("====================================");
    console.log("🏁 CAMPAIGN COMPLETE");
    console.log("Sent:", sent);
    console.log("Failed:", failed);
    console.log("Duration (sec):", (Date.now() - startTime.getTime()) / 1000);
    console.log("====================================");

    return NextResponse.json({
      status: "ok",
      count: recipients.length,
      sent,
      failed,
      results,
    });
  } catch (err: any) {
    console.error("💥 EMAIL ROUTE CRASH:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}