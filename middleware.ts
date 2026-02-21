import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.searchParams.has("__NEXT_ACTION__")) {
    console.log("🔥 __NEXT_ACTION__ hit:", req.nextUrl.toString());
    console.log("User-Agent:", req.headers.get("user-agent"));
  }
  return NextResponse.next();
}