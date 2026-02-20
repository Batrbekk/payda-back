import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/warranties?userId=xxx — user's warranties
// GET /api/warranties — all warranties (admin/warranty_manager)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = req.nextUrl.searchParams.get("userId");
  const search = req.nextUrl.searchParams.get("search") || "";
  const filter = req.nextUrl.searchParams.get("filter") || "all";

  // Regular user — only their warranties
  if (payload.role === "USER") {
    const warranties = await prisma.warranty.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(warranties);
  }

  // Admin or WARRANTY_MANAGER — all or filtered
  const where: Record<string, unknown> = {};

  if (userId) where.userId = userId;

  if (search) {
    where.OR = [
      { contractNumber: { contains: search } },
      { clientName: { contains: search } },
      { vin: { contains: search } },
    ];
  }

  if (filter === "active") {
    where.isActive = true;
    where.endDate = { gte: new Date() };
  } else if (filter === "expired") {
    where.OR = [
      { isActive: false },
      { endDate: { lt: new Date() } },
    ];
  }

  const warranties = await prisma.warranty.findMany({
    where,
    include: { user: { select: { phone: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(warranties);
}

// POST /api/warranties — create (WARRANTY_MANAGER or ADMIN)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || !["ADMIN", "WARRANTY_MANAGER"].includes(payload.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const body = await req.json();
  const { contractNumber, clientName, vin, brand, model, year, startDate, endDate, plateNumber } = body;
  let { userId, carId } = body;
  const phone = body.phone as string | undefined;

  if (!contractNumber || !clientName || !startDate || !endDate) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }

  // Check unique contract number
  const existing = await prisma.warranty.findUnique({ where: { contractNumber } });
  if (existing) {
    return NextResponse.json({ error: "Договор с таким номером уже существует" }, { status: 409 });
  }

  // New client flow: phone passed instead of userId
  if (!userId && phone) {
    if (!/^\+7\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "Неверный формат телефона" }, { status: 400 });
    }
    if (!brand || !model || !year || !plateNumber) {
      return NextResponse.json({ error: "Для нового клиента заполните данные авто" }, { status: 400 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone, name: clientName, role: "USER" },
      });
    }
    userId = user.id;

    // Create car for user
    const car = await prisma.car.create({
      data: {
        brand,
        model: model as string,
        year: parseInt(year) || 0,
        plateNumber,
        vin: vin || null,
        userId: user.id,
      },
    });
    carId = car.id;
  }

  if (!userId || !carId) {
    return NextResponse.json({ error: "Укажите пользователя и автомобиль" }, { status: 400 });
  }

  const warranty = await prisma.warranty.create({
    data: {
      contractNumber,
      userId,
      carId,
      clientName,
      vin: vin || "",
      brand: brand || "",
      model: model || "",
      year: parseInt(year) || 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdById: payload.userId,
    },
  });

  return NextResponse.json(warranty, { status: 201 });
}
