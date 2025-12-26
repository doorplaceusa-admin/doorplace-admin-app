/**
 * STEP 3 — IMPORT SHOPIFY PARTNERS INTO SUPABASE (FIXED)
 */

import "dotenv/config";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// ENV
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase env variables");
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// FILE
const INPUT_FILE = "./shopify_partners_export.json";

if (!fs.existsSync(INPUT_FILE)) {
  throw new Error("Partner export file not found");
}

// READ FILE
const partners = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));

console.log("Partners loaded from file:", partners.length);

async function importPartners() {
  let inserted = 0;
  let skipped = 0;

  for (const p of partners) {
    const address = p.default_address || {};

    const record = {
      email_address: p.email?.toLowerCase() || null,
      first_name: p.first_name || null,
      last_name: p.last_name || null,
      cell_phone_number: p.phone || address.phone || null,
      street_address: address.address1 || null,
      city: address.city || null,
      state: address.province || address.province_code || null,
      zip_code: address.zip || null,
      shopify_customer_id: p.id
    };

    // Email is required
    if (!record.email_address) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from("partners")
      .upsert(record, {
        onConflict: "email_address"
      });

    if (error) {
      console.error("Insert error:", record.email_address, error.message);
      skipped++;
    } else {
      inserted++;
    }
  }

  console.log("STEP 3 COMPLETE");
  console.log("Inserted / Updated:", inserted);
  console.log("Skipped:", skipped);
}

importPartners().catch(err => {
  console.error("STEP 3 FAILED:", err.message);
});
