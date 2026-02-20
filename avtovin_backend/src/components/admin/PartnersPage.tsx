"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Star, User, Pencil, Trash2, MapPin, X, Instagram, Globe, MessageCircle, Map, Image as ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPE_LABELS: Record<string, { title: string; singular: string; addBtn: string }> = {
  SERVICE_CENTER: { title: "Сервисные центры", singular: "СЦ", addBtn: "Добавить СЦ" },
  AUTO_SHOP: { title: "Автомагазины", singular: "Автомагазин", addBtn: "Добавить магазин" },
  CAR_WASH: { title: "Автомойки", singular: "Автомойку", addBtn: "Добавить мойку" },
};

interface ServiceObj {
  id: string;
  serviceCenterId: string;
  serviceId: string;
  price: number | null;
  isFlexPrice: boolean;
  service: { id: string; name: string; category: string };
}

interface Address {
  id: string;
  address: string;
  city: string;
}

interface Partner {
  id: string;
  name: string;
  type: string;
  description: string | null;
  city: string;
  phone: string | null;
  rating: number;
  isActive: boolean;
  commissionPercent: number;
  discountPercent: number;
  logoUrl: string | null;
  link2gis: string | null;
  linkInstagram: string | null;
  linkWebsite: string | null;
  linkWhatsapp: string | null;
  manager: { phone: string; name: string | null } | null;
  addresses: Address[];
  services: ServiceObj[];
  _count: { visits: number };
}

interface AllService {
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
  description: string;
  city: string;
  phone: string;
  managerPhone: string;
  link2gis: string;
  linkInstagram: string;
  linkWebsite: string;
  linkWhatsapp: string;
  logoUrl: string;
  commissionPercent: string;
  discountPercent: string;
  addresses: string[];
  serviceIds: { serviceId: string; price: string; isFlexPrice: boolean }[];
}

const emptyForm: FormData = {
  name: "", description: "", city: "Алматы", phone: "", managerPhone: "",
  link2gis: "", linkInstagram: "", linkWebsite: "", linkWhatsapp: "", logoUrl: "",
  commissionPercent: "", discountPercent: "",
  addresses: [""],
  serviceIds: [],
};

function getCookie(name: string) {
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : "";
}

export default function PartnersPage({ type }: { type: string }) {
  const labels = TYPE_LABELS[type] || TYPE_LABELS.SERVICE_CENTER;
  const [partners, setPartners] = useState<Partner[]>([]);
  const [allServices, setAllServices] = useState<AllService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPartners = () => {
    setLoading(true);
    fetch(`/api/service-centers?type=${type}`)
      .then((r) => r.json())
      .then(setPartners)
      .finally(() => setLoading(false));
  };

  const fetchServices = () => {
    fetch("/api/services").then((r) => r.json()).then(setAllServices);
  };

  useEffect(() => { fetchPartners(); fetchServices(); }, [type]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, addresses: [""] });
    setShowModal(true);
  };

  const openEdit = (sc: Partner) => {
    setEditId(sc.id);
    setForm({
      name: sc.name,
      description: sc.description || "",
      city: sc.city,
      phone: sc.phone || "",
      managerPhone: sc.manager?.phone || "",
      link2gis: sc.link2gis || "",
      linkInstagram: sc.linkInstagram || "",
      linkWebsite: sc.linkWebsite || "",
      linkWhatsapp: sc.linkWhatsapp || "",
      logoUrl: sc.logoUrl || "",
      commissionPercent: sc.commissionPercent ? sc.commissionPercent.toString() : "",
      discountPercent: sc.discountPercent ? sc.discountPercent.toString() : "",
      addresses: sc.addresses.map((a) => a.address),
      serviceIds: sc.services.map((s) => ({
        serviceId: s.serviceId,
        price: s.price?.toString() || "",
        isFlexPrice: s.isFlexPrice ?? false,
      })),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = getCookie("token");
    const payload = {
      name: form.name,
      type,
      description: form.description || undefined,
      city: form.city,
      phone: form.phone || undefined,
      managerPhone: form.managerPhone || undefined,
      link2gis: form.link2gis || undefined,
      linkInstagram: form.linkInstagram || undefined,
      linkWebsite: form.linkWebsite || undefined,
      linkWhatsapp: form.linkWhatsapp || undefined,
      logoUrl: form.logoUrl || undefined,
      commissionPercent: form.commissionPercent ? parseFloat(form.commissionPercent) : undefined,
      discountPercent: form.discountPercent ? parseFloat(form.discountPercent) : undefined,
      addresses: form.addresses.filter((a) => a.trim()).map((a) => ({ address: a, city: form.city })),
      serviceIds: form.serviceIds.map((s) => ({
        serviceId: s.serviceId,
        price: s.price ? parseInt(s.price) : undefined,
        isFlexPrice: s.isFlexPrice,
      })),
    };
    try {
      const url = editId ? `/api/service-centers/${editId}` : "/api/service-centers";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ ...emptyForm });
        fetchPartners();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = getCookie("token");
    await fetch(`/api/service-centers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleteConfirm(null);
    fetchPartners();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const addAddress = () => setForm({ ...form, addresses: [...form.addresses, ""] });
  const removeAddress = (i: number) => setForm({ ...form, addresses: form.addresses.filter((_, idx) => idx !== i) });
  const updateAddress = (i: number, val: string) => {
    const addrs = [...form.addresses];
    addrs[i] = val;
    setForm({ ...form, addresses: addrs });
  };

  const addService = () => {
    if (allServices.length === 0) return;
    setForm({
      ...form,
      serviceIds: [...form.serviceIds, { serviceId: allServices[0].id, price: "", isFlexPrice: false }],
    });
  };
  const removeService = (i: number) => setForm({ ...form, serviceIds: form.serviceIds.filter((_, idx) => idx !== i) });
  const updateService = (i: number, key: string, val: string) => {
    const svcs = [...form.serviceIds];
    svcs[i] = { ...svcs[i], [key]: val };
    setForm({ ...form, serviceIds: svcs });
  };

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-sm";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{labels.title}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600">
          <Plus className="h-4 w-4" /> {labels.addBtn}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))
          : partners.map((sc) => (
              <div key={sc.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {sc.logoUrl ? (
                      <img src={sc.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 font-bold text-lg">
                        {sc.name[0]}
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900">{sc.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{sc.rating}</span>
                  </div>
                </div>

                {sc.description && <p className="text-xs text-gray-500 mb-2">{sc.description}</p>}

                <div className="space-y-1 mb-2">
                  {sc.addresses.map((a) => (
                    <div key={a.id} className="flex items-start gap-1 text-sm text-gray-600">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
                      <span>{a.address}</span>
                    </div>
                  ))}
                </div>

                {sc.phone && <p className="text-sm text-gray-500 mb-1">{sc.phone}</p>}

                <div className="flex gap-2 mb-2">
                  {sc.link2gis && <a href={sc.link2gis} target="_blank" className="text-green-600 hover:text-green-700"><Map className="h-4 w-4" /></a>}
                  {sc.linkInstagram && <a href={sc.linkInstagram} target="_blank" className="text-pink-600 hover:text-pink-700"><Instagram className="h-4 w-4" /></a>}
                  {sc.linkWebsite && <a href={sc.linkWebsite} target="_blank" className="text-blue-600 hover:text-blue-700"><Globe className="h-4 w-4" /></a>}
                  {sc.linkWhatsapp && <a href={`https://wa.me/${sc.linkWhatsapp?.replace(/\+/g, "")}`} target="_blank" className="text-green-500 hover:text-green-600"><MessageCircle className="h-4 w-4" /></a>}
                </div>

                {(sc.commissionPercent > 0 || sc.discountPercent > 0) && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {sc.commissionPercent > 0 && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        Комиссия: {sc.commissionPercent}%
                      </span>
                    )}
                    {sc.discountPercent > 0 && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        Скидка: {sc.discountPercent}%
                      </span>
                    )}
                  </div>
                )}

                {sc.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {sc.services.slice(0, 4).map((s) => (
                      <span key={s.id} className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                        {s.service.name}
                        {s.price ? ` ${s.price.toLocaleString()}₸` : ""}
                        {s.isFlexPrice ? " ~" : ""}
                      </span>
                    ))}
                    {sc.services.length > 4 && (
                      <span className="text-xs text-gray-400">+{sc.services.length - 4}</span>
                    )}
                  </div>
                )}

                {sc.manager && (
                  <div className="flex items-center gap-1 text-sm text-blue-600 mb-3">
                    <User className="h-3.5 w-3.5" />
                    <span>{sc.manager.name || sc.manager.phone}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">{sc._count.visits} визитов</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${sc.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {sc.isActive ? "Активен" : "Неактивен"}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); openEdit(sc); }} className="p-1 hover:bg-gray-100 rounded"><Pencil className="h-4 w-4 text-gray-500" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(sc.id); }} className="p-1 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4 text-red-400" /></button>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {!loading && partners.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">Нет партнёров</p>
          <p className="text-sm">Нажмите &quot;{labels.addBtn}&quot; чтобы добавить</p>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Удалить {labels.singular}?</h3>
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
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{editId ? `Редактировать ${labels.singular}` : `Новый ${labels.singular}`}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название *" className={inp} />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Телефон" className={inp} />
              </div>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Описание" className={inp + " resize-none"} rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Город" className={inp} />
                <input value={form.managerPhone} onChange={(e) => setForm({ ...form, managerPhone: e.target.value })} placeholder="Телефон менеджера" className={inp} />
              </div>

              {/* Logo */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Логотип</label>
                <div className="flex items-center gap-3">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                      Загрузить
                    </button>
                    {form.logoUrl && (
                      <button onClick={() => setForm({ ...form, logoUrl: "" })} className="ml-2 text-sm text-red-500">Удалить</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Links */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Ссылки</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4 text-green-600 shrink-0" />
                    <input value={form.link2gis} onChange={(e) => setForm({ ...form, link2gis: e.target.value })} placeholder="2GIS ссылка" className={inp} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-600 shrink-0" />
                    <input value={form.linkInstagram} onChange={(e) => setForm({ ...form, linkInstagram: e.target.value })} placeholder="Instagram" className={inp} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600 shrink-0" />
                    <input value={form.linkWebsite} onChange={(e) => setForm({ ...form, linkWebsite: e.target.value })} placeholder="Вебсайт" className={inp} />
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-500 shrink-0" />
                    <input value={form.linkWhatsapp} onChange={(e) => setForm({ ...form, linkWhatsapp: e.target.value })} placeholder="WhatsApp номер" className={inp} />
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Адреса *</label>
                  <button onClick={addAddress} className="text-xs text-yellow-600 hover:text-yellow-700">+ Добавить адрес</button>
                </div>
                <div className="space-y-2">
                  {form.addresses.map((addr, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={addr} onChange={(e) => updateAddress(i, e.target.value)} placeholder={`Адрес ${i + 1}`} className={inp + " flex-1"} />
                      {form.addresses.length > 1 && (
                        <button onClick={() => removeAddress(i)} className="px-2 text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Commission & Discount — for AUTO_SHOP and CAR_WASH */}
              {(type === "AUTO_SHOP" || type === "CAR_WASH") && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Процент от чека</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">Комиссия Payda (%)</label>
                      <input
                        type="number" step="0.1" min="0" max="100"
                        value={form.commissionPercent}
                        onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
                        placeholder="5"
                        className={inp}
                      />
                      <p className="text-xs text-gray-400 mt-0.5">Сколько % партнёр платит нам</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">Скидка клиенту (%)</label>
                      <input
                        type="number" step="0.1" min="0" max="100"
                        value={form.discountPercent}
                        onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                        placeholder="5"
                        className={inp}
                      />
                      <p className="text-xs text-gray-400 mt-0.5">Сколько % скидка покупателю</p>
                    </div>
                  </div>
                  {form.commissionPercent && form.discountPercent && (
                    <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-gray-600">
                      <p>Пример: чек <b>10 000₸</b></p>
                      <p>Скидка клиенту: <b className="text-green-600">{(10000 * parseFloat(form.discountPercent) / 100).toLocaleString()}₸</b> → клиент платит <b>{(10000 - 10000 * parseFloat(form.discountPercent) / 100).toLocaleString()}₸</b></p>
                      <p>Комиссия Payda: <b className="text-blue-600">{(10000 * parseFloat(form.commissionPercent) / 100).toLocaleString()}₸</b> → партнёр должен нам</p>
                    </div>
                  )}
                </div>
              )}

              {/* Services — only for SERVICE_CENTER and CAR_WASH */}
              {type !== "AUTO_SHOP" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">Услуги и цены</label>
                  <button onClick={addService} className="text-xs text-yellow-600 hover:text-yellow-700">+ Добавить услугу</button>
                </div>
                <div className="space-y-3">
                  {form.serviceIds.map((svc, i) => {
                    const selectedService = allServices.find((s) => s.id === svc.serviceId);
                    const price = parseInt(svc.price) || 0;
                    let commission = 0;
                    let cashback = 0;
                    if (selectedService && price > 0) {
                      commission = selectedService.commissionType === "percent"
                        ? Math.round(price * (selectedService.commissionValue ?? 0) / 100)
                        : (selectedService.commissionValue ?? 0);
                      cashback = selectedService.cashbackType === "percent"
                        ? Math.round(commission * (selectedService.cashbackValue ?? 0) / 100)
                        : (selectedService.cashbackValue ?? 0);
                    }
                    return (
                      <div key={i} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex gap-3 items-center">
                          <Select
                            value={svc.serviceId}
                            onValueChange={(val) => updateService(i, "serviceId", val)}
                          >
                            <SelectTrigger className="flex-1 h-9 border-gray-300 rounded-lg text-sm">
                              <SelectValue placeholder="Выберите услугу" />
                            </SelectTrigger>
                            <SelectContent>
                              {allServices.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name} <span className="text-gray-400 ml-1">({s.category})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!svc.isFlexPrice && (
                            <input value={svc.price} onChange={(e) => updateService(i, "price", e.target.value)} placeholder="Цена ₸" className={inp + " w-36"} />
                          )}
                          <button onClick={() => removeService(i)} className="text-red-400 hover:text-red-600 shrink-0"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={svc.isFlexPrice}
                              onChange={(e) => {
                                const svcs = [...form.serviceIds];
                                svcs[i] = { ...svcs[i], isFlexPrice: e.target.checked, price: e.target.checked ? "" : svcs[i].price };
                                setForm({ ...form, serviceIds: svcs });
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                            />
                            <span className="text-xs text-gray-500">Плавающая цена</span>
                          </label>
                          {selectedService && (
                            <div className="flex gap-3 text-xs">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                Комиссия: {price > 0 ? `${commission.toLocaleString()}₸` : `${selectedService.commissionValue ?? 0}${selectedService.commissionType === "percent" ? "%" : "₸"}`}
                              </span>
                              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                Кэшбэк: {price > 0 ? `${cashback.toLocaleString()}₸` : `${selectedService.cashbackValue ?? 0}${selectedService.cashbackType === "percent" ? "% от комиссии" : "₸"}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.addresses.some((a) => a.trim())}
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
