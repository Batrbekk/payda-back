import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.visit.deleteMany();
  await prisma.car.deleteMany();
  await prisma.serviceCenter.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: { phone: "+77001234567", name: "Админ Avtovin", role: "ADMIN" },
  });

  const manager = await prisma.user.create({
    data: { phone: "+77009876543", name: "Серик Менеджер", role: "SC_MANAGER" },
  });

  const user1 = await prisma.user.create({
    data: { phone: "+77011111111", name: "Куандык Батырбек", role: "USER" },
  });

  const user2 = await prisma.user.create({
    data: { phone: "+77022222222", name: "Айбек Нурлан", role: "USER" },
  });

  const sc1 = await prisma.serviceCenter.create({
    data: { name: "AutoDoc Service", city: "Алматы", phone: "+77273334455", rating: 4.8, managerId: manager.id, addresses: { create: { address: "ул. Абая 150, Алматы", city: "Алматы" } } },
  });

  const sc2 = await prisma.serviceCenter.create({
    data: { name: "KazAuto Pro", city: "Алматы", phone: "+77271112233", rating: 4.5, addresses: { create: { address: "пр. Назарбаева 77, Алматы", city: "Алматы" } } },
  });

  const sc3 = await prisma.serviceCenter.create({
    data: { name: "Toyota Center Almaty", city: "Алматы", phone: "+77275556677", rating: 4.9, addresses: { create: { address: "ул. Толе би 295, Алматы", city: "Алматы" } } },
  });

  const car1 = await prisma.car.create({
    data: { vin: "JTDKN3DU5A0123456", brand: "Toyota", model: "Camry", year: 2021, plateNumber: "123 ABC 01", mileage: 45000, userId: user1.id },
  });

  const car2 = await prisma.car.create({
    data: { vin: "KNAGH4A89A5123456", brand: "Kia", model: "Sportage", year: 2019, plateNumber: "789 DEF 02", mileage: 78000, userId: user1.id },
  });

  const car3 = await prisma.car.create({
    data: { brand: "Honda", model: "CR-V", year: 2020, plateNumber: "456 GHI 01", mileage: 32000, userId: user2.id },
  });

  await prisma.visit.createMany({
    data: [
      { carId: car1.id, serviceCenterId: sc1.id, description: "Замена масла + фильтры", cost: 15000, cashback: 500, serviceFee: 2000 },
      { carId: car1.id, serviceCenterId: sc2.id, description: "Диагностика ходовой", cost: 8000, cashback: 500, serviceFee: 2000 },
      { carId: car2.id, serviceCenterId: sc1.id, description: "Замена тормозных колодок", cost: 25000, cashback: 500, serviceFee: 2000 },
      { carId: car3.id, serviceCenterId: sc3.id, description: "ТО-30000", cost: 35000, cashback: 500, serviceFee: 2000 },
      { carId: car1.id, serviceCenterId: sc3.id, description: "Замена свечей зажигания", cost: 12000, cashback: 500, serviceFee: 2000 },
    ],
  });

  console.log("Seed completed!");
  console.log(`Admin: ${admin.phone}, Manager: ${manager.phone}`);
  console.log(`Users: ${user1.phone}, ${user2.phone}`);
  console.log(`SC: ${sc1.name}, ${sc2.name}, ${sc3.name}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
