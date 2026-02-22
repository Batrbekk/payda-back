"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CatalogBrand {
  id: string;
  name: string;
}

interface CatalogModel {
  id: string;
  name: string;
  brandId: string;
}

function getToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/warranty_token=([^;]+)/);
  return match ? match[1] : "";
}

function formatDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function calcEndDate(carYear: number): Date {
  const now = new Date();
  const currentYear = now.getFullYear();
  if (currentYear - carYear >= 2) {
    // БУ — 1 месяц
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    return end;
  }
  // Новая — 5 лет
  const end = new Date(now);
  end.setFullYear(end.getFullYear() + 5);
  return end;
}

// Combobox component
function Combobox({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (id: string, name: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label} *</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-left flex items-center justify-between focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        }`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">Ничего не найдено</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id, o.name);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 ${
                    o.name === value ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-700"
                  }`}
                >
                  {o.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateWarrantyPage() {
  const router = useRouter();

  // Form fields
  const [contractNumber, setContractNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [vin, setVin] = useState("");
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [modelId, setModelId] = useState("");
  const [modelName, setModelName] = useState("");
  const [year, setYear] = useState("");

  // Catalog data
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [models, setModels] = useState<CatalogModel[]>([]);

  // Dates (auto-calculated)
  const today = new Date();
  const startDateStr = formatDate(today);
  const endDate = year ? calcEndDate(parseInt(year)) : null;
  const endDateStr = endDate ? formatDate(endDate) : "—";
  const warrantyType = year
    ? today.getFullYear() - parseInt(year) >= 2
      ? "БУ (1 месяц)"
      : "Новая (5 лет)"
    : "";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load brands on mount
  useEffect(() => {
    fetch("/api/car-catalog/brands", {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setBrands(data))
      .catch(() => {});
  }, []);

  // Load models when brand changes
  useEffect(() => {
    if (!brandId) {
      setModels([]);
      return;
    }
    fetch(`/api/car-catalog/models?brandId=${brandId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setModels(data))
      .catch(() => {});
  }, [brandId]);

  // Year options: current year down to 1990
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => currentYear - i);

  const isFormValid =
    contractNumber && phone && clientName && brandName && modelName && year && vin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        contractNumber,
        phone,
        clientName,
        vin,
        brand: brandName,
        model: modelName,
        year: parseInt(year),
        plateNumber: contractNumber, // ГРНЗ = номер договора
        startDate: toISODate(today),
        endDate: endDate ? toISODate(endDate) : undefined,
      };

      const res = await fetch("/api/warranties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);

      setSuccess(true);
      setTimeout(() => router.push("/warranty-admin"), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка при создании");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none";

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.push("/warranty-admin")}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к списку
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Добавить гарантию</h1>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
          <Check className="h-4 w-4" />
          Гарантия успешно создана! Перенаправление...
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ГРНЗ / Номер договора */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ГРНЗ / Номер договора *
          </label>
          <input
            type="text"
            value={contractNumber}
            onChange={(e) => setContractNumber(e.target.value)}
            placeholder="123ABC02"
            className={inputClass}
            required
          />
        </div>

        {/* Phone + Name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон клиента *
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+77001234567"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ФИО клиента *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Иванов Иван"
              className={inputClass}
              required
            />
          </div>
        </div>

        {/* Car details */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Данные автомобиля</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Brand combobox */}
            <Combobox
              label="Марка"
              value={brandName}
              options={brands}
              placeholder="Выберите марку"
              onChange={(id, name) => {
                setBrandId(id);
                setBrandName(name);
                setModelId("");
                setModelName("");
              }}
            />

            {/* Model combobox */}
            <Combobox
              label="Модель"
              value={modelName}
              options={models}
              placeholder={brandId ? "Выберите модель" : "Сначала марку"}
              disabled={!brandId}
              onChange={(id, name) => {
                setModelId(id);
                setModelName(name);
              }}
            />

            {/* Year select */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Год *</label>
              <ShadSelect value={year} onValueChange={(val) => setYear(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите год" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadSelect>
            </div>

            {/* VIN */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">VIN *</label>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="WBAXXXXXX..."
                className={inputClass}
                required
              />
            </div>
          </div>
        </div>

        {/* Dates (auto-calculated, readonly) */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Срок гарантии</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Дата начала
              </label>
              <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                {startDateStr}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Дата окончания
              </label>
              <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                {endDateStr}
              </div>
            </div>
          </div>
          {warrantyType && (
            <p className="mt-2 text-xs text-blue-600">
              Тип: {warrantyType}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || !isFormValid}
          className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Сохранение..." : "Создать гарантию"}
        </button>
      </form>
    </div>
  );
}
