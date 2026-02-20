import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "SC_MANAGER") {
    return NextResponse.json({ error: "Только для менеджеров СЦ" }, { status: 403 });
  }

  const center = await prisma.serviceCenter.findUnique({
    where: { managerId: payload.userId },
  });

  if (!center) {
    return NextResponse.json({ error: "СЦ не найден" }, { status: 404 });
  }

  // Current month visits (breakdown)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const currentMonthVisits = await prisma.visit.findMany({
    where: {
      serviceCenterId: center.id,
      createdAt: { gte: monthStart },
    },
    orderBy: { createdAt: "desc" },
    include: {
      car: { select: { brand: true, model: true, plateNumber: true, vin: true } },
      services: true,
    },
  });

  // Settlements (payment history)
  const settlements = await prisma.settlement.findMany({
    where: { serviceCenterId: center.id },
    orderBy: { periodEnd: "desc" },
  });

  // Unpaid settlements total (SC pays full commission, cashback is company's expense)
  const unpaid = settlements.filter((s) => !s.isPaid);
  const unpaidSettlements = unpaid.reduce((sum, s) => sum + s.totalCommission, 0);

  // Current month total commission
  const currentMonthTotal = currentMonthVisits.reduce((sum, v) => sum + v.serviceFee, 0);

  // Check if current month is covered by a settlement
  const hasCurrentMonthSettlement = settlements.some((s) => {
    const end = new Date(s.periodEnd);
    return end.getMonth() === now.getMonth() && end.getFullYear() === now.getFullYear();
  });

  // Total to pay: unpaid settlements + current month if not yet settled
  const unpaidAmount = unpaidSettlements + (hasCurrentMonthSettlement ? 0 : currentMonthTotal);

  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
  ];

  return NextResponse.json({
    unpaidAmount,
    currentMonth: {
      name: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      total: currentMonthTotal,
      visitCount: currentMonthVisits.length,
      visits: currentMonthVisits.map((v) => ({
        id: v.id,
        date: v.createdAt,
        car: `${v.car.brand} ${v.car.model}`,
        vin: v.car.vin,
        plate: v.car.plateNumber,
        fee: v.serviceFee,
      })),
    },
    settlements: settlements.map((s) => {
      const start = new Date(s.periodStart);
      const end = new Date(s.periodEnd);
      return {
        id: s.id,
        period: `${monthNames[start.getMonth()]} ${start.getFullYear()}`,
        amount: s.totalCommission,
        isPaid: s.isPaid,
        periodStart: s.periodStart,
        periodEnd: s.periodEnd,
      };
    }),
  });
}
