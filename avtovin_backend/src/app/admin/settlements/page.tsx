"use client";

import { useEffect, useState } from "react";
import { Check, Clock, X, Image, FileCheck, FileX, Trash2 } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  SERVICE_CENTER: "СЦ",
  AUTO_SHOP: "Магазин",
  CAR_WASH: "Мойка",
};

const RECEIPT_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  NONE: { label: "Нет чека", color: "text-gray-500", bg: "bg-gray-100" },
  PENDING: { label: "Чек на проверке", color: "text-blue-700", bg: "bg-blue-100" },
  APPROVED: { label: "Чек подтверждён", color: "text-green-700", bg: "bg-green-100" },
  REJECTED: { label: "Чек отклонён", color: "text-red-700", bg: "bg-red-100" },
};

interface Settlement {
  id: string;
  serviceCenterId: string;
  periodStart: string;
  periodEnd: string;
  totalCommission: number;
  totalCashbackRedeemed: number;
  netAmount: number;
  isPaid: boolean;
  receiptUrl: string | null;
  receiptStatus: string;
  createdAt: string;
  serviceCenter: { name: string; type: string };
}

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : "";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [receiptModal, setReceiptModal] = useState<Settlement | null>(null);

  const getToken = () => getCookie("token");

  const fetchSettlements = () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    const params = filter === "paid" ? "?isPaid=true" : filter === "unpaid" ? "?isPaid=false" : "";
    fetch(`/api/settlements${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setSettlements)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSettlements(); }, [filter]);

  const deleteSettlement = async (id: string) => {
    if (!confirm("Удалить этот расчёт?")) return;
    const token = getToken();
    await fetch(`/api/settlements/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchSettlements();
  };

  const markPaid = async (id: string) => {
    const token = getToken();
    await fetch(`/api/settlements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isPaid: true }),
    });
    fetchSettlements();
  };

  const approveReceipt = async (id: string) => {
    const token = getToken();
    await fetch(`/api/settlements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ receiptStatus: "APPROVED" }),
    });
    setReceiptModal(null);
    fetchSettlements();
  };

  const rejectReceipt = async (id: string) => {
    const token = getToken();
    await fetch(`/api/settlements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ receiptStatus: "REJECTED" }),
    });
    setReceiptModal(null);
    fetchSettlements();
  };

  const getReceiptSrc = (url: string) => {
    if (url.startsWith("data:")) return url;
    return `data:image/jpeg;base64,${url}`;
  };

  const isPdf = (url: string) => url.startsWith("data:application/pdf");

  const totalNet = settlements.reduce((s, r) => s + (r.isPaid ? 0 : r.totalCommission), 0);
  const pendingReceipts = settlements.filter((s) => s.receiptStatus === "PENDING").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Взаиморасчёт</h1>
        <p className="text-sm text-gray-500 mt-1">Еженедельные расчёты с партнёрами</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Всего расчётов</p>
          <p className="text-2xl font-bold text-gray-900">{settlements.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Неоплаченных</p>
          <p className="text-2xl font-bold text-red-600">{settlements.filter((s) => !s.isPaid).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Итого к оплате</p>
          <p className="text-2xl font-bold text-yellow-600">{totalNet.toLocaleString()}₸</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4">
          <p className="text-sm text-blue-600">Чеки на проверке</p>
          <p className="text-2xl font-bold text-blue-600">{pendingReceipts}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "all", label: "Все" },
          { key: "unpaid", label: "Неоплаченные" },
          { key: "paid", label: "Оплаченные" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-yellow-100 text-yellow-700"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Партнёр</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Тип</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Период</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Комиссия</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Кэшбэки (инфо)</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">К оплате</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Статус</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Чек</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Загрузка...</td></tr>
            ) : settlements.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Нет расчётов</td></tr>
            ) : (
              settlements.map((s) => {
                const rs = RECEIPT_STATUS_LABELS[s.receiptStatus] || RECEIPT_STATUS_LABELS.NONE;
                return (
                  <tr key={s.id} className={`hover:bg-gray-50 ${s.receiptStatus === "PENDING" ? "bg-blue-50/50" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.serviceCenter.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[s.serviceCenter.type] || s.serviceCenter.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(s.periodStart)} — {formatDate(s.periodEnd)}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 font-medium">
                      {s.totalCommission.toLocaleString()}₸
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600">
                      -{s.totalCashbackRedeemed.toLocaleString()}₸
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span className="text-green-600">
                        {s.totalCommission.toLocaleString()}₸
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.isPaid ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          <Check className="h-3 w-3" /> Оплачено
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          <Clock className="h-3 w-3" /> Ожидание
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.receiptUrl ? (
                        <button
                          onClick={() => setReceiptModal(s)}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${rs.bg} ${rs.color}`}
                        >
                          <Image className="h-3 w-3" />
                          {rs.label}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {s.receiptStatus === "PENDING" && (
                          <>
                            <button
                              onClick={() => approveReceipt(s.id)}
                              className="text-xs bg-green-500 text-white px-2.5 py-1 rounded-lg hover:bg-green-600 flex items-center gap-1"
                            >
                              <FileCheck className="h-3 w-3" /> Принять
                            </button>
                            <button
                              onClick={() => rejectReceipt(s.id)}
                              className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600 flex items-center gap-1"
                            >
                              <FileX className="h-3 w-3" /> Отклонить
                            </button>
                          </>
                        )}
                        {!s.isPaid && s.receiptStatus !== "PENDING" && (
                          <button
                            onClick={() => markPaid(s.id)}
                            className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                          >
                            Оплачено
                          </button>
                        )}
                        <button
                          onClick={() => deleteSettlement(s.id)}
                          className="text-xs text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50"
                          title="Удалить расчёт"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setReceiptModal(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">Чек оплаты</h3>
                <p className="text-sm text-gray-500">{receiptModal.serviceCenter.name} — {receiptModal.totalCommission.toLocaleString()}₸</p>
              </div>
              <button onClick={() => setReceiptModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              {receiptModal.receiptUrl && (
                isPdf(receiptModal.receiptUrl) ? (
                  <iframe
                    src={receiptModal.receiptUrl}
                    className="w-full rounded-lg border border-gray-200"
                    style={{ height: "60vh" }}
                    title="Чек оплаты"
                  />
                ) : (
                  <img
                    src={getReceiptSrc(receiptModal.receiptUrl)}
                    alt="Чек оплаты"
                    className="w-full rounded-lg border border-gray-200 max-h-[60vh] object-contain"
                  />
                )
              )}
            </div>
            {receiptModal.receiptStatus === "PENDING" && (
              <div className="flex gap-3 p-4 border-t bg-gray-50">
                <button
                  onClick={() => approveReceipt(receiptModal.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                >
                  <FileCheck className="h-4 w-4" /> Подтвердить оплату
                </button>
                <button
                  onClick={() => rejectReceipt(receiptModal.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                >
                  <FileX className="h-4 w-4" /> Отклонить
                </button>
              </div>
            )}
            {receiptModal.receiptStatus === "APPROVED" && (
              <div className="p-4 border-t bg-green-50 text-center">
                <span className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium">
                  <Check className="h-4 w-4" /> Чек подтверждён, оплата принята
                </span>
              </div>
            )}
            {receiptModal.receiptStatus === "REJECTED" && (
              <div className="p-4 border-t bg-red-50 text-center">
                <span className="inline-flex items-center gap-1.5 text-sm text-red-700 font-medium">
                  <X className="h-4 w-4" /> Чек отклонён
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
