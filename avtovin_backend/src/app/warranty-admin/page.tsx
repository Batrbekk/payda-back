"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Shield, ShieldCheck, ShieldX } from "lucide-react";

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
  const match = document.cookie.match(/warranty_token=([^;]+)/);
  return match ? match[1] : "";
}

export default function WarrantyAdminPage() {
  const router = useRouter();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchWarranties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter !== "all") params.set("filter", filter);

      const res = await fetch(`/api/warranties?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/warranty-admin/login");
        return;
      }

      const data = await res.json();
      setWarranties(data);
    } catch {
      console.error("Failed to fetch warranties");
    } finally {
      setLoading(false);
    }
  }, [search, filter, router]);

  useEffect(() => {
    fetchWarranties();
  }, [fetchWarranties]);

  const isExpired = (w: Warranty) => new Date(w.endDate) < new Date();

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Гарантии</h1>
          <p className="text-sm text-gray-500 mt-1">Управление гарантийными договорами</p>
        </div>
        <button
          onClick={() => router.push("/warranty-admin/create")}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm"
        >
          <Plus className="h-4 w-4" />
          Добавить гарантию
        </button>
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        >
          <option value="all">Все</option>
          <option value="active">Активные</option>
          <option value="expired">Истёкшие</option>
        </select>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Загрузка...
                </td>
              </tr>
            ) : warranties.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Гарантии не найдены
                </td>
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
                      {w.user?.phone && (
                        <div className="text-xs text-gray-500">{w.user.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {w.brand} {w.model} {w.year}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{w.vin || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {formatDate(w.startDate)} — {formatDate(w.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {active ? "Активна" : "Истекла"}
                      </span>
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
