"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldCheck, Wrench } from "lucide-react";

interface VisitServiceItem {
  id: string;
  serviceName: string;
  price: number;
}

interface VisitUserBrief {
  name: string | null;
  phone: string;
}

interface VisitCarBrief {
  brand: string;
  model: string;
  plateNumber: string;
  user: VisitUserBrief | null;
}

interface VisitScBrief {
  name: string;
  type: string;
}

interface Visit {
  id: string;
  description: string;
  cost: number;
  mileage: number | null;
  cashback: number;
  cashbackUsed: number;
  serviceFee: number;
  status: string;
  createdAt: string | null;
  services: VisitServiceItem[];
  car: VisitCarBrief | null;
  serviceCenter: VisitScBrief | null;
}

interface VisitListResponse {
  visits: Visit[];
  total: number;
  page: number;
  totalPages: number;
}

type Tab = "warranty" | "regular";

function getToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/sc_token=([^;]+)/);
  return match ? match[1] : "";
}

export default function ScAdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("warranty");
  const [data, setData] = useState<VisitListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ warranty: tab === "warranty" ? "true" : "false", limit: "50" });
      const res = await fetch(`/api/visits?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401 || res.status === 403) {
        router.push("/sc-admin/login");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tab, router]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const formatMoney = (n: number) =>
    `${n.toLocaleString("ru-RU")} ₸`;

  const visits = data?.visits ?? [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Визиты</h1>
          <p className="text-sm text-gray-500 mt-1">История обслуживания клиентов</p>
        </div>
        <button
          onClick={() => router.push("/sc-admin/create")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Добавить визит
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6 w-full sm:w-fit">
        <button
          onClick={() => setTab("warranty")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none justify-center ${
            tab === "warranty"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Гарантийные клиенты
        </button>
        <button
          onClick={() => setTab("regular")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none justify-center ${
            tab === "regular"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Wrench className="h-4 w-4" />
          Обычные визиты
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Клиент</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Авто</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Услуги</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">Загрузка...</td></tr>
            ) : visits.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">
                {tab === "warranty" ? "Нет визитов гарантийных клиентов" : "Нет обычных визитов"}
              </td></tr>
            ) : (
              visits.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 text-xs">{formatDate(v.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{v.car?.user?.name || "—"}</div>
                    {v.car?.user?.phone && (
                      <div className="text-xs text-gray-500">{v.car.user.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <div>{v.car ? `${v.car.brand} ${v.car.model}` : "—"}</div>
                    {v.car?.plateNumber && (
                      <div className="text-xs text-gray-500">{v.car.plateNumber}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs max-w-md truncate">{v.description}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatMoney(v.cost)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
        ) : visits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {tab === "warranty" ? "Нет визитов гарантийных клиентов" : "Нет обычных визитов"}
          </div>
        ) : (
          visits.map((v) => (
            <div key={v.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2 gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {v.car?.user?.name || v.car?.user?.phone || "Клиент"}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(v.createdAt)}</p>
                </div>
                <p className="font-semibold text-gray-900 text-sm shrink-0">{formatMoney(v.cost)}</p>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                {v.car && <p>{v.car.brand} {v.car.model} · {v.car.plateNumber}</p>}
                <p className="line-clamp-2">{v.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
