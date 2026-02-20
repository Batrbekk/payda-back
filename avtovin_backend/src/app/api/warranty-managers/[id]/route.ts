import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// PUT /api/warranty-managers/:id — update (ADMIN only)
export async function PUT(
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
  const body = await req.json();
  const { name, email, phone, password, salonName } = body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.role !== "WARRANTY_MANAGER") {
    return NextResponse.json({ error: "Менеджер не найден" }, { status: 404 });
  }

  const manager = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(salonName !== undefined && { salonName }),
      ...(password && { password: hashPassword(password) }),
    },
  });

  return NextResponse.json({
    id: manager.id,
    phone: manager.phone,
    email: manager.email,
    name: manager.name,
    salonName: manager.salonName,
  });
}

// DELETE /api/warranty-managers/:id — delete (ADMIN only)
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

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing || existing.role !== "WARRANTY_MANAGER") {
    return NextResponse.json({ error: "Менеджер не найден" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ message: "Удалено" });
}
