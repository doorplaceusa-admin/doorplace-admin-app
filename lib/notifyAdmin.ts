// lib/notifyAdmin.ts

export async function notifyAdmin(payload: any) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`;

    if (!baseUrl) {
      console.warn("notifyAdmin skipped: no base URL");
      return;
    }

    await fetch(`${baseUrl}/api/notify-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // 🔒 NEVER break lead intake
    console.error("notifyAdmin failed (non-fatal):", err);
  }
}
