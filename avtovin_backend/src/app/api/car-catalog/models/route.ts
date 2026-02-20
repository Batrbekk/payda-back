import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const brandId = req.nextUrl.searchParams.get("brandId");

  if (!brandId) {
    return NextResponse.json({ error: "brandId обязателен" }, { status: 400 });
  }

  const models = await prisma.carModel.findMany({
    where: { brandId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(models);
}
