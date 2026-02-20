import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для админов" }, { status: 403 });
  }

  const search = req.nextUrl.searchParams.get("search") || "";
  const role = req.nextUrl.searchParams.get("role") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  const conditions: Record<string, unknown>[] = [];

  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search } },
        { phone: { contains: search } },
      ],
    });
  }

  if (role && ["USER", "ADMIN", "SC_MANAGER"].includes(role)) {
    conditions.push({ role });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { cars: true } },
        cars: {
          select: { id: true, brand: true, model: true, year: true, plateNumber: true },
          take: 3,
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
}
