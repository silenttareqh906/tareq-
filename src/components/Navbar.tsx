import { FormEvent, useState } from 'react';
import {
  Bell,
  Menu,
  PhoneCall,
  Search,
  ShoppingBag,
  Truck,
  User as UserIcon,
  X,
} from 'lucide-react';
import type { Category, Product, User } from '../types';
import { KynzoLogo } from './KynzoLogo';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenMenu: () => void;
  onOpenTracking: () => void;
  onOpenNotice?: () => void;
  hasNotice?: boolean;
  currentUser: User | null;
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  products: Product[];
  onSelectProduct: (p: Product) => void;
  onNavigateHome: () => void;
  onNavigateShop: () => void;
  hotline?: string;
}

export function Navbar({
  cartCount,
  onOpenCart,
  onOpenAccount,
  onOpenMenu,
  onOpenTracking,
  onOpenNotice,
  hasNotice = false,
  currentUser,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  products,
  onSelectProduct,
  onNavigateHome,
  onNavigateShop,
  hotline = '01994618066',
}: NavbarProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const searchResults =
    searchQuery.trim().length > 1
      ? products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.shortDesc.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 6)
      : [];

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      onNavigateShop();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_16px_-6px_rgba(15,23,42,0.08)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[74px] gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenMenu}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-900 hover:text-[#2563EB] hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open menu drawer"
            >
              <Menu className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={onNavigateHome}
              className="group cursor-pointer text-left shrink-0"
              title="KYNZO Tech Home"
            >
              <KynzoLogo size="md" />
            </button>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-4 relative">
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full shadow-[0_1px_4px_rgba(15,23,42,0.05)] rounded-lg"
            >
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search Gadgets... (Smartwatch, ANC Earbuds, GaN Charger, Keyboard)"
                  className="w-full bg-[#F8FAFC] focus:bg-white border border-r-0 border-slate-300 focus:border-[#2563EB] text-slate-900 text-sm rounded-l-lg pl-4 pr-9 py-2.5 outline-none transition-colors placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 p-1 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-[#0B1120] hover:bg-[#2563EB] text-white px-5 rounded-r-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-[#0B1120] hover:border-[#2563EB]"
                aria-label="Search Gadgets"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/80">
                  <span>ফলাফল ({searchResults.length})</span>
                  <button
                    type="button"
                    className="text-[#2563EB] hover:underline font-bold cursor-pointer"
                    onClick={onNavigateShop}
                  >
                    সবগুলো দেখুন
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProduct(p);
                        onSearchChange('');
                      }}
                      className="p-3 flex items-center gap-3 hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.category} · {p.weights[0]}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold text-[#2563EB] tabular-nums">
                          ৳{p.price}
                        </span>
                        {p.originalPrice > p.price && (
                          <span className="block text-xs line-through text-slate-400 tabular-nums">
                            ৳{p.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 rounded-lg text-slate-900 hover:text-[#2563EB] hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle mobile search"
            >
              <Search className="w-5 h-5" />
            </button>

            {hasNotice && onOpenNotice && (
              <button
                type="button"
                onClick={onOpenNotice}
                className="relative flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#2563EB] hover:text-white border border-blue-200 p-2 sm:px-2.5 sm:py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="স্টোর নোটিশ দেখুন"
                aria-label="স্টোর নোটিশ দেখুন"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden xl:inline">নোটিশ</span>
              </button>
            )}

            <a
              href={`tel:${hotline}`}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-[#2563EB] px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
              title="Call For Order"
            >
              <PhoneCall className="w-4 h-4 text-[#2563EB]" />
              <span>Call For Order</span>
            </a>

            <button
              type="button"
              onClick={onOpenAccount}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-[#2563EB] p-2 sm:px-2.5 sm:py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Account"
            >
              <UserIcon className="w-5 h-5 text-[#2563EB]" />
              <span className="hidden xl:inline">
                {currentUser ? currentUser.name.split(' ')[0] : 'একাউন্ট'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2 rounded-lg text-slate-900 hover:text-[#2563EB] hover:bg-slate-100 transition-all cursor-pointer group shrink-0"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag className="w-6 h-6 group-hover:scale-105 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 bg-[#2563EB] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center ring-2 ring-white tabular-nums">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <form onSubmit={handleSearchSubmit} className="flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search Gadgets..."
                  className="w-full bg-white border border-r-0 border-slate-300 focus:border-[#2563EB] text-slate-900 text-sm rounded-l-lg pl-3.5 pr-8 py-2.5 outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 p-1"
                    aria-label="Clear mobile search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-[#0B1120] text-white px-4 rounded-r-lg flex items-center justify-center"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="bg-[#0B1120] text-white hidden lg:block border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11 gap-4">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[13px] font-medium">
              <button
                type="button"
                onClick={onNavigateHome}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === null
                    ? 'bg-[#2563EB] font-semibold text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Home
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.name);
                    onNavigateShop();
                  }}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCategory === cat.name
                      ? 'bg-[#2563EB] font-semibold text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat.name}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  onSelectCategory(null);
                  onNavigateShop();
                }}
                className="px-3 py-1.5 rounded-md text-[#38BDF8] hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer font-semibold"
              >
                All Gadgets
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenTracking}
                className="flex items-center gap-1.5 bg-[#2563EB]/20 hover:bg-[#2563EB] border border-[#38BDF8]/40 px-3 py-1.5 rounded-md text-xs font-bold tracking-wide transition-colors cursor-pointer whitespace-nowrap text-[#E0F2FE] hover:text-white"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>TRACK ORDER</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
