import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// GET /api/warranty-managers — list all (ADMIN only)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для админов" }, { status: 403 });
  }

  const managers = await prisma.user.findMany({
    where: { role: "WARRANTY_MANAGER" },
    select: {
      id: true,
      phone: true,
      email: true,
      name: true,
      salonName: true,
      createdAt: true,
      _count: { select: { createdWarranties: true } },
      createdWarranties: {
        select: { isActive: true, endDate: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute stats
  const result = managers.map((m) => {
    const now = new Date();
    const activeCount = m.createdWarranties.filter(
      (w) => w.isActive && new Date(w.endDate) >= now
    ).length;
    return {
      id: m.id,
      phone: m.phone,
      email: m.email,
      name: m.name,
      salonName: m.salonName,
      createdAt: m.createdAt,
      totalWarranties: m._count.createdWarranties,
      activeWarranties: activeCount,
    };
  });

  return NextResponse.json(result);
}

// POST /api/warranty-managers — create (ADMIN only)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для админов" }, { status: 403 });
  }

  const body = await req.json();
  const { phone, name, email, password, salonName } = body;

  if (!phone || !name || !email || !password) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }

  // Check phone unique
  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    return NextResponse.json({ error: "Пользователь с таким телефоном уже существует" }, { status: 409 });
  }

  // Check email unique
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 409 });
  }

  const manager = await prisma.user.create({
    data: {
      phone,
      name,
      email,
      password: hashPassword(password),
      role: "WARRANTY_MANAGER",
      salonName: salonName || null,
    },
  });

  return NextResponse.json({
    id: manager.id,
    phone: manager.phone,
    email: manager.email,
    name: manager.name,
    salonName: manager.salonName,
  }, { status: 201 });
}
