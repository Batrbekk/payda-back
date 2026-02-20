"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, ShieldCheck, ShieldX, Search, Trash2, Save, Plus, X } from "lucide-react";

interface Warranty {
  id: string;
  contractNumber: string;
  clientName: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  user?: { phone: string; name: string | null };
}

function getToken(): string {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : "";
}

export default function AdminWarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Settings
  const [whatsappLink, setWhatsappLink] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchWarranties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter !== "all") params.set("filter", filter);

      const res = await fetch(`/api/warranties?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setWarranties(data);
    } catch {
      console.error("Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?key=warranty_whatsapp_link,warranty_conditions");
      const data = await res.json();
      setWhatsappLink(data.warranty_whatsapp_link || "");
      try {
        setConditions(JSON.parse(data.warranty_conditions || "[]"));
      } catch {
        setConditions([]);
      }
    } catch {
      console.error("Failed to fetch settings");
    }
  }, []);

  useEffect(() => {
    fetchWarranties();
    fetchSettings();
  }, [fetchWarranties, fetchSettings]);

  const saveSettings = async () => {
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ key: "warranty_whatsapp_link", value: whatsappLink }),
      });
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ key: "warranty_conditions", value: JSON.stringify(conditions) }),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch {
      console.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const deleteWarranty = async (id: string) => {
    if (!confirm("Удалить гарантию?")) return;
    try {
      await fetch(`/api/warranties/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setWarranties((prev) => prev.filter((w) => w.id !== id));
    } catch {
      console.error("Failed to delete");
    }
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;
    setConditions([...conditions, newCondition.trim()]);
    setNewCondition("");
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const isExpired = (w: Warranty) => new Date(w.endDate) < new Date();

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Гарантии</h1>

      {/* Settings Block */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Настройки гарантий</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp ссылка (кнопка &quot;Купить гарантию&quot;)
            </label>
            <input
              type="text"
              value={whatsappLink}
              onChange={(e) => setWhatsappLink(e.target.value)}
              placeholder="https://wa.me/77001234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Условия гарантии
            </label>
            <div className="space-y-2 mb-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    {c}
                  </span>
                  <button
                    onClick={() => removeCondition(i)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCondition())}
                placeholder="Новое условие..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              />
              <button
                onClick={addCondition}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {savingSettings ? "Сохранение..." : settingsSaved ? "Сохранено!" : "Сохранить настройки"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Shield className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{warranties.length}</p>
            <p className="text-xs text-gray-500">Всего</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {warranties.filter((w) => w.isActive && !isExpired(w)).length}
            </p>
            <p className="text-xs text-gray-500">Активные</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <ShieldX className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {warranties.filter((w) => !w.isActive || isExpired(w)).length}
            </p>
            <p className="text-xs text-gray-500">Истёкшие</p>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по номеру договора, ФИО или VIN..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
        >
          <option value="all">Все</option>
          <option value="active">Активные</option>
          <option value="expired">Истёкшие</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Договор</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Клиент</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Автомобиль</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">VIN</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Период</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Загрузка...</td>
              </tr>
            ) : warranties.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Гарантии не найдены</td>
              </tr>
            ) : (
              warranties.map((w) => {
                const expired = isExpired(w);
                const active = w.isActive && !expired;
                return (
                  <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{w.contractNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{w.clientName}</div>
                      {w.user?.phone && <div className="text-xs text-gray-500">{w.user.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{w.brand} {w.model} {w.year}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{w.vin || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {formatDate(w.startDate)} — {formatDate(w.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {active ? "Активна" : "Истекла"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteWarranty(w.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
