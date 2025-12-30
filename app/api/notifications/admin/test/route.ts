import { NextResponse } from "next/server";
import { sendAdminNotification } from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await sendAdminNotification({
    type: "system",
    title: "✅ Admin notification test successful",
    details: {
      env: process.env.NODE_ENV || "development",
      time: new Date().toISOString(),
    },
  });

  return NextResponse.json({ status: "test_notification_sent" });
}
