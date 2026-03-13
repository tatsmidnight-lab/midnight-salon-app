import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get("artist");

  let query = supabase.from("services").select("*").order("name");

  if (artistId) {
    query = query.eq("artist_id", artistId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If no artist filter, return as products list (for add-ons)
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const body = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("services")
    .insert({
      artist_id: body.artistId ?? user.id,
      name: body.name,
      description: body.description ?? "",
      price: Number(body.price),
      duration: Number(body.duration),
      image_url: body.imageUrl ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ service: data });
}
