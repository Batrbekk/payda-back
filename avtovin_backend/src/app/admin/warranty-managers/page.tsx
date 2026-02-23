"use client";

import { useEffect, useState, useCallback } from "react";
import { UserCheck, Plus, Trash2, ShieldCheck, X } from "lucide-react";

/* ── Phone mask helpers ── */
function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  let d = digits;
  if (d.startsWith("7") || d.startsWith("8")) d = d.slice(1);
  if (d.length === 0) return "+7 ";
  let result = "+7 (";
  result += d.slice(0, 3);
  if (d.length > 3) result += ") " + d.slice(3, 6);
  if (d.length > 6) result += "-" + d.slice(6, 8);
  if (d.length > 8) result += "-" + d.slice(8, 10);
  return result;
}

function phoneToRaw(formatted: string): string {
  const digits = formatted.replace(/\D/g, "");
  if (digits.startsWith("7")) return "+" + digits;
  return "+7" + digits;
}

function formatPhoneDisplay(raw: string): string {
  if (!raw) return "—";
  return formatPhoneInput(raw);
}

interface Manager {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  salonName: string | null;
  createdAt: string;
  totalWarranties: number;
  activeWarranties: number;
}

function getToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : "";
}

export default function WarrantyManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    phone: "",
    name: "",
    email: "",
    password: "",
    salonName: "",
  });

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/warranty-managers", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setManagers(data);
    } catch {
      console.error("Failed to fetch managers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/warranty-managers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ ...form, phone: phoneToRaw(form.phone) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);
      setShowForm(false);
      setForm({ phone: "", name: "", email: "", password: "", salonName: "" });
      fetchManagers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить менеджера? Его гарантии останутся в системе.")) return;
    try {
      await fetch(`/api/warranty-managers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setManagers((prev) => prev.filter((m) => m.id !== id));
    } catch {
      console.error("Failed to delete");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Менеджеры гарантий</h1>
          <p className="text-sm text-gray-500 mt-1">Управление продажниками гарантий</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm"
        >
          <Plus className="h-4 w-4" />
          Добавить менеджера
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UserCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{managers.length}</p>
            <p className="text-xs text-gray-500">Всего менеджеров</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {managers.reduce((sum, m) => sum + m.totalWarranties, 0)}
            </p>
            <p className="text-xs text-gray-500">Всего гарантий создано</p>
          </div>
        </div>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Новый менеджер</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatPhoneInput(e.target.value) })}
                  placeholder="+7 (700) 123-45-67"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ФИО *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Иванов Иван Иванович"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="manager@salon.kz"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Минимум 6 символов"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Автосалон</label>
                <input
                  type="text"
                  value={form.salonName}
                  onChange={(e) => setForm({ ...form, salonName: e.target.value })}
                  placeholder="Название автосалона или СЦ"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50"
              >
                {saving ? "Создание..." : "Создать менеджера"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ФИО</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Телефон</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Автосалон</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Гарантии</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Загрузка...</td>
              </tr>
            ) : managers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Менеджеры не найдены</td>
              </tr>
            ) : (
              managers.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{formatPhoneDisplay(m.phone)}</td>
                  <td className="px-4 py-3 text-gray-500">{m.email || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{m.salonName || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        {m.activeWarranties} акт.
                      </span>
                      <span className="text-gray-400 text-xs">/ {m.totalWarranties} всего</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
