"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Check, UserPlus, UserSearch } from "lucide-react";

interface Car {
  id: string;
  vin: string | null;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
}

interface UserResult {
  id: string;
  phone: string;
  name: string | null;
  cars: Car[];
}

function getToken(): string {
  const match = document.cookie.match(/warranty_token=([^;]+)/);
  return match ? match[1] : "";
}

export default function CreateWarrantyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"new" | "existing">("new");

  // Existing client search
  const [phoneSearch, setPhoneSearch] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  // Form fields
  const [contractNumber, setContractNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [vin, setVin] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const switchMode = (newMode: "new" | "existing") => {
    setMode(newMode);
    setSelectedUser(null);
    setSelectedCar(null);
    setUsers([]);
    setPhoneSearch("");
    setPhone("");
    setClientName("");
    setVin("");
    setBrand("");
    setModel("");
    setYear("");
    setPlateNumber("");
    setError("");
  };

  const searchUsers = async () => {
    if (phoneSearch.length < 3) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/warranties/search-users?phone=${encodeURIComponent(phoneSearch)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setUsers(data);
    } catch {
      console.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const selectUser = (user: UserResult) => {
    setSelectedUser(user);
    setClientName(user.name || "");
    setUsers([]);
    setSelectedCar(null);
    setVin("");
    setBrand("");
    setModel("");
    setYear("");
    setPlateNumber("");
  };

  const selectCar = (car: Car) => {
    setSelectedCar(car);
    setVin(car.vin || "");
    setBrand(car.brand);
    setModel(car.model);
    setYear(String(car.year));
    setPlateNumber(car.plateNumber);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "existing" && (!selectedUser || !selectedCar)) {
      setError("Выберите пользователя и автомобиль");
      return;
    }

    if (mode === "new" && (!phone || !brand || !model || !year || !plateNumber)) {
      setError("Заполните телефон и данные автомобиля");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        contractNumber,
        clientName,
        vin,
        brand,
        model,
        year,
        startDate,
        endDate,
      };

      if (mode === "existing") {
        payload.userId = selectedUser!.id;
        payload.carId = selectedCar!.id;
      } else {
        payload.phone = phone;
        payload.plateNumber = plateNumber;
      }

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

  const isFormValid = mode === "new"
    ? contractNumber && phone && clientName && brand && model && year && plateNumber && startDate && endDate
    : contractNumber && selectedUser && selectedCar && clientName && startDate && endDate;

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none";

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

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => switchMode("new")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${
            mode === "new"
              ? "bg-emerald-50 border-emerald-500 text-emerald-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Новый клиент
        </button>
        <button
          type="button"
          onClick={() => switchMode("existing")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${
            mode === "existing"
              ? "bg-emerald-50 border-emerald-500 text-emerald-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <UserSearch className="h-4 w-4" />
          Существующий клиент
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contract Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Номер договора *</label>
          <input type="text" value={contractNumber} onChange={(e) => setContractNumber(e.target.value)}
            placeholder="ГД-001-2026" className={inputClass} required />
        </div>

        {mode === "new" ? (
          <>
            {/* New client: phone + name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон клиента *</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+77001234567" className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ФИО клиента *</label>
                <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
                  placeholder="Иванов Иван" className={inputClass} required />
              </div>
            </div>

            {/* Car details */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Данные автомобиля</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Марка *</label>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
                    placeholder="BMW" className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Модель *</label>
                  <input type="text" value={model} onChange={(e) => setModel(e.target.value)}
                    placeholder="X5" className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Год *</label>
                  <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
                    placeholder="2024" className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Гос. номер *</label>
                  <input type="text" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="123ABC02" className={inputClass} required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">VIN</label>
                  <input type="text" value={vin} onChange={(e) => setVin(e.target.value)}
                    placeholder="WBAXXXXXX..." className={inputClass} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Existing client: search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пользователь *</label>
              {selectedUser ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{selectedUser.name || "Без имени"}</span>
                    <span className="text-gray-500 ml-2">{selectedUser.phone}</span>
                  </div>
                  <button type="button" onClick={() => { setSelectedUser(null); setSelectedCar(null); setClientName(""); }}
                    className="text-sm text-red-600 hover:text-red-700">Изменить</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" value={phoneSearch} onChange={(e) => setPhoneSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchUsers())}
                        placeholder="Поиск по номеру телефона..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                    </div>
                    <button type="button" onClick={searchUsers} disabled={searching || phoneSearch.length < 3}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50">
                      {searching ? "..." : "Найти"}
                    </button>
                  </div>
                  {users.length > 0 && (
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {users.map((u) => (
                        <button key={u.id} type="button" onClick={() => selectUser(u)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">
                          <span className="font-medium">{u.name || "Без имени"}</span>
                          <span className="text-gray-500 ml-2">{u.phone}</span>
                          <span className="text-gray-400 ml-2">({u.cars.length} авто)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Car Selection */}
            {selectedUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Автомобиль *</label>
                {selectedUser.cars.length === 0 ? (
                  <p className="text-sm text-gray-500">У пользователя нет автомобилей</p>
                ) : (
                  <div className="grid gap-2">
                    {selectedUser.cars.map((car) => (
                      <button key={car.id} type="button" onClick={() => selectCar(car)}
                        className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                          selectedCar?.id === car.id ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"
                        }`}>
                        <div className="font-medium text-gray-900">{car.brand} {car.model} {car.year}</div>
                        <div className="text-gray-500 text-xs mt-0.5">
                          {car.plateNumber} {car.vin ? `| VIN: ${car.vin}` : ""}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ФИО клиента *</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
                placeholder="Иванов Иван Иванович" className={inputClass} required />
            </div>

            {/* Auto-filled car details (read-only context) */}
            {selectedCar && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                  <input type="text" value={vin} onChange={(e) => setVin(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Марка</label>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Модель</label>
                  <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Год</label>
                  <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}
          </>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала *</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания *</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className={inputClass} required />
          </div>
        </div>

        <button type="submit" disabled={saving || !isFormValid}
          className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? "Сохранение..." : "Создать гарантию"}
        </button>
      </form>
    </div>
  );
}
