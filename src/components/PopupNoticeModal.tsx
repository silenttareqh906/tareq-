import { useEffect, useState } from 'react';
import { ArrowRight, Bell, Check, Copy, Cpu, ShieldCheck, Tag, X } from 'lucide-react';
import type { PopupNotice } from '../types';

interface PopupNoticeModalProps {
  isOpen: boolean;
  notice?: PopupNotice;
  onClose: () => void;
  onAction: (category?: string) => void;
}

export function PopupNoticeModal({
  isOpen,
  notice,
  onClose,
  onAction,
}: PopupNoticeModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !notice || !notice.enabled) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050914]/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-notice-title"
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-[0_24px_64px_-12px_rgba(11,17,32,0.5)] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-[#0B1120] via-[#0F172A] to-[#1E293B] text-white overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#2563EB]/25 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/60 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="নোটিশ বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="w-11 h-11 rounded-2xl bg-[#1E293B] border border-[#38BDF8]/40 text-[#38BDF8] shadow-md shrink-0 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#38BDF8]">
                <Bell className="w-3 h-3" />
                <span>{notice.badge || 'KYNZO TECH NOTICE'}</span>
              </div>
              <h3
                id="popup-notice-title"
                className="text-lg sm:text-xl font-black font-display text-white leading-snug mt-0.5 text-balance"
              >
                {notice.title}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 bg-[#F8FAFC]">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            {notice.message}
          </p>

          {notice.highlightNote && (
            <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-blue-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs font-semibold text-slate-800 leading-relaxed">
                {notice.highlightNote}
              </p>
            </div>
          )}

          {notice.couponCode && notice.couponCode.trim().length > 0 && (
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>স্পেশাল টেক কুপন কোড</span>
                </span>
                <p className="font-mono text-base font-black text-[#0B1120] tracking-widest mt-0.5">
                  {notice.couponCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!notice.couponCode) return;
                  navigator.clipboard.writeText(notice.couponCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2400);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#EFF6FF] hover:bg-[#2563EB] hover:text-white text-[#2563EB] border border-blue-200 hover:border-[#2563EB] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>কপি করুন</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => onAction(notice.ctaCategory)}
              className="flex-1 py-3 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
            >
              <span>{notice.ctaText || 'গ্যাজেট দেখুন'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
