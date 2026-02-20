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

  // Юзер может смотреть только свой профиль, админ — любой
  if (payload.role !== "ADMIN" && payload.userId !== id) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { cars: { include: { visits: { include: { serviceCenter: true } }, warranties: true } } },
  });

  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  // balance — реальный баланс кэшбэка (начисления - списания)
  // cashback — для обратной совместимости, равен balance
  return NextResponse.json({ ...user, cashback: user.balance });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (payload.role !== "ADMIN" && payload.userId !== id) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const body = await req.json();
  const { name } = body as { name?: string };

  const user = await prisma.user.update({
    where: { id },
    data: { ...(name !== undefined && { name }) },
  });

  return NextResponse.json(user);
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

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: "Пользователь удалён" });
}
