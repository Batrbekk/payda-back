import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const modelId = req.nextUrl.searchParams.get("modelId");

  if (!modelId) {
    return NextResponse.json({ error: "modelId обязателен" }, { status: 400 });
  }

  const generations = await prisma.carGeneration.findMany({
    where: { modelId },
    orderBy: { yearFrom: "desc" },
  });

  return NextResponse.json(generations);
}
