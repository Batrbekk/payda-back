import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, code } = body as { phone: string; code: string };

  if (!phone || !code) {
    return NextResponse.json({ error: "Телефон и код обязательны" }, { status: 400 });
  }

  const otpRecord = await prisma.otpCode.findFirst({
    where: { phone, code, verified: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return NextResponse.json({ error: "Неверный или просроченный код" }, { status: 401 });
  }

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { verified: true },
  });

  // Проверяем есть ли пользователь в базе
  let user = await prisma.user.findUnique({
    where: { phone },
    include: { cars: true, serviceCenter: true },
  });

  let isNewUser = false;

  if (!user) {
    // Первый вход — регистрация
    user = await prisma.user.create({
      data: { phone },
      include: { cars: true, serviceCenter: true },
    });
    isNewUser = true;
  }

  const token = await signToken({ userId: user.id, role: user.role });

  return NextResponse.json({
    token,
    isNewUser,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      cars: user.cars,
      serviceCenterId: user.serviceCenter?.id ?? null,
    },
  });
}
