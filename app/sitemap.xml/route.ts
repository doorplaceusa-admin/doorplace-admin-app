import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(
    "https://doorplaceusa.myshopify.com/sitemap.xml",
    301
  );
}
