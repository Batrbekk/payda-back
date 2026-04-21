"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface ScDashboard {
  id: string;
  name: string;
  type: string;
  commissionPercent: number;
  discountPercent: number;
}

interface ScService {
  id: string; // service id
  name: string;
  category: string;
  price: number | null;
  isFlexPrice: boolean;
  commissionType: string | null;
  commissionValue: number | null;
  cashbackType: string | null;
  cashbackValue: number | null;
}

interface CarByVin {
  id: string;
  vin: string | null;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  mileage: number | null;
  hasActiveWarranty: boolean;
  owner: { id: string; phone: string; name: string | null };
}

interface SelectedService {
  serviceId: string;
  name: string;
  price: number;
  isFlexPrice: boolean;
  details: string;
}

function getToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/sc_token=([^;]+)/);
  return match ? match[1] : "";
}

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  const clean = digits.startsWith("7") || digits.startsWith("8") ? digits.slice(1) : digits;
  const limited = clean.slice(0, 10);
  let result = "+7";
  if (limited.length > 0) result += ` (${limited.slice(0, 3)}`;
  if (limited.length >= 3) result += ")";
  if (limited.length > 3) result += ` ${limited.slice(3, 6)}`;
  if (limited.length > 6) result += `-${limited.slice(6, 8)}`;
  if (limited.length > 8) result += `-${limited.slice(8, 10)}`;
  return result;
}

function phoneToRaw(formatted: string): string {
  const digits = formatted.replace(/\D/g, "");
  if (digits.length >= 11) return `+${digits.slice(0, 11)}`;
  if (digits.length > 1) return `+${digits}`;
  return "";
}

function formatVinInput(value: string): string {
  return value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
}

function computeCommission(svc: ScService, price: number, scCommissionPercent: number): number {
  // Service-level override: SC manager sets commission_type/value for this service
  if (svc.commissionType && svc.commissionValue != null) {
    if (svc.commissionType === "percent") return Math.round((price * svc.commissionValue) / 100);
    return Math.round(svc.commissionValue);
  }
  // Fallback to SC-level commission
  return Math.round((price * scCommissionPercent) / 100);
}

export default function ScCreateVisitPage() {
  const router = useRouter();

  const [sc, setSc] = useState<ScDashboard | null>(null);
  const [services, setServices] = useState<ScService[]>([]);

  // VIN / car lookup
  const [vin, setVin] = useState("");
  const [foundCar, setFoundCar] = useState<CarByVin | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  // Fields for new client (when VIN not found)
  const [phone, setPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

  // Visit details
  const [mileage, setMileage] = useState<string>("");
  const [description, setDescription] = useState("");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [totalAmount, setTotalAmount] = useState<string>(""); // for AUTO_SHOP

  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const didRequestCar = useRef(false);

  // Load SC info + services
  useEffect(() => {
    const token = getToken();
    fetch("/api/service-centers/my", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ScDashboard | null) => {
        if (!d) {
          router.push("/sc-admin/login");
          return;
        }
        setSc(d);
        return fetch(`/api/service-centers/${d.id}/services`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json());
      })
      .then((svcs: ScService[] | undefined) => {
        if (svcs) setServices(svcs);
      })
      .catch(() => {});
  }, [router]);

  const isAutoShop = sc?.type === "AUTO_SHOP";

  // Auto-lookup when VIN is 17 chars
  useEffect(() => {
    if (vin.length !== 17) {
      setFoundCar(null);
      setLookupError("");
      didRequestCar.current = false;
      return;
    }
    if (didRequestCar.current) return;
    didRequestCar.current = true;
    setLookupLoading(true);
    setLookupError("");
    fetch(`/api/cars/by-vin?vin=${encodeURIComponent(vin)}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(async (r) => {
        if (r.status === 404) {
          setFoundCar(null);
          setLookupError("Авто с таким VIN не найдено. Заполните данные для создания нового клиента.");
          return;
        }
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.detail || "Ошибка поиска");
        }
        const data: CarByVin = await r.json();
        setFoundCar(data);
        setBrand(data.brand);
        setModel(data.model);
        setYear(String(data.year));
        setPlateNumber(data.plateNumber);
        setPhone(formatPhoneInput(data.owner.phone.replace(/^\+7/, "")));
        setClientName(data.owner.name || "");
      })
      .catch((e) => setLookupError(e instanceof Error ? e.message : "Ошибка поиска"))
      .finally(() => setLookupLoading(false));
  }, [vin]);

  const toggleService = (svc: ScService) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.serviceId === svc.id);
      if (exists) return prev.filter((s) => s.serviceId !== svc.id);
      return [
        ...prev,
        {
          serviceId: svc.id,
          name: svc.name,
          price: svc.isFlexPrice ? 0 : svc.price ?? 0,
          isFlexPrice: svc.isFlexPrice,
          details: "",
        },
      ];
    });
  };

  const updateServicePrice = (serviceId: string, price: number) => {
    setSelectedServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, price } : s))
    );
  };

  const updateServiceDetails = (serviceId: string, details: string) => {
    setSelectedServices((prev) =>
      prev.map((s) => (s.serviceId === serviceId ? { ...s, details } : s))
    );
  };

  const { totalCost, totalCommission } = useMemo(() => {
    if (!sc) return { totalCost: 0, totalCommission: 0 };
    if (isAutoShop) {
      const amount = parseInt(totalAmount) || 0;
      const commission = Math.round((amount * sc.commissionPercent) / 100);
      return { totalCost: amount, totalCommission: commission };
    }
    let cost = 0;
    let commission = 0;
    for (const sel of selectedServices) {
      const svc = services.find((s) => s.id === sel.serviceId);
      if (!svc) continue;
      cost += sel.price;
      commission += computeCommission(svc, sel.price, sc.commissionPercent);
    }
    return { totalCost: cost, totalCommission: commission };
  }, [sc, services, selectedServices, totalAmount, isAutoShop]);

  const phoneDigits = phone.replace(/\D/g, "");
  const needsClientData = vin.length === 17 && !foundCar && !lookupLoading;

  const isFormValid = useMemo(() => {
    if (!sc) return false;
    if (vin.length !== 17) return false;
    if (lookupLoading) return false;
    if (needsClientData) {
      if (phoneDigits.length !== 11) return false;
      if (!clientName || !brand || !model || !year || !plateNumber) return false;
    }
    if (mileage && foundCar?.mileage != null && parseInt(mileage) < foundCar.mileage) return false;
    if (isAutoShop) {
      return (parseInt(totalAmount) || 0) > 0 && !!description;
    }
    if (selectedServices.length === 0) return false;
    if (selectedServices.some((s) => !s.price || s.price <= 0)) return false;
    return true;
  }, [sc, vin, lookupLoading, needsClientData, phoneDigits, clientName, brand, model, year, plateNumber, mileage, foundCar, isAutoShop, totalAmount, description, selectedServices]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!sc || !isFormValid) return;

      setSaving(true);
      setSubmitError("");

      const payload: Record<string, unknown> = {
        serviceCenterId: sc.id,
        vin,
      };
      if (mileage) payload.mileage = parseInt(mileage);
      if (!foundCar) {
        payload.phone = phoneToRaw(phone);
        payload.clientName = clientName;
        payload.brand = brand;
        payload.model = model;
        payload.year = parseInt(year);
        payload.plateNumber = plateNumber;
      }
      if (isAutoShop) {
        payload.totalAmount = parseInt(totalAmount);
        payload.description = description;
      } else {
        payload.services = selectedServices.map((s) => ({
          serviceId: s.serviceId,
          price: s.price,
          details: s.details || undefined,
        }));
        if (description) payload.description = description;
      }

      try {
        const res = await fetch("/api/visits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.error || "Ошибка создания");
        toast.success("Визит создан", {
          description: `${brand || data.car?.brand || ""} ${model || data.car?.model || ""}`.trim() || undefined,
        });
        setTimeout(() => router.push("/sc-admin"), 700);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Ошибка";
        setSubmitError(msg);
        toast.error("Ошибка", { description: msg });
      } finally {
        setSaving(false);
      }
    },
    [sc, isFormValid, vin, mileage, foundCar, phone, clientName, brand, model, year, plateNumber, isAutoShop, totalAmount, description, selectedServices, router]
  );

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none";

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.push("/sc-admin")}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 sm:mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к списку
      </button>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Добавить визит</h1>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        {/* VIN lookup */}
        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN клиента * <span className="text-gray-400 font-normal">({vin.length}/17)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(formatVinInput(e.target.value))}
              placeholder="WBAPH5C55BA123456"
              className={`${inputClass} font-mono tracking-wider pr-9`}
              required
              maxLength={17}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          {lookupLoading && <p className="mt-2 text-xs text-gray-500">Поиск...</p>}
          {foundCar && (
            <div className="mt-3 p-3 bg-white border border-emerald-200 rounded-lg text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{foundCar.brand} {foundCar.model} {foundCar.year}</p>
                  <p className="text-xs text-gray-500">
                    {foundCar.plateNumber} · {foundCar.owner.name || "без имени"} · {foundCar.owner.phone}
                  </p>
                </div>
                {foundCar.hasActiveWarranty && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full shrink-0">
                    <ShieldCheck className="h-3 w-3" />
                    Гарантия
                  </span>
                )}
              </div>
            </div>
          )}
          {lookupError && (
            <p className="mt-2 text-xs text-amber-700">{lookupError}</p>
          )}
        </div>

        {/* Client + car data — shown when VIN not found */}
        {needsClientData && (
          <div className="p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
            <p className="text-sm font-medium text-gray-700">Новый клиент</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Телефон *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                  placeholder="+7 (700) 123-45-67"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ФИО</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Иванов Иван"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Марка *</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Модель *</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Год *</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Гос.номер *</label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Mileage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Пробег (км)</label>
          <input
            type="number"
            value={mileage}
            onChange={(e) => setMileage(e.target.value.replace(/\D/g, ""))}
            placeholder={foundCar?.mileage ? String(foundCar.mileage) : "150000"}
            min={foundCar?.mileage ?? undefined}
            className={inputClass}
          />
          {foundCar?.mileage != null && (
            <p className="mt-1 text-xs text-gray-500">
              Предыдущий пробег: {foundCar.mileage.toLocaleString("ru-RU")} км — укажите не меньше.
            </p>
          )}
          {foundCar?.mileage != null && mileage && parseInt(mileage) < foundCar.mileage && (
            <p className="mt-1 text-xs text-red-600">
              Пробег не может быть меньше предыдущего ({foundCar.mileage.toLocaleString("ru-RU")} км).
            </p>
          )}
        </div>

        {/* Services or total amount */}
        {isAutoShop ? (
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <p className="text-sm font-medium text-gray-700">Покупка / услуга</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Описание *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Масло, фильтр и т.д."
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Сумма (₸) *</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value.replace(/\D/g, ""))}
                className={inputClass}
                required
              />
            </div>
          </div>
        ) : (
          <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Услуги</p>
              <p className="text-xs text-gray-500">Отметьте выполненные</p>
            </div>
            {services.length === 0 ? (
              <p className="text-xs text-gray-500">У СЦ нет настроенных услуг. Обратитесь к администратору.</p>
            ) : (
              <div className="space-y-2">
                {services.map((svc) => {
                  const selected = selectedServices.find((s) => s.serviceId === svc.id);
                  return (
                    <div
                      key={svc.id}
                      className={`border rounded-lg p-3 ${
                        selected ? "border-emerald-300 bg-emerald-50/50" : "border-gray-200 bg-white"
                      }`}
                    >
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => toggleService(svc)}
                          className="mt-1 accent-emerald-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900">{svc.name}</p>
                            {!svc.isFlexPrice && svc.price != null && (
                              <p className="text-xs text-gray-600 shrink-0">
                                {svc.price.toLocaleString("ru-RU")} ₸
                              </p>
                            )}
                            {svc.isFlexPrice && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded shrink-0">
                                Плавающая
                              </span>
                            )}
                          </div>
                        </div>
                      </label>

                      {selected && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-gray-500 mb-1">
                              Цена (₸) {svc.isFlexPrice && "— укажите"}
                            </label>
                            <input
                              type="number"
                              value={selected.price || ""}
                              onChange={(e) =>
                                updateServicePrice(svc.id, parseInt(e.target.value) || 0)
                              }
                              disabled={!svc.isFlexPrice}
                              className={`${inputClass} ${
                                !svc.isFlexPrice ? "bg-gray-100 text-gray-600" : ""
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-500 mb-1">Комментарий</label>
                            <input
                              type="text"
                              value={selected.details}
                              onChange={(e) => updateServiceDetails(svc.id, e.target.value)}
                              placeholder="Необязательно"
                              className={inputClass}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {sc && (totalCost > 0 || isAutoShop) && (
          <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Сумма визита</span>
              <span className="font-medium text-gray-900">
                {totalCost.toLocaleString("ru-RU")} ₸
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Комиссия платформы</span>
              <span className="font-medium text-gray-900">
                {totalCommission.toLocaleString("ru-RU")} ₸
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !isFormValid}
          className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? "Сохранение..." : <><Check className="h-4 w-4" /> Создать визит</>}
        </button>
      </form>
    </div>
  );
}
