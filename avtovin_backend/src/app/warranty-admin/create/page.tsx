"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, Upload, X, FileText, Image } from "lucide-react";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface CatalogBrand {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface CatalogModel {
  id: string;
  name: string;
  brandId: string;
}

interface UploadedFile {
  filename: string;
  url: string;
  originalName: string;
}

function formatPhoneInput(value: string): string {
  // Strip everything except digits
  const digits = value.replace(/\D/g, "");
  // Remove leading 7 or 8 if user types full number
  const clean = digits.startsWith("7") ? digits.slice(1) : digits.startsWith("8") ? digits.slice(1) : digits;
  // Limit to 10 digits
  const limited = clean.slice(0, 10);
  // Format: +7 (XXX) XXX-XX-XX
  let result = "+7";
  if (limited.length > 0) result += ` (${limited.slice(0, 3)}`;
  if (limited.length >= 3) result += `)`;
  if (limited.length > 3) result += ` ${limited.slice(3, 6)}`;
  if (limited.length > 6) result += `-${limited.slice(6, 8)}`;
  if (limited.length > 8) result += `-${limited.slice(8, 10)}`;
  return result;
}

function phoneToRaw(formatted: string): string {
  // Extract +7XXXXXXXXXX from formatted string
  const digits = formatted.replace(/\D/g, "");
  if (digits.length >= 11) return `+${digits.slice(0, 11)}`;
  if (digits.length > 1) return `+${digits}`;
  return "";
}

function formatVinInput(value: string): string {
  // VIN: 17 alphanumeric characters, uppercase, no I, O, Q
  return value
    .toUpperCase()
    .replace(/[^A-HJ-NPR-Z0-9]/g, "")
    .slice(0, 17);
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
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    return end;
  }
  const end = new Date(now);
  end.setFullYear(end.getFullYear() + 5);
  return end;
}

// Combobox component with optional logos
function Combobox({
  label,
  value,
  selectedLogo,
  options,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  selectedLogo?: string | null;
  options: { id: string; name: string; logoUrl?: string | null }[];
  onChange: (id: string, name: string, logoUrl?: string | null) => void;
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
        <span className={`flex items-center gap-2 truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
          {selectedLogo && (
            <img src={selectedLogo} alt="" className="w-5 h-5 object-contain shrink-0" />
          )}
          {value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
      </button>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-hidden">
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
          <div className="overflow-y-auto max-h-56">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">Ничего не найдено</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id, o.name, o.logoUrl);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center gap-2 ${
                    o.name === value ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-700"
                  }`}
                >
                  {o.logoUrl && (
                    <img src={o.logoUrl} alt="" className="w-5 h-5 object-contain shrink-0" />
                  )}
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
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [modelId, setModelId] = useState("");
  const [modelName, setModelName] = useState("");
  const [year, setYear] = useState("");

  // File uploads
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Responsibility
  const [accepted, setAccepted] = useState(false);

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

  const phoneDigits = phone.replace(/\D/g, "");
  const isFormValid =
    contractNumber && phoneDigits.length === 11 && clientName && brandName && modelName && year && vin.length === 17 && accepted;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/warranties/upload-docs", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Ошибка загрузки");
      }

      const data: { filename: string; url: string }[] = await res.json();
      const newFiles = data.map((d, i) => ({
        ...d,
        originalName: files[i]?.name || d.filename,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки файлов");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSaving(true);
    setError("");
    try {
      const docUrls = uploadedFiles.map((f) => f.url).join(",");
      const payload = {
        contractNumber,
        phone: phoneToRaw(phone),
        clientName,
        vin,
        brand: brandName,
        model: modelName,
        year: parseInt(year),
        plateNumber: contractNumber,
        startDate: toISODate(today),
        endDate: endDate ? toISODate(endDate) : undefined,
        docUrls: docUrls || undefined,
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
      toast.success("Гарантия успешно создана!", {
        description: `${brandName} ${modelName} — ${clientName}`,
      });
      setTimeout(() => router.push("/warranty-admin"), 1500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка при создании";
      setError(msg);
      toast.error("Ошибка", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none";

  const isImage = (name: string) => /\.(png|jpg|jpeg)$/i.test(name);

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.push("/warranty-admin")}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 sm:mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к списку
      </button>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Добавить гарантию</h1>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          Гарантия успешно создана! Перенаправление...
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон клиента *
            </label>
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
        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Данные автомобиля</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Combobox
              label="Марка"
              value={brandName}
              selectedLogo={brandLogo}
              options={brands}
              placeholder="Выберите марку"
              onChange={(id, name, logoUrl) => {
                setBrandId(id);
                setBrandName(name);
                setBrandLogo(logoUrl ?? null);
                setModelId("");
                setModelName("");
              }}
            />
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
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                VIN * <span className="text-gray-400 font-normal">({vin.length}/17)</span>
              </label>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(formatVinInput(e.target.value))}
                placeholder="WBAPH5C55BA123456"
                className={`${inputClass} font-mono tracking-wider`}
                required
                maxLength={17}
              />
            </div>
          </div>
        </div>

        {/* Dates (auto-calculated, readonly) */}
        <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Срок гарантии</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Дата начала</label>
              <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                {startDateStr}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Дата окончания</label>
              <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900">
                {endDateStr}
              </div>
            </div>
          </div>
          {warrantyType && (
            <p className="mt-2 text-xs text-blue-600">Тип: {warrantyType}</p>
          )}
        </div>

        {/* Document uploads */}
        <div className="p-3 sm:p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm font-medium text-gray-700 mb-1">Документы</p>
          <p className="text-xs text-gray-500 mb-3">
            Прикрепите фото/скан техпаспорта и удостоверения личности (PDF, PNG, JPG)
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 border border-amber-300 bg-white rounded-lg text-sm text-gray-700 hover:bg-amber-100 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Загрузка..." : "Выбрать файлы"}
          </button>

          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-amber-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isImage(f.originalName) ? (
                      <Image className="h-4 w-4 text-amber-600 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    <span className="text-sm text-gray-700 truncate">{f.originalName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="p-1 text-gray-400 hover:text-red-500 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Responsibility disclaimer */}
        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-3">
            <Checkbox
              id="responsibility"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              className="mt-0.5"
            />
            <label
              htmlFor="responsibility"
              className="text-xs sm:text-sm text-gray-600 leading-relaxed cursor-pointer"
            >
              Я подтверждаю, что все указанные данные являются достоверными и корректными.
              За заполненные данные несёт ответственность менеджер, оформляющий гарантию.
              В случае предоставления недостоверных данных, ответственность возлагается на заполняющего менеджера.
            </label>
          </div>
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
