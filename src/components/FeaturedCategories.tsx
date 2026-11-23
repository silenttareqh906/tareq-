import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Cpu } from 'lucide-react';
import { ASSETS } from '../data/assets';
import type { Category } from '../types';

interface FeaturedCategoriesProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
}

export function FeaturedCategories({
  categories,
  selectedCategory,
  onSelectCategory,
}: FeaturedCategoriesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -300 : 300;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <section className="py-4 sm:py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] font-display tracking-tight">
            Featured Tech Categories
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            স্মার্টওয়াচ, অডিও, পাওয়ার ও পিসি গিয়ার ব্রাউজ করুন
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="w-8 h-8 rounded-md bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
            aria-label="Previous categories"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="w-8 h-8 rounded-md bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
            aria-label="Next categories"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-1"
      >
        <div
          onClick={() => onSelectCategory(null)}
          className={`group flex flex-col items-center p-2.5 rounded-xl cursor-pointer transition-all shrink-0 w-32 sm:w-40 kynzo-card ${
            selectedCategory === null
              ? 'border-[#2563EB] ring-1 ring-[#2563EB]/30'
              : 'hover:-translate-y-0.5'
          }`}
        >
          <div
            className={`w-full aspect-square rounded-lg flex items-center justify-center mb-2 transition-colors ${
              selectedCategory === null
                ? 'bg-[#EFF6FF] text-[#2563EB]'
                : 'bg-[#F8FAFC] text-slate-600 group-hover:bg-[#EFF6FF] group-hover:text-[#2563EB]'
            }`}
          >
            <Cpu className="w-9 h-9" />
          </div>
          <span
            className={`text-xs font-semibold text-center leading-tight line-clamp-1 w-full ${
              selectedCategory === null ? 'text-[#1D4ED8] font-bold' : 'text-slate-900'
            }`}
          >
            All Gadgets
          </span>
        </div>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className={`group flex flex-col items-center p-2.5 rounded-xl cursor-pointer transition-all shrink-0 w-32 sm:w-40 kynzo-card ${
                isSelected
                  ? 'border-[#2563EB] ring-1 ring-[#2563EB]/30'
                  : 'hover:-translate-y-0.5'
              }`}
            >
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#F1F5F9] mb-2 flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = ASSETS.productSmartwatch;
                  }}
                />
              </div>
              <span
                className={`text-xs font-semibold text-center leading-tight line-clamp-1 w-full ${
                  isSelected
                    ? 'text-[#1D4ED8] font-bold'
                    : 'text-slate-900 group-hover:text-[#2563EB]'
                }`}
              >
                {cat.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
