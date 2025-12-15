import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import nodemailer from "nodemailer";

// IMPORTANT: Nodemailer requires Node runtime
export const runtime = "nodejs";

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
  <h2 style="color:#b80d0d;">Welcome to Doorplace USA!</h2>
  <p>Hello${name ? ` ${name}` : ""},</p>
  <p><strong>Partner ID:</strong> ${partner.partner_id}</p>
  <p>
    <strong>Tracking Link:</strong><br>
    <a href="${partner.tracking_link}" target="_blank">${partner.tracking_link}</a>
  </p>
  <p>Welcome aboard,<br><strong>Doorplace USA</strong></p>
</div>`;

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
       SYNC SHOPIFY TAGS (NEW)
    =============================== */
    if (action === "sync_shopify_tags") {
      const SHOPIFY_STORE = requireEnv("SHOPIFY_STORE");
      const SHOPIFY_TOKEN = requireEnv("SHOPIFY_ADMIN_TOKEN");
      const API_VERSION = "2025-01";

      const { data: partner, error } = await supabaseAdmin
        .from("partners")
        .select("email_address, partner_id")
        .eq("partner_id", partner_id)
        .single();

      if (error || !partner) {
        return NextResponse.json({ error: "Partner not found" }, { status: 404 });
      }

      const searchRes = await fetch(
        `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/customers/search.json?query=email:${encodeURIComponent(
          partner.email_address
        )}`,
        {
          headers: {
            "X-Shopify-Access-Token": SHOPIFY_TOKEN,
          },
        }
      );

      const searchJson = await searchRes.json();
      const customer = searchJson.customers?.[0];
      if (!customer) {
        return NextResponse.json({ error: "Shopify customer not found" }, { status: 404 });
      }

      const existingTags = customer.tags
        ? customer.tags.split(",").map((t: string) => t.trim())
        : [];

      const newTags = Array.from(
        new Set([
          ...existingTags,
          "partner",
          "swing partner",
          partner.partner_id,
          ...tags,
        ])
      );

      await fetch(
        `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/customers/${customer.id}.json`,
        {
          method: "PUT",
          headers: {
            "X-Shopify-Access-Token": SHOPIFY_TOKEN,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: { id: customer.id, tags: newTags.join(", ") },
          }),
        }
      );

      return NextResponse.json({ status: "shopify_tags_synced", tags: newTags });
    }
/* ===============================
   SYNC SHOPIFY TAGS
=============================== */
if (action === "sync_shopify_tags") {
  const { tags } = body;

  if (!Array.isArray(tags)) {
    return NextResponse.json(
      { error: "tags must be an array" },
      { status: 400 }
    );
  }

  // 1️⃣ Get partner data
  const { data: partner, error } = await supabaseAdmin
    .from("partners")
    .select("email_address, partner_id")
    .eq("partner_id", partner_id)
    .single();

  if (error || !partner) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  // 2️⃣ Shopify ENV
  const SHOPIFY_STORE = requireEnv("SHOPIFY_STORE");
  const SHOPIFY_TOKEN = requireEnv("SHOPIFY_ADMIN_TOKEN");
  const API_VERSION = "2025-01";

  // 3️⃣ Find customer by email
  const searchRes = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/customers/search.json?query=email:${encodeURIComponent(
      partner.email_address
    )}`,
    {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
      },
    }
  );

  const searchJson = await searchRes.json();
  const customer = searchJson.customers?.[0];

  if (!customer) {
    return NextResponse.json(
      { error: "Shopify customer not found" },
      { status: 404 }
    );
  }

  // 4️⃣ Merge tags
  const existingTags = customer.tags
    ? customer.tags.split(",").map((t: string) => t.trim())
    : [];

  const finalTags = Array.from(
    new Set([...existingTags, ...tags, partner.partner_id])
  );

  // 5️⃣ Update Shopify
  await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/customers/${customer.id}.json`,
    {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: {
          id: customer.id,
          tags: finalTags.join(", "),
        },
      }),
    }
  );

  return NextResponse.json({ status: "shopify_tags_synced" });
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
