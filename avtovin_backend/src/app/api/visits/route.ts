import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { eventStore } from "@/lib/events";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const carId = req.nextUrl.searchParams.get("carId");
  const serviceCenterId = req.nextUrl.searchParams.get("serviceCenterId");
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {};

  if (carId) {
    where.carId = carId;
  } else if (payload.role === "USER") {
    // Обычный юзер видит визиты только своих авто
    const userCars = await prisma.car.findMany({
      where: { userId: payload.userId },
      select: { id: true },
    });
    where.carId = { in: userCars.map((c) => c.id) };
  }

  if (serviceCenterId) where.serviceCenterId = serviceCenterId;

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        car: { select: { brand: true, model: true, plateNumber: true } },
        serviceCenter: { select: { name: true, type: true } },
        services: true,
      },
    }),
    prisma.visit.count({ where }),
  ]);

  return NextResponse.json({ visits, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Визит создаёт менеджер СЦ или админ (после QR скана)
  if (payload.role !== "SC_MANAGER" && payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для менеджеров СЦ" }, { status: 403 });
  }

  const body = await req.json();
  const { carId, serviceCenterId, services, cashbackUsed, mileage, totalAmount, description: bodyDescription } = body as {
    carId: string;
    serviceCenterId: string;
    services: Array<{
      serviceId: string;
      price: number;
      details?: string;
    }>;
    cashbackUsed?: number;
    mileage?: number;
    totalAmount?: number;
    description?: string;
  };

  if (!carId || !serviceCenterId) {
    return NextResponse.json({ error: "carId и serviceCenterId обязательны" }, { status: 400 });
  }

  // Check SC type for simple amount mode
  const sc = await prisma.serviceCenter.findUnique({
    where: { id: serviceCenterId },
    select: { type: true, commissionPercent: true, discountPercent: true },
  });

  const isAutoShop = sc?.type === "AUTO_SHOP";
  const isCarWash = sc?.type === "CAR_WASH";
  // Simple mode: AUTO_SHOP always, CAR_WASH if no services provided
  const isSimpleMode = isAutoShop || (isCarWash && (!services || services.length === 0));

  if (!isSimpleMode && (!services || services.length === 0)) {
    return NextResponse.json({ error: "services обязательны" }, { status: 400 });
  }

  if (isSimpleMode && (!totalAmount || totalAmount <= 0)) {
    return NextResponse.json({ error: "Укажите сумму" }, { status: 400 });
  }

  let totalCost = 0;
  let totalCommission = 0;
  let totalCashback = 0; // For AUTO_SHOP this is discount, not cashback
  const visitServicesData: Array<{
    serviceName: string;
    price: number;
    commission: number;
    cashback: number;
    details: string | null;
  }> = [];

  if (isSimpleMode) {
    totalCost = totalAmount!;
    const commPct = sc?.commissionPercent ?? 5;
    const discPct = sc?.discountPercent ?? 0;
    totalCommission = Math.round(totalCost * commPct / 100);
    totalCashback = Math.round(totalCost * discPct / 100); // скидка для магазина
    visitServicesData.push({
      serviceName: bodyDescription || (isAutoShop ? "Покупка" : "Услуга"),
      price: totalCost,
      commission: totalCommission,
      cashback: totalCashback,
      details: bodyDescription || null,
    });
  } else {
    // Service-based mode (SERVICE_CENTER or CAR_WASH with services)
    const serviceIds = services.map((s) => s.serviceId);
    const serviceConfigs = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });
    const configMap = new Map(serviceConfigs.map((s) => [s.id, s]));

    for (const svc of services) {
      const config = configMap.get(svc.serviceId);
      if (!config) continue;

      const price = svc.price;

      const commission = config.commissionType === "percent"
        ? Math.round(price * config.commissionValue / 100)
        : config.commissionValue;

      const cashback = config.cashbackType === "percent"
        ? Math.round(commission * config.cashbackValue / 100)
        : config.cashbackValue;

      totalCost += price;
      totalCommission += commission;
      totalCashback += cashback;

      visitServicesData.push({
        serviceName: config.name,
        price,
        commission,
        cashback,
        details: svc.details || null,
      });
    }
  }

  // Проверка списания кэшбэка
  const usedCashback = cashbackUsed && cashbackUsed > 0 ? cashbackUsed : 0;

  if (usedCashback > 0) {
    // Находим владельца авто
    const car = await prisma.car.findUnique({
      where: { id: carId },
      select: { userId: true },
    });
    if (!car) {
      return NextResponse.json({ error: "Авто не найдено" }, { status: 404 });
    }

    const carOwner = await prisma.user.findUnique({
      where: { id: car.userId },
      select: { balance: true },
    });
    if (!carOwner) {
      return NextResponse.json({ error: "Владелец авто не найден" }, { status: 404 });
    }

    // Проверка: не больше баланса
    if (usedCashback > carOwner.balance) {
      return NextResponse.json({ error: "Недостаточно кэшбэка на балансе" }, { status: 400 });
    }

    // Проверка: не больше 50% стоимости
    const maxCashback = Math.floor(totalCost * 0.5);
    if (usedCashback > maxCashback) {
      return NextResponse.json({ error: `Кэшбэк покрывает не более 50% (макс ${maxCashback}₸)` }, { status: 400 });
    }
  }

  const description = isSimpleMode
    ? (bodyDescription || "Покупка")
    : visitServicesData.map((s) => s.serviceName).join(", ");

  // Находим владельца авто для начисления кэшбэка
  const car = await prisma.car.findUnique({
    where: { id: carId },
    select: { userId: true },
  });

  // Создаём визит + транзакции баланса в одной транзакции
  const visit = await prisma.$transaction(async (tx) => {
    const newVisit = await tx.visit.create({
      data: {
        carId,
        serviceCenterId,
        description,
        cost: totalCost,
        mileage: mileage || null,
        cashback: totalCashback,
        cashbackUsed: usedCashback,
        serviceFee: totalCommission,
        services: {
          create: visitServicesData,
        },
      },
      include: {
        car: true,
        serviceCenter: true,
        services: true,
      },
    });

    // Update car: lastServiceAt + mileage
    await tx.car.update({
      where: { id: carId },
      data: {
        lastServiceAt: new Date(),
        ...(mileage ? { mileage } : {}),
      },
    });

    if (car) {
      // Начисление кэшбэка
      if (totalCashback > 0) {
        await tx.balanceTransaction.create({
          data: {
            userId: car.userId,
            amount: totalCashback,
            type: "CASHBACK_EARN",
            description: `Кэшбэк за визит: ${description}`,
            visitId: newVisit.id,
          },
        });
      }

      // Списание кэшбэка
      if (usedCashback > 0) {
        await tx.balanceTransaction.create({
          data: {
            userId: car.userId,
            amount: -usedCashback,
            type: "CASHBACK_SPEND",
            description: `Списание кэшбэка: ${newVisit.serviceCenter.name}`,
            visitId: newVisit.id,
          },
        });
      }

      // Обновляем баланс пользователя
      const balanceChange = totalCashback - usedCashback;
      if (balanceChange !== 0) {
        await tx.user.update({
          where: { id: car.userId },
          data: { balance: { increment: balanceChange } },
        });
      }
    }

    return newVisit;
  });

  // Emit real-time event to car owner
  if (car) {
    eventStore.emit(car.userId, "visit:created", {
      visitId: visit.id,
      carName: `${visit.car.brand} ${visit.car.model}`,
      serviceCenterName: visit.serviceCenter.name,
      serviceCenterType: visit.serviceCenter.type,
      cost: totalCost,
      cashback: totalCashback,
      cashbackUsed: usedCashback,
      mileage: mileage || null,
      description,
    });
  }

  return NextResponse.json(visit, { status: 201 });
}
