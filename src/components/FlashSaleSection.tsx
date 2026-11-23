import { MouseEvent, useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ShoppingBag,
  Tag,
  Zap,
} from 'lucide-react';
import { ASSETS } from '../data/assets';
import type { Coupon, Product } from '../types';

interface FlashSaleSectionProps {
  products: Product[];
  coupons: Coupon[];
  onSelectProduct: (p: Product) => void;
  onAddToCart: (p: Product, e?: MouseEvent<HTMLButtonElement>) => void;
  onNavigateShop?: () => void;
}

export function FlashSaleSection({
  products,
  coupons,
  onSelectProduct,
  onAddToCart,
}: FlashSaleSectionProps) {
  const markedFlash = products.filter((p) => p.isFlashSale);
  const flashItems =
    markedFlash.length > 0
      ? markedFlash
      : products.filter((p) => p.discountPercent >= 15).slice(0, 8);

  const [slideIdx, setSlideIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState({ hours: 14, minutes: 42, seconds: 19 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (flashItems.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % flashItems.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [flashItems.length, paused]);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (flashItems.length === 0) return null;

  const visibleCount = Math.min(5, flashItems.length);
  const visibleItems = Array.from(
    { length: visibleCount },
    (_, i) => flashItems[(slideIdx + i) % flashItems.length]
  );

  return (
    <section
      id="flash-deals"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 my-2 scroll-mt-28"
    >
      <div className="rounded-2xl p-5 sm:p-7 border border-slate-200 bg-gradient-to-br from-[#EFF6FF]/70 via-white to-[#F8FAFC] shadow-[0_12px_36px_-14px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2563EB] mb-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Tech Flash Deals · সীমিত সময়ের অফার</span>
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display text-[#0F172A]">
              স্মার্ট গ্যাজেট মেগা ডিল ও ডিসকাউন্ট
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              ফ্ল্যাগশিপ গ্যাজেটে স্পেশাল প্রাইস ও কুপন সুবিধা — স্টক ফুরানোর আগেই অর্ডার করুন
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-blue-200 bg-white shadow-2xs">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span className="text-xs font-semibold text-slate-600">অফারের বাকি:</span>
              <div className="flex items-center gap-1 font-mono font-extrabold text-xs sm:text-sm tabular-nums">
                <span className="bg-[#0B1120] text-[#38BDF8] px-2 py-0.5 rounded">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="text-[#2563EB] font-bold">:</span>
                <span className="bg-[#0B1120] text-[#38BDF8] px-2 py-0.5 rounded">
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
                <span className="text-[#2563EB] font-bold">:</span>
                <span className="bg-[#0B1120] text-[#38BDF8] px-2 py-0.5 rounded">
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setSlideIdx((prev) => (prev - 1 + flashItems.length) % flashItems.length)
                }
                className="w-8 h-8 rounded-md bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                aria-label="Previous flash sale product"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSlideIdx((prev) => (prev + 1) % flashItems.length)}
                className="w-8 h-8 rounded-md bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                aria-label="Next flash sale product"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {coupons && coupons.length > 0 && (
          <div className="py-3.5 border-b border-slate-200/80 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A] shrink-0">
              <Tag className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>টেক কুপন কোড:</span>
            </div>

            {coupons
              .filter((c) => c.isActive)
              .map((cpn) => {
                const isCopied = copiedCode === cpn.code;
                return (
                  <button
                    key={cpn.id}
                    type="button"
                    onClick={() => handleCopyCoupon(cpn.code)}
                    className="px-3 py-1.5 rounded-lg border border-blue-200 bg-white hover:border-[#2563EB] flex items-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95 shadow-2xs"
                    title={`${cpn.description} - ক্লিক করে কোড কপি করুন`}
                  >
                    <span className="font-mono font-extrabold text-xs text-[#2563EB] tracking-wider">
                      {cpn.code}
                    </span>
                    <span className="text-[11px] text-slate-600 hidden sm:inline">
                      (
                      {cpn.discountType === 'percentage'
                        ? `${cpn.discountValue}% ছাড়`
                        : `৳${cpn.discountValue} ছাড়`}
                      )
                    </span>
                    <span className="text-slate-400">
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </span>
                  </button>
                );
              })}
          </div>
        )}

        <div
          className="pt-5"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {visibleItems.map((item) => (
              <div
                key={`${item.id}-${slideIdx}`}
                onClick={() => onSelectProduct(item)}
                className="group kynzo-card rounded-xl hover:-translate-y-0.5 transition-all duration-200 p-3 cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] rounded-lg bg-[#F1F5F9] overflow-hidden mb-2.5 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = ASSETS.productSmartwatch;
                    }}
                  />
                </div>

                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between gap-1 mb-1">
                      <span className="truncate">{item.category}</span>
                      {item.discountPercent > 0 && (
                        <span className="text-[#2563EB] font-bold shrink-0 tabular-nums">
                          -{item.discountPercent}%
                        </span>
                      )}
                    </p>
                    <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 line-clamp-2 min-h-[2.25rem] group-hover:text-[#2563EB] transition-colors">
                      {item.name}
                    </h4>
                  </div>

                  <div className="mt-2.5 space-y-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm sm:text-base font-extrabold text-[#0B1120] tabular-nums">
                        ৳{item.price}
                      </span>
                      {item.originalPrice > item.price && (
                        <span className="text-[11px] text-slate-400 line-through tabular-nums">
                          ৳{item.originalPrice}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(item, e);
                      }}
                      disabled={!item.inStock}
                      className="w-full py-2 px-3 rounded-lg bg-[#EFF6FF] hover:bg-[#2563EB] text-[#1D4ED8] hover:text-white border border-blue-200 hover:border-[#2563EB] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-97 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-4">
            {flashItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSlideIdx(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  slideIdx === idx
                    ? 'w-6 bg-[#2563EB]'
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
