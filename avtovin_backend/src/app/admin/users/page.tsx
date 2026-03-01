"use client";

import React, { useEffect, useState } from "react";
import { Search, Car, ChevronDown, ChevronUp, Pencil, Trash2, X } from "lucide-react";

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
  email: string | null;
  role: string;
  balance: number;
  salonName: string | null;
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
  { value: "WARRANTY_MANAGER", label: "Гарантийные" },
  { value: "ADMIN", label: "Админы" },
];

const allRoles = [
  { value: "USER", label: "Пользователь" },
  { value: "SC_MANAGER", label: "Менеджер СЦ" },
  { value: "WARRANTY_MANAGER", label: "Гарантийный менеджер" },
  { value: "ADMIN", label: "Администратор" },
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

  // Edit modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", role: "", salonName: "", balance: 0 });
  const [editLoading, setEditLoading] = useState(false);

  // Delete modal
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
      role: user.role,
      salonName: user.salonName || "",
      balance: user.balance || 0,
    });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setEditLoading(true);
    const token = getCookie("token");
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name || null,
          phone: editForm.phone || null,
          email: editForm.email || null,
          role: editForm.role,
          salonName: editForm.salonName || null,
          balance: editForm.balance,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Ошибка сохранения");
        return;
      }
      setEditUser(null);
      fetchUsers();
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    const token = getCookie("token");
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Ошибка удаления");
        return;
      }
      setDeleteUser(null);
      fetchUsers();
    } finally {
      setDeleteLoading(false);
    }
  };

  const roleLabel: Record<string, string> = {
    USER: "Пользователь",
    ADMIN: "Администратор",
    SC_MANAGER: "Менеджер СЦ",
    WARRANTY_MANAGER: "Гарантийный",
  };

  const roleBadge: Record<string, string> = {
    USER: "bg-gray-100 text-gray-700",
    ADMIN: "bg-yellow-100 text-yellow-700",
    SC_MANAGER: "bg-blue-100 text-blue-700",
    WARRANTY_MANAGER: "bg-purple-100 text-purple-700",
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Баланс</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Автомобиль</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleBadge[user.role] || "bg-gray-100"}`}>
                          {roleLabel[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{(user.balance || 0).toLocaleString()} ₸</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.cars.length > 0 ? (
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                            <Car className="h-4 w-4 text-gray-400" />
                            <span>{formatCar(user.cars[0])}</span>
                            {user.cars[0].plateNumber && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{user.cars[0].plateNumber}</span>
                            )}
                            {user._count.cars > 1 && (
                              <>
                                <span className="text-xs text-gray-400">+{user._count.cars - 1}</span>
                                {expandedUser === user.id
                                  ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                                  : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                                }
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Нет авто</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString("ru-RU")}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(user); }}
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteUser(user); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedUser === user.id && user.cars.length > 1 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-3 bg-gray-50">
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

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Редактирование пользователя</h2>
              <button onClick={() => setEditUser(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm"
                  placeholder="Имя пользователя"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm"
                  placeholder="+7XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm"
                >
                  {allRoles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Баланс (₸)</label>
                <input
                  type="number"
                  value={editForm.balance}
                  onChange={(e) => setEditForm({ ...editForm, balance: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm"
                />
              </div>
              {(editForm.role === "SC_MANAGER" || editForm.role === "WARRANTY_MANAGER") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название салона/СЦ</label>
                  <input
                    type="text"
                    value={editForm.salonName}
                    onChange={(e) => setEditForm({ ...editForm, salonName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none text-sm"
                    placeholder="Название"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setEditUser(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={saveEdit}
                disabled={editLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 disabled:opacity-50"
              >
                {editLoading ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Удалить пользователя?</h3>
              <p className="text-sm text-gray-500">
                {deleteUser.name || deleteUser.phone} будет удалён. Это действие нельзя отменить.
              </p>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setDeleteUser(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
