import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const brands = await prisma.carBrand.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(brands);
}
