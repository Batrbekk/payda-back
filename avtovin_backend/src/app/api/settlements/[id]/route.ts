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
  const { isPaid, receiptStatus } = body as { isPaid?: boolean; receiptStatus?: string };

  const data: Record<string, unknown> = {};
  if (isPaid !== undefined) data.isPaid = isPaid;
  if (receiptStatus) data.receiptStatus = receiptStatus;

  // If approving receipt, also mark as paid
  if (receiptStatus === "APPROVED") {
    data.isPaid = true;
  }

  const settlement = await prisma.settlement.update({
    where: { id },
    data,
    include: {
      serviceCenter: { select: { name: true, type: true } },
    },
  });

  return NextResponse.json(settlement);
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

  await prisma.settlement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для админов" }, { status: 403 });
  }

  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: {
      serviceCenter: { select: { name: true, type: true } },
    },
  });

  if (!settlement) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  return NextResponse.json(settlement);
}
