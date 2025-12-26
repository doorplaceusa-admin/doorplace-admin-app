import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import nodemailer from "nodemailer";

// IMPORTANT: Nodemailer requires Node runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generate Doorplace USA Partner ID
 */
function generatePartnerID() {
  return "DP" + Math.floor(1000000 + Math.random() * 9000000);
}

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/* ======================================================
   SHOPIFY TAG SYNC (PRESERVED)
====================================================== */
async function syncShopifyPartnerTags(email: string, newPartnerID: string) {
  const SHOPIFY_STORE = requireEnv("SHOPIFY_STORE");
  const SHOPIFY_API_VERSION = requireEnv("SHOPIFY_API_VERSION");
  const SHOPIFY_ACCESS_TOKEN = requireEnv("SHOPIFY_ACCESS_TOKEN");

  const headers = {
    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    "Content-Type": "application/json",
  };

  const searchRes = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=email:${encodeURIComponent(
      email
    )}`,
    { headers }
  );

  const searchJson = await searchRes.json();
  if (!searchJson.customers || searchJson.customers.length === 0) {
    throw new Error("Shopify customer not found");
  }

  const customer = searchJson.customers[0];

  const existingTags = customer.tags
    ? customer.tags.split(",").map((t: string) => t.trim())
    : [];

  const cleanedTags = existingTags.filter(
    (tag: string) => !tag.startsWith("DP")
  );

  if (!cleanedTags.includes("partner")) cleanedTags.push("partner");
  if (!cleanedTags.includes("swing partner"))
    cleanedTags.push("swing partner");

  cleanedTags.push(newPartnerID);

  const updateRes = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/customers/${customer.id}.json`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({
        customer: {
          id: customer.id,
          tags: cleanedTags.join(", "),
        },
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Shopify update failed: ${errText}`);
  }
}

/* ======================================================
   EMAIL SENDER (PRESERVED)
====================================================== */
async function sendPartnerEmail(partner: any) {
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

  const subject = `Your Doorplace USA Partner ID - ${partner.partner_id}`;

  const htmlBody = `
<div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#000;">
  <h2 style="color:#b80d0d;">Welcome to Doorplace USA!</h2>

  <p>Hello,</p>

  <p>
    You're officially set up as a <strong>Doorplace USA Partner</strong>.
  </p>

  <p>
    Below is your unique Partner ID and Tracking Link, which you’ll use to share
    Doorplace USA swings with potential customers.
  </p>

  <p><strong>Partner ID:</strong><br>
    <span style="background:#fff3a0; padding:6px 10px; display:inline-block; font-weight:bold;">
      ${partner.partner_id}
    </span>
  </p>

  <p><strong>Your Tracking Link:</strong><br>
    <a href="${partner.tracking_link}" target="_blank">
      ${partner.tracking_link}
    </a>
  </p>

  <p>
    You can begin sharing your tracking link anywhere — Facebook Marketplace,
    social media, text messages, or directly with customers.
  </p>

  <p>
    When a customer submits the form through your link, the lead is automatically
    tracked to your Partner ID and routed to our team for follow-up and quoting.
  </p>

  <p>
    Any lead or order that comes through your tracking link will always remain
    associated with your Partner ID.
  </p>

  <p>
    You can track all leads, orders, and commissions through your Partner Dashboard
    at any time.
  </p>

  <p style="margin-top:24px;">
    Welcome aboard,<br>
    <strong>Doorplace USA</strong>
  </p>
</div>
`;


  return transporter.sendMail({
    from: SMTP_FROM,
    to: partner.email_address,
    subject,
    html: htmlBody,
    replyTo: "partners@doorplaceusa.com",
  });
}

async function syncShopifyContactInfo(partner: any) {
  const SHOPIFY_STORE = requireEnv("SHOPIFY_STORE");
  const SHOPIFY_API_VERSION = requireEnv("SHOPIFY_API_VERSION");
  const SHOPIFY_ACCESS_TOKEN = requireEnv("SHOPIFY_ACCESS_TOKEN");

  const headers = {
    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    "Content-Type": "application/json",
  };

  // Find Shopify customer by email
  const searchRes = await fetch(
    `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=email:${encodeURIComponent(
      partner.email_address
    )}`,
    { headers }
  );

  const searchJson = await searchRes.json();
  if (!searchJson.customers || searchJson.customers.length === 0) return;

  const customer = searchJson.customers[0];

  const update: any = { id: customer.id };

  // Phone
  if (partner.cell_phone_number) {
    update.phone = partner.cell_phone_number.replace(/[^\d+]/g, "");

  }

  // Address (safe — only fills what exists)
  if (
    partner.street_address ||
    partner.city ||
    partner.state ||
    partner.zip_code
  ) {
    update.addresses = [
  {
    address1: partner.street_address || "",
    city: partner.city || "",
    province_code: partner.state || "",
    zip: partner.zip_code || "",
    country_code: "US",
    default: true,
  },
];

  }

  // Nothing to update → exit quietly
  if (Object.keys(update).length === 1) return;

  await fetch(
    `https://${SHOPIFY_STORE}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/customers/${customer.id}.json`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ customer: update }),
    }
  );
}


/* ======================================================
   MAIN ROUTE
====================================================== */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, partner_id } = body;

    if (!action || !partner_id) {
      return NextResponse.json(
        { error: "action and partner_id required" },
        { status: 400 }
      );
    }

    /* ===============================
       REGENERATE PARTNER ID
    =============================== */
    if (action === "regenerate_partner_id") {
      const newPartnerID = generatePartnerID();
      const newTrackingLink =
        `https://doorplaceusa.com/pages/swing-partner-lead?partner_id=${newPartnerID}`;

      await supabaseAdmin
        .from("partners")
        .update({
          partner_id: newPartnerID,
          tracking_link: newTrackingLink,
          approval_email_sent: null,
        })
        .eq("partner_id", partner_id);

      return NextResponse.json({
        status: "partner_id_regenerated",
        partner_id: newPartnerID,
        tracking_link: newTrackingLink,
      });
    }

    /* ===============================
       APPROVE PARTNER (NO EMAIL)
    =============================== */
    if (action === "approve_partner") {
  await supabaseAdmin
    .from("partners")
    .update({ approved_at: new Date().toISOString() })
    .eq("partner_id", partner_id);

  return NextResponse.json({ status: "partner_approved" });
}


    /* ===============================
   SEND ONBOARDING EMAIL (FIXED)
=============================== */
if (action === "send_approval_email") {
  const { data: partner, error } = await supabaseAdmin
    .from("partners")
    .select("*")
    .eq("partner_id", partner_id)
    .single();

  if (error || !partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  // ✅ Send email FIRST
  await sendPartnerEmail(partner);

  // ✅ THEN mark approval + email sent
  await supabaseAdmin
    .from("partners")
    .update({
      approval_email_sent: true,
      approved_at: new Date().toISOString(),
    })
    .eq("partner_id", partner_id);

  return NextResponse.json({ status: "email_sent_and_marked" });
}


    /* ===============================
       RESET EMAIL STATUS
    =============================== */
    if (action === "reset_approval_email") {
      await supabaseAdmin
        .from("partners")
        .update({ approval_email_sent: null })
        .eq("partner_id", partner_id);

      return NextResponse.json({ status: "email_status_reset" });
    }

    /* ===============================
       DELETE PARTNER
    =============================== */
    if (action === "delete_partner") {
      await supabaseAdmin
        .from("partners")
        .delete()
        .eq("partner_id", partner_id);

      return NextResponse.json({ status: "partner_deleted" });
    }

    /* ===============================
       SYNC SHOPIFY TAGS
    =============================== */
    if (action === "sync_shopify_tags") {
      const { data: partner } = await supabaseAdmin
        .from("partners")
        .select("*")
        .eq("partner_id", partner_id)
        .single();

      if (!partner) {
        return NextResponse.json(
          { error: "Partner not found" },
          { status: 404 }
        );
      }

      await syncShopifyPartnerTags(
        partner.email_address,
        partner.partner_id
      );

      await syncShopifyContactInfo(partner);


      await supabaseAdmin
  .from("partners")
  .update({ shopify_synced: true })
  .eq("partner_id", partner_id);


      return NextResponse.json({ status: "shopify_tags_synced" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("PARTNER ACTION ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
