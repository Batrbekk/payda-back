import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;
// Increase body size limit for base64 receipt uploads
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const { receiptBase64, settlementId } = body as { receiptBase64?: string; settlementId?: string };

  if (!receiptBase64) {
    return NextResponse.json({ error: "Прикрепите чек" }, { status: 400 });
  }

  // If specific settlement ID provided, update that one
  if (settlementId) {
    const settlement = await prisma.settlement.findFirst({
      where: { id: settlementId, serviceCenterId: center.id },
    });
    if (!settlement) {
      return NextResponse.json({ error: "Расчёт не найден" }, { status: 404 });
    }
    const updated = await prisma.settlement.update({
      where: { id: settlementId },
      data: { receiptUrl: receiptBase64, receiptStatus: "PENDING" },
    });
    return NextResponse.json({ success: true, settlementId: updated.id });
  }

  // Otherwise, attach receipt to all unpaid settlements for this SC
  let unpaid = await prisma.settlement.findMany({
    where: { serviceCenterId: center.id, isPaid: false, receiptStatus: "NONE" },
  });

  // If no settlements exist, auto-create one from current month visits
  if (unpaid.length === 0) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const visits = await prisma.visit.findMany({
      where: {
        serviceCenterId: center.id,
        createdAt: { gte: monthStart },
      },
      select: { serviceFee: true, cashbackUsed: true },
    });

    if (visits.length === 0) {
      return NextResponse.json({ error: "Нет визитов для расчёта" }, { status: 400 });
    }

    const totalCommission = visits.reduce((sum, v) => sum + v.serviceFee, 0);
    const totalCashbackRedeemed = visits.reduce((sum, v) => sum + v.cashbackUsed, 0);

    const settlement = await prisma.settlement.create({
      data: {
        serviceCenterId: center.id,
        periodStart: monthStart,
        periodEnd: now,
        totalCommission,
        totalCashbackRedeemed,
        netAmount: totalCommission,
        receiptUrl: receiptBase64,
        receiptStatus: "PENDING",
      },
    });

    return NextResponse.json({ success: true, settlementId: settlement.id });
  }

  await prisma.settlement.updateMany({
    where: {
      id: { in: unpaid.map((s) => s.id) },
    },
    data: { receiptUrl: receiptBase64, receiptStatus: "PENDING" },
  });

  return NextResponse.json({ success: true, updatedCount: unpaid.length });
}
