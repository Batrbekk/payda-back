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
    include: {
      addresses: true,
      services: { include: { service: true } },
      visits: {
        orderBy: { createdAt: "desc" },
        include: {
          car: { select: { brand: true, model: true, plateNumber: true, user: { select: { name: true, phone: true } } } },
          services: true,
        },
      },
      settlements: { where: { isPaid: false } },
    },
  });

  if (!center) {
    return NextResponse.json({ error: "Сервисный центр не найден" }, { status: 404 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayVisits = center.visits.filter((v) => new Date(v.createdAt) >= todayStart).length;
  const monthVisits = center.visits.filter((v) => new Date(v.createdAt) >= monthStart).length;
  const unpaidAmount = center.settlements.reduce((sum, s) => sum + s.netAmount, 0);

  return NextResponse.json({
    id: center.id,
    name: center.name,
    type: center.type,
    description: center.description,
    city: center.city,
    phone: center.phone,
    rating: center.rating,
    logoUrl: center.logoUrl,
    commissionPercent: center.commissionPercent,
    discountPercent: center.discountPercent,
    addresses: center.addresses.map((a) => a.address),
    services: center.services.map((s) => s.service.name),
    stats: {
      todayVisits,
      monthVisits,
      unpaidAmount,
    },
  });
}
