import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const center = await prisma.serviceCenter.findUnique({
    where: { id },
    include: {
      addresses: true,
      services: { include: { service: true } },
      manager: { select: { phone: true, name: true } },
      _count: { select: { visits: true } },
    },
  });

  if (!center) return NextResponse.json({ error: "СЦ не найден" }, { status: 404 });
  return NextResponse.json(center);
}

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
  const {
    name, type, description, city, phone, managerPhone,
    logoUrl, link2gis, linkInstagram, linkWebsite, linkWhatsapp,
    isActive, rating,
    commissionPercent, discountPercent,
    addresses, serviceIds,
  } = body as {
    name?: string;
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
    isActive?: boolean;
    rating?: number;
    commissionPercent?: number;
    discountPercent?: number;
    addresses?: { address: string; city?: string }[];
    serviceIds?: { serviceId: string; price?: number; isFlexPrice?: boolean }[];
  };

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

  // Update addresses: delete old, create new
  if (addresses) {
    await prisma.serviceCenterAddress.deleteMany({ where: { serviceCenterId: id } });
  }

  // Update services: delete old, create new
  if (serviceIds) {
    await prisma.serviceCenterService.deleteMany({ where: { serviceCenterId: id } });
  }

  const center = await prisma.serviceCenter.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description }),
      ...(city !== undefined && { city }),
      ...(phone !== undefined && { phone }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(link2gis !== undefined && { link2gis }),
      ...(linkInstagram !== undefined && { linkInstagram }),
      ...(linkWebsite !== undefined && { linkWebsite }),
      ...(linkWhatsapp !== undefined && { linkWhatsapp }),
      ...(isActive !== undefined && { isActive }),
      ...(rating !== undefined && { rating }),
      ...(commissionPercent !== undefined && { commissionPercent }),
      ...(discountPercent !== undefined && { discountPercent }),
      ...(managerId !== undefined && { managerId }),
      ...(addresses && {
        addresses: {
          create: addresses.map((a) => ({ address: a.address, city: a.city || city || "Алматы" })),
        },
      }),
      ...(serviceIds && {
        services: {
          create: serviceIds.map((s) => ({
            serviceId: s.serviceId,
            price: s.price,
            isFlexPrice: s.isFlexPrice ?? false,
          })),
        },
      }),
    },
    include: {
      addresses: true,
      services: { include: { service: true } },
      manager: { select: { phone: true, name: true } },
    },
  });

  return NextResponse.json(center);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Только для админов" }, { status: 403 });
  }

  await prisma.serviceCenter.delete({ where: { id } });
  return NextResponse.json({ message: "Сервисный центр удалён" });
}
