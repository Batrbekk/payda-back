"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  MapPin,
  Building2,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KZ_CITIES } from "@/lib/kz-cities";

interface Partner {
  id: string;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  services: string[];
  gis_url: string | null;
  sort_order: number;
  is_active: boolean;
}

interface City {
  name: string;
  count: number;
}

interface FormData {
  name: string;
  city: string;
  address: string;
  phone: string;
  logo_url: string;
  services: string;
  gis_url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FormData = {
  name: "",
  city: "",
  address: "",
  phone: "",
  logo_url: "",
  services: "",
  gis_url: "",
  sort_order: 0,
  is_active: true,
};

/* ── Phone mask helpers ── */
function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  // Remove leading 7 or 8 if user types full number
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

function rawToFormatted(raw: string): string {
  if (!raw) return "";
  return formatPhoneInput(raw);
}

/* ── Address helpers ── */
function stripUl(address: string): string {
  return address.replace(/^ул\.?\s*/i, "").trim();
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getCookie("token")}`,
  };
}

export default function LandingAdminPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filterCity, setFilterCity] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const [partnersRes, citiesRes] = await Promise.all([
        fetch("/api/landing/admin/partners", { headers: getAuthHeaders() }),
        fetch("/api/landing/cities"),
      ]);
      if (partnersRes.ok) setPartners(await partnersRes.json());
      if (citiesRes.ok) setCities(await citiesRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p: Partner) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      city: p.city,
      address: stripUl(p.address || ""),
      phone: rawToFormatted(p.phone || ""),
      logo_url: p.logo_url || "",
      services: p.services.join(", "),
      gis_url: p.gis_url || "",
      sort_order: p.sort_order,
      is_active: p.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/landing/admin/partners/${editingId}`
        : "/api/landing/admin/partners";
      const method = editingId ? "PUT" : "POST";

      // Clean phone to raw format
      const rawPhone = form.phone ? phoneToRaw(form.phone) : null;
      // Clean address — store without "ул." prefix
      const cleanAddress = form.address ? stripUl(form.address) : null;

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...form,
          phone: rawPhone && rawPhone.length >= 12 ? rawPhone : null,
          address: cleanAddress || null,
          services: form.services || null,
          gis_url: form.gis_url || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        await fetchData();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить партнёра?")) return;
    try {
      await fetch(`/api/landing/admin/partners/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      await fetchData();
    } catch {
      // ignore
    }
  };

  const toggleActive = async (p: Partner) => {
    try {
      await fetch(`/api/landing/admin/partners/${p.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      await fetchData();
    } catch {
      // ignore
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new window.FormData();
      fd.append("file", file);
      const res = await fetch("/api/landing/admin/upload-logo", {
        method: "POST",
        headers: { Authorization: `Bearer ${getCookie("token")}` },
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, logo_url: data.url }));
      }
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  };

  const filtered = partners.filter((p) => {
    if (filterCity && p.city !== filterCity) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const uniqueCities = [...new Set(partners.map((p) => p.city))].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Управление лендингом
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Партнёры и города для Payda
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Добавить партнёра
        </button>
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
          Города формируются автоматически из активных партнёров
        </p>
      </div>

      {/* Partners table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-yellow-500" />
          Партнёры ({partners.length})
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
            {uniqueCities.map((c) => (
              <option key={c} value={c}>{c}</option>
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
                <th className="text-left py-3 px-4 font-medium text-gray-500">Адрес</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Телефон</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">2GIS</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Услуги</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Статус</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{p.name}</td>
                  <td className="py-3 px-4 text-gray-600">{p.city}</td>
                  <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate">
                    {p.address ? `ул. ${stripUl(p.address)}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{p.phone ? rawToFormatted(p.phone) : "—"}</td>
                  <td className="py-3 px-4">
                    {p.gis_url ? (
                      <a
                        href={p.gis_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="text-xs">Ссылка</span>
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {p.services.slice(0, 2).map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
                        >
                          {s}
                        </span>
                      ))}
                      {p.services.length > 2 && (
                        <span className="text-xs text-gray-400">+{p.services.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        p.is_active
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {p.is_active ? (
                        <><Eye className="h-3.5 w-3.5" /> Активен</>
                      ) : (
                        <><EyeOff className="h-3.5 w-3.5" /> Скрыт</>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Редактировать"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    Ничего не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Редактировать партнёра" : "Новый партнёр"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  placeholder="Например: AutoMaster"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Город *
                  </label>
                  <Select value={form.city} onValueChange={(val) => setForm({ ...form, city: val })}>
                    <SelectTrigger className="w-full h-9 border-gray-200 rounded-lg text-sm">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneInput(e.target.value);
                      setForm({ ...form, phone: formatted });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                    placeholder="+7 (777) 123-45-67"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес
                </label>
                <div className="flex items-center gap-0">
                  <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-sm text-gray-500 select-none">
                    ул.
                  </span>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: stripUl(e.target.value) })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                    placeholder="Абая 100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ссылка 2GIS
                </label>
                <input
                  type="url"
                  value={form.gis_url}
                  onChange={(e) => setForm({ ...form, gis_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  placeholder="https://2gis.kz/almaty/firm/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Услуги (через запятую)
                </label>
                <input
                  type="text"
                  value={form.services}
                  onChange={(e) => setForm({ ...form, services: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  placeholder="КАСКО, ТО, Диагностика"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Логотип
                </label>
                <div className="flex items-center gap-3">
                  {form.logo_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={form.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                    {uploading ? "Загрузка..." : "Загрузить файл"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {form.logo_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logo_url: "" })}
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      Удалить
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Порядок сортировки
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.is_active}
                      onCheckedChange={(checked) =>
                        setForm({ ...form, is_active: checked === true })
                      }
                    />
                    <span className="text-sm text-gray-700">Активен на лендинге</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.city}
                className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                {saving ? "Сохранение..." : editingId ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
