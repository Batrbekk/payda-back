import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/warranties/:id — update (WARRANTY_MANAGER or ADMIN)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || !["ADMIN", "WARRANTY_MANAGER"].includes(payload.role)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { contractNumber, clientName, vin, brand, model, year, startDate, endDate, isActive } = body;

  const existing = await prisma.warranty.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Гарантия не найдена" }, { status: 404 });
  }

  // Check unique contract number if changed
  if (contractNumber && contractNumber !== existing.contractNumber) {
    const dup = await prisma.warranty.findUnique({ where: { contractNumber } });
    if (dup) {
      return NextResponse.json({ error: "Договор с таким номером уже существует" }, { status: 409 });
    }
  }

  const warranty = await prisma.warranty.update({
    where: { id },
    data: {
      ...(contractNumber !== undefined && { contractNumber }),
      ...(clientName !== undefined && { clientName }),
      ...(vin !== undefined && { vin }),
      ...(brand !== undefined && { brand }),
      ...(model !== undefined && { model }),
      ...(year !== undefined && { year }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(warranty);
}

// DELETE /api/warranties/:id — delete (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для админов" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.warranty.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Гарантия не найдена" }, { status: 404 });
  }

  await prisma.warranty.delete({ where: { id } });

  return NextResponse.json({ message: "Удалено" });
}
