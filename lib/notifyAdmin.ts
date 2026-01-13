// lib/notifyAdmin.ts

export async function notifyAdmin(payload: any) {
  await fetch("/api/notify-admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
