/**
 * STEP 4 — REPAIR PARTNER CONTACT DATA
 *
 * - Reads Shopify notes
 * - Extracts phone + address
 * - Updates Supabase partners table
 *
 * REQUIRED COLUMNS (partners table):
 * - email_address
 * - cell_phone_number
 * - street_address
 * - city
 * - state
 * - zip_code
 */

import "dotenv/config";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase env variables");
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

const INPUT_FILE = "./shopify_partners_export.json";

function extractFromNote(note = "") {
  const phoneMatch = note.match(/Cell Phone:\s*([0-9\-()\s]+)/i);
  const addressMatch = note.match(/Address:\s*(.+)/i);

  let street = null;
  let city = null;
  let state = null;
  let zip = null;

  if (addressMatch) {
    const parts = addressMatch[1].split(",");
    street = parts[0]?.trim() || null;
    city = parts[1]?.trim() || null;

    if (parts[2]) {
      const stateZip = parts[2].trim().split(" ");
      state = stateZip[0] || null;
      zip = stateZip[1] || null;
    }
  }

  return {
    cell_phone_number: phoneMatch ? phoneMatch[1].trim() : null,
    street_address: street,
    city,
    state,
    zip_code: zip
  };
}

async function repairPartners() {
  console.log("Starting partner contact repair…");

  const partners = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));

  let updated = 0;
  let skipped = 0;

  for (const p of partners) {
    if (!p.email || !p.note) {
      skipped++;
      continue;
    }

    const extracted = extractFromNote(p.note);

    if (
      !extracted.cell_phone_number &&
      !extracted.street_address
    ) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from("partners")
      .update(extracted)
      .eq("email_address", p.email);

    if (error) {
      console.error(
        `Update error (${p.email}):`,
        error.message
      );
      continue;
    }

    updated++;
  }

  console.log("STEP 4 COMPLETE");
  console.log("Updated:", updated);
  console.log("Skipped:", skipped);
}

repairPartners().catch(err => {
  console.error("STEP 4 FAILED:", err.message);
});
