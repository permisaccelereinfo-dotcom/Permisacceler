import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/lib/supabase/database.types";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const isAdminLogin = pathname === "/admin/login";
  const isPublicLogin = pathname === "/login";
  const isAdmin = pathname === "/admin" || (pathname.startsWith("/admin/") && !isAdminLogin);
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAccount = pathname === "/mon-compte" || pathname.startsWith("/mon-compte/");
  const isAutoEcoleAuth = pathname === "/auto-ecole";
  const isProtectedRoute = isAdmin || isDashboard || isAccount;
  const isAuthRoute = isAdminLogin || isPublicLogin || isAutoEcoleAuth;

  if (!isProtectedRoute && !isAuthRoute) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const redirectWithSession = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  };

  const redirectToAuth = () => {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isAdmin ? "/admin/login" : isDashboard ? "/auto-ecole" : "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return redirectWithSession(redirectUrl);
  };

  let user = null;

  try {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    user = currentUser;
  } catch (error) {
    console.warn(
      "[auth] Supabase session refresh failed; treating request as signed out.",
      getErrorMessage(error)
    );

    if (isProtectedRoute) {
      return redirectToAuth();
    }

    return supabaseResponse;
  }

  if (!user && isProtectedRoute) {
    return redirectToAuth();
  }

  if (!user) {
    return supabaseResponse;
  }

  if (isProtectedRoute || isAuthRoute) {
    let role: string | undefined;

    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.warn("[auth] Supabase role lookup failed.", error.message);

        if (isProtectedRoute) {
          return redirectToAuth();
        }

        return supabaseResponse;
      }

      role = userData?.role;
    } catch (error) {
      console.warn("[auth] Supabase role lookup failed.", getErrorMessage(error));

      if (isProtectedRoute) {
        return redirectToAuth();
      }

      return supabaseResponse;
    }

    if (isAdminLogin && role === "admin") {
      return redirectWithSession(new URL("/admin", request.url));
    }

    if (isPublicLogin) {
      return redirectWithSession(
        new URL(role === "admin" ? "/admin" : role === "auto_ecole" ? "/dashboard" : "/mon-compte", request.url)
      );
    }

    if (isAdmin && role !== "admin") {
      return redirectWithSession(new URL("/admin/login", request.url));
    }

    if (isDashboard && role !== "auto_ecole") {
      return redirectWithSession(new URL(role === "admin" ? "/admin" : "/mon-compte", request.url));
    }

    if (isAccount && (role === "auto_ecole" || role === "admin")) {
      return redirectWithSession(new URL(role === "admin" ? "/admin" : "/dashboard", request.url));
    }

    if (isAutoEcoleAuth && (role === "auto_ecole" || role === "admin")) {
      return redirectWithSession(new URL(role === "admin" ? "/admin" : "/dashboard", request.url));
    }
  }

  return supabaseResponse;
}
