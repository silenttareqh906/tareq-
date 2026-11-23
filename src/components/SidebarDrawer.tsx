import {
  ChevronRight,
  Home,
  LogIn,
  PhoneCall,
  ShoppingBag,
  Truck,
  User as UserIcon,
  X,
} from 'lucide-react';
import type { Category, User } from '../types';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  currentUser: User | null;
  onOpenAccount: () => void;
  onOpenTracking: () => void;
  onNavigateHome: () => void;
  onNavigateShop: () => void;
  hotline?: string;
}

export function SidebarDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
  currentUser,
  onOpenAccount,
  onOpenTracking,
  onNavigateHome,
  onNavigateShop,
  hotline = '01994618066',
}: SidebarDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pr-10">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col justify-between">
          <div>
            <div className="bg-gradient-to-r from-[#0B1120] to-[#1E293B] text-white p-5 flex items-center justify-between">
              <div
                onClick={() => {
                  onClose();
                  onOpenAccount();
                }}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-full bg-white/10 border border-[#38BDF8]/35 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                  <UserIcon className="w-6 h-6 text-[#38BDF8]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    {currentUser ? `Hello, ${currentUser.name.split(' ')[0]}!` : 'Hello there!'}
                  </h3>
                  <span className="text-xs text-slate-300 hover:underline">
                    {currentUser ? 'View My Account' : 'Sign In / Register'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto max-h-[60vh] space-y-0.5 divide-y divide-slate-100 text-xs sm:text-sm font-semibold text-slate-700">
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateHome();
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#EFF6FF] hover:text-[#2563EB] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Home className="w-4 h-4 text-slate-400" />
                    Home
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onNavigateShop();
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#EFF6FF] hover:text-[#2563EB] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                    Shop All Gadgets
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenTracking();
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#EFF6FF] hover:text-[#2563EB] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-[#2563EB]" />
                    Track Order
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              <div className="py-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block mb-1">
                  Gadget Categories
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.name);
                      onClose();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      selectedCategory === cat.name
                        ? 'bg-[#EFF6FF] text-[#2563EB] font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {cat.itemCount}+
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
            <a
              href={`tel:${hotline}`}
              className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700 hover:text-[#2563EB] py-2 transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-[#2563EB]" />
              <span>Call For Order</span>
            </a>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAccount();
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{currentUser ? 'My Account' : 'Login / Sign Up'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
