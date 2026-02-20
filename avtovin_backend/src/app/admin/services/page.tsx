"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Service {
  id: string;
  name: string;
  category: string;
  commissionType: string;
  commissionValue: number;
  cashbackType: string;
  cashbackValue: number;
}

interface FormData {
  name: string;
  category: string;
  commissionType: string;
  commissionValue: string;
  cashbackType: string;
  cashbackValue: string;
}

const emptyForm: FormData = {
  name: "",
  category: "general",
  commissionType: "percent",
  commissionValue: "20",
  cashbackType: "percent",
  cashbackValue: "25",
};

const categories = [
  { value: "engine", label: "Двигатель" },
  { value: "transmission", label: "Трансмиссия" },
  { value: "brakes", label: "Тормоза" },
  { value: "diagnostics", label: "Диагностика" },
  { value: "wash", label: "Мойка" },
  { value: "body", label: "Кузов" },
  { value: "electrical", label: "Электрика" },
  { value: "general", label: "Общее" },
  { value: "other", label: "Другое" },
];

function getCookie(name: string) {
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : "";
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchServices = () => {
    setLoading(true);
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServices(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (svc: Service) => {
    setEditId(svc.id);
    setForm({
      name: svc.name,
      category: svc.category || "general",
      commissionType: svc.commissionType || "percent",
      commissionValue: (svc.commissionValue ?? 20).toString(),
      cashbackType: svc.cashbackType || "percent",
      cashbackValue: (svc.cashbackValue ?? 25).toString(),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = getCookie("token");
    const payload = {
      name: form.name,
      category: form.category,
      commissionType: form.commissionType,
      commissionValue: parseInt(form.commissionValue) || 0,
      cashbackType: form.cashbackType,
      cashbackValue: parseInt(form.cashbackValue) || 0,
    };
    try {
      const url = editId ? `/api/services/${editId}` : "/api/services";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ ...emptyForm });
        setEditId(null);
        fetchServices();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = getCookie("token");
    await fetch(`/api/services/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleteConfirm(null);
    fetchServices();
  };

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-sm";
  const categoryLabel = (cat: string) => categories.find((c) => c.value === cat)?.label || cat;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Каталог услуг</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600">
          <Plus className="h-4 w-4" /> Добавить услугу
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Услуга</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Категория</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Комиссия с СЦ</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Кэшбэк клиенту</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-full animate-pulse" /></td>
                </tr>
              ))
            ) : services.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Услуги не добавлены</td></tr>
            ) : (
              services.map((svc) => (
                <tr key={svc.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(svc)}>
                  <td className="px-4 py-3 font-medium text-gray-900 text-sm">{svc.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{categoryLabel(svc.category)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded">
                      {svc.commissionValue}{svc.commissionType === "percent" ? "% от стоимости" : "₸ фиксированная"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                      {svc.cashbackValue}{svc.cashbackType === "percent" ? "% от комиссии" : "₸ фиксированный"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(svc); }} className="p-1 hover:bg-gray-100 rounded mr-1"><Pencil className="h-4 w-4 text-gray-500" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(svc.id); }} className="p-1 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4 text-red-400" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Удалить услугу?</h3>
            <p className="text-sm text-gray-500 mb-4">Это действие нельзя отменить.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium">Отмена</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">Удалить</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{editId ? "Редактировать услугу" : "Новая услуга"}</h2>
              <button onClick={() => { setShowModal(false); setEditId(null); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <div className="space-y-5">
              {/* Row: name + category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Название *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Замена масла" className={inp} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Категория</label>
                  <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                    <SelectTrigger className="w-full h-[38px] border-gray-300 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Commission + Cashback side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-blue-700 mb-2 block">Комиссия с СЦ</label>
                  <div className="flex gap-2">
                    <Select value={form.commissionType} onValueChange={(val) => setForm({ ...form, commissionType: val })}>
                      <SelectTrigger className="flex-1 h-[38px] border-blue-200 bg-white rounded-lg text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">% от стоимости</SelectItem>
                        <SelectItem value="fixed">Фикс. сумма (₸)</SelectItem>
                      </SelectContent>
                    </Select>
                    <input
                      type="number"
                      value={form.commissionValue}
                      onChange={(e) => setForm({ ...form, commissionValue: e.target.value })}
                      placeholder={form.commissionType === "percent" ? "20" : "2000"}
                      className={inp + " w-24 border-blue-200"}
                    />
                  </div>
                  <p className="text-xs text-blue-500 mt-2">
                    {form.commissionType === "percent"
                      ? `${form.commissionValue || 0}% от стоимости услуги`
                      : `${form.commissionValue || 0}₸ за каждый визит`}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-green-700 mb-2 block">Кэшбэк клиенту</label>
                  <div className="flex gap-2">
                    <Select value={form.cashbackType} onValueChange={(val) => setForm({ ...form, cashbackType: val })}>
                      <SelectTrigger className="flex-1 h-[38px] border-green-200 bg-white rounded-lg text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">% от комиссии</SelectItem>
                        <SelectItem value="fixed">Фикс. сумма (₸)</SelectItem>
                      </SelectContent>
                    </Select>
                    <input
                      type="number"
                      value={form.cashbackValue}
                      onChange={(e) => setForm({ ...form, cashbackValue: e.target.value })}
                      placeholder={form.cashbackType === "percent" ? "25" : "500"}
                      className={inp + " w-24 border-green-200"}
                    />
                  </div>
                  <p className="text-xs text-green-500 mt-2">
                    {form.cashbackType === "percent"
                      ? `${form.cashbackValue || 0}% от суммы комиссии`
                      : `${form.cashbackValue || 0}₸ за каждый визит`}
                  </p>
                </div>
              </div>

              {/* Example calculation */}
              {form.commissionType === "percent" && form.cashbackType === "percent" && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  <p className="font-medium mb-1">Пример расчёта (услуга за 10 000₸):</p>
                  <div className="flex gap-6">
                    <p>Комиссия: <span className="font-medium text-blue-700">{Math.round(10000 * (parseInt(form.commissionValue) || 0) / 100).toLocaleString()}₸</span></p>
                    <p>Кэшбэк: <span className="font-medium text-green-700">{Math.round(10000 * (parseInt(form.commissionValue) || 0) / 100 * (parseInt(form.cashbackValue) || 0) / 100).toLocaleString()}₸</span></p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditId(null); }} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="flex-1 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
              >
                {saving ? "Сохранение..." : editId ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
