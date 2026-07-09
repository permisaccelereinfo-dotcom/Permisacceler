import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the OAuth (Google / Facebook) redirect from Supabase: exchanges the
// PKCE code for a session, then sends the user to the right area by role.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // Behind a dev tunnel (ngrok) the request origin is localhost while the
  // browser is on the tunnel domain — prefer the forwarded host there.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const baseUrl =
    process.env.NODE_ENV !== "development" && forwardedHost
      ? `https://${forwardedHost}`
      : request.nextUrl.origin;

  const redirectToLogin = (message: string) => {
    const url = new URL("/login", baseUrl);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  };

  if (!code) {
    // Provider denied / user cancelled — Supabase redirects with error params.
    const description = searchParams.get("error_description");
    return redirectToLogin(description || "Connexion annulée. Veuillez réessayer.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth/callback] Code exchange failed:", error?.message);
    return redirectToLogin("La connexion a échoué. Veuillez réessayer.");
  }

  const user = data.user;

  // The on_auth_user_created DB trigger normally creates the public.users row;
  // keep this fallback for environments missing the trigger, otherwise the
  // role checks in the proxy bounce the user straight back to /login.
  let role: string | undefined;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    role = profile.role;
  } else {
    const meta = user.user_metadata ?? {};
    const name: string =
      meta.full_name || meta.name || user.email?.split("@")[0] || "Utilisateur";

    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      email: user.email ?? "",
      name,
      phone: meta.phone ?? null,
      role: "student",
    });

    if (insertError) {
      console.error("[auth/callback] Could not create user profile:", insertError.message);
    }

    role = "student";
  }

  if (role === "admin") {
    return NextResponse.redirect(new URL("/admin", baseUrl));
  }
  if (role === "auto_ecole") {
    return NextResponse.redirect(new URL("/dashboard", baseUrl));
  }

  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/mon-compte";
  return NextResponse.redirect(new URL(safeNext, baseUrl));
}
