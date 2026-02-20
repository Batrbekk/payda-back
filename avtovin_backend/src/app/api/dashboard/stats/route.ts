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

  const [
    totalUsers,
    totalCars,
    totalServiceCenters,
    totalAutoShops,
    totalCarWashes,
    totalVisits,
    revenueResult,
    cashbackResult,
    totalCashbackBalance,
    unpaidSettlements,
    recentVisits,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.car.count(),
    prisma.serviceCenter.count({ where: { isActive: true, type: "SERVICE_CENTER" } }),
    prisma.serviceCenter.count({ where: { isActive: true, type: "AUTO_SHOP" } }),
    prisma.serviceCenter.count({ where: { isActive: true, type: "CAR_WASH" } }),
    prisma.visit.count(),
    prisma.visit.aggregate({ _sum: { serviceFee: true } }),
    prisma.visit.aggregate({ _sum: { cashback: true } }),
    prisma.user.aggregate({ _sum: { balance: true } }),
    prisma.settlement.aggregate({
      where: { isPaid: false },
      _sum: { netAmount: true },
      _count: true,
    }),
    prisma.visit.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        car: { select: { brand: true, model: true, plateNumber: true, user: { select: { name: true, phone: true } } } },
        serviceCenter: { select: { name: true, type: true } },
      },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalCars,
    partners: {
      serviceCenters: totalServiceCenters,
      autoShops: totalAutoShops,
      carWashes: totalCarWashes,
      total: totalServiceCenters + totalAutoShops + totalCarWashes,
    },
    totalVisits,
    totalRevenue: revenueResult._sum.serviceFee || 0,
    totalCashback: cashbackResult._sum.cashback || 0,
    totalCashbackBalance: totalCashbackBalance._sum.balance || 0,
    unpaidSettlements: {
      count: unpaidSettlements._count || 0,
      amount: unpaidSettlements._sum.netAmount || 0,
    },
    recentVisits,
  });
}
