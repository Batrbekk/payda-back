"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Trophy, Image, ChevronDown, ChevronUp, X, Star, Calendar, Gift } from "lucide-react";

interface Winner {
  name: string;
  phone: string;
  month: string;
  prize: string;
}

interface Banner {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  actionType: string;
  actionValue: string | null;
  sortOrder: number;
  isActive: boolean;
  conditions: string | null;
  winners: string | null;
  prizeTitle: string | null;
  prizeImage: string | null;
  drawDate: string | null;
  createdAt: string;
}

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : "";
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");

  // Raffle modal
  const [showRaffleModal, setShowRaffleModal] = useState(false);
  const [raffleEditing, setRaffleEditing] = useState<Banner | null>(null);

  // Promo modal
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoEditing, setPromoEditing] = useState<Banner | null>(null);

  // Raffle detail page
  const [showRaffleDetail, setShowRaffleDetail] = useState(false);
  const [raffleDetail, setRaffleDetail] = useState<Banner | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => { setToken(getCookie("token")); }, []);

  const fetchBanners = () => {
    setLoading(true);
    fetch("/api/banners?all=true")
      .then((r) => r.json())
      .then((data) => setBanners(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBanners(); }, []);

  const raffleBanner = banners.find((b) => b.type === "raffle");
  const promoBanners = banners.filter((b) => b.type !== "raffle").sort((a, b) => a.sortOrder - b.sortOrder);

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить баннер?")) return;
    await fetch(`/api/banners/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchBanners();
  };

  const toggleActive = async (b: Banner) => {
    await fetch(`/api/banners/${b.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    fetchBanners();
  };

  // ===================== RAFFLE DETAIL PAGE =====================
  if (showRaffleDetail && raffleDetail) {
    return <RaffleDetailPage banner={raffleDetail} token={token} onBack={() => { setShowRaffleDetail(false); fetchBanners(); }} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Баннеры</h1>
        <p className="text-sm text-gray-500 mt-1">Управление баннерами на главном экране приложения</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Загрузка...</div>
      ) : (
        <div className="space-y-8">
          {/* ===== SECTION 1: RAFFLE BANNER ===== */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900">Баннер розыгрыша</h2>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Всегда первый</span>
            </div>

            {raffleBanner ? (
              <div className={`bg-white rounded-xl border-2 border-purple-200 p-5 ${!raffleBanner.isActive ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-4">
                  {/* Cover */}
                  <div className="w-28 h-20 rounded-lg overflow-hidden bg-purple-50 flex-shrink-0">
                    {raffleBanner.imageUrl ? (
                      <img src={raffleBanner.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy className="h-8 w-8 text-purple-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900">{raffleBanner.title}</h3>
                    {raffleBanner.subtitle && <p className="text-sm text-gray-500 mt-0.5">{raffleBanner.subtitle}</p>}
                    {raffleBanner.prizeTitle && (
                      <p className="text-sm text-purple-600 font-medium mt-1 flex items-center gap-1">
                        <Gift className="h-3.5 w-3.5" /> Приз: {raffleBanner.prizeTitle}
                      </p>
                    )}
                    {raffleBanner.drawDate && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Дата розыгрыша: {raffleBanner.drawDate}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(raffleBanner)}
                      className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${raffleBanner.isActive ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${raffleBanner.isActive ? "translate-x-4" : ""}`} />
                    </button>
                    <button
                      onClick={() => { setRaffleDetail(raffleBanner); setShowRaffleDetail(true); }}
                      className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100"
                    >
                      Наполнение
                    </button>
                    <button
                      onClick={() => { setRaffleEditing(raffleBanner); setShowRaffleModal(true); }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-dashed border-purple-200 p-8 text-center">
                <Trophy className="h-10 w-10 text-purple-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">Баннер розыгрыша ещё не создан</p>
                <button
                  onClick={() => { setRaffleEditing(null); setShowRaffleModal(true); }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Создать баннер розыгрыша
                </button>
              </div>
            )}
          </section>

          {/* ===== SECTION 2: PROMO BANNERS ===== */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Промо-баннеры</h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{promoBanners.length}</span>
              </div>
              <button
                onClick={() => { setPromoEditing(null); setShowPromoModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> Добавить баннер
              </button>
            </div>

            {promoBanners.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <Image className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Промо-баннеров пока нет</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {promoBanners.map((b) => (
                  <div key={b.id} className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 ${!b.isActive ? "opacity-50" : ""}`}>
                    {/* Preview */}
                    <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {b.imageUrl ? (
                        <img src={b.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <Image className="h-6 w-6 text-blue-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{b.title}</h3>
                      {b.subtitle && <p className="text-xs text-gray-500 truncate mt-0.5">{b.subtitle}</p>}
                    </div>

                    {/* Sort order */}
                    <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">#{b.sortOrder}</span>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleActive(b)}
                      className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${b.isActive ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${b.isActive ? "translate-x-4" : ""}`} />
                    </button>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <button onClick={() => { setPromoEditing(b); setShowPromoModal(true); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ===== RAFFLE MODAL ===== */}
      {showRaffleModal && (
        <RaffleModal
          editing={raffleEditing}
          token={token}
          onClose={() => setShowRaffleModal(false)}
          onSaved={() => { setShowRaffleModal(false); fetchBanners(); }}
        />
      )}

      {/* ===== PROMO MODAL ===== */}
      {showPromoModal && (
        <PromoModal
          editing={promoEditing}
          token={token}
          nextOrder={promoBanners.length + 1}
          onClose={() => setShowPromoModal(false)}
          onSaved={() => { setShowPromoModal(false); fetchBanners(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// RAFFLE MODAL — title, subtitle, description, cover, prize, date
// ============================================================
function RaffleModal({ editing, token, onClose, onSaved }: { editing: Banner | null; token: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(editing?.title || "");
  const [subtitle, setSubtitle] = useState(editing?.subtitle || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [imageUrl, setImageUrl] = useState(editing?.imageUrl || "");
  const [prizeTitle, setPrizeTitle] = useState(editing?.prizeTitle || "");
  const [drawDate, setDrawDate] = useState(editing?.drawDate || "");
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const body = {
      type: "raffle",
      title,
      subtitle: subtitle || null,
      description: description || null,
      imageUrl: imageUrl || null,
      actionType: "raffle",
      sortOrder: 0,
      isActive,
      prizeTitle: prizeTitle || null,
      drawDate: drawDate || null,
    };
    try {
      if (editing) {
        await fetch(`/api/banners/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-bold text-gray-900">{editing ? "Редактировать розыгрыш" : "Новый розыгрыш"}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm" placeholder="Розыгрыш iPhone 16 Pro Max" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок</label>
            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm" placeholder="Пройдите ТО для участия" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm resize-none" placeholder="Подробное описание розыгрыша..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Приз</label>
              <input type="text" value={prizeTitle} onChange={(e) => setPrizeTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm" placeholder="iPhone 16 Pro Max" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата розыгрыша</label>
              <input type="text" value={drawDate} onChange={(e) => setDrawDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm" placeholder="28.02.2026" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Обложка</label>
            {imageUrl && (
              <div className="mb-2 rounded-lg overflow-hidden h-32 bg-gray-100 relative">
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 text-purple-500 rounded" />
            <span className="text-sm text-gray-700">Активен</span>
          </label>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Отмена</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {saving ? "Сохранение..." : editing ? "Сохранить" : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PROMO MODAL — only cover image + order
// ============================================================
function PromoModal({ editing, token, nextOrder, onClose, onSaved }: { editing: Banner | null; token: string; nextOrder: number; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(editing?.title || "");
  const [imageUrl, setImageUrl] = useState(editing?.imageUrl || "");
  const [sortOrder, setSortOrder] = useState(editing?.sortOrder ?? nextOrder);
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [actionType, setActionType] = useState(editing?.actionType || "none");
  const [actionValue, setActionValue] = useState(editing?.actionValue || "");
  const [saving, setSaving] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const body = {
      type: "promo",
      title,
      imageUrl: imageUrl || null,
      actionType,
      actionValue: actionValue || null,
      sortOrder,
      isActive,
    };
    try {
      if (editing) {
        await fetch(`/api/banners/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center gap-2">
          <Image className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">{editing ? "Редактировать баннер" : "Новый промо-баннер"}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" placeholder="Акция: Бесплатная диагностика" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Обложка (cover image)</label>
            {imageUrl && (
              <div className="mb-2 rounded-lg overflow-hidden h-40 bg-gray-100 relative">
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Действие при нажатии</label>
            <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
              <option value="none">Нет действия</option>
              <option value="url">Открыть URL</option>
              <option value="screen">Экран приложения</option>
            </select>
          </div>
          {actionType !== "none" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{actionType === "url" ? "URL" : "Route"}</label>
              <input type="text" value={actionValue} onChange={(e) => setActionValue(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" placeholder={actionType === "url" ? "https://payda.kz/promo" : "/history"} />
            </div>
          )}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Очередь</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 text-blue-500 rounded" />
                <span className="text-sm text-gray-700">Активен</span>
              </label>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Отмена</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Сохранение..." : editing ? "Сохранить" : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RAFFLE DETAIL PAGE — conditions, winners, prize image
// ============================================================
function RaffleDetailPage({ banner, token, onBack }: { banner: Banner; token: string; onBack: () => void }) {
  const [conditions, setConditions] = useState<string[]>(() => {
    try { return banner.conditions ? JSON.parse(banner.conditions) : []; } catch { return []; }
  });
  const [winners, setWinners] = useState<Winner[]>(() => {
    try { return banner.winners ? JSON.parse(banner.winners) : []; } catch { return []; }
  });
  const [prizeImage, setPrizeImage] = useState(banner.prizeImage || "");
  const [newCondition, setNewCondition] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // New winner form
  const [wName, setWName] = useState("");
  const [wPhone, setWPhone] = useState("");
  const [wMonth, setWMonth] = useState("");
  const [wPrize, setWPrize] = useState("");

  const addCondition = () => {
    if (!newCondition.trim()) return;
    setConditions([...conditions, newCondition.trim()]);
    setNewCondition("");
  };

  const removeCondition = (i: number) => {
    setConditions(conditions.filter((_, idx) => idx !== i));
  };

  const addWinner = () => {
    if (!wName.trim() || !wMonth.trim()) return;
    setWinners([...winners, { name: wName, phone: wPhone, month: wMonth, prize: wPrize }]);
    setWName(""); setWPhone(""); setWMonth(""); setWPrize("");
  };

  const removeWinner = (i: number) => {
    setWinners(winners.filter((_, idx) => idx !== i));
  };

  const handlePrizeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPrizeImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          conditions: JSON.stringify(conditions),
          winners: JSON.stringify(winners),
          prizeImage: prizeImage || null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <ChevronUp className="h-5 w-5 -rotate-90" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Наполнение розыгрыша</h1>
          <p className="text-sm text-gray-500">{banner.title}</p>
        </div>
        <div className="ml-auto">
          <button onClick={handleSave} disabled={saving} className={`px-5 py-2 text-sm font-medium rounded-lg ${saved ? "bg-green-500 text-white" : "bg-purple-600 text-white hover:bg-purple-700"} disabled:opacity-50`}>
            {saving ? "Сохранение..." : saved ? "Сохранено!" : "Сохранить"}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* ===== PRIZE IMAGE ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" /> Изображение приза
          </h3>
          {prizeImage && (
            <div className="mb-3 rounded-lg overflow-hidden h-48 bg-gray-100 relative">
              <img src={prizeImage} alt="" className="w-full h-full object-contain" />
              <button onClick={() => setPrizeImage("")} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handlePrizeImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
        </div>

        {/* ===== CONDITIONS ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Условия участия</h3>
          <div className="space-y-2 mb-4">
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5">
                <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span className="flex-1 text-sm text-gray-700">{c}</span>
                <button onClick={() => removeCondition(i)} className="text-gray-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCondition()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Пройти ТО у партнёра Payda..."
            />
            <button onClick={addCondition} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200">
              Добавить
            </button>
          </div>
        </div>

        {/* ===== WINNERS ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" /> Победители прошлых месяцев
          </h3>

          {winners.length > 0 && (
            <div className="space-y-2 mb-4">
              {winners.map((w, i) => (
                <div key={i} className="flex items-center gap-3 bg-yellow-50 rounded-lg px-4 py-3">
                  <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 text-yellow-700" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{w.name}</div>
                    <div className="text-xs text-gray-500">{w.month} — {w.prize}</div>
                    {w.phone && <div className="text-xs text-gray-400">{w.phone}</div>}
                  </div>
                  <button onClick={() => removeWinner(i)} className="text-gray-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Добавить победителя</p>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={wName} onChange={(e) => setWName(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Имя *" />
              <input type="text" value={wPhone} onChange={(e) => setWPhone(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Телефон" />
              <input type="text" value={wMonth} onChange={(e) => setWMonth(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Месяц (Январь 2026) *" />
              <input type="text" value={wPrize} onChange={(e) => setWPrize(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Приз (iPhone 16)" />
            </div>
            <button onClick={addWinner} disabled={!wName.trim() || !wMonth.trim()} className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 disabled:opacity-50">
              Добавить победителя
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
