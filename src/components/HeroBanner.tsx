import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ASSETS } from '../data/assets';
import { DEFAULT_SETTINGS } from '../data/seedData';
import type { HeroSlide } from '../types';

interface HeroBannerProps {
  slides?: HeroSlide[];
  onShopNow: () => void;
  onSelectCategory: (cat: string) => void;
}

export function HeroBanner({ slides, onShopNow, onSelectCategory }: HeroBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideList = slides && slides.length > 0 ? slides : DEFAULT_SETTINGS.heroSlides;

  useEffect(() => {
    if (slideList.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideList.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slideList.length]);

  const currentSlide = slideList[activeIndex] || slideList[0];
  if (!currentSlide) return null;

  const words = currentSlide.title.split(' ');
  const splitIdx = words.length > 2 ? Math.ceil(words.length / 2) : words.length;
  const firstHalf = words.slice(0, splitIdx).join(' ');
  const secondHalf = words.slice(splitIdx).join(' ');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      <div className="relative overflow-hidden bg-[#0B1120] rounded-2xl shadow-[0_24px_56px_-18px_rgba(11,17,32,0.5)] border border-slate-800">
        <div className="relative min-h-[320px] sm:min-h-[400px] md:min-h-[440px] flex items-center">
          <div className="absolute inset-0 z-0">
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transition-all duration-700"
              fetchPriority="high"
              decoding="async"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = ASSETS.heroGadgetWorkspace;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050914]/95 via-[#0B1120]/82 to-[#0B1120]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050914]/65 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 md:p-14 max-w-xl text-white">
            <p className="text-[11px] sm:text-xs font-bold tracking-[0.18em] uppercase text-[#38BDF8] mb-3">
              {currentSlide.badge}
            </p>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-display text-white leading-[1.08] mb-3 text-balance">
              <span className="block">{firstHalf}</span>
              {secondHalf && (
                <span className="block text-[#93C5FD] font-extrabold mt-0.5">
                  {secondHalf}
                </span>
              )}
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-slate-200/90 line-clamp-2 sm:line-clamp-3 mb-6 max-w-md leading-relaxed">
              {currentSlide.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (currentSlide.category) {
                    onSelectCategory(currentSlide.category);
                  } else {
                    onShopNow();
                  }
                }}
                className="pl-6 pr-2.5 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-950/40 hover:scale-102 active:scale-98 transition-all inline-flex items-center gap-3 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{currentSlide.cta || 'Explore Gadgets'}</span>
                <span className="w-7 h-7 rounded-full bg-white text-[#0B1120] flex items-center justify-center shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>

              <button
                type="button"
                onClick={onShopNow}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xs border border-white/25 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                সব গ্যাজেট দেখুন
              </button>
            </div>
          </div>

          {slideList.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev - 1 + slideList.length) % slideList.length)
                }
                className="hidden sm:flex absolute right-14 bottom-4 z-20 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xs border border-white/25 text-white items-center justify-center transition-colors cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev + 1) % slideList.length)}
                className="hidden sm:flex absolute right-4 bottom-4 z-20 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xs border border-white/25 text-white items-center justify-center transition-colors cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="absolute left-6 sm:left-10 md:left-14 bottom-4 z-20 flex items-center gap-1.5">
                {slideList.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeIndex === idx
                        ? 'w-7 bg-[#38BDF8]'
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
