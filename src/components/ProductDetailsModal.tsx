import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  MessageCircle,
  Minus,
  PhoneCall,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { ASSETS } from '../data/assets';
import type { Product, Review } from '../types';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, weight: string) => void;
  onBuyNow: (product: Product, quantity: number, weight: string) => void;
  allProducts: Product[];
  reviews: Review[];
  onSelectProduct: (p: Product) => void;
  hotline?: string;
  whatsapp?: string;
}

export function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  allProducts,
  reviews,
  onSelectProduct,
  hotline = '01994618066',
  whatsapp = '8801994618066',
}: ProductDetailsModalProps) {
  const [selectedWeight, setSelectedWeight] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [activeTab, setActiveTab] = useState<'description' | 'additional' | 'reviews'>(
    'description'
  );

  useEffect(() => {
    if (product) {
      setSelectedWeight(product.weights[0] || '');
      setQuantity(1);
      setActiveImage(product.image);
      setActiveTab('description');
    }
  }, [product]);

  if (!product) return null;

  const multiplier = product.weightPriceMultipliers?.[selectedWeight] ?? 1;
  const activePrice = Math.round(product.price * multiplier);
  const activeOriginalPrice = Math.round(product.originalPrice * multiplier);

  const productReviews = reviews.filter(
    (r) => r.productId === product.id || !r.productId
  );

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);
  const fallbackRelated =
    relatedProducts.length > 0
      ? relatedProducts
      : allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  const waOrderUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    `হ্যালো KYNZO, আমি "${product.name}" (${selectedWeight}, ${quantity}টি, মূল্য ৳${
      activePrice * quantity
    }) অর্ডার করতে চাই।`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-4 border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F8FAFC]">
          <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">
            {product.category}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Close product modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
            <div className="space-y-3">
              <div className="relative aspect-[4/3] rounded-2xl bg-[#F1F5F9] border border-slate-200/80 overflow-hidden flex items-center justify-center">
                {product.discountPercent > 0 && (
                  <span className="absolute top-3 left-3 z-10 bg-[#0B1120] text-[#38BDF8] text-xs font-extrabold px-2.5 py-1 rounded-lg border border-blue-500/30 tabular-nums">
                    SAVE {product.discountPercent}%
                  </span>
                )}
                <img
                  src={activeImage || product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = ASSETS.productSmartwatch;
                  }}
                />
              </div>

              {product.gallery && product.gallery.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {product.gallery.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(imgUrl)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        activeImage === imgUrl
                          ? 'border-[#2563EB] ring-2 ring-blue-600/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="p-3 bg-[#EFF6FF] rounded-xl border border-blue-200/70 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <Truck className="w-4 h-4 text-[#2563EB]" />
                  <span>ঢাকা সিটিতে ২৪ ঘণ্টায় ও সারাদেশে ২-৩ দিনে হোম ডেলিভারি</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>১০০% অরিজিনাল গ্যাজেট ও ১ বছরের অফিসিয়াল ওয়ারেন্টি গ্যারান্টি</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                      product.inStock
                        ? 'text-blue-700 bg-blue-50 border-blue-200'
                        : 'text-red-700 bg-red-50 border-red-200'
                    }`}
                  >
                    {product.inStock ? 'In Stock · Ready to Ship' : 'Out of Stock'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">SKU: {product.id}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display leading-tight mb-2">
                  {product.name}
                </h1>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{product.rating}</span>
                  <span className="text-xs text-slate-400">
                    ({product.reviewsCount} কাস্টমার রিভিউ)
                  </span>
                </div>

                <div className="flex items-baseline gap-3 mb-6 p-3.5 bg-[#EFF6FF] rounded-xl border border-blue-200/70">
                  <span className="text-2xl sm:text-3xl font-black text-[#0F172A] font-display tabular-nums">
                    {activePrice}৳
                  </span>
                  {activeOriginalPrice > activePrice && (
                    <span className="text-base sm:text-lg text-slate-400 line-through tabular-nums">
                      {activeOriginalPrice}৳
                    </span>
                  )}
                  {product.discountPercent > 0 && (
                    <span className="text-xs font-bold text-[#2563EB] bg-white px-2 py-0.5 rounded border border-blue-200 tabular-nums">
                      {product.discountPercent}% OFF
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                    Color / Edition নির্বাচন করুন:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.weights.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSelectedWeight(w)}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                          selectedWeight === w
                            ? 'bg-[#0B1120] text-white shadow-md ring-2 ring-blue-600/25'
                            : 'bg-slate-100 hover:bg-[#EFF6FF] text-slate-700 border border-slate-200'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Quantity / পরিমাণ:
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2.5 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 text-sm font-bold text-slate-900 min-w-[2.5rem] text-center tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2.5 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs text-slate-500">
                      মোট:{' '}
                      <strong className="text-slate-800 font-bold tabular-nums">
                        ৳{activePrice * quantity}
                      </strong>
                    </span>
                  </div>
                </div>

                {product.isCodAvailable === false && (
                  <div className="mb-4 p-3.5 bg-red-50 border-2 border-red-300 rounded-2xl text-red-600 text-xs font-bold leading-relaxed flex items-start gap-2 shadow-xs">
                    <span className="text-base leading-none shrink-0 mt-0.5">⚠️</span>
                    <span>
                      এই পণ্যটি বর্তমানে ক্যাশ অন ডেলিভারিতে নেওয়ার সুযোগ নেই সুতরাং বিকাশ
                      অথবা নগদে আপনার ঠিকানা অনুযায়ী ডেলিভারি চার্জ এডভান্স করে অর্ডার করুন।
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onAddToCart(product, quantity, selectedWeight)}
                  disabled={!product.inStock}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#EFF6FF] hover:bg-[#2563EB] text-[#1D4ED8] hover:text-white border border-blue-200 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart (কার্টে যুক্ত করুন)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onBuyNow(product, quantity, selectedWeight)}
                  disabled={!product.inStock}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#0B1120] hover:bg-[#2563EB] text-white shadow-lg shadow-slate-950/15 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 text-[#38BDF8]" />
                  <span>অর্ডার করুন (Buy Now)</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={waOrderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366] text-[#15803D] hover:text-white border border-[#25D366]/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Order</span>
                  </a>
                  <a
                    href={`tel:${hotline}`}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-[#0B1120] text-slate-700 hover:text-white border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call For Order</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center gap-2 border-b border-slate-200 mb-4 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'description', label: 'Overview' },
                  { id: 'additional', label: 'Specs & Box Info' },
                  { id: 'reviews', label: `Reviews (${productReviews.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-[#2563EB] text-[#0F172A]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'description' && (
              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p className="font-medium text-[#0F172A]">{product.shortDesc}</p>
                <p>{product.description}</p>
                {product.keyBenefits && product.keyBenefits.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-2">
                    <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider">
                      Key Features & Hardware Specs:
                    </h4>
                    <ul className="space-y-1.5">
                      {product.keyBenefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'additional' && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs sm:text-sm">
                <div className="grid grid-cols-3 p-3.5 bg-slate-50 border-b border-slate-200">
                  <span className="font-bold text-slate-700">Available Editions</span>
                  <span className="col-span-2 text-slate-600">
                    {product.weights.join(', ')}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-3.5 bg-white border-b border-slate-200">
                  <span className="font-bold text-slate-700">Packaging Unit</span>
                  <span className="col-span-2 text-slate-600">{product.unit}</span>
                </div>
                <div className="grid grid-cols-3 p-3.5 bg-slate-50">
                  <span className="font-bold text-slate-700">Specs & Warranty</span>
                  <span className="col-span-2 text-slate-600">
                    {product.ingredients || '100% Authentic KYNZO Tech Verified · 1 Year Official Warranty'}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-3">
                {productReviews.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">
                    এই গ্যাজেটে এখনো কোনো রিভিউ দেওয়া হয়নি।
                  </p>
                ) : (
                  productReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-[#0F172A]">
                          {rev.userName}{' '}
                          <span className="text-slate-400 font-normal">
                            ({rev.userLocation})
                          </span>
                        </span>
                        <div className="flex text-amber-500">
                          {[...Array(rev.rating)].map((_, idx) => (
                            <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {fallbackRelated.length > 0 && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-extrabold text-[#0F172A] mb-3 font-display">
                Related Gadgets (অনুরূপ গ্যাজেটসমূহ)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {fallbackRelated.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectProduct(rel)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-[#2563EB] bg-[#F8FAFC] cursor-pointer transition-colors"
                  >
                    <img
                      src={rel.image}
                      alt={rel.name}
                      referrerPolicy="no-referrer"
                      className="w-full aspect-[4/3] object-cover rounded-lg bg-[#F1F5F9] mb-2"
                    />
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {rel.name}
                    </p>
                    <p className="text-xs font-extrabold text-[#2563EB] mt-0.5 tabular-nums">
                      ৳{rel.price}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
