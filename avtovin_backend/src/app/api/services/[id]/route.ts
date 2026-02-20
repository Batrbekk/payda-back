import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для админов" }, { status: 403 });
  }

  const body = await req.json();
  const { name, category, commissionType, commissionValue, cashbackType, cashbackValue } = body as {
    name?: string;
    category?: string;
    commissionType?: string;
    commissionValue?: number;
    cashbackType?: string;
    cashbackValue?: number;
  };

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (category !== undefined) data.category = category;
  if (commissionType !== undefined) data.commissionType = commissionType;
  if (commissionValue !== undefined) data.commissionValue = commissionValue;
  if (cashbackType !== undefined) data.cashbackType = cashbackType;
  if (cashbackValue !== undefined) data.cashbackValue = cashbackValue;

  const service = await prisma.service.update({
    where: { id },
    data,
  });

  return NextResponse.json(service);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для админов" }, { status: 403 });
  }

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
