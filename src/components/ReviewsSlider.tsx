import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, PenLine, Quote, Star } from 'lucide-react';
import type { Review } from '../types';

interface ReviewsSliderProps {
  reviews: Review[];
  onAddReview?: (review: Omit<Review, 'id' | 'date'>) => void;
}

export function ReviewsSlider({ reviews, onAddReview }: ReviewsSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [userName, setUserName] = useState('');
  const [userLocation, setUserLocation] = useState('Dhaka');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (reviews.length <= 1 || paused || showForm) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [reviews.length, paused, showForm]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !comment.trim()) return;
    onAddReview?.({
      userName: userName.trim(),
      userLocation: userLocation.trim() || 'Dhaka',
      rating,
      comment: comment.trim(),
      verified: true,
    });
    setUserName('');
    setComment('');
    setShowForm(false);
  };

  if (reviews.length === 0) return null;

  return (
    <section className="py-10 sm:py-12 bg-[#EFF6FF]/60 border-y border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-1">
              <Quote className="w-3.5 h-3.5 fill-current" />
              <span>সন্তুষ্ট টেক গ্রাহকদের অভিজ্ঞতা</span>
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] font-display tracking-tight">
              Verified Gadget Reviews &amp; Ratings
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              হাজারো টেক-প্রেমীর অরিজিনাল গ্যাজেট ও অফিসিয়াল ওয়ারেন্টি সেবার ঠিকানা KYNZO
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#2563EB] text-slate-900 hover:text-white border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>রিভিউ দিন</span>
            </button>

            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length)
                }
                className="w-8 h-8 rounded-md bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev + 1) % reviews.length)}
                className="w-8 h-8 rounded-md bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                aria-label="Next review"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 p-5 bg-white rounded-2xl border border-blue-200 shadow-md space-y-3 max-w-xl mx-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase">
                আপনার অভিজ্ঞতা জানান
              </h4>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  আপনার নাম *
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="যেমন: সাকিব হাসান"
                  className="w-full bg-[#F8FAFC] focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  এলাকা / শহর
                </label>
                <input
                  type="text"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                  placeholder="যেমন: ধানমন্ডি, ঢাকা"
                  className="w-full bg-[#F8FAFC] focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">রেটিং</label>
              <div className="flex items-center gap-1.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating ? 'fill-current text-amber-500' : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                আপনার রিভিউ মন্তব্য *
              </label>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="KYNZO থেকে কেনা গ্যাজেটটি কেমন ছিল..."
                className="w-full bg-[#F8FAFC] focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#2563EB]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              রিভিউ জমা দিন
            </button>
          </form>
        )}

        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="overflow-hidden py-1">
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {reviews.map((rev) => (
                <div key={rev.id} className="w-full shrink-0 px-1 sm:px-3">
                  <div className="max-w-3xl mx-auto p-6 sm:p-7 rounded-2xl kynzo-card relative">
                    <Quote className="w-9 h-9 text-blue-500/15 absolute top-5 right-6 pointer-events-none" />

                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center text-amber-500">
                        {[...Array(rev.rating)].map((_, idx) => (
                          <Star key={idx} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      {rev.verified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D4ED8]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>Verified Buyer</span>
                        </span>
                      )}
                    </div>

                    <p className="text-slate-900 text-sm sm:text-base leading-relaxed italic mb-5">
                      &ldquo;{rev.comment}&rdquo;
                    </p>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200/80">
                      <div className="w-10 h-10 rounded-full bg-[#0B1120] text-[#38BDF8] flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-blue-500/40">
                        {rev.avatar ? (
                          <img
                            src={rev.avatar}
                            alt={rev.userName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          rev.userName.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {rev.userName}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {rev.userLocation} · {rev.date}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-5">
            {reviews.map((rev, idx) => (
              <button
                key={rev.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeIndex === idx
                    ? 'w-7 bg-[#2563EB]'
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to review ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
