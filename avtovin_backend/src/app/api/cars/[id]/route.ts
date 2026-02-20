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

  const car = await prisma.car.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, phone: true } },
    },
  });

  if (!car) return NextResponse.json({ error: "Автомобиль не найден" }, { status: 404 });

  return NextResponse.json(car);
}
