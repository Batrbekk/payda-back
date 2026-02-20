import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ vin: string }> }) {
  const { vin } = await params;

  if (!vin || !/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
    return NextResponse.json({ error: "Неверный формат VIN (17 символов)" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin.toUpperCase()}?format=json`,
      { next: { revalidate: 86400 } } // кешируем на 24 часа
    );

    const data = await res.json();
    const result = data.Results?.[0];

    if (!result || result.ErrorCode === "1") {
      return NextResponse.json({ error: "VIN не найден" }, { status: 404 });
    }

    // Определяем тип двигателя
    let engineType = "ICE";
    const fuel = (result.FuelTypePrimary || "").toLowerCase();
    const electrification = (result.ElectrificationLevel || "").toLowerCase();

    if (electrification.includes("bev") || fuel.includes("electric")) {
      engineType = "ELECTRIC";
    } else if (electrification.includes("hybrid") || fuel.includes("hybrid")) {
      engineType = "HYBRID";
    }

    return NextResponse.json({
      vin: vin.toUpperCase(),
      brand: result.Make || null,
      model: result.Model || null,
      year: result.ModelYear ? parseInt(result.ModelYear) : null,
      engineType,
      fuelType: result.FuelTypePrimary || null,
      vehicleType: result.VehicleType || null,
      manufacturer: result.Manufacturer || null,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка декодирования VIN" }, { status: 500 });
  }
}
