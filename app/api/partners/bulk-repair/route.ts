// app/api/partners/bulk-repair/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ======================================================
   HELPERS / UTILS (PRESERVED + EXTENDED)
====================================================== */
function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const SHOPIFY_STORE = requireEnv("SHOPIFY_STORE");
const SHOPIFY_API_VERSION = requireEnv("SHOPIFY_API_VERSION");
const SHOPIFY_ACCESS_TOKEN = requireEnv("SHOPIFY_ACCESS_TOKEN");

/* ---------- RATE LIMIT CONTROL ---------- */
// Shopify error you hit: "Exceeded 2 calls per second"
// Hard throttle to 1 request every 600ms (safe)
const SHOPIFY_THROTTLE_MS = 600;
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/* ---------- SHOPIFY HELPERS ---------- */
async function getShopifyCustomerByEmail(email: string) {
  await sleep(SHOPIFY_THROTTLE_MS);

  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=email:${encodeURIComponent(
      email
    )}`,
    {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Shopify search failed: ${t}`);
  }

  const json = await res.json();
  return json.customers?.[0] || null;
}

async function updateShopifyTags(customerId: number, tags: string[]) {
  await sleep(SHOPIFY_THROTTLE_MS);

  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/customers/${customerId}.json`,
    {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: {
          id: customerId,
          tags: tags.join(", "),
        },
      }),
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Shopify update failed: ${txt}`);
  }
}

/* ---------- EMAIL ---------- */
async function sendOnboardingEmail(partner: any) {
  const SMTP_HOST = requireEnv("SMTP_HOST");
  const SMTP_PORT = Number(requireEnv("SMTP_PORT"));
  const SMTP_USER = requireEnv("SMTP_USER");
  const SMTP_PASS = requireEnv("SMTP_PASS");
  const SMTP_FROM = requireEnv("SMTP_FROM");

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
  <h2 style="color:#b80d0d;">Welcome to Doorplace USA</h2>
  <p><b>Partner ID:</b> ${partner.partner_id}</p>
  <p>
    <a href="https://doorplaceusa.com/pages/swing-partner-lead?partner_id=${partner.partner_id}">
      Your Tracking Link
    </a>
  </p>
  <p>You are now fully set up.</p>
</div>
`;

  await transporter.sendMail({
    from: SMTP_FROM,
    to: partner.email_address,
    subject: `Your Doorplace USA Partner ID - ${partner.partner_id}`,
    html,
  });
}

/* ======================================================
   BULK REPAIR ROUTE
   - Dry Run
   - Per-partner log
   - Progress data
   - Rate limit safe
====================================================== */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;

    const { data: partners, error } = await supabaseAdmin
      .from("partners")
      .select("*");

    if (error) throw error;

    let repaired = 0;
    let emailsSent = 0;
    let alreadyClean = 0;
    let skipped = 0;

    const results: any[] = [];

    for (const partner of partners) {
      const log: any = {
        id: partner.id,
        email: partner.email_address,
        partner_id_before: partner.partner_id,
        partner_id_after: partner.partner_id,
        shopify_synced: false,
        email_sent: false,
        skipped: false,
        reason: null,
      };

      if (!partner.email_address) {
        skipped++;
        log.skipped = true;
        log.reason = "missing_email";
        results.push(log);
        continue;
      }

      const customer = await getShopifyCustomerByEmail(
        partner.email_address
      );

      if (!customer) {
        skipped++;
        log.skipped = true;
        log.reason = "shopify_customer_not_found";
        results.push(log);
        continue;
      }

      const existingTags = customer.tags
        ? customer.tags.split(",").map((t: string) => t.trim())
        : [];

      const dpTags = existingTags.filter((t: string) =>
        t.startsWith("DP")
      );

      const canonicalPartnerID =
        dpTags.length > 0 ? dpTags[0] : partner.partner_id;

      log.partner_id_after = canonicalPartnerID;

      // Detect already-clean
      if (
        dpTags.length === 1 &&
        partner.partner_id === dpTags[0] &&
        partner.onboarding_email_sent
      ) {
        alreadyClean++;
        log.reason = "already_clean";
        results.push(log);
        continue;
      }

      // Clean tags
      const cleanedTags = existingTags.filter(
        (t: string) => !t.startsWith("DP")
      );

      if (!cleanedTags.includes("partner")) cleanedTags.push("partner");
      if (!cleanedTags.includes("swing partner"))
        cleanedTags.push("swing partner");

      cleanedTags.push(canonicalPartnerID);

      if (!dryRun) {
        await updateShopifyTags(customer.id, cleanedTags);
        log.shopify_synced = true;
      }

      // Email resend logic (truth-based)
      let emailSentNow = false;
      if (!partner.onboarding_email_sent) {
        if (!dryRun) {
          await sendOnboardingEmail({
            ...partner,
            partner_id: canonicalPartnerID,
          });
        }
        emailSentNow = true;
        emailsSent++;
        log.email_sent = true;
      }

      if (!dryRun) {
        await supabaseAdmin
          .from("partners")
          .update({
            partner_id: canonicalPartnerID,
            tracking_link: `https://doorplaceusa.com/pages/swing-partner-lead?partner_id=${canonicalPartnerID}`,
            onboarding_email_sent:
              emailSentNow || partner.onboarding_email_sent,
          })
          .eq("id", partner.id);
      }

      repaired++;
      results.push(log);
    }

    return NextResponse.json({
      success: true,
      dryRun,
      totals: {
        repaired,
        emailsSent,
        alreadyClean,
        skipped,
        totalPartners: partners.length,
      },
      results, // per-partner repair log
    });
  } catch (err: any) {
    console.error("BULK REPAIR ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Bulk repair failed" },
      { status: 500 }
    );
  }
}
