import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_TOKEN_KEY = "gg_token";
const AUTH_ROLE_KEY = "gg_role";

const PUBLIC_PATHS = ["/", "/login", "/register"];
const PUBLIC_PREFIXES = ["/register/"];

function normalizeRole(role?: string | null) {
  return (role || "").trim().toLowerCase();
}

function getRoleRedirectPath(role?: string | null) {
  switch (normalizeRole(role)) {
    case "admin":
      return "/admin";
    case "buyer":
      return "/buyer";
    case "supplier":
    case "farmer":
      return "/supplier";
    default:
      return "/login";
  }
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_TOKEN_KEY)?.value ?? null;
  const role = normalizeRole(request.cookies.get(AUTH_ROLE_KEY)?.value ?? null);

  const isAuthenticated = Boolean(token);
  const isPublic = isPublicPath(pathname);

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && isPublic && pathname !== "/") {
    return NextResponse.redirect(new URL(getRoleRedirectPath(role), request.url));
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(getRoleRedirectPath(role), request.url));
  }

  if (pathname.startsWith("/buyer") && role !== "buyer") {
    return NextResponse.redirect(new URL(getRoleRedirectPath(role), request.url));
  }

  if (pathname.startsWith("/supplier") && role !== "supplier" && role !== "farmer") {
    return NextResponse.redirect(new URL(getRoleRedirectPath(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};