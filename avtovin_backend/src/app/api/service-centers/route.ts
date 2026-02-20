import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city") || "";
  const search = req.nextUrl.searchParams.get("search") || "";
  const type = req.nextUrl.searchParams.get("type") || "";

  const where: Record<string, unknown> = { isActive: true };
  if (city) where.city = city;
  if (search) where.name = { contains: search };
  if (type) where.type = type;

  const centers = await prisma.serviceCenter.findMany({
    where,
    include: {
      addresses: true,
      services: { include: { service: true } },
      manager: { select: { phone: true, name: true } },
      _count: { select: { visits: true } },
    },
    orderBy: { rating: "desc" },
  });

  return NextResponse.json(centers);
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
  const {
    name, type, description, city, phone, managerPhone,
    logoUrl, link2gis, linkInstagram, linkWebsite, linkWhatsapp,
    commissionPercent, discountPercent,
    addresses, serviceIds,
  } = body as {
    name: string;
    type?: string;
    description?: string;
    city?: string;
    phone?: string;
    managerPhone?: string;
    logoUrl?: string;
    link2gis?: string;
    linkInstagram?: string;
    linkWebsite?: string;
    linkWhatsapp?: string;
    commissionPercent?: number;
    discountPercent?: number;
    addresses?: { address: string; city?: string }[];
    serviceIds?: { serviceId: string; price?: number; isFlexPrice?: boolean }[];
  };

  if (!name) {
    return NextResponse.json({ error: "Название обязательно" }, { status: 400 });
  }

  if (!addresses || addresses.length === 0) {
    return NextResponse.json({ error: "Укажите хотя бы один адрес" }, { status: 400 });
  }

  let managerId: string | undefined;
  if (managerPhone) {
    let manager = await prisma.user.findUnique({ where: { phone: managerPhone } });
    if (!manager) {
      manager = await prisma.user.create({
        data: { phone: managerPhone, role: "SC_MANAGER" },
      });
    } else {
      await prisma.user.update({
        where: { id: manager.id },
        data: { role: "SC_MANAGER" },
      });
    }
    managerId = manager.id;
  }

  const center = await prisma.serviceCenter.create({
    data: {
      name,
      type: type || "SERVICE_CENTER",
      description,
      city: city || "Алматы",
      phone,
      logoUrl,
      link2gis,
      linkInstagram,
      linkWebsite,
      linkWhatsapp,
      managerId,
      ...(commissionPercent !== undefined && { commissionPercent }),
      ...(discountPercent !== undefined && { discountPercent }),
      addresses: {
        create: addresses.map((a) => ({ address: a.address, city: a.city || city || "Алматы" })),
      },
      services: serviceIds
        ? {
            create: serviceIds.map((s) => ({
              serviceId: s.serviceId,
              price: s.price,
              isFlexPrice: s.isFlexPrice ?? false,
            })),
          }
        : undefined,
    },
    include: {
      addresses: true,
      services: { include: { service: true } },
    },
  });

  return NextResponse.json(center, { status: 201 });
}
