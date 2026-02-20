import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Защищаем админку — только role=ADMIN
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Защищаем warranty-admin — WARRANTY_MANAGER или ADMIN
  if (pathname.startsWith("/warranty-admin") && pathname !== "/warranty-admin/login") {
    const token = req.cookies.get("warranty_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/warranty-admin/login", req.url));
    }

    const payload = await verifyToken(token);
    if (!payload || !["ADMIN", "WARRANTY_MANAGER"].includes(payload.role)) {
      return NextResponse.redirect(new URL("/warranty-admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/warranty-admin/:path*"],
};
