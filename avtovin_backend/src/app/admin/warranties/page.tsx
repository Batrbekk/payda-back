"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, ShieldCheck, ShieldX, Search, Trash2, Save, Plus, X, Bell, Clock, User, Car, FileText, ExternalLink, CheckCircle, XCircle } from "lucide-react";

interface Warranty {
  id: string;
  contractNumber: string;
  clientName: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: string;
  docUrls: string | null;
  createdAt: string | null;
  createdById: string;
  user?: { phone: string; name: string | null };
  createdBy?: { phone: string; name: string | null };
}

function getToken(): string {
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : "";
}

export default function AdminWarrantiesPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [pendingWarranties, setPendingWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState<"feed" | "table" | "settings">("feed");

  // Settings
  const [whatsappLink, setWhatsappLink] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchWarranties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter !== "all") params.set("filter", filter);
      const res = await fetch(`/api/warranties?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setWarranties(data);
    } catch {
      console.error("Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  const fetchPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const res = await fetch(`/api/warranties?status=pending`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setPendingWarranties(data);
    } catch {
      console.error("Failed to fetch pending");
    } finally {
      setLoadingPending(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?key=warranty_whatsapp_link,warranty_conditions");
      const data = await res.json();
      setWhatsappLink(data.warranty_whatsapp_link || "");
      try { setConditions(JSON.parse(data.warranty_conditions || "[]")); } catch { setConditions([]); }
    } catch { console.error("Failed to fetch settings"); }
  }, []);

  useEffect(() => {
    fetchWarranties();
    fetchPending();
    fetchSettings();
  }, [fetchWarranties, fetchPending, fetchSettings]);

  const updateWarrantyStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/warranties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status }),
      });
      // Remove from pending, refresh all
      setPendingWarranties((prev) => prev.filter((w) => w.id !== id));
      fetchWarranties();
    } catch {
      console.error("Failed to update status");
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ key: "warranty_whatsapp_link", value: whatsappLink }),
      });
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ key: "warranty_conditions", value: JSON.stringify(conditions) }),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch { console.error("Failed to save settings"); }
    finally { setSavingSettings(false); }
  };

  const deleteWarranty = async (id: string) => {
    if (!confirm("Удалить гарантию?")) return;
    try {
      await fetch(`/api/warranties/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setWarranties((prev) => prev.filter((w) => w.id !== id));
      setPendingWarranties((prev) => prev.filter((w) => w.id !== id));
    } catch { console.error("Failed to delete"); }
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;
    setConditions([...conditions, newCondition.trim()]);
    setNewCondition("");
  };
  const removeCondition = (i: number) => setConditions(conditions.filter((_, idx) => idx !== i));

  const isExpired = (w: Warranty) => new Date(w.endDate) < new Date();
  const formatDate = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const formatDateTime = (d: string) => new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return "только что";
    if (mins < 60) return `${mins} мин. назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч. назад`;
    const days = Math.floor(hours / 24);
    return `${days} дн. назад`;
  };

  const warrantyType = (w: Warranty) => (new Date().getFullYear() - w.year) >= 2 ? "БУ" : "Новая";

  const statusLabel = (s: string) => {
    if (s === "pending") return { text: "Ожидает договор", color: "bg-amber-100 text-amber-700" };
    if (s === "approved") return { text: "Договор подписан", color: "bg-emerald-100 text-emerald-700" };
    if (s === "rejected") return { text: "Отклонена", color: "bg-red-100 text-red-700" };
    return { text: s, color: "bg-gray-100 text-gray-700" };
  };

  const activeCount = warranties.filter((w) => w.isActive && !isExpired(w)).length;
  const expiredCount = warranties.filter((w) => !w.isActive || isExpired(w)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Гарантии</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab("feed")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "feed" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Bell className="h-4 w-4" />
          Поступающие
          {pendingWarranties.length > 0 && (
            <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingWarranties.length}</span>
          )}
        </button>
        <button onClick={() => setTab("table")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Shield className="h-4 w-4" />
          Все гарантии
        </button>
        <button onClick={() => setTab("settings")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "settings" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <Save className="h-4 w-4" />
          Настройки
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg"><Bell className="h-5 w-5 text-amber-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pendingWarranties.length}</p>
            <p className="text-xs text-gray-500">Ожидают</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg"><Shield className="h-5 w-5 text-gray-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{warranties.length}</p>
            <p className="text-xs text-gray-500">Всего</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg"><ShieldCheck className="h-5 w-5 text-emerald-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            <p className="text-xs text-gray-500">Активные</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg"><ShieldX className="h-5 w-5 text-red-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{expiredCount}</p>
            <p className="text-xs text-gray-500">Истёкшие</p>
          </div>
        </div>
      </div>

      {/* === FEED TAB (Pending only) === */}
      {tab === "feed" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            Ожидают подписания договора
          </h2>

          {loadingPending ? (
            <div className="text-center py-12 text-gray-500">Загрузка...</div>
          ) : pendingWarranties.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg">Все гарантии обработаны</p>
              <p className="text-gray-400 text-sm mt-1">Нет ожидающих подписания договоров</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingWarranties.map((w) => (
                <div key={w.id} className="bg-white rounded-xl border-2 border-amber-200 p-5 shadow-sm">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{w.contractNumber}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">Ожидает договор</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${warrantyType(w) === "Новая" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                            {warrantyType(w)}
                          </span>
                        </div>
                        {w.createdAt && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{timeAgo(w.createdAt)} · {formatDateTime(w.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deleteWarranty(w.id)} className="p-1.5 text-gray-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Клиент</p>
                        <p className="text-sm font-medium text-gray-900">{w.clientName}</p>
                        {w.user?.phone && <p className="text-xs text-gray-500">{w.user.phone}</p>}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Car className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Автомобиль</p>
                        <p className="text-sm font-medium text-gray-900">{w.brand} {w.model} {w.year}</p>
                        {w.vin && <p className="text-xs text-gray-500 font-mono">{w.vin}</p>}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Период</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(w.startDate)} — {formatDate(w.endDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Менеджер</p>
                        <p className="text-sm font-medium text-gray-900">{w.createdBy?.name || "—"}</p>
                        {w.createdBy?.phone && <p className="text-xs text-gray-500">{w.createdBy.phone}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Docs */}
                  {w.docUrls && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Документы:</span>
                      {w.docUrls.split(",").filter(Boolean).map((url, i) => (
                        <a key={i} href={url.trim()} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          Файл {i + 1} <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-3">
                    <button
                      onClick={() => updateWarrantyStatus(w.id, "approved")}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Договор подписан
                    </button>
                    <button
                      onClick={() => updateWarrantyStatus(w.id, "rejected")}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === TABLE TAB === */}
      {tab === "table" && (
        <div>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по номеру, ФИО или VIN..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none" />
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none">
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="expired">Истёкшие</option>
            </select>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Договор</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Клиент</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Автомобиль</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">VIN</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Период</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Менеджер</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Договор</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-500">Загрузка...</td></tr>
                ) : warranties.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-500">Гарантии не найдены</td></tr>
                ) : (
                  warranties.map((w) => {
                    const expired = isExpired(w);
                    const active = w.isActive && !expired;
                    const sl = statusLabel(w.status);
                    return (
                      <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{w.contractNumber}</td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900">{w.clientName}</div>
                          {w.user?.phone && <div className="text-xs text-gray-500">{w.user.phone}</div>}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{w.brand} {w.model} {w.year}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{w.vin || "—"}</td>
                        <td className="px-4 py-3 text-gray-700 text-xs">{formatDate(w.startDate)} — {formatDate(w.endDate)}</td>
                        <td className="px-4 py-3 text-gray-900 text-xs">{w.createdBy?.name || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${sl.color}`}>{sl.text}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {active ? "Активна" : "Истекла"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteWarranty(w.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === SETTINGS TAB === */}
      {tab === "settings" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Настройки гарантий</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp ссылка (кнопка &quot;Купить гарантию&quot;)</label>
              <input type="text" value={whatsappLink} onChange={(e) => setWhatsappLink(e.target.value)} placeholder="https://wa.me/77001234567" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Условия гарантии</label>
              <div className="space-y-2 mb-2">
                {conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">{c}</span>
                    <button onClick={() => removeCondition(i)} className="p-1 text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newCondition} onChange={(e) => setNewCondition(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCondition())} placeholder="Новое условие..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none" />
                <button onClick={addCondition} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
            <button onClick={saveSettings} disabled={savingSettings} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50">
              <Save className="h-4 w-4" />
              {savingSettings ? "Сохранение..." : settingsSaved ? "Сохранено!" : "Сохранить настройки"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
