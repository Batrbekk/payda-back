import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/banners — публичный (активные) или admin (все, ?all=true)
export async function GET(req: NextRequest) {
  const showAll = req.nextUrl.searchParams.get("all") === "true";
  const banners = await prisma.banner.findMany({
    ...(showAll ? {} : { where: { isActive: true } }),
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(banners);
}

// POST /api/banners — создание (admin only)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для админов" }, { status: 403 });
  }

  const body = await req.json();
  const { type, title, subtitle, description, imageUrl, actionType, actionValue, sortOrder, isActive, conditions, winners, prizeTitle, prizeImage, drawDate } = body;

  if (!title) {
    return NextResponse.json({ error: "Title обязателен" }, { status: 400 });
  }

  const banner = await prisma.banner.create({
    data: {
      type: type || "promo",
      title,
      subtitle: subtitle || null,
      description: description || null,
      imageUrl: imageUrl || null,
      actionType: actionType || "none",
      actionValue: actionValue || null,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
      conditions: conditions || null,
      winners: winners || null,
      prizeTitle: prizeTitle || null,
      prizeImage: prizeImage || null,
      drawDate: drawDate || null,
    },
  });

  return NextResponse.json(banner, { status: 201 });
}
