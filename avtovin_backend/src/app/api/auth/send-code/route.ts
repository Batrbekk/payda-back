import { prisma } from "@/lib/db";
import { generateOtp } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

async function sendSms(phone: string, text: string) {
  const apiKey = process.env.MOBIZON_API_KEY;
  const apiUrl = process.env.MOBIZON_API_URL || "https://api.mobizon.kz";

  // Номер без "+" для Mobizon (77001234567)
  const recipient = phone.replace("+", "");

  const params = new URLSearchParams({
    apiKey: apiKey || "",
    recipient,
    text,
    output: "json",
  });

  const url = `${apiUrl}/service/message/sendSmsMessage?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json();
  console.log(`[Mobizon] ${phone}:`, JSON.stringify(data));
  return data;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const phone = body.phone as string;

  if (!phone || !/^\+7\d{10}$/.test(phone)) {
    return NextResponse.json({ error: "Неверный формат телефона. Используйте +7XXXXXXXXXX" }, { status: 400 });
  }

  // Удаляем старые коды
  await prisma.otpCode.deleteMany({ where: { phone } });

  // Проверяем: если это SC_MANAGER или тестовый номер — фиксированный код 0000, без SMS
  const testPhones = ["+77760047836"];
  const existingUser = await prisma.user.findUnique({ where: { phone } });
  const isTestAccount = existingUser?.role === "SC_MANAGER" || testPhones.includes(phone);

  const code = isTestAccount ? "0000" : generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

  await prisma.otpCode.create({
    data: { phone, code, expiresAt },
  });

  // Отправка SMS через Mobizon (пропускаем для тестовых аккаунтов)
  if (!isTestAccount) {
    try {
      const smsResult = await sendSms(phone, `Payda: Ваш код подтверждения: ${code}`);
      if (smsResult.code !== 0) {
        console.error("[Mobizon] SMS failed:", JSON.stringify(smsResult));
        return NextResponse.json({ error: "Не удалось отправить SMS. Попробуйте позже" }, { status: 502 });
      }
    } catch (err) {
      console.error("[Mobizon Error]", err);
      return NextResponse.json({ error: "Ошибка отправки SMS. Попробуйте позже" }, { status: 502 });
    }
  }

  console.log(`[OTP] ${phone}: ${code}${isTestAccount ? " (test account, no SMS)" : ""}`);

  return NextResponse.json({ message: "Код отправлен", expiresIn: 300 });
}
