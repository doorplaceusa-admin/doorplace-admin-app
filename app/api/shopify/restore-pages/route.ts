export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createShopifyPage } from "@/lib/shopify/createShopifyPage";

/**
 * FULL SHOPIFY RESTORE
 * - Restores pages from backup
 * - SKIPS "crib Porch Swing" pages
 * - Heavy rate limiting protection
 * - Verbose logging
 */

function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
}

export async function POST() {
  log("=== FULL RESTORE STARTED ===");

  try {
    const backupPath = path.join(
      process.env.USERPROFILE || "",
      "Desktop",
      "shopify-backup.json"
    );

    if (!fs.existsSync(backupPath)) {
      throw new Error("Backup file not found on Desktop");
    }

    const raw = fs.readFileSync(backupPath, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed?.pages || !Array.isArray(parsed.pages)) {
      throw new Error("Invalid backup format");
    }

    const pages = parsed.pages;

    let restored = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const title = page.title || "";

      // 🚫 SKIP crib Porch Swing pages
      if (/^crib\s+porch\s+swing/i.test(title)) {
        skipped++;
        log(`⏭️ SKIPPED: ${title}`);
        continue;
      }

      try {
        log(`➡️ (${i + 1}/${pages.length}) Restoring: ${title}`);

        await createShopifyPage({
          title: page.title,
          body_html: page.body_html,
          handle: page.handle,
        });

        restored++;
        log(`✅ Restored: ${title}`);

        // 🐢 Shopify-safe rate limit
        await new Promise(res => setTimeout(res, 2500));

      } catch (err: any) {
        failed++;
        log(`❌ FAILED: ${title}`);
        log(err?.message || JSON.stringify(err));

        await new Promise(res => setTimeout(res, 5000));
      }
    }

    log(`✔ DONE | restored=${restored}, skipped=${skipped}, failed=${failed}`);

    return NextResponse.json({
      success: true,
      restored,
      skipped,
      failed,
      total: pages.length,
    });

  } catch (err: any) {
    log("🔥 FATAL ERROR");
    log(err?.message || JSON.stringify(err));

    return NextResponse.json(
      { error: err?.message || "Restore failed" },
      { status: 500 }
    );
  }
}
