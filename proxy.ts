import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { PUBLIC_ROUTES, ROUTES } from "@/lib/constants";

export async function proxy(request: NextRequest) {
  const { user, supabaseResponse, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return supabaseResponse;
  }

  // Allow static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return supabaseResponse;
  }

  // Not authenticated — redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.LOGIN;
    return NextResponse.redirect(url);
  }

  // Get user role from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "client";

  // Coach trying to access client routes -> redirect to coach dashboard
  if (role === "coach" && pathname.startsWith("/portal")) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.COACH_DASHBOARD;
    return NextResponse.redirect(url);
  }

  // Client trying to access coach routes -> redirect to client portal
  if (role === "client" && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.CLIENT_PORTAL;
    return NextResponse.redirect(url);
  }

  if (role === "client" && pathname.startsWith("/clients")) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.CLIENT_PORTAL;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
