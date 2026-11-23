import { MouseEvent } from 'react';
import { Eye, ShoppingBag } from 'lucide-react';
import { ASSETS } from '../data/assets';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, e?: MouseEvent<HTMLButtonElement>) => void;
}

export function ProductCard({ product, onSelect, onAddToCart }: ProductCardProps) {
  return (
    <div
      onClick={() => onSelect(product)}
      className="group kynzo-card rounded-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer p-3"
    >
      <div className="relative aspect-[4/3] bg-[#F1F5F9] rounded-lg overflow-hidden mb-3 flex items-center justify-center">
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="w-7 h-7 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-900 hover:text-[#2563EB] transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </span>
        </div>

        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = ASSETS.productSmartwatch;
          }}
        />

        {!product.inStock && (
          <div className="absolute inset-0 bg-[#0B1120]/70 backdrop-blur-2xs flex items-center justify-center rounded-lg">
            <span className="bg-white text-slate-900 text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider shadow-xs">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between gap-1 mb-1">
            <span className="truncate">{product.category}</span>
            {product.discountPercent > 0 && (
              <span className="text-[#2563EB] font-bold shrink-0 tabular-nums">
                -{product.discountPercent}%
              </span>
            )}
          </p>
          <h3 className="font-semibold text-slate-900 text-xs sm:text-[13px] leading-snug line-clamp-2 min-h-[2.25rem] group-hover:text-[#2563EB] transition-colors">
            {product.name}
          </h3>
          {product.isCodAvailable === false && (
            <p className="text-[10px] font-semibold text-amber-700 mt-1">
              এডভান্স ডেলিভারি প্রযোজ্য
            </p>
          )}
        </div>

        <div className="mt-3 space-y-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-extrabold text-[#0B1120] tabular-nums">
              ৳{product.price}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-[11px] text-slate-400 line-through tabular-nums">
                ৳{product.originalPrice}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, e);
            }}
            disabled={!product.inStock}
            className={`w-full py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-97 cursor-pointer whitespace-nowrap ${
              product.inStock
                ? 'bg-[#EFF6FF] hover:bg-[#2563EB] text-[#1D4ED8] hover:text-white border border-blue-200 hover:border-[#2563EB]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
