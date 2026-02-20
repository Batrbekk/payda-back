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

  // Юзер может смотреть только свой баланс, админ — любой
  if (payload.role !== "ADMIN" && payload.userId !== id) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { balance: true },
  });

  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  const [transactions, total] = await Promise.all([
    prisma.balanceTransaction.findMany({
      where: { userId: id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        visit: {
          select: {
            serviceCenter: { select: { name: true } },
          },
        },
      },
    }),
    prisma.balanceTransaction.count({ where: { userId: id } }),
  ]);

  return NextResponse.json({
    balance: user.balance,
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
