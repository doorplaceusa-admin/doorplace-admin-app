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
async function syncShopifyPartnerTags(
  email: string,
  newPartnerID: string
) {
  const SHOPIFY_STORE = requireEnv("SHOPIFY_STORE");
  const SHOPIFY_API_VERSION = requireEnv("SHOPIFY_API_VERSION");
  const SHOPIFY_ACCESS_TOKEN = requireEnv("SHOPIFY_ACCESS_TOKEN");

  const headers = {
    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    "Content-Type": "application/json",
  };

  // 1️⃣ Find customer by email
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
  const customerId = customer.id;

  // 2️⃣ Clean tags — REMOVE ALL DP TAGS
  const existingTags = customer.tags
    ? customer.tags.split(",").map((t: string) => t.trim())
    : [];

  const cleanedTags = existingTags.filter(
    (tag: string) => !tag.startsWith("DP")
  );

  // 3️⃣ Ensure required partner tags
  if (!cleanedTags.includes("partner")) cleanedTags.push("partner");
  if (!cleanedTags.includes("swing partner"))
    cleanedTags.push("swing partner");

  // 4️⃣ Add NEW Partner ID
  cleanedTags.push(newPartnerID);

  // 5️⃣ Update Shopify customer
  const updateRes = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/customers/${customerId}.json`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({
        customer: {
          id: customerId,
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, partner_id, tags = [] } = body;

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

      const { error } = await supabaseAdmin
        .from("partners")
        .update({
          partner_id: newPartnerID,
          tracking_link: newTrackingLink,
          onboarding_email_sent: false,
        })
        .eq("partner_id", partner_id);

      if (error) throw error;

      return NextResponse.json({
        status: "partner_id_regenerated",
        partner_id: newPartnerID,
        tracking_link: newTrackingLink,
      });
    }

    /* ===============================
       SEND ONBOARDING EMAIL (SMTP)
    =============================== */
    if (action === "mark_email_sent") {
      const { data: partner, error } = await supabaseAdmin
        .from("partners")
        .select("email_address, first_name, last_name, partner_id, tracking_link")
        .eq("partner_id", partner_id)
        .single();

      if (error || !partner) {
        return NextResponse.json({ error: "Partner not found" }, { status: 404 });
      }

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

      const name = `${partner.first_name || ""} ${partner.last_name || ""}`.trim();
      const subject = `Your Doorplace USA Partner ID - ${partner.partner_id}`;

      const htmlBody = `
<div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #000; line-height: 1.6;">

  <h2 style="color:#b80d0d; margin-bottom: 14px;">
    Welcome to Doorplace USA!
  </h2>

  <p>Hello,</p>

  <p>
    You're officially set up as a <strong>Doorplace USA Partner</strong>.
  </p>

  <p>
    Below is your unique Partner ID and Tracking Link, which you’ll use to share
    Doorplace USA swings with potential customers.
  </p>

  <p>
    <strong>Partner ID:</strong><br>
    <span style="background:#fff3a0; padding:6px 10px; display:inline-block; font-weight:bold;">
      ${partner.partner_id}
    </span>
  </p>

  <p>
    <strong>Your Tracking Link:</strong><br>
    <a href="${partner.tracking_link}" target="_blank">
      ${partner.tracking_link}
    </a>
  </p>

  <p>
    You can begin sharing your tracking link anywhere —
    Facebook Marketplace, social media, text messages,
    or directly with customers.
  </p>

  <p>
    When a customer submits the form through your link,
    the lead is automatically tracked to your Partner ID
    and routed to our team for follow-up and quoting.
  </p>

  <p>
    Any lead or order that comes through your tracking link
    will always remain associated with your Partner ID.
  </p>

  <p>
    You can track all leads, orders, and commissions through
    your Partner Dashboard at any time.
  </p>

  <br>

  <p>
    Welcome aboard,<br>
    <strong>Doorplace USA</strong>
  </p>

</div>
`;


      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to: partner.email_address,
        subject,
        html: htmlBody,
        replyTo: "partners@doorplaceusa.com",
      });

      await supabaseAdmin
        .from("partners")
        .update({ onboarding_email_sent: true })
        .eq("partner_id", partner_id);

      return NextResponse.json({ status: "email_sent", messageId: info.messageId });
    }

    /* ===============================
       DELETE PARTNER
    =============================== */
    if (action === "delete_partner") {
      const { error } = await supabaseAdmin
        .from("partners")
        .delete()
        .eq("partner_id", partner_id);

      if (error) throw error;

      return NextResponse.json({ status: "partner_deleted" });
    }

    
/* ===============================
   SYNC SHOPIFY TAGS (CLEAN + SAFE)
=============================== */
if (action === "sync_shopify_tags") {
  // 1️⃣ Get partner data
  const { data: partner, error } = await supabaseAdmin
    .from("partners")
    .select("email_address, partner_id")
    .eq("partner_id", partner_id)
    .single();

  if (error || !partner) {
    return NextResponse.json(
      { error: "Partner not found" },
      { status: 404 }
    );
  }

  // 2️⃣ ENV
  const SHOPIFY_STORE = requireEnv("SHOPIFY_STORE");
  const SHOPIFY_ACCESS_TOKEN = requireEnv("SHOPIFY_ACCESS_TOKEN");
  const SHOPIFY_API_VERSION = requireEnv("SHOPIFY_API_VERSION");

  const headers = {
    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    "Content-Type": "application/json",
  };

  // 3️⃣ Find Shopify customer by email
  const searchRes = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=email:${encodeURIComponent(
      partner.email_address
    )}`,
    { headers }
  );

  const searchJson = await searchRes.json();
  const customer = searchJson.customers?.[0];

  if (!customer) {
    return NextResponse.json(
      { error: "Shopify customer not found" },
      { status: 404 }
    );
  }

  // 4️⃣ Strip ALL old DP* tags
  const existingTags = customer.tags
    ? customer.tags.split(",").map((t: string) => t.trim())
    : [];

  const cleanedTags = existingTags.filter(
    (tag: string) => !tag.startsWith("DP")
  );

  // 5️⃣ Ensure base partner tags
  if (!cleanedTags.includes("partner")) cleanedTags.push("partner");
  if (!cleanedTags.includes("swing partner"))
    cleanedTags.push("swing partner");

  // 6️⃣ Add current Partner ID ONLY
  cleanedTags.push(partner.partner_id);

  // 7️⃣ Update Shopify customer
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

  return NextResponse.json({
    status: "shopify_tags_synced",
    tags: cleanedTags,
  });
}



    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("PARTNER ACTION ERROR:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
