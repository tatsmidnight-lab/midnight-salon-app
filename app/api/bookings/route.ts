import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      artists (id, name),
      services (id, name, price, duration),
      customers (id, name, email, phone)
    `
    )
    .eq("customer_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: body.customerId,
      artist_id: body.artistId,
      service_id: body.serviceId,
      date: body.date,
      time: body.time,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert booking products if any
  if (body.productIds && body.productIds.length > 0) {
    await supabase.from("booking_products").insert(
      body.productIds.map((pid: string) => ({
        booking_id: data.id,
        product_id: pid,
      }))
    );
  }

  return NextResponse.json({ bookingId: data.id, booking: data });
}
