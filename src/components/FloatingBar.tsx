import { Grid3x3, Home, Menu, ShoppingBag, User } from 'lucide-react';

interface FloatingBarProps {
  currentView: 'home' | 'shop';
  cartCount: number;
  onNavigateHome: () => void;
  onNavigateShop: () => void;
  onOpenMenu: () => void;
  onOpenCart: () => void;
  onOpenAccount: () => void;
}

export function FloatingBar({
  currentView,
  cartCount,
  onNavigateHome,
  onNavigateShop,
  onOpenMenu,
  onOpenCart,
  onOpenAccount,
}: FloatingBarProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_28px_-8px_rgba(15,23,42,0.12)] py-1.5 px-4">
      <div className="flex items-center justify-around relative">
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-[#2563EB] p-1 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Menu</span>
        </button>

        <button
          type="button"
          onClick={onNavigateShop}
          className={`flex flex-col items-center justify-center p-1 transition-colors cursor-pointer ${
            currentView === 'shop'
              ? 'text-[#2563EB]'
              : 'text-slate-500 hover:text-[#2563EB]'
          }`}
        >
          <Grid3x3 className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Shop</span>
        </button>

        <div className="relative -top-5">
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-13 h-13 rounded-full bg-gradient-to-br from-[#2563EB] to-[#0B1120] text-white flex items-center justify-center shadow-lg shadow-blue-950/30 border-4 border-white ring-1 ring-blue-400/40 active:scale-95 transition-all cursor-pointer"
            aria-label="Home"
          >
            <Home className="w-6 h-6" />
          </button>
          <span className="block text-[10px] font-black text-center text-[#0B1120] -mt-0.5">
            Home
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-[#2563EB] p-1 relative transition-colors cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#2563EB] text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5">Cart</span>
        </button>

        <button
          type="button"
          onClick={onOpenAccount}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-[#2563EB] p-1 transition-colors cursor-pointer"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Account</span>
        </button>
      </div>
    </div>
  );
}
