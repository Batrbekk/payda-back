import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  // Удаляем всё кроме car catalog
  await prisma.warranty.deleteMany();
  await prisma.appSettings.deleteMany();
  await prisma.serviceCenterService.deleteMany();
  await prisma.serviceCenterAddress.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.car.deleteMany();
  await prisma.serviceCenter.deleteMany();
  await prisma.service.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.user.deleteMany();

  // ===== ADMIN =====
  const admin = await prisma.user.create({
    data: { phone: "+77001234567", email: "admin@payda.kz", password: hashPassword("admin123"), name: "Админ Payda", role: "ADMIN" },
  });

  // ===== REAL USER =====
  const user1 = await prisma.user.create({
    data: { phone: "+77758221235", name: "Куандык Батырбек", role: "USER" },
  });

  // ===== SERVICES CATALOG =====
  const services = await Promise.all([
    prisma.service.create({ data: { name: "Замена масла в ДВС", category: "engine", commissionType: "fixed", commissionValue: 2000, cashbackType: "fixed", cashbackValue: 500 } }),
    prisma.service.create({ data: { name: "Замена масла в коробке", category: "transmission" } }),
    prisma.service.create({ data: { name: "Замена фильтров", category: "engine" } }),
    prisma.service.create({ data: { name: "Замена тормозных колодок", category: "brakes" } }),
    prisma.service.create({ data: { name: "Замена тормозных дисков", category: "brakes" } }),
    prisma.service.create({ data: { name: "Замена свечей зажигания", category: "engine" } }),
    prisma.service.create({ data: { name: "Замена ремня ГРМ", category: "engine" } }),
    prisma.service.create({ data: { name: "Чистка коллектора", category: "engine" } }),
    prisma.service.create({ data: { name: "Компьютерная диагностика", category: "diagnostics" } }),
    prisma.service.create({ data: { name: "Мойка автомобиля", category: "wash" } }),
    prisma.service.create({ data: { name: "Проверка тормозной системы", category: "brakes" } }),
    prisma.service.create({ data: { name: "Замена антифриза", category: "engine" } }),
    prisma.service.create({ data: { name: "Диагностика ходовой", category: "diagnostics" } }),
    prisma.service.create({ data: { name: "Развал-схождение", category: "diagnostics" } }),
    prisma.service.create({ data: { name: "Замена аккумулятора", category: "other" } }),
    prisma.service.create({ data: { name: "Шиномонтаж", category: "other" } }),
    prisma.service.create({ data: { name: "Кузовной ремонт", category: "other" } }),
    prisma.service.create({ data: { name: "Покраска", category: "other" } }),
    prisma.service.create({ data: { name: "Полировка", category: "wash" } }),
    prisma.service.create({ data: { name: "Химчистка салона", category: "wash" } }),
  ]);

  const svcMap: Record<string, string> = {};
  for (const s of services) svcMap[s.name] = s.id;

  // ===== SERVICE CENTERS (real Almaty) =====

  const sc1 = await prisma.serviceCenter.create({
    data: {
      name: "AutoDoc Service",
      description: "Профессиональный сервис для всех марок. Оригинальные запчасти и гарантия на работы.",
      city: "Алматы",
      phone: "+77273334455",
      rating: 4.8,
      link2gis: "https://2gis.kz/almaty/firm/70000001",
      linkInstagram: "https://instagram.com/autodoc_almaty",
      linkWhatsapp: "+77273334455",
      addresses: {
        create: [
          { address: "ул. Абая 150, Алматы", city: "Алматы" },
          { address: "ул. Сатпаева 90, Алматы", city: "Алматы" },
        ],
      },
      services: {
        create: [
          { serviceId: svcMap["Замена масла в ДВС"], price: 8000, isFlexPrice: false },
          { serviceId: svcMap["Замена масла в коробке"], price: 12000, isFlexPrice: true },
          { serviceId: svcMap["Замена фильтров"], price: 5000, isFlexPrice: false },
          { serviceId: svcMap["Компьютерная диагностика"], price: 5000, isFlexPrice: false },
          { serviceId: svcMap["Замена тормозных колодок"], price: 15000, isFlexPrice: false },
          { serviceId: svcMap["Диагностика ходовой"], price: 8000, isFlexPrice: true },
        ],
      },
    },
  });

  const sc2 = await prisma.serviceCenter.create({
    data: {
      name: "KazAuto Pro",
      description: "Премиум сервис для немецких авто. BMW, Mercedes, Audi, Volkswagen.",
      city: "Алматы",
      phone: "+77271112233",
      rating: 4.5,
      link2gis: "https://2gis.kz/almaty/firm/70000002",
      linkInstagram: "https://instagram.com/kazauto_pro",
      addresses: {
        create: [
          { address: "пр. Назарбаева 77, Алматы", city: "Алматы" },
        ],
      },
      services: {
        create: [
          { serviceId: svcMap["Компьютерная диагностика"], price: 7000, isFlexPrice: false },
          { serviceId: svcMap["Замена масла в ДВС"], price: 10000, isFlexPrice: true },
          { serviceId: svcMap["Развал-схождение"], price: 6000, isFlexPrice: false },
          { serviceId: svcMap["Замена ремня ГРМ"], price: 35000, isFlexPrice: false },
        ],
      },
    },
  });

  const sc3 = await prisma.serviceCenter.create({
    data: {
      name: "Toyota Center Almaty",
      description: "Официальный дилерский сервис Toyota и Lexus. Оригинальные запчасти.",
      city: "Алматы",
      phone: "+77275556677",
      rating: 4.9,
      link2gis: "https://2gis.kz/almaty/firm/70000003",
      linkInstagram: "https://instagram.com/toyota_almaty",
      linkWebsite: "https://toyota.kz",
      addresses: {
        create: [
          { address: "ул. Толе би 295, Алматы", city: "Алматы" },
          { address: "пр. Суюнбая 159, Алматы", city: "Алматы" },
          { address: "ул. Рыскулова 57, Алматы", city: "Алматы" },
        ],
      },
      services: {
        create: [
          { serviceId: svcMap["Замена масла в ДВС"], price: 12000, isFlexPrice: false },
          { serviceId: svcMap["Компьютерная диагностика"], price: 3000, isFlexPrice: false },
          { serviceId: svcMap["Мойка автомобиля"], price: 3000, isFlexPrice: false },
          { serviceId: svcMap["Замена антифриза"], price: 8000, isFlexPrice: false },
          { serviceId: svcMap["Полировка"], price: 15000, isFlexPrice: true },
        ],
      },
    },
  });

  const sc4 = await prisma.serviceCenter.create({
    data: {
      name: "Speed Motors",
      description: "Быстрый и качественный сервис. Корейские и японские авто.",
      city: "Алматы",
      phone: "+77277778899",
      rating: 4.3,
      linkInstagram: "https://instagram.com/speed_motors_almaty",
      linkWhatsapp: "+77277778899",
      addresses: {
        create: [
          { address: "ул. Жандосова 180, Алматы", city: "Алматы" },
        ],
      },
      services: {
        create: [
          { serviceId: svcMap["Замена масла в ДВС"], price: 7000, isFlexPrice: true },
          { serviceId: svcMap["Шиномонтаж"], price: 4000, isFlexPrice: false },
          { serviceId: svcMap["Замена тормозных колодок"], price: 12000, isFlexPrice: false },
          { serviceId: svcMap["Проверка тормозной системы"], price: 0, isFlexPrice: true },
          { serviceId: svcMap["Химчистка салона"], price: 25000, isFlexPrice: false },
        ],
      },
    },
  });

  const sc5 = await prisma.serviceCenter.create({
    data: {
      name: "Master Oil",
      description: "Специализация: замена масла и фильтров за 30 минут. Все марки авто.",
      city: "Алматы",
      phone: "+77279990011",
      rating: 4.6,
      link2gis: "https://2gis.kz/almaty/firm/70000005",
      addresses: {
        create: [
          { address: "ул. Тимирязева 42, Алматы", city: "Алматы" },
          { address: "пр. Райымбека 221, Алматы", city: "Алматы" },
        ],
      },
      services: {
        create: [
          { serviceId: svcMap["Замена масла в ДВС"], price: 6000, isFlexPrice: true },
          { serviceId: svcMap["Замена масла в коробке"], price: 10000, isFlexPrice: true },
          { serviceId: svcMap["Замена фильтров"], price: 3000, isFlexPrice: false },
          { serviceId: svcMap["Замена антифриза"], price: 5000, isFlexPrice: false },
        ],
      },
    },
  });

  // ===== SC_MANAGER USERS (linked to service centers) =====
  const mgr1 = await prisma.user.create({ data: { phone: "+77273334455", name: "Менеджер AutoDoc", role: "SC_MANAGER" } });
  const mgr2 = await prisma.user.create({ data: { phone: "+77271112233", name: "Менеджер KazAuto", role: "SC_MANAGER" } });
  const mgr3 = await prisma.user.create({ data: { phone: "+77275556677", name: "Менеджер Toyota", role: "SC_MANAGER" } });
  const mgr4 = await prisma.user.create({ data: { phone: "+77277778899", name: "Менеджер Speed Motors", role: "SC_MANAGER" } });
  const mgr5 = await prisma.user.create({ data: { phone: "+77279990011", name: "Менеджер Master Oil", role: "SC_MANAGER" } });

  // Link managers to service centers
  await prisma.serviceCenter.update({ where: { id: sc1.id }, data: { managerId: mgr1.id } });
  await prisma.serviceCenter.update({ where: { id: sc2.id }, data: { managerId: mgr2.id } });
  await prisma.serviceCenter.update({ where: { id: sc3.id }, data: { managerId: mgr3.id } });
  await prisma.serviceCenter.update({ where: { id: sc4.id }, data: { managerId: mgr4.id } });
  await prisma.serviceCenter.update({ where: { id: sc5.id }, data: { managerId: mgr5.id } });

  // ===== WARRANTY_MANAGER =====
  const warrantyMgr = await prisma.user.create({
    data: {
      phone: "+77050001122",
      email: "warranty@payda.kz",
      password: hashPassword("warranty123"),
      name: "Менеджер Гарантий",
      role: "WARRANTY_MANAGER",
      salonName: "AutoStar Almaty",
    },
  });

  // ===== APP SETTINGS (warranty) =====
  await prisma.appSettings.create({
    data: { key: "warranty_whatsapp_link", value: "https://wa.me/77050001122?text=Хочу оформить гарантию" },
  });
  await prisma.appSettings.create({
    data: {
      key: "warranty_conditions",
      value: JSON.stringify([
        "Гарантия действует на территории Республики Казахстан",
        "Распространяется на двигатель, КПП, ходовую часть",
        "Максимальная выплата — до 1 000 000 ₸",
        "Срок действия — 1 год с момента оформления",
        "Необходимо проходить ТО по регламенту",
      ]),
    },
  });

  return NextResponse.json({
    message: "Seed completed!",
    admin: { email: "admin@payda.kz", password: "admin123" },
    warrantyManager: { email: "warranty@payda.kz", password: "warranty123" },
    users: [user1.phone],
    serviceCenters: [sc1.name, sc2.name, sc3.name, sc4.name, sc5.name],
    scManagers: [mgr1.phone, mgr2.phone, mgr3.phone, mgr4.phone, mgr5.phone],
    services: services.length,
    note: "SC manager phones use OTP 0000 (no SMS). Warranty admin: /warranty-admin/login",
  });
}
