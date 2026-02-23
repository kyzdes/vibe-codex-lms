import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Admin routes: require ADMIN or INSTRUCTOR
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    const role = req.auth.user?.role;
    if (role !== "ADMIN" && role !== "INSTRUCTOR") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Student routes: require auth
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/profile")) {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/profile/:path*"],
};
