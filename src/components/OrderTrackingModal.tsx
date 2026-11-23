import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Search, Truck, X } from 'lucide-react';
import { storage } from '../services/storage';
import type { Order } from '../types';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  initialOrderId?: string;
}

export function OrderTrackingModal({
  isOpen,
  onClose,
  orders,
  initialOrderId = '',
}: OrderTrackingModalProps) {
  const [query, setQuery] = useState(initialOrderId);
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(
    initialOrderId
      ? orders.find((o) => o.id.toLowerCase() === initialOrderId.toLowerCase()) || null
      : orders[0] || null
  );
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setQuery(initialOrderId);
    setSearched(false);
    const local = initialOrderId
      ? orders.find((o) => o.id.toLowerCase() === initialOrderId.toLowerCase()) || null
      : orders[0] || null;
    setMatchedOrder(local);

    if (initialOrderId && !local) {
      setLoading(true);
      storage
        .trackOrder(initialOrderId)
        .then((res) => {
          setMatchedOrder(res);
          setSearched(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, initialOrderId, orders]);

  if (!isOpen) return null;

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const found = await storage.trackOrder(query);
      setMatchedOrder(found);
    } catch {
      setMatchedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-4 border border-slate-200 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-lg font-extrabold text-[#0F172A] font-display">
              Live Order & Delivery Tracking
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Close tracking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <form onSubmit={handleTrack} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="অর্ডার আইডি (KYN-98421) বা মোবাইল নম্বর লিখুন..."
                className="w-full bg-slate-50 border border-slate-300 focus:border-[#2563EB] focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#0B1120] hover:bg-[#2563EB] text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              {loading ? 'খোঁজা হচ্ছে...' : 'ট্র্যাক করুন'}
            </button>
          </form>

          {matchedOrder ? (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 bg-[#EFF6FF] rounded-2xl border border-blue-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    অর্ডার নম্বর:
                  </span>
                  <span className="text-base sm:text-lg font-black text-[#0F172A] font-mono">
                    {matchedOrder.id}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    তারিখ: {matchedOrder.date}
                  </span>
                </div>

                <div className="sm:text-right">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    কুরিয়ার পার্টনার:
                  </span>
                  <span className="text-xs font-extrabold text-[#1D4ED8] bg-white px-2.5 py-1 rounded-lg border border-blue-200 inline-block mt-0.5">
                    {matchedOrder.courierPartner} · {matchedOrder.trackingCode}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                  ডেলিভারি অগ্রগতি (Live Delivery Steps)
                </h3>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {matchedOrder.timeline.map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-4">
                      <div
                        className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                          step.done
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {step.done ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-xs sm:text-sm font-bold ${
                              step.done ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {step.title}
                          </h4>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {step.time}
                          </span>
                        </div>
                        <p
                          className={`text-xs mt-0.5 ${
                            step.done ? 'text-slate-600' : 'text-slate-400'
                          }`}
                        >
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="font-bold text-slate-700 block">গ্রাহকের ঠিকানা:</span>
                  <p className="text-slate-800 font-semibold">{matchedOrder.customerName}</p>
                  <p className="text-slate-600">
                    {matchedOrder.customerAddress}
                    {matchedOrder.district ? `, ${matchedOrder.district}` : ''}
                    {matchedOrder.division ? ` (${matchedOrder.division})` : ''}
                  </p>
                  <p className="text-slate-600 font-mono">{matchedOrder.customerPhone}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="font-bold text-slate-700 block">পেমেন্ট বিবরণ:</span>
                  <p className="text-slate-800">
                    পদ্ধতি: <strong className="font-bold">{matchedOrder.paymentMethod}</strong>
                  </p>
                  <p className="text-slate-800">
                    স্ট্যাটাস:{' '}
                    <span className="font-bold text-[#2563EB]">
                      {matchedOrder.paymentStatus}
                    </span>
                  </p>
                  <p className="text-slate-800">
                    সর্বমোট:{' '}
                    <strong className="text-sm font-bold text-[#0F172A] tabular-nums">
                      ৳{matchedOrder.total}
                    </strong>
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  অর্ডারের গ্যাজেটসমূহ:
                </span>
                <div className="space-y-2">
                  {matchedOrder.items.map((item, idx) => (
                    <div
                      key={`${item.productId}-${idx}`}
                      className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-9 h-9 rounded object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[11px] text-slate-500">
                            ভ্যারিয়েন্ট: {item.weight} · পরিমাণ: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums">
                        ৳{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : searched ? (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">কোনো অর্ডার পাওয়া যায়নি</p>
              <p className="text-xs text-slate-500 mt-1">
                আপনার অর্ডার আইডি (যেমন: KYN-98421) অথবা যে ফোন নম্বর দিয়ে অর্ডার করেছেন তা
                সঠিকভাবে দিন।
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
