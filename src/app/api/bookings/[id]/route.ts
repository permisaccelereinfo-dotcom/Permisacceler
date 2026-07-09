import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, status, payment_status, stripe_session_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
