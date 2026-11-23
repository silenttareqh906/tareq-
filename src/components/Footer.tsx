import { ArrowRight, Mail, MapPin, PhoneCall } from 'lucide-react';
import type { StoreSettings } from '../types';
import { sanitizeExternalUrl } from '../utils/urlSafety';
import { KynzoLogo } from './KynzoLogo';

interface FooterProps {
  settings: StoreSettings;
  onOpenTracking: () => void;
  onOpenAccount: () => void;
  onSelectCategory: (cat: string | null) => void;
}

export function Footer({
  settings,
  onOpenTracking,
  onOpenAccount,
  onSelectCategory,
}: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-200 pt-12 pb-24 sm:pb-10 text-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-200">
          <div className="space-y-4">
            <KynzoLogo size="md" />
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              বিশ্বস্ততা, অফিসিয়াল ওয়ারেন্টি ও প্রিমিয়াম গ্যাজেটের নির্ভরযোগ্য ঠিকানা KYNZO।
              স্মার্টওয়াচ, ANC অডিও, পিসি গিয়ার ও পাওয়ার সলিউশন — সব এক ছাদের নিচে।
            </p>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#2563EB] shrink-0" />
                <a
                  href={`tel:${settings.hotline}`}
                  className="font-semibold hover:text-[#2563EB] transition-colors"
                >
                  {settings.hotline}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#2563EB] shrink-0" />
                <a
                  href={`mailto:${settings.email}`}
                  className="hover:text-[#2563EB] transition-colors"
                >
                  {settings.email}
                </a>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wider font-display text-slate-900 mb-4">
              Customer Service
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={onOpenTracking}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600/60" />
                  <span>Live Order Tracking (অর্ডার ট্র্যাক)</span>
                </button>
              </li>
              <li>
                <a
                  href="#flash-deals"
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600/60" />
                  <span>Tech Flash Deals &amp; Coupons</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600/60" />
                  <span>WhatsApp Tech Support</span>
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory(null)}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600/60" />
                  <span>All Gadgets Catalog</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wider font-display text-slate-900 mb-4">
              Gadget Categories
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory('Smartwatches')}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600/60" />
                  <span>Smartwatches (স্মার্টওয়াচ)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory('Audio & Earbuds')}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600/60" />
                  <span>Audio &amp; Earbuds (ইয়ারবাডস ও হেডফোন)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory('Power & Charging')}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600/60" />
                  <span>Power &amp; Charging (পাওয়ার ব্যাংক)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory('PC & Gaming Gear')}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600/60" />
                  <span>PC &amp; Gaming Gear (কিবোর্ড ও মাউস)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenAccount}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3 text-blue-600/60" />
                  <span>My Account (আমার অ্যাকাউন্ট)</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-extrabold text-sm uppercase tracking-wider font-display text-slate-900">
              Follow Us
            </h4>
            <p className="text-xs text-slate-500">
              Stay connected with KYNZO for flagship gadget drops, tech reviews, and launch discounts:
            </p>
            <div className="flex items-center gap-2.5">
              <a
                href={sanitizeExternalUrl(settings.socialLinks?.facebook, 'https://facebook.com')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#2563EB] hover:text-white text-slate-800 border border-slate-200 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={sanitizeExternalUrl(settings.socialLinks?.instagram, 'https://instagram.com')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#2563EB] hover:text-white text-slate-800 border border-slate-200 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href={sanitizeExternalUrl(settings.socialLinks?.youtube, 'https://youtube.com')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#2563EB] hover:text-white text-slate-800 border border-slate-200 flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href={sanitizeExternalUrl(settings.socialLinks?.twitter, 'https://x.com')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#2563EB] hover:text-white text-slate-800 border border-slate-200 flex items-center justify-center transition-colors"
                aria-label="X"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="py-7 grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-slate-200">
          <div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3 font-display">
              We Accept (পেমেন্ট পার্টনার্স):
            </span>
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-extrabold">
              <div className="px-3 py-1.5 bg-[#E2136E]/10 border border-[#E2136E]/30 text-[#E2136E] rounded-lg">
                bKash (বিকাশ)
              </div>
              <div className="px-3 py-1.5 bg-[#F7941D]/10 border border-[#F7941D]/30 text-[#D97706] rounded-lg">
                Nagad (নগদ)
              </div>
              <div className="px-3 py-1.5 bg-[#EFF6FF] border border-blue-200 text-[#1D4ED8] rounded-lg">
                Cash On Delivery (ক্যাশ অন ডেলিভারি)
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3 font-display">
              Our Delivery Partners (কুরিয়ার পার্টনার্স):
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 font-black text-[11px] rounded-lg tracking-tight">
                PATHAO
              </div>
              <div className="px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-700 font-black text-[11px] rounded-lg tracking-tight">
                STEADFAST
              </div>
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 font-black text-[11px] rounded-lg tracking-tight">
                REDX
              </div>
              <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 font-bold text-[11px] rounded-lg tracking-tight">
                eCourier
              </div>
              <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 font-bold text-[11px] rounded-lg tracking-tight">
                Paperfly
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 text-center sm:text-left">
          <p>© 2026 KYNZO Tech. All rights reserved.</p>
          <p className="text-[11px] text-[#2563EB] font-semibold">
            Smart · Authentic · Tech &amp; Gadgets Store
          </p>
        </div>
      </div>
    </footer>
  );
}
