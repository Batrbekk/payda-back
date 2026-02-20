import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { eventStore } from "@/lib/events";
import { NextRequest, NextResponse } from "next/server";

// SC calls this when scanning a user's QR code
// Notifies the car owner that their QR was scanned
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (payload.role !== "SC_MANAGER" && payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { carId } = body as { carId: string };

  if (!carId) {
    return NextResponse.json({ error: "carId required" }, { status: 400 });
  }

  // Find car owner
  const car = await prisma.car.findUnique({
    where: { id: carId },
    select: { userId: true, brand: true, model: true },
  });

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  // Find SC name
  const sc = await prisma.serviceCenter.findFirst({
    where: { managerId: payload.userId },
    select: { name: true, type: true },
  });

  // Emit scan:started event to the car owner
  eventStore.emit(car.userId, "scan:started", {
    carId,
    carName: `${car.brand} ${car.model}`,
    serviceCenterName: sc?.name ?? "Сервисный центр",
    serviceCenterType: sc?.type ?? "SERVICE_CENTER",
  });

  return NextResponse.json({ ok: true });
}
