import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import type { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, weight: string, quantity: number) => void;
  onRemoveItem: (productId: string, weight: string) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const freeShippingThreshold = 2500;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const progressPct = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          <div className="bg-gradient-to-r from-[#0B1120] via-[#111827] to-[#0B1120] text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#38BDF8]" />
              </div>
              <div>
                <h2 className="font-extrabold text-base font-display">Shopping Bag</h2>
                <p className="text-[11px] text-slate-300 tabular-nums">
                  {totalCount} টি গ্যাজেট কার্টে যুক্ত আছে
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 py-3 bg-[#EFF6FF] border-b border-blue-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#2563EB]" />
                {remaining === 0 ? (
                  <span>অভিনন্দন! FREESHIP কুপনে ঢাকায় ফ্রি ডেলিভারি পান</span>
                ) : (
                  <span>আর মাত্র ৳{remaining} যোগ করলেই FREESHIP সুবিধা</span>
                )}
              </span>
              <span className="text-[11px] font-bold tabular-nums">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-blue-100">
              <div
                className="h-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Your gadget bag is currently empty.
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  আপনার কার্ট বর্তমানে খালি আছে। সেরা স্মার্ট গ্যাজেটগুলো দেখতে শপে প্রবেশ করুন।
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-md hover:bg-[#1D4ED8] transition-colors cursor-pointer"
                >
                  Return to shop
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.weight}`}
                  className="p-3 bg-slate-50/80 hover:bg-[#EFF6FF]/40 rounded-2xl border border-slate-200 flex gap-3 items-center transition-colors"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      ভ্যারিয়েন্ট: {item.weight}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.weight, item.quantity - 1)
                          }
                          className="p-1 hover:bg-[#EFF6FF] text-slate-600 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.weight, item.quantity + 1)
                          }
                          className="p-1 hover:bg-[#EFF6FF] text-slate-600 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-[#2563EB] tabular-nums">
                          ৳{item.price * item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.productId, item.weight)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">Subtotal (উপ-মোট):</span>
                <span className="text-lg font-black text-[#0B1120] font-display tabular-nums">
                  ৳{subtotal}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ডেলিভারি চার্জ ও টেক কুপন কোড পরবর্তী চেকআউট ধাপে হিসাব করা হবে।
              </p>
              <button
                type="button"
                onClick={onCheckout}
                className="w-full py-3.5 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950/20 transition-all cursor-pointer active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
