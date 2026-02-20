"use client";

import { useEffect, useState } from "react";
import { Globe, Eye, EyeOff, MapPin, Building2, Search } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  type: string;
  city: string;
  is_active: boolean;
  show_on_landing: boolean;
}

interface City {
  name: string;
  count: number;
}

export default function LandingAdminPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filterCity, setFilterCity] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [partnersRes, citiesRes] = await Promise.all([
        fetch("/api/service-centers"),
        fetch("/api/landing/cities"),
      ]);
      const partnersData = await partnersRes.json();
      const citiesData = await citiesRes.json();
      setPartners(
        partnersData.map((p: Record<string, unknown>) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          city: p.city,
          is_active: p.isActive ?? p.is_active,
          show_on_landing: p.showOnLanding ?? p.show_on_landing ?? true,
        }))
      );
      setCities(citiesData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleVisibility = async (id: string) => {
    try {
      const res = await fetch(`/api/landing/partners/${id}/visibility`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getCookie("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPartners((prev) =>
          prev.map((p) => (p.id === id ? { ...p, show_on_landing: data.show_on_landing } : p))
        );
      }
    } catch {
      // ignore
    }
  };

  const filtered = partners.filter((p) => {
    if (filterCity && p.city !== filterCity) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="h-6 w-6" />
          Управление лендингом
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Управляйте отображением партнёров и городов на странице casco.kz
        </p>
      </div>

      {/* Cities overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-yellow-500" />
          Города на лендинге
        </h2>
        <div className="flex flex-wrap gap-3">
          {cities.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200"
            >
              <span className="text-sm font-medium text-gray-900">{c.name}</span>
              <span className="text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                {c.count}
              </span>
            </div>
          ))}
          {cities.length === 0 && (
            <p className="text-sm text-gray-500">Нет городов с активными партнёрами</p>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Города отображаются автоматически на основе активных партнёров, показанных на лендинге
        </p>
      </div>

      {/* Partners */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-yellow-500" />
          Партнёры на лендинге
        </h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
            />
          </div>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
          >
            <option value="">Все города</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Партнёр</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Город</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Тип</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Статус</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">На лендинге</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{p.name}</td>
                  <td className="py-3 px-4 text-gray-600">{p.city}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-1">
                      {p.type === "SERVICE_CENTER"
                        ? "СЦ"
                        : p.type === "AUTO_SHOP"
                          ? "Магазин"
                          : "Мойка"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs rounded-full px-2 py-1 ${
                        p.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {p.is_active ? "Активен" : "Неактивен"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleVisibility(p.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        p.show_on_landing
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {p.show_on_landing ? (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Показан
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Скрыт
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Ничего не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}
