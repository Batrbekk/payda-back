import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для админов" }, { status: 403 });
  }

  const body = await req.json();
  const { name, category, commissionType, commissionValue, cashbackType, cashbackValue } = body as {
    name: string;
    category?: string;
    commissionType?: string;
    commissionValue?: number;
    cashbackType?: string;
    cashbackValue?: number;
  };

  if (!name) {
    return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      name,
      category: category || "general",
      commissionType: commissionType || "percent",
      commissionValue: commissionValue ?? 20,
      cashbackType: cashbackType || "percent",
      cashbackValue: cashbackValue ?? 25,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
