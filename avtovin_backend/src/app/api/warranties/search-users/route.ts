import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/warranties/search-users?phone=7701 — search users by phone (for warranty creation)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || !["ADMIN", "WARRANTY_MANAGER"].includes(payload.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const phone = req.nextUrl.searchParams.get("phone") || "";
  if (phone.length < 3) {
    return NextResponse.json([]);
  }

  const users = await prisma.user.findMany({
    where: {
      phone: { contains: phone },
      role: "USER",
    },
    take: 10,
    select: {
      id: true,
      phone: true,
      name: true,
      cars: {
        select: {
          id: true,
          vin: true,
          brand: true,
          model: true,
          year: true,
          plateNumber: true,
        },
      },
    },
  });

  return NextResponse.json(users);
}
