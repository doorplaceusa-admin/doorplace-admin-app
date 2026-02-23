/* ======================================================
   ✅ ENV LOADING (PM2 SAFE)
====================================================== */

import dotenv from "dotenv";
dotenv.config({ path: "/var/www/doorplace-admin-app/.env.local" });

/* ======================================================
   IMPORTS
====================================================== */

import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* ======================================================
   ENTERPRISE SETTINGS
====================================================== */

const INTERVAL_MS = 60_000;
const SEND_DELAY_MS = 1000;
const MAX_SEQUENCE = 30;

/* ======================================================
   HELPERS
====================================================== */

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/* ======================================================
   SEGMENT LOGIC (MATCHES DASHBOARD)
====================================================== */

type SegmentKey =
  | "all"
  | "login_users"
  | "no_login"
  | "email_not_verified"
  | "ready_for_activation"
  | "welcome_email_not_sent_login"
  | "pending"
  | "active";

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

/* ======================================================
   EMAIL TRANSPORT
====================================================== */

const transporter = nodemailer.createTransport({
  host: requireEnv("SMTP_HOST"),
  port: Number(requireEnv("SMTP_PORT")),
  secure: true,
  auth: {
    user: requireEnv("SMTP_USER"),
    pass: requireEnv("SMTP_PASS"),
  },
});

console.log("=== SMTP DEBUG ===");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("===================");

const FROM_MAP: Record<string, string> = {
  partners: `"Doorplace USA Partners" <partners@doorplaceusa.com>`,
  support: `"Doorplace USA Support" <support@doorplaceusa.com>`,
  info: `"Doorplace USA" <info@doorplaceusa.com>`,
};

/* ======================================================
   FETCH SETTINGS
====================================================== */

async function getSettings() {
  const { data, error } = await supabaseAdmin
    .from("email_automation_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("❌ Failed to load automation settings:", error.message);
    return null;
  }

  return data;
}

/* ======================================================
   FETCH TEMPLATE
====================================================== */

async function getTemplate(sequence: number) {
  const { data, error } = await supabaseAdmin
    .from("email_templates")
    .select("*")
    .eq("sequence_number", sequence)
    .eq("active", true)
    .single();

  if (error || !data) {
    console.log(`⚠️ No template found for sequence ${sequence}`);
    return null;
  }

  return data;
}

/* ======================================================
   FETCH RECIPIENTS (FULL SEGMENT SUPPORT)
====================================================== */

async function getRecipients(segment: SegmentKey) {
  let query = supabaseAdmin.from("partners").select("email_address");

  query = applyPartnerSegment(query, segment);

  const { data, error } = await query;

  if (error) {
    console.error("❌ Failed to fetch recipients:", error.message);
    return [];
  }

  return Array.from(
    new Set(
      (data || [])
        .map((p: any) => p.email_address?.toLowerCase().trim())
        .filter(Boolean)
    )
  );
}

/* ======================================================
   SEND CAMPAIGN
====================================================== */

async function sendCampaign(settings: any) {
  const today = new Date().toISOString().split("T")[0];

  if (settings.last_sent_date === today) {
    console.log("📭 Already sent today.");
    return;
  }

  const template = await getTemplate(settings.current_sequence);
  if (!template) return;

  const recipients = await getRecipients(settings.segment);

  if (!recipients.length) {
    console.log("📭 No recipients found.");
    return;
  }

  console.log(
    `📨 Sending sequence ${settings.current_sequence} to ${recipients.length} partners`
  );

  for (const email of recipients) {
    try {
      await transporter.sendMail({
        from: FROM_MAP[settings.from_key],
        to: email,
        subject: template.subject,
        html: template.body,
        replyTo: "support@doorplaceusa.com",
      });
    } catch (err: any) {
  console.log("❌ Failed:", email);
  console.log("Error message:", err?.message);
  console.log("Error response:", err?.response);
  console.log("Full error object:", err);
}

    await sleep(SEND_DELAY_MS);
  }

  const nextSequence =
    settings.current_sequence >= MAX_SEQUENCE
      ? 1
      : settings.current_sequence + 1;

  await supabaseAdmin
    .from("email_automation_settings")
    .update({
      current_sequence: nextSequence,
      last_sent_date: today,
    })
    .eq("id", 1);

  console.log("✅ Daily campaign complete.");
}

/* ======================================================
   MAIN LOOP (ENTERPRISE SAFE)
====================================================== */

console.log("🔥 Daily Email Worker Started (Enterprise Mode)");

async function runForever() {
  while (true) {
    try {
      const settings = await getSettings();

      if (!settings?.enabled) {
        await sleep(INTERVAL_MS);
        continue;
      }

      const now = new Date();
      const [hour, minute] = settings.send_time.split(":").map(Number);

      const sendTime = new Date();
      sendTime.setHours(hour, minute, 0, 0);

      if (now >= sendTime) {
        await sendCampaign(settings);
      }
    } catch (err) {
      console.error("❌ Worker crash prevented:", err);
    }

    await sleep(INTERVAL_MS);
  }
}

runForever();