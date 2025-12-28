import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const payload = await req.json();

  console.log("📞 iPlum webhook received:", payload);

  return NextResponse.json({ ok: true });
}
