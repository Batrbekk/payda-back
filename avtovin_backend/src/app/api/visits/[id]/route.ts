import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const visit = await prisma.visit.findUnique({
    where: { id },
    include: {
      car: true,
      serviceCenter: {
        include: { addresses: true },
      },
      services: true,
    },
  });

  if (!visit) {
    return NextResponse.json({ error: "Визит не найден" }, { status: 404 });
  }

  // Check access: user owns the car, or SC manager of this SC, or admin
  if (payload.role === "USER") {
    if (visit.car.userId !== payload.userId) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
  } else if (payload.role === "SC_MANAGER") {
    if (visit.serviceCenter.managerId !== payload.userId) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
  }

  return NextResponse.json(visit);
}
