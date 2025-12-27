import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/* ===============================
   GET — list resources
=============================== */
export async function GET() {
  const { data, error } = await supabase
    .from("partner_resources")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json(data || []);
}

/* ===============================
   POST — create resource
=============================== */
export async function POST(req: Request) {
  const body = await req.json();

  const { error } = await supabase.from("partner_resources").insert([
    {
      title: body.title,
      description: body.description || "",
      resource_url: body.resource_url,
      category: body.category || "General",
      resource_type: body.resource_type || "link",
      is_active: body.is_active ?? true,
      show_new: body.show_new ?? false,
      sort_order: body.sort_order ?? 100,
    },
  ]);

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/* ===============================
   PUT — update resource
=============================== */
export async function PUT(req: Request) {
  const body = await req.json();

  if (!body.id) {
    return new NextResponse("Missing resource id", { status: 400 });
  }

  const { error } = await supabase
    .from("partner_resources")
    .update({
      title: body.title,
      description: body.description || "",
      resource_url: body.resource_url,
      category: body.category || "General",
      resource_type: body.resource_type || "link",
      is_active: body.is_active ?? true,
      show_new: body.show_new ?? false,
      sort_order: body.sort_order ?? 100,
    })
    .eq("id", body.id);

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/* ===============================
   DELETE — delete resource
=============================== */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing resource id", { status: 400 });
  }

  const { error } = await supabase
    .from("partner_resources")
    .delete()
    .eq("id", id);

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
