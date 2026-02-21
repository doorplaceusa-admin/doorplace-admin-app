import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (
    req.method === "POST" &&
    req.url.includes("__NEXT_ACTION__")
  ) {
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.next();
}