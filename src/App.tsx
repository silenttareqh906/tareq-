import { MouseEvent, useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Headphones,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  Wallet,
} from 'lucide-react';
import { AccountModal } from './components/AccountModal';
import { AIChatbotModal } from './components/AIChatbotModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { FeaturedCategories } from './components/FeaturedCategories';
import { FlashSaleSection } from './components/FlashSaleSection';
import { FloatingBar } from './components/FloatingBar';
import { Footer } from './components/Footer';
import { HeroBanner } from './components/HeroBanner';
import { Navbar } from './components/Navbar';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { PopupNoticeModal } from './components/PopupNoticeModal';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { ReviewsSlider } from './components/ReviewsSlider';
import { SidebarDrawer } from './components/SidebarDrawer';
import { storage } from './services/storage';
import type {
  CartItem,
  Category,
  Coupon,
  Order,
  Product,
  Review,
  StoreSettings,
  User,
} from './types';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('kynzo_cart_v1');
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [currentView, setCurrentView] = useState<'home' | 'shop'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high' | 'rating'>(
    'default'
  );
  const [featuredOffset, setFeaturedOffset] = useState(0);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const refreshData = () => {
    setProducts(storage.getProducts());
    setCategories(storage.getCategories());
    setOrders(storage.getOrders());
    setReviews(storage.getReviews());
    setCurrentUser(storage.getCurrentUser());
    setSettings(storage.getSettings());
    setCoupons(storage.getCoupons());
  };

  useEffect(() => {
    storage.init();
    refreshData();
    storage
      .fetchStore()
      .then(() => {
        refreshData();
      })
      .catch((err) => {
        console.warn('Could not sync initial store from server:', err);
      });
  }, []);

  useEffect(() => {
    if (!settings?.popupNotice?.enabled) return;
    try {
      if (sessionStorage.getItem('kynzo_popup_notice_seen_v1') === '1') return;
    } catch {
      // Ignore sessionStorage access restrictions
    }
    const timer = window.setTimeout(() => {
      setNoticeOpen(true);
    }, 550);
    return () => window.clearTimeout(timer);
  }, [settings?.popupNotice?.enabled]);

  const handleCloseNotice = () => {
    setNoticeOpen(false);
    try {
      sessionStorage.setItem('kynzo_popup_notice_seen_v1', '1');
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('kynzo_cart_v1', JSON.stringify(cart));
    } catch (err) {
      console.warn('Failed to save cart to localStorage', err);
    }
  }, [cart]);

  useEffect(() => {
    const onPageHide = () => {
      if (currentUser?.role === 'admin') {
        storage.logout();
        setCurrentUser(null);
      }
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [currentUser]);

  const handleLogout = () => {
    storage.logout();
    setCurrentUser(null);
    setAccountOpen(false);
    refreshData();
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = (
    product: Product,
    quantity = 1,
    weight?: string,
    e?: MouseEvent<HTMLButtonElement>
  ) => {
    e?.stopPropagation();
    const chosenWeight = weight || product.weights[0] || 'Standard';
    const multiplier = product.weightPriceMultipliers?.[chosenWeight] ?? 1;
    const finalPrice = Math.round(product.price * multiplier);
    const finalOriginal = Math.round(product.originalPrice * multiplier);

    setCart((prev) => {
      const idx = prev.findIndex(
        (it) => it.productId === product.id && it.weight === chosenWeight
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        return updated;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: finalPrice,
          originalPrice: finalOriginal,
          quantity,
          weight: chosenWeight,
          image: product.image,
        },
      ];
    });

    showToast(`"${product.name} (${chosenWeight})" কার্টে যুক্ত হয়েছে!`);
  };

  const handleUpdateQuantity = (productId: string, weight: string, nextQty: number) => {
    if (nextQty <= 0) {
      handleRemoveItem(productId, weight);
      return;
    }
    setCart((prev) =>
      prev.map((it) =>
        it.productId === productId && it.weight === weight
          ? { ...it, quantity: nextQty }
          : it
      )
    );
  };

  const handleRemoveItem = (productId: string, weight: string) => {
    setCart((prev) =>
      prev.filter((it) => it.productId !== productId || it.weight !== weight)
    );
  };

  const handleBuyNow = (product: Product, quantity: number, weight: string) => {
    handleAddToCart(product, quantity, weight);
    setSelectedProduct(null);
    setCheckoutOpen(true);
  };

  const handleCreateOrder = async (
    orderInput: Omit<
      Order,
      'id' | 'date' | 'status' | 'courierPartner' | 'trackingCode' | 'timeline'
    >
  ) => {
    const created = await storage.createOrder(orderInput);
    setCart([]);
    refreshData();
    return created;
  };

  const handleAddReview = async (reviewInput: Omit<Review, 'id' | 'date'>) => {
    await storage.addReview(reviewInput);
    refreshData();
    showToast('আপনার মূল্যবান রিভিউ সফলভাবে গৃহীত হয়েছে!');
  };

  const filteredProducts = products
    .filter((p) => {
      const catMatch = !selectedCategory || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const searchMatch =
        q.length > 0
          ? p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.shortDesc.toLowerCase().includes(q)
          : true;
      return catMatch && searchMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  const featuredWindow =
    products.length > 0
      ? Array.from(
          { length: Math.min(10, products.length) },
          (_, i) => products[(featuredOffset + i) % products.length]
        )
      : [];

  const cartCount = cart.reduce((sum, it) => sum + it.quantity, 0);
  const hotline = settings?.hotline || '01994618066';
  const whatsapp = settings?.whatsapp || '8801994618066';

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-[#F8FAFC] text-[#0F172A] selection:bg-[#2563EB] selection:text-white">
      {settings?.announcement && (
        <div className="bg-[#0B1120] text-[#38BDF8] text-[11px] sm:text-xs font-semibold text-center py-1.5 px-4 border-b border-slate-800">
          {settings.announcement}
        </div>
      )}

      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-[#0B1120] text-white px-4 py-3 rounded-xl shadow-[0_14px_34px_-10px_rgba(11,17,32,0.55)] flex items-center gap-2.5 text-xs font-bold border border-blue-500/40">
          <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span>{toast}</span>
        </div>
      )}

      <Navbar
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenTracking={() => {
          setTrackingOrderId('');
          setTrackingOpen(true);
        }}
        onOpenNotice={() => setNoticeOpen(true)}
        hasNotice={Boolean(settings?.popupNotice?.enabled)}
        currentUser={currentUser}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          if (cat) setCurrentView('shop');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        products={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
        onNavigateHome={() => {
          setCurrentView('home');
          setSelectedCategory(null);
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateShop={() => {
          setCurrentView('shop');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        hotline={hotline}
      />

      <main className="flex-1 pb-16">
        {currentView === 'home' ? (
          <div className="space-y-6 sm:space-y-8">
            <HeroBanner
              slides={settings?.heroSlides}
              onShopNow={() => setCurrentView('shop')}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setCurrentView('shop');
              }}
            />

            <FeaturedCategories
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                if (cat) setCurrentView('shop');
              }}
            />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] font-display tracking-tight">
                    Featured Tech & Gadgets
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    স্মার্টওয়াচ, ANC অডিও, GaN চার্জিং, গেমিং ও ক্রিয়েটর গিয়ারের সেরা কালেকশন
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentView('shop')}
                    className="hidden sm:inline-flex text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] items-center gap-1 mr-2 cursor-pointer transition-colors"
                  >
                    <span>সব গ্যাজেট দেখুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFeaturedOffset(
                        (prev) =>
                          (prev - 1 + Math.max(1, products.length)) %
                          Math.max(1, products.length)
                      )
                    }
                    className="w-8 h-8 rounded-md bg-white hover:bg-[#EFF6FF] text-[#0F172A] border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Previous featured gadgets"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFeaturedOffset((prev) => (prev + 1) % Math.max(1, products.length))
                    }
                    className="w-8 h-8 rounded-md bg-white hover:bg-[#EFF6FF] text-[#0F172A] border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Next featured gadgets"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {featuredWindow.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onSelect={(p) => setSelectedProduct(p)}
                    onAddToCart={(p, e) => handleAddToCart(p, 1, undefined, e)}
                  />
                ))}
              </div>
            </section>

            <FlashSaleSection
              products={products}
              coupons={coupons}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onAddToCart={(p, e) => handleAddToCart(p, 1, undefined, e)}
              onNavigateShop={() => setCurrentView('shop')}
            />

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0B1120] via-[#131C31] to-[#1E293B] border border-slate-800 shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
                <div>
                  <span className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-0.5">
                    Wearables & Acoustic Audio
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold font-display">
                    স্মার্টওয়াচ ও প্রো ANC অডিও কালেকশন
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                    টাইটানিয়াম AMOLED স্মার্টওয়াচ, ৪৮dB হাইব্রিড ANC ইয়ারবাডস ও স্টুডিও হেডফোন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Audio & Earbuds');
                    setCurrentView('shop');
                  }}
                  className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-colors self-start sm:self-center cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
                >
                  Watch & Audio
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {products
                  .filter(
                    (p) =>
                      p.category === 'Smartwatches' ||
                      p.category === 'Audio & Earbuds'
                  )
                  .slice(0, 5)
                  .map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onSelect={(p) => setSelectedProduct(p)}
                      onAddToCart={(p, e) => handleAddToCart(p, 1, undefined, e)}
                    />
                  ))}
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#EFF6FF] via-white to-[#F1F5F9] border border-blue-200/70 shadow-2xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block mb-0.5">
                    Power, Gaming & Creator Setup
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A] font-display">
                    GaN পাওয়ার, মেকানিক্যাল কিবোর্ড ও ক্রিয়েটর গিয়ার
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                    ম্যাগসেফ পাওয়ারব্যাংক, ৬৫W GaN চার্জার, ওয়্যারলেস মেকানিক্যাল কিবোর্ড, ৩-অ্যাক্সিস গিম্বল ও স্মার্ট ডেস্ক সেটআপ।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('PC & Gaming Gear');
                    setCurrentView('shop');
                  }}
                  className="px-5 py-2.5 rounded-lg bg-[#0B1120] hover:bg-[#2563EB] text-white font-bold text-xs transition-colors self-start sm:self-center cursor-pointer shrink-0 shadow-2xs whitespace-nowrap"
                >
                  Setup & Gear
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {products
                  .filter(
                    (p) =>
                      p.category === 'Power & Charging' ||
                      p.category === 'PC & Gaming Gear' ||
                      p.category === 'Camera & Creators' ||
                      p.category === 'Smart Home & Setup'
                  )
                  .slice(0, 5)
                  .map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onSelect={(p) => setSelectedProduct(p)}
                      onAddToCart={(p, e) => handleAddToCart(p, 1, undefined, e)}
                    />
                  ))}
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-[0_8px_28px_-14px_rgba(15,23,42,0.1)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-blue-200/70 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">ফাস্ট হোম ডেলিভারি</h4>
                    <p className="text-[11px] text-slate-500">
                      ঢাকায় ২৪-৪৮ ঘণ্টা, সারাদেশে ২-৩ দিন
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-blue-200/70 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">১০০% অরিজিনাল গ্যাজেট</h4>
                    <p className="text-[11px] text-slate-500">
                      ১ বছরের অফিসিয়াল ওয়ারেন্টি ও QC ভেরিফাইড
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-blue-200/70 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">ক্যাশ অন ডেলিভারি</h4>
                    <p className="text-[11px] text-slate-500">গ্যাজেট হাতে পেয়ে মূল্য পরিশোধ</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-blue-200/70 flex items-center justify-center shrink-0">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">
                      ২৪/৭ টেক সাপোর্ট
                    </h4>
                    <p className="text-[11px] text-slate-500">লাইভ হেল্পলাইন ও এক্সপার্ট পরামর্শ</p>
                  </div>
                </div>
              </div>
            </section>

            <ReviewsSlider reviews={reviews} onAddReview={handleAddReview} />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h1 className="text-2xl font-black text-[#0F172A] font-display">
                  {selectedCategory || 'All Gadgets & Tech Gear'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                  মোট {filteredProducts.length} টি গ্যাজেট পাওয়া গেছে
                </p>
              </div>

              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as 'default' | 'price_low' | 'price_high' | 'rating'
                    )
                  }
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-[#0F172A] outline-none"
                >
                  <option value="default">Default Sorting</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  selectedCategory === null
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-white hover:bg-[#EFF6FF] text-[#0F172A] border border-slate-200'
                }`}
              >
                All Gadgets
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    selectedCategory === cat.name
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-white hover:bg-[#EFF6FF] text-[#0F172A] border border-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8">
                <p className="text-base font-bold text-[#0F172A]">কোনো গ্যাজেট খুঁজে পাওয়া যায়নি</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  আপনার অনুসন্ধান অনুযায়ী কোনো গ্যাজেট মেলেনি। ভিন্ন নাম দিয়ে চেষ্টা করুন অথবা
                  ফিল্টার রিসেট করুন।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                  className="mt-4 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  সকল গ্যাজেট দেখুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onSelect={(p) => setSelectedProduct(p)}
                    onAddToCart={(p, e) => handleAddToCart(p, 1, undefined, e)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {settings && (
        <Footer
          settings={settings}
          onOpenTracking={() => {
            setTrackingOrderId('');
            setTrackingOpen(true);
          }}
          onOpenAccount={() => setAccountOpen(true)}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setCurrentView('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      <FloatingBar
        currentView={currentView}
        cartCount={cartCount}
        onNavigateHome={() => {
          setCurrentView('home');
          setSelectedCategory(null);
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateShop={() => {
          setCurrentView('shop');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenCart={() => setCartOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
      />

      <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-center gap-2.5 pointer-events-auto">
        <a
          href={`tel:${hotline}`}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0B1120] hover:bg-[#1E293B] text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all group relative border border-blue-500/40"
          aria-label="Call For Order"
          title="Call For Order"
        >
          <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-[#38BDF8] group-hover:rotate-12 transition-transform" />
          <span className="hidden group-hover:block absolute right-14 bg-[#0B1120] text-white text-[11px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap shadow-md">
            Call For Order
          </span>
        </a>

        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
            'হ্যালো KYNZO Tech, আমি গ্যাজেট সম্পর্কে জানতে চাই'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all group relative border border-white/40"
          aria-label="WhatsApp Support"
          title="WhatsApp Support"
        >
          <MessageCircle className="w-5 h-5 fill-current" />
          <span className="hidden group-hover:block absolute right-14 bg-[#0B1120] text-white text-[11px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap shadow-md">
            WhatsApp Support
          </span>
        </a>

        <button
          type="button"
          onClick={() => setChatbotOpen(!chatbotOpen)}
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-[#2563EB] to-[#0B1120] text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all group relative border-2 border-[#38BDF8]/60 cursor-pointer"
          aria-label="KYNZO Tech AI Support"
          title="KYNZO Tech AI Support"
        >
          <Bot className="w-6 h-6 text-[#38BDF8]" />
          <span className="hidden group-hover:block absolute right-15 bg-[#0B1120] text-white text-[11px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap shadow-md">
            KYNZO Tech Chat
          </span>
        </button>
      </div>

      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, q, w) => handleAddToCart(p, q, w)}
        onBuyNow={handleBuyNow}
        allProducts={products}
        reviews={reviews}
        onSelectProduct={(p) => setSelectedProduct(p)}
        hotline={hotline}
        whatsapp={whatsapp}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      {settings && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          items={cart}
          currentUser={currentUser}
          onOrderSuccess={() => showToast('অর্ডার সফলভাবে সম্পন্ন হয়েছে!')}
          createOrder={handleCreateOrder}
          settings={settings}
          products={products}
        />
      )}

      <OrderTrackingModal
        isOpen={trackingOpen}
        onClose={() => setTrackingOpen(false)}
        orders={orders}
        initialOrderId={trackingOrderId}
      />

      <AccountModal
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => {
          setCurrentUser(user);
          refreshData();
        }}
        onLogout={handleLogout}
        orders={orders}
        products={products}
        categories={categories}
        reviews={reviews}
        onRefreshData={refreshData}
        onTrackOrder={(orderId) => {
          setTrackingOrderId(orderId);
          setTrackingOpen(true);
        }}
      />

      <SidebarDrawer
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setCurrentView('shop');
        }}
        currentUser={currentUser}
        onOpenAccount={() => setAccountOpen(true)}
        onOpenTracking={() => {
          setTrackingOrderId('');
          setTrackingOpen(true);
        }}
        onNavigateHome={() => {
          setCurrentView('home');
          setSelectedCategory(null);
          setSearchQuery('');
        }}
        onNavigateShop={() => setCurrentView('shop')}
        hotline={hotline}
      />

      <PopupNoticeModal
        isOpen={noticeOpen}
        notice={settings?.popupNotice}
        onClose={handleCloseNotice}
        onAction={(cat) => {
          handleCloseNotice();
          if (cat) setSelectedCategory(cat);
          setCurrentView('shop');
        }}
      />

      <AIChatbotModal
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        hotline={hotline}
        whatsapp={whatsapp}
      />
    </div>
  );
}
