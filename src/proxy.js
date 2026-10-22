import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ROLE_ROUTES = {
  developer: "/dashboard/developer",
  mentor: "/dashboard/mentor",
  admin: "/dashboard/admin",
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  let session;

  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    console.error("Proxy session error:", error);
    session = null;
  }

  // Redirect unauthenticated users to sign-in
  if (!session?.user) {
    const signInUrl = new URL("/signIn", request.url);
    signInUrl.searchParams.set("callbackURL", pathname);

    return NextResponse.redirect(signInUrl);
  }

  const role = String(
    session.user.role || session.user.userType || ""
  ).toLowerCase();

  const userDashboard = ROLE_ROUTES[role];

  // Users without a recognized role
  if (!userDashboard) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Allow everyone to access their profile
  if (pathname === "/dashboard/profile") {
    return NextResponse.next();
  }

  const isDeveloperRoute =
    pathname === "/dashboard/developer" ||
    pathname.startsWith("/dashboard/developer/");

  const isMentorRoute =
    pathname === "/dashboard/mentor" ||
    pathname.startsWith("/dashboard/mentor/");

  const isAdminRoute =
    pathname === "/dashboard/admin" ||
    pathname.startsWith("/dashboard/admin/");

  // Wrong-role access → unauthorized page
  if (isDeveloperRoute && role !== "developer") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (isMentorRoute && role !== "mentor") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Protect other dashboard routes
  if (
    pathname.startsWith("/dashboard/") &&
    !isDeveloperRoute &&
    !isMentorRoute &&
    !isAdminRoute &&
    pathname !== "/dashboard/profile"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};