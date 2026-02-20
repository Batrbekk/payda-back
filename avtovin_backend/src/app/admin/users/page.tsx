"use client";

import React, { useEffect, useState } from "react";
import { Search, Car, ChevronDown, ChevronUp } from "lucide-react";

interface CarInfo {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  plateNumber: string | null;
}

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  createdAt: string;
  _count: { cars: number };
  cars: CarInfo[];
}

function getCookie(name: string) {
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : "";
}

const roles = [
  { value: "", label: "Все" },
  { value: "USER", label: "Пользователи" },
  { value: "SC_MANAGER", label: "Менеджеры СЦ" },
  { value: "ADMIN", label: "Админы" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    const token = getCookie("token");
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);

    fetch(`/api/users?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const roleLabel: Record<string, string> = {
    USER: "Пользователь",
    ADMIN: "Администратор",
    SC_MANAGER: "Менеджер СЦ",
  };

  const roleBadge: Record<string, string> = {
    USER: "bg-gray-100 text-gray-700",
    ADMIN: "bg-yellow-100 text-yellow-700",
    SC_MANAGER: "bg-blue-100 text-blue-700",
  };

  const formatCar = (car: CarInfo) => {
    const parts = [car.brand, car.model, car.year].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Без данных";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
          <p className="text-sm text-gray-500 mt-1">Всего: {total}</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или телефону..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm w-72"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600">
            Найти
          </button>
        </form>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 mb-4">
        {roles.map((r) => (
          <button
            key={r.value}
            onClick={() => { setRoleFilter(r.value); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              roleFilter === r.value
                ? "bg-yellow-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Пользователи не найдены</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Имя</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Телефон</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Роль</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Автомобиль</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleBadge[user.role] || "bg-gray-100"}`}>
                          {roleLabel[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.cars.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-gray-400" />
                            <span>{formatCar(user.cars[0])}</span>
                            {user.cars[0].plateNumber && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{user.cars[0].plateNumber}</span>
                            )}
                            {user._count.cars > 1 && (
                              <span className="text-xs text-gray-400">+{user._count.cars - 1}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Нет авто</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString("ru-RU")}</td>
                      <td className="px-6 py-4">
                        {user._count.cars > 1 && (
                          expandedUser === user.id
                            ? <ChevronUp className="h-4 w-4 text-gray-400" />
                            : <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </td>
                    </tr>
                    {expandedUser === user.id && user.cars.length > 1 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-3 bg-gray-50">
                          <div className="flex flex-wrap gap-3">
                            {user.cars.map((car, i) => (
                              <div key={car.id || i} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm">
                                <Car className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-gray-700">{formatCar(car)}</span>
                                {car.plateNumber && (
                                  <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600">{car.plateNumber}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
