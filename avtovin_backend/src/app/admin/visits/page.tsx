"use client";

import { useEffect, useState } from "react";

interface Visit {
  id: string;
  description: string;
  cost: number;
  cashback: number;
  cashbackUsed: number;
  serviceFee: number;
  status: string;
  createdAt: string;
  car: { brand: string; model: string; plateNumber: string };
  serviceCenter: { name: string };
}

function getCookie(name: string) {
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : "";
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("ru-RU").format(amount) + " ₸";
}

export default function AdminVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const token = getCookie("token");
    fetch(`/api/visits?page=${page}&limit=20`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setVisits(data.visits || []);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const statusLabel: Record<string, string> = {
    COMPLETED: "Завершён",
    PENDING: "В ожидании",
    CANCELLED: "Отменён",
  };

  const statusBadge: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Визиты</h1>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Авто</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Сервис</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Описание</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Стоимость</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Кешбэк</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Списание</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Сбор СЦ</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(visit.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{visit.car.brand} {visit.car.model}</div>
                      <div className="text-xs text-gray-500">{visit.car.plateNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{visit.serviceCenter.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{visit.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{formatMoney(visit.cost)}</td>
                    <td className="px-6 py-4 text-sm text-green-600 text-right">{formatMoney(visit.cashback)}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      {visit.cashbackUsed > 0 ? (
                        <span className="text-red-500">-{formatMoney(visit.cashbackUsed)}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 text-right">{formatMoney(visit.serviceFee)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusBadge[visit.status] || "bg-gray-100"}`}>
                        {statusLabel[visit.status] || visit.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
            >
              Назад
            </button>
            <span className="text-sm text-gray-500">Страница {page} из {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
            >
              Далее
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
