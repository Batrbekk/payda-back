import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scServices = await prisma.serviceCenterService.findMany({
    where: { serviceCenterId: id },
    include: {
      service: true,
    },
  });

  // Формируем удобный ответ с настройками комиссий
  const services = scServices.map((scs) => ({
    id: scs.service.id,
    name: scs.service.name,
    category: scs.service.category,
    price: scs.price,
    isFlexPrice: scs.isFlexPrice,
    commissionType: scs.service.commissionType,
    commissionValue: scs.service.commissionValue,
    cashbackType: scs.service.cashbackType,
    cashbackValue: scs.service.cashbackValue,
  }));

  return NextResponse.json(services);
}
