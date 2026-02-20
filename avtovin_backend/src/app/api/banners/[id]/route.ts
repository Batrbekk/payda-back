import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/banners/:id — обновление (admin only)
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
  const { type, title, subtitle, description, imageUrl, actionType, actionValue, sortOrder, isActive, conditions, winners, prizeTitle, prizeImage, drawDate } = body;

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      ...(type !== undefined && { type }),
      ...(title !== undefined && { title }),
      ...(subtitle !== undefined && { subtitle }),
      ...(description !== undefined && { description }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(actionType !== undefined && { actionType }),
      ...(actionValue !== undefined && { actionValue }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
      ...(conditions !== undefined && { conditions }),
      ...(winners !== undefined && { winners }),
      ...(prizeTitle !== undefined && { prizeTitle }),
      ...(prizeImage !== undefined && { prizeImage }),
      ...(drawDate !== undefined && { drawDate }),
    },
  });

  return NextResponse.json(banner);
}

// DELETE /api/banners/:id — удаление (admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для админов" }, { status: 403 });
  }

  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ message: "Баннер удалён" });
}
