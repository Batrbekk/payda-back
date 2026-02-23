"use client";

import { useEffect, useState, useCallback } from "react";
import { UserCheck, Plus, Trash2, ShieldCheck, X, Eye, EyeOff, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KZ_CITIES } from "@/lib/kz-cities";

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
  city: string | null;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emptyForm = { phone: "", name: "", email: "", password: "", salonName: "", city: "" };
  const [form, setForm] = useState(emptyForm);

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

  const openEdit = (m: Manager) => {
    setEditingId(m.id);
    setForm({
      phone: formatPhoneInput(m.phone),
      name: m.name || "",
      email: m.email || "",
      password: "",
      salonName: m.salonName || "",
      city: m.city || "",
    });
    setError("");
    setShowPassword(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editingId ? `/api/warranty-managers/${editingId}` : "/api/warranty-managers";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          ...form,
          phone: phoneToRaw(form.phone),
          city: form.city || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error);
      closeForm();
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
          onClick={() => { setEditingId(null); setForm(emptyForm); setError(""); setShowPassword(false); setShowForm(true); }}
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
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? "Редактировать менеджера" : "Новый менеджер"}</h2>
              <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingId ? "Пароль (оставьте пустым, чтобы не менять)" : "Пароль *"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editingId ? "Оставьте пустым" : "Минимум 6 символов"}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                    required={!editingId}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
                <Select value={form.city} onValueChange={(val) => setForm({ ...form, city: val })}>
                  <SelectTrigger className="w-full h-9 border-gray-300 rounded-lg text-sm">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    {KZ_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                {saving ? "Сохранение..." : editingId ? "Сохранить" : "Создать менеджера"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-[160px]">ФИО</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-[150px]">Телефон</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-[170px]">Email</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-[110px]">Город</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-[120px]">Автосалон</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-[100px]">Гарантии</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-[90px]">Дата</th>
              <th className="px-2 py-2.5 w-[70px]"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">Загрузка...</td>
              </tr>
            ) : managers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">Менеджеры не найдены</td>
              </tr>
            ) : (
              managers.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-medium text-gray-900 truncate">{m.name || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{formatPhoneDisplay(m.phone)}</td>
                  <td className="px-3 py-2.5 text-gray-500 truncate">{m.email || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-700 truncate">{m.city || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-700 truncate">{m.salonName || "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-xs font-medium text-emerald-700">{m.activeWarranties} акт.</span>
                    <span className="text-gray-400 text-xs"> / {m.totalWarranties}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{formatDate(m.createdAt)}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1 text-gray-400 hover:text-yellow-600"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
