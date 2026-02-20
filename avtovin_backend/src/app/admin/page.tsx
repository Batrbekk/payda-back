"use client";

import { useEffect, useState } from "react";
import { Users, Car, Building2, Receipt, TrendingUp, Coins, ShoppingCart, Droplets, Wallet, HandCoins } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalCars: number;
  partners: {
    serviceCenters: number;
    autoShops: number;
    carWashes: number;
    total: number;
  };
  totalVisits: number;
  totalRevenue: number;
  totalCashback: number;
  totalCashbackBalance: number;
  unpaidSettlements: {
    count: number;
    amount: number;
  };
  recentVisits: Array<{
    id: string;
    description: string;
    cost: number;
    cashback: number;
    cashbackUsed: number;
    createdAt: string;
    car: { brand: string; model: string; plateNumber: string; user: { name: string; phone: string } };
    serviceCenter: { name: string; type: string };
  }>;
}

function getCookie(name: string) {
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : "";
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("ru-RU").format(amount) + " ₸";
}

const TYPE_LABELS: Record<string, string> = {
  SERVICE_CENTER: "СЦ",
  AUTO_SHOP: "Магазин",
  CAR_WASH: "Мойка",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie("token");
    fetch("/api/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-gray-500">Загрузка...</div>;
  if (!stats) return <div className="text-red-500">Ошибка загрузки</div>;

  const cards = [
    { label: "Пользователи", value: stats.totalUsers, icon: Users, color: "bg-blue-50 text-blue-700" },
    { label: "Автомобили", value: stats.totalCars, icon: Car, color: "bg-green-50 text-green-700" },
    { label: "Сервисные центры", value: stats.partners.serviceCenters, icon: Building2, color: "bg-purple-50 text-purple-700" },
    { label: "Автомагазины", value: stats.partners.autoShops, icon: ShoppingCart, color: "bg-indigo-50 text-indigo-700" },
    { label: "Автомойки", value: stats.partners.carWashes, icon: Droplets, color: "bg-cyan-50 text-cyan-700" },
    { label: "Визиты", value: stats.totalVisits, icon: Receipt, color: "bg-orange-50 text-orange-700" },
    { label: "Доход (комиссии)", value: formatMoney(stats.totalRevenue), icon: TrendingUp, color: "bg-yellow-50 text-yellow-700" },
    { label: "Выдано кэшбэка", value: formatMoney(stats.totalCashback), icon: Coins, color: "bg-red-50 text-red-700" },
    { label: "Баланс кэшбэков", value: formatMoney(stats.totalCashbackBalance), icon: Wallet, color: "bg-emerald-50 text-emerald-700" },
    { label: "Неоплач. расчётов", value: `${stats.unpaidSettlements.count} (${formatMoney(stats.unpaidSettlements.amount)})`, icon: HandCoins, color: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Дашборд</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 truncate">{card.label}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1 truncate">{card.value}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${card.color} ml-3 shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Последние визиты</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Клиент</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Авто</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Партнёр</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Описание</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Стоимость</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Кэшбэк</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentVisits.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{visit.car.user.name || "—"}</div>
                    <div className="text-xs text-gray-500">{visit.car.user.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{visit.car.brand} {visit.car.model}</div>
                    <div className="text-xs text-gray-500">{visit.car.plateNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{visit.serviceCenter.name}</div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {TYPE_LABELS[visit.serviceCenter.type] || visit.serviceCenter.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">{visit.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{formatMoney(visit.cost)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm text-green-600 font-medium">+{formatMoney(visit.cashback)}</div>
                    {visit.cashbackUsed > 0 && (
                      <div className="text-xs text-red-500">-{formatMoney(visit.cashbackUsed)}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
