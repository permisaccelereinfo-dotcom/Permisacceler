import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?redirectedFrom=/admin");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/admin/login?redirectedFrom=/admin");
  }

  return { supabase, user, profile };
}
