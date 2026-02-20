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

  const isPaid = req.nextUrl.searchParams.get("isPaid");

  const where: Record<string, unknown> = {};
  if (isPaid === "true") where.isPaid = true;
  if (isPaid === "false") where.isPaid = false;

  const settlements = await prisma.settlement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      serviceCenter: { select: { name: true, type: true } },
    },
  });

  return NextResponse.json(settlements);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для админов" }, { status: 403 });
  }

  const body = await req.json();
  const { periodStart, periodEnd } = body as {
    periodStart: string;
    periodEnd: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "Укажите период" }, { status: 400 });
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  // Получаем все активные партнёры
  const partners = await prisma.serviceCenter.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const settlements = [];

  for (const partner of partners) {
    // Визиты за период
    const visits = await prisma.visit.findMany({
      where: {
        serviceCenterId: partner.id,
        createdAt: { gte: start, lte: end },
      },
      select: {
        serviceFee: true,
        cashbackUsed: true,
      },
    });

    if (visits.length === 0) continue;

    const totalCommission = visits.reduce((sum, v) => sum + v.serviceFee, 0);
    const totalCashbackRedeemed = visits.reduce((sum, v) => sum + v.cashbackUsed, 0);
    // SC/auto shop/car wash pays full commission, cashback is company's expense
    const netAmount = totalCommission;

    const settlement = await prisma.settlement.create({
      data: {
        serviceCenterId: partner.id,
        periodStart: start,
        periodEnd: end,
        totalCommission,
        totalCashbackRedeemed,
        netAmount,
      },
      include: {
        serviceCenter: { select: { name: true, type: true } },
      },
    });

    settlements.push(settlement);
  }

  return NextResponse.json({ created: settlements.length, settlements }, { status: 201 });
}
