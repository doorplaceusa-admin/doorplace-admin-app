import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    let query = supabaseAdmin
      .from("generated_pages")
      .select(
        "id,page_title,slug,page_template,status,created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (q) {
      query = query.or(
        `page_title.ilike.%${q}%,slug.ilike.%${q}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("generated-pages error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rows: data ?? [] });
  } catch (e: any) {
    console.error("generated-pages fatal:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No page IDs provided" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("generated_pages")
      .delete()
      .in("id", ids);

    if (error) {
      console.error("generated-pages delete error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("generated-pages delete fatal:", e);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
