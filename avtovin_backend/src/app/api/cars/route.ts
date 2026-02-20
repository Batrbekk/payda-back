import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = req.nextUrl.searchParams.get("userId") || payload.userId;

  // Обычный юзер видит только свои авто
  if (payload.role !== "ADMIN" && userId !== payload.userId) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const cars = await prisma.car.findMany({
    where: { userId },
    include: { _count: { select: { visits: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cars);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { vin, brand, model, year, plateNumber, mileage, generation, engineType, lastServiceAt, photoUrl } = body as {
    vin?: string;
    brand: string;
    model: string;
    year: number;
    plateNumber: string;
    mileage?: number;
    generation?: string;
    engineType?: string;
    lastServiceAt?: string;
    photoUrl?: string;
  };

  if (!brand || !model || !year || !plateNumber) {
    return NextResponse.json({ error: "Марка, модель, год и гос.номер обязательны" }, { status: 400 });
  }

  // Проверка дубликатов по гос.номеру у этого пользователя
  const existingByPlate = await prisma.car.findFirst({
    where: { plateNumber, userId: payload.userId },
  });
  if (existingByPlate) {
    return NextResponse.json({ error: "Автомобиль с таким гос.номером уже добавлен" }, { status: 409 });
  }

  // Проверка дубликатов по VIN у этого пользователя
  if (vin) {
    const existingByVin = await prisma.car.findFirst({
      where: { vin, userId: payload.userId },
    });
    if (existingByVin) {
      return NextResponse.json({ error: "Автомобиль с таким VIN уже добавлен" }, { status: 409 });
    }
  }

  const car = await prisma.car.create({
    data: {
      vin, brand, model, year, plateNumber, mileage,
      generation, engineType,
      lastServiceAt: lastServiceAt ? new Date(lastServiceAt) : undefined,
      photoUrl,
      userId: payload.userId,
    },
  });

  return NextResponse.json(car, { status: 201 });
}
