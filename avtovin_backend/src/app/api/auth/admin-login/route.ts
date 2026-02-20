import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Введите email и пароль" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  if (!user.password || user.password !== hashPassword(password)) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  const token = await signToken({ userId: user.id, role: user.role });

  return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
