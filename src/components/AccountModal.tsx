import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Database,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  KeyRound,
  Layers,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  Truck,
  Upload,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { ASSETS } from '../data/assets';
import { AdminUserRow, storage } from '../services/storage';
import { sanitizeImageUrl } from '../utils/urlSafety';
import type {
  Category,
  Coupon,
  Order,
  OrderStatus,
  Product,
  Review,
  StoreSettings,
  User,
} from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  orders: Order[];
  products: Product[];
  categories: Category[];
  reviews: Review[];
  onRefreshData: () => void;
  onTrackOrder: (orderId: string) => void;
}

type AdminTab =
  | 'profile'
  | 'addresses'
  | 'orders'
  | 'admin_orders'
  | 'admin_users'
  | 'admin_inventory'
  | 'admin_content'
  | 'admin_coupons'
  | 'admin_reviews'
  | 'admin_settings'
  | 'admin_backup';

export function AccountModal({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  orders,
  products,
  categories,
  onRefreshData,
  onTrackOrder,
}: AccountModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showOwnerActivate, setShowOwnerActivate] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regDistrict, setRegDistrict] = useState('Dhaka');
  const [showPassword, setShowPassword] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // First-run owner admin activation fields (inside Sign In until claimed or set via Secrets)
  const [claimName, setClaimName] = useState('KYNZO Store Admin');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [claimConfirmPassword, setClaimConfirmPassword] = useState('');

  const [otpPending, setOtpPending] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [pendingRegData, setPendingRegData] = useState<{
    name: string;
    phone: string;
    email?: string;
    password: string;
    address: string;
    district: string;
  } | null>(null);

  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('profile');
  const [canClaimAdmin, setCanClaimAdmin] = useState(false);

  // Admin Orders controls
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [trackingEdits, setTrackingEdits] = useState<Record<string, string>>({});

  // Admin Users controls
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserAddress, setEditUserAddress] = useState('');
  const [editUserDistrict, setEditUserDistrict] = useState('Dhaka');
  const [editUserRole, setEditUserRole] = useState<'admin' | 'customer'>('customer');

  // Admin inventory states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState(categories[0]?.name || 'Smartwatches');
  const [prodPrice, setProdPrice] = useState(2490);
  const [prodOriginalPrice, setProdOriginalPrice] = useState(3200);
  const [prodStock, setProdStock] = useState(50);
  const [prodImage, setProdImage] = useState<string>(ASSETS.productSmartwatch);
  const [prodWeights, setProdWeights] = useState('Space Black, Silver Titanium');
  const [prodShortDesc, setProdShortDesc] = useState('');
  const [prodCodAvailable, setProdCodAvailable] = useState(true);
  const [prodFlashSale, setProdFlashSale] = useState(false);

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState<string>(ASSETS.productSmartwatch);

  // Settings & popup notice state
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() =>
    storage.getSettings()
  );
  const [savedNotice, setSavedNotice] = useState('');

  // Coupon form state
  const [coupons, setCoupons] = useState<Coupon[]>(() => storage.getCoupons());
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'fixed' | 'percentage'>('fixed');
  const [couponValue, setCouponValue] = useState(100);
  const [couponMinAmount, setCouponMinAmount] = useState(1000);
  const [couponDesc, setCouponDesc] = useState('');

  // Review form state
  const [adminReviews, setAdminReviews] = useState<Review[]>(() => storage.getReviews());
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [revName, setRevName] = useState('');
  const [revLocation, setRevLocation] = useState('ঢাকা');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revDate, setRevDate] = useState('আজকে');
  const [revVerified, setRevVerified] = useState(true);
  const [revProductId, setRevProductId] = useState('');

  // Customer profile edit state
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profileAddress, setProfileAddress] = useState(currentUser?.address || '');
  const [profileDistrict, setProfileDistrict] = useState(currentUser?.district || 'Dhaka');
  const [profileMessage, setProfileMessage] = useState('');

  // Delete confirm & backup state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'product' | 'order' | 'category' | 'coupon' | 'review' | 'user';
    id: string;
    title: string;
  } | null>(null);
  const [backupMessage, setBackupMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStoreSettings(storage.getSettings());
      setCoupons(storage.getCoupons());
      setAdminReviews(storage.getReviews());
      setCanClaimAdmin(storage.getAdminSetupState().canClaimAdmin);
      setBackupMessage('');
      setProfileMessage('');
      setAuthError('');
      setAuthSuccess('');

      if (currentUser) {
        setProfileName(currentUser.name || '');
        setProfilePhone(currentUser.phone || '');
        setProfileEmail(currentUser.email || '');
        setProfileAddress(currentUser.address || '');
        setProfileDistrict(currentUser.district || 'Dhaka');
        setActiveTab(currentUser.role === 'admin' ? 'admin_orders' : 'profile');
        if (currentUser.role === 'admin') {
          storage
            .fetchAdminDashboard()
            .then(() => {
              setStoreSettings(storage.getSettings());
              setCoupons(storage.getCoupons());
              setAdminReviews(storage.getReviews());
              onRefreshData();
            })
            .catch(() => {});
        } else {
          storage
            .fetchMyOrders()
            .then(() => onRefreshData())
            .catch(() => {});
        }
      } else {
        setIdentifier('');
        setPassword('');
        setConfirmPassword('');
        setShowOwnerActivate(false);
        setActiveTab('profile');
      }
    } else {
      setIdentifier('');
      setPassword('');
      setConfirmPassword('');
      setAuthError('');
      setAuthSuccess('');
      setOtpPending(false);
      setOtpInput('');
      setShowOwnerActivate(false);
      setDeleteTarget(null);
      setEditingUser(null);
      setActiveTab('profile');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';
  const usersList = storage.getUsers();
  const customerOrders = orders;

  const showToastNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(''), 2800);
  };

  const handleImageFile = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowedMime.includes(file.type)) {
      showToastNotice('শুধুমাত্র PNG, JPG, WEBP বা GIF ছবি আপলোড করা যাবে।');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToastNotice('ছবির সাইজ সর্বোচ্চ ২ মেগাবাইট (2MB) হতে পারবে।');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        const safe = sanitizeImageUrl(result, '');
        if (safe) {
          setter(safe);
        } else {
          showToastNotice('অবৈধ ছবির ফরম্যাট বাতিল করা হয়েছে।');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!identifier.trim() || !password.trim()) {
      setAuthError('মোবাইল নম্বর / Gmail এবং পাসওয়ার্ড দিন।');
      return;
    }
    setAuthSubmitting(true);
    const result = await storage.login(identifier.trim(), password);
    setAuthSubmitting(false);
    if (result.success && result.user) {
      onLogin(result.user);
      setAuthSuccess('সফলভাবে সাইন ইন হয়েছে!');
      if (result.user.role === 'admin') {
        setActiveTab('admin_orders');
      }
    } else {
      setAuthError(result.message || 'ভুল মোবাইল নম্বর / Gmail অথবা পাসওয়ার্ড।');
    }
  };

  const handleRegisterStep1 = (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!fullName.trim() || (!regPhone.trim() && !regEmail.trim()) || !password.trim()) {
      setAuthError('নাম, পাসওয়ার্ড এবং মোবাইল নম্বর অথবা Gmail অন্তত একটি দিন।');
      return;
    }
    if (password.length < 6) {
      setAuthError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('উভয় পাসওয়ার্ড একই হতে হবে।');
      return;
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otp);
    setPendingRegData({
      name: fullName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim() || undefined,
      password: password,
      address: regAddress.trim(),
      district: regDistrict,
    });
    setOtpPending(true);
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!pendingRegData) return;
    if (otpInput.trim() !== generatedOtp) {
      setAuthError('ভুল ওটিপি কোড। অনুগ্রহ করে সঠিক ৪ ডিজিটের কোড দিন।');
      return;
    }
    setAuthSubmitting(true);
    const result = await storage.register(pendingRegData);
    setAuthSubmitting(false);
    if (result.success && result.user) {
      onLogin(result.user);
      setOtpPending(false);
      setAuthSuccess('আপনার অ্যাকাউন্ট স্থায়ীভাবে সংরক্ষিত ও তৈরি হয়েছে!');
    } else {
      setAuthError(result.message || 'নিবন্ধন ব্যর্থ হয়েছে।');
    }
  };

  const handleClaimAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!claimEmail.trim() || !claimPassword.trim()) {
      setAuthError('Admin Gmail এবং Password দিন।');
      return;
    }
    if (claimPassword.length < 8) {
      setAuthError('অ্যাডমিন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।');
      return;
    }
    if (claimPassword !== claimConfirmPassword) {
      setAuthError('উভয় পাসওয়ার্ড একই হতে হবে।');
      return;
    }
    setAuthSubmitting(true);
    const result = await storage.claimAdmin({
      name: claimName.trim() || 'KYNZO Store Admin',
      email: claimEmail.trim(),
      password: claimPassword,
    });
    setAuthSubmitting(false);
    if (result.success && result.user) {
      setCanClaimAdmin(false);
      setShowOwnerActivate(false);
      onLogin(result.user);
      setActiveTab('admin_orders');
      setAuthSuccess('অ্যাডমিন অ্যাকাউন্ট সফলভাবে সেটআপ হয়েছে!');
    } else {
      setAuthError(result.message || 'অ্যাডমিন সেটআপ ব্যর্থ হয়েছে।');
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileMessage('');
    const result = await storage.updateProfile({
      name: profileName.trim(),
      phone: profilePhone.trim(),
      email: profileEmail.trim(),
      address: profileAddress.trim(),
      district: profileDistrict.trim(),
    });
    if (result.success && result.user) {
      onLogin(result.user);
      setProfileMessage('আপনার অ্যাকাউন্ট তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
      setTimeout(() => setProfileMessage(''), 3000);
    } else {
      setProfileMessage(result.message || 'আপডেট ব্যর্থ হয়েছে।');
    }
  };

  const handleOrderPatch = async (
    orderId: string,
    patch: {
      status?: OrderStatus;
      paymentStatus?: string;
      courierPartner?: string;
      trackingCode?: string;
    }
  ) => {
    try {
      await storage.updateOrderStatus(orderId, patch);
      onRefreshData();
      showToastNotice(`অর্ডার ${orderId} আপডেট হয়েছে!`);
    } catch (err) {
      showToastNotice(err instanceof Error ? err.message : 'আপডেট ব্যর্থ হয়েছে।');
    }
  };

  const openNewProductForm = () => {
    setEditingProdId(null);
    setProdName('');
    setProdCategory(categories[0]?.name || 'Smartwatches');
    setProdPrice(2490);
    setProdOriginalPrice(3200);
    setProdStock(50);
    setProdImage(ASSETS.productSmartwatch);
    setProdWeights('Space Black, Silver Titanium');
    setProdShortDesc('');
    setProdCodAvailable(true);
    setProdFlashSale(false);
    setShowProductForm(true);
  };

  const openEditProductForm = (p: Product) => {
    setEditingProdId(p.id);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdPrice(p.price);
    setProdOriginalPrice(p.originalPrice);
    setProdStock(p.stockQuantity);
    setProdImage(p.image);
    setProdWeights(p.weights.join(', '));
    setProdShortDesc(p.shortDesc);
    setProdCodAvailable(p.isCodAvailable !== false);
    setProdFlashSale(Boolean(p.isFlashSale));
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    const weightsArr = prodWeights
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);
    const finalWeights = weightsArr.length > 0 ? weightsArr : ['Standard'];
    const discountPct =
      prodOriginalPrice > prodPrice
        ? Math.round(((prodOriginalPrice - prodPrice) / prodOriginalPrice) * 100)
        : 0;

    const existing = editingProdId
      ? products.find((p) => p.id === editingProdId)
      : undefined;

    await storage.saveProduct({
      id: editingProdId || `prod-${Date.now()}`,
      name: prodName.trim(),
      category: prodCategory,
      price: Number(prodPrice),
      originalPrice: Number(prodOriginalPrice),
      discountPercent: discountPct,
      isBestSelling: existing?.isBestSelling ?? true,
      isFlashSale: prodFlashSale,
      inStock: Number(prodStock) > 0,
      stockQuantity: Number(prodStock),
      image: prodImage || ASSETS.productSmartwatch,
      gallery: [prodImage || ASSETS.productSmartwatch],
      weights: finalWeights,
      weightPriceMultipliers: existing?.weightPriceMultipliers || {
        [finalWeights[0]]: 1,
      },
      rating: existing?.rating ?? 4.9,
      reviewsCount: existing?.reviewsCount ?? 12,
      unit: existing?.unit ?? 'Unit',
      shortDesc: prodShortDesc.trim() || prodName.trim(),
      description:
        existing?.description ||
        prodShortDesc.trim() ||
        'KYNZO Tech Verified Authentic Gadget.',
      isCodAvailable: prodCodAvailable,
    });

    onRefreshData();
    setShowProductForm(false);
    showToastNotice('গ্যাজেট ইনভেন্টরি সংরক্ষিত হয়েছে!');
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    await storage.saveCategory({
      id: `cat-${Date.now()}`,
      name: catName.trim(),
      slug: catName.trim().toLowerCase().replace(/\s+/g, '-'),
      image: catImage || ASSETS.productSmartwatch,
      itemCount: 10,
    });
    setCatName('');
    setShowCategoryForm(false);
    onRefreshData();
    showToastNotice('নতুন ক্যাটাগরি যোগ হয়েছে!');
  };

  const handleSaveCoupon = async (e: FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    await storage.saveCoupon({
      id: `cpn-${Date.now()}`,
      code: couponCode.trim().toUpperCase(),
      discountType: couponType,
      discountValue: Number(couponValue),
      minOrderAmount: Number(couponMinAmount),
      description: couponDesc.trim() || `${couponCode.toUpperCase()} কুপনে বিশেষ ছাড়`,
      isActive: true,
    });
    setCoupons(storage.getCoupons());
    onRefreshData();
    setShowCouponForm(false);
    setCouponCode('');
    setCouponDesc('');
    showToastNotice('নতুন কুপন সংরক্ষিত হয়েছে!');
  };

  const openNewReviewForm = () => {
    setEditingReviewId(null);
    setRevName('');
    setRevLocation('ঢাকা');
    setRevRating(5);
    setRevComment('');
    setRevDate('আজকে');
    setRevVerified(true);
    setRevProductId('');
    setShowReviewForm(true);
  };

  const openEditReviewForm = (r: Review) => {
    setEditingReviewId(r.id);
    setRevName(r.userName);
    setRevLocation(r.userLocation);
    setRevRating(r.rating);
    setRevComment(r.comment);
    setRevDate(r.date);
    setRevVerified(r.verified);
    setRevProductId(r.productId || '');
    setShowReviewForm(true);
  };

  const handleSaveReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revComment.trim()) return;
    if (editingReviewId) {
      await storage.updateReview(editingReviewId, {
        userName: revName.trim(),
        userLocation: revLocation.trim(),
        rating: revRating,
        comment: revComment.trim(),
        date: revDate.trim() || 'আজকে',
        verified: revVerified,
        productId: revProductId || undefined,
      });
    } else {
      await storage.adminAddReview({
        userName: revName.trim(),
        userLocation: revLocation.trim(),
        rating: revRating,
        comment: revComment.trim(),
        verified: revVerified,
        productId: revProductId || undefined,
      });
    }
    setAdminReviews(storage.getReviews());
    onRefreshData();
    setShowReviewForm(false);
    setEditingReviewId(null);
    showToastNotice('রিভিউ আপডেট হয়েছে!');
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    await storage.updateSettings(storeSettings);
    onRefreshData();
    showToastNotice('স্টোর সেটিংস সংরক্ষিত হয়েছে!');
  };

  const updateHeroSlide = async (
    idx: number,
    field: 'badge' | 'title' | 'subtitle' | 'cta' | 'image' | 'category',
    value: string
  ) => {
    const slides = [...(storeSettings.heroSlides || [])];
    if (!slides[idx]) return;
    slides[idx] = { ...slides[idx], [field]: value };
    const updated = { ...storeSettings, heroSlides: slides };
    setStoreSettings(updated);
    await storage.updateSettings(updated);
    onRefreshData();
  };

  const addHeroSlide = async () => {
    const slides = [...(storeSettings.heroSlides || [])];
    slides.push({
      id: Date.now(),
      badge: 'NEW TECH ARRIVAL',
      title: 'Next-Gen Smart Tech Collection',
      subtitle: 'অফিসিয়াল ওয়ারেন্টিসহ প্রিমিয়াম গ্যাজেট ও টেক একসেসরিজ অর্ডার করুন সাশ্রয়ী মূল্যে।',
      cta: 'Explore Gadgets',
      image: ASSETS.heroGadgetWorkspace,
      category: 'Smartwatches',
      badgeColor: 'bg-blue-500',
    });
    const updated = { ...storeSettings, heroSlides: slides };
    setStoreSettings(updated);
    await storage.updateSettings(updated);
    onRefreshData();
    showToastNotice('নতুন ব্যানার স্লাইড যোগ হয়েছে!');
  };

  const removeHeroSlide = async (idx: number) => {
    const slides = [...(storeSettings.heroSlides || [])];
    slides.splice(idx, 1);
    const updated = { ...storeSettings, heroSlides: slides };
    setStoreSettings(updated);
    await storage.updateSettings(updated);
    onRefreshData();
  };

  const handleSaveEditedUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await storage.adminUpdateUser(editingUser.id, {
      name: editUserName.trim(),
      phone: editUserPhone.trim(),
      email: editUserEmail.trim() || undefined,
      address: editUserAddress.trim(),
      district: editUserDistrict.trim(),
      role: editUserRole,
    });
    setEditingUser(null);
    onRefreshData();
    showToastNotice('কাস্টমার তথ্য আপডেট হয়েছে!');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'product') {
      await storage.deleteProduct(deleteTarget.id);
    } else if (deleteTarget.type === 'order') {
      await storage.deleteOrder(deleteTarget.id);
    } else if (deleteTarget.type === 'category') {
      await storage.deleteCategory(deleteTarget.id);
    } else if (deleteTarget.type === 'coupon') {
      await storage.deleteCoupon(deleteTarget.id);
      setCoupons(storage.getCoupons());
    } else if (deleteTarget.type === 'review') {
      await storage.deleteReview(deleteTarget.id);
      setAdminReviews(storage.getReviews());
    } else if (deleteTarget.type === 'user') {
      await storage.adminDeleteUser(deleteTarget.id);
    }
    setDeleteTarget(null);
    onRefreshData();
    showToastNotice('সফলভাবে মুছে ফেলা হয়েছে।');
  };

  const handleExportJson = () => {
    const json = storage.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kynzo-backup-${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupMessage('JSON ব্যাকআপ ফাইল ডাউনলোড হয়েছে!');
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string' && (await storage.importBackup(content))) {
        onRefreshData();
        setStoreSettings(storage.getSettings());
        setCoupons(storage.getCoupons());
        setAdminReviews(storage.getReviews());
        setBackupMessage('ব্যাকআপ সফলভাবে রিস্টোর হয়েছে!');
      } else {
        setBackupMessage('ব্যাকআপ ফাইলটি সঠিক JSON নয়।');
      }
    };
    reader.readAsText(file);
  };

  // Filtered Admin Orders
  const filteredAdminOrders = orders.filter((ord) => {
    const matchesStatus =
      orderStatusFilter === 'All' || ord.status === orderStatusFilter;
    const q = orderSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      ord.id.toLowerCase().includes(q) ||
      ord.customerName.toLowerCase().includes(q) ||
      ord.customerPhone.toLowerCase().includes(q) ||
      (ord.customerEmail && ord.customerEmail.toLowerCase().includes(q)) ||
      (ord.transactionId && ord.transactionId.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;

  const filteredUsers = usersList.filter((u) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {deleteTarget && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">মুছে ফেলতে চান?</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                আপনি কি নিশ্চিত <strong>"{deleteTarget.title}"</strong> মুছে ফেলতে চান? এটি আর
                ফিরিয়ে আনা যাবে না।
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
              >
                হ্যাঁ, মুছুন
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden my-4 border border-slate-200 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-[#0B1120] to-[#1E293B] text-white">
          <div className="flex items-center gap-2.5">
            {isAdmin ? (
              <Shield className="w-5 h-5 text-[#38BDF8]" />
            ) : (
              <UserIcon className="w-5 h-5 text-[#38BDF8]" />
            )}
            <div>
              <h2 className="text-base sm:text-lg font-extrabold font-display">
                {currentUser
                  ? isAdmin
                    ? 'KYNZO Tech Admin Suite (A-to-Z Control)'
                    : `স্বাগতম, ${currentUser.name}`
                  : authMode === 'login'
                  ? 'Sign In to KYNZO'
                  : 'Create KYNZO Account'}
              </h2>
              {currentUser && (
                <p className="text-[11px] text-slate-300 font-mono">
                  {currentUser.email || currentUser.phone} ·{' '}
                  {isAdmin ? 'Store Administrator' : 'Verified Member'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                type="button"
                onClick={() => {
                  storage.logout();
                  onLogout();
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-600/80 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close account modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6">
          {!currentUser ? (
            <div className="max-w-md mx-auto py-3 space-y-5">
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F1F5F9] border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                    setOtpPending(false);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-[#0B1120] text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError('');
                    setOtpPending(false);
                    setShowOwnerActivate(false);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-[#0B1120] text-white shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                  {authError}
                </div>
              )}
              {authSuccess && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold">
                  {authSuccess}
                </div>
              )}

              {authMode === 'login' ? (
                <div className="space-y-4">
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        মোবাইল নম্বর অথবা Gmail / Email *
                      </label>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="01XXXXXXXXX বা example@gmail.com"
                        className="w-full bg-[#F8FAFC] border border-slate-300 focus:border-[#2563EB] rounded-xl px-4 py-2.5 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        পাসওয়ার্ড *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#F8FAFC] border border-slate-300 focus:border-[#2563EB] rounded-xl px-4 py-2.5 pr-10 text-sm outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-md transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {authSubmitting ? 'লগইন হচ্ছে...' : 'Sign In (Number বা Gmail দিয়ে)'}
                    </button>
                  </form>

                  {canClaimAdmin && (
                    <div className="pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError('');
                          if (!claimEmail && identifier.includes('@')) {
                            setClaimEmail(identifier.trim());
                          }
                          setShowOwnerActivate((prev) => !prev);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline cursor-pointer py-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>
                          {showOwnerActivate
                            ? 'সাধারণ Sign In ফর্মে ফিরে যান'
                            : 'প্রথমবার Store Owner? আপনার Admin Gmail ও পাসওয়ার্ড দিয়ে Sign In চালু করুন'}
                        </span>
                      </button>

                      {showOwnerActivate && (
                        <form
                          onSubmit={handleClaimAdmin}
                          className="mt-3 p-4 rounded-2xl bg-[#F8FAFC] border border-blue-200 space-y-3"
                        >
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            প্রথমবার আপনার অ্যাডমিন Gmail এবং পাসওয়ার্ড সেট করলে সাথে সাথেই Admin Panel ওপেন হবে এবং পরবর্তীতে শুধু Sign In করলেই হবে।
                          </p>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Admin Name
                            </label>
                            <input
                              type="text"
                              value={claimName}
                              onChange={(e) => setClaimName(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Admin Gmail / Email *
                            </label>
                            <input
                              type="email"
                              required
                              value={claimEmail}
                              onChange={(e) => setClaimEmail(e.target.value)}
                              placeholder="your-admin@gmail.com"
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Password (8+ chars) *
                              </label>
                              <input
                                type="password"
                                required
                                value={claimPassword}
                                onChange={(e) => setClaimPassword(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Confirm Password *
                              </label>
                              <input
                                type="password"
                                required
                                value={claimConfirmPassword}
                                onChange={(e) => setClaimConfirmPassword(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={authSubmitting}
                            className="w-full py-2.5 rounded-xl bg-[#0B1120] hover:bg-[#2563EB] text-white font-bold text-xs cursor-pointer disabled:opacity-60"
                          >
                            {authSubmitting ? 'সেটআপ হচ্ছে...' : 'Activate & Sign In as Admin'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ) : otpPending ? (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-blue-200 text-xs">
                    <p className="font-bold text-[#0F172A]">
                      ভেরিফিকেশন OTP কোড:{' '}
                      <span className="font-mono text-base text-[#2563EB]">{generatedOtp}</span>
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      নিচের বক্সে ৪ ডিজিটের ওটিপি কোডটি লিখে অ্যাকাউন্ট নিশ্চিত করুন।
                    </p>
                  </div>
                  <input
                    type="text"
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="4-digit OTP"
                    className="w-full text-center tracking-[0.5em] font-mono font-black text-lg bg-[#F8FAFC] border border-slate-300 rounded-xl py-3 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm cursor-pointer disabled:opacity-60"
                  >
                    {authSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'Verify & Create Account'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterStep1} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      পূর্ণ নাম *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="আপনার নাম"
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        মোবাইল নম্বর (অথবা নিচে Gmail দিন)
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Gmail / Email
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3.5 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        পাসওয়ার্ড (6+ অক্ষর) *
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        নিশ্চিত পাসওয়ার্ড *
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">জেলা</label>
                      <input
                        type="text"
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        placeholder="Dhaka"
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ঠিকানা
                      </label>
                      <input
                        type="text"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="বাসা/রোড/এলাকা"
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm cursor-pointer"
                  >
                    Continue with Verification
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 border-b border-slate-200">
                {isAdmin ? (
                  <>
                    {(
                      [
                        { id: 'admin_orders', label: `Orders (${orders.length})`, icon: Truck },
                        { id: 'admin_users', label: `Customers (${usersList.length})`, icon: Users },
                        { id: 'admin_inventory', label: `Gadgets (${products.length})`, icon: Package },
                        { id: 'admin_content', label: 'Banners & Categories', icon: Layers },
                        { id: 'admin_coupons', label: 'Coupons', icon: Sparkles },
                        { id: 'admin_reviews', label: 'Reviews', icon: Star },
                        { id: 'admin_settings', label: 'Settings & Notice', icon: Settings },
                        { id: 'admin_backup', label: 'Backup', icon: Database },
                      ] as const
                    ).map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveTab(t.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                            activeTab === t.id
                              ? 'bg-[#0B1120] text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-[#EFF6FF]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {(
                      [
                        { id: 'profile', label: 'My Account & Profile', icon: UserIcon },
                        {
                          id: 'orders',
                          label: `My Orders (${customerOrders.length})`,
                          icon: ShoppingBag,
                        },
                      ] as const
                    ).map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setActiveTab(t.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                            activeTab === t.id
                              ? 'bg-[#0B1120] text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-[#EFF6FF]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              {savedNotice && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savedNotice}</span>
                </div>
              )}

              {(activeTab === 'profile' || activeTab === 'addresses') && !isAdmin && (
                <form
                  onSubmit={handleSaveProfile}
                  className="max-w-xl space-y-4 p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#0F172A]">
                        Saved Account Information
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        আপনার অ্যাকাউন্ট ডাটা ও ঠিকানা স্থায়ীভাবে সার্ভারে সংরক্ষিত থাকে।
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Joined {currentUser.createdAt}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">পূর্ণ নাম</label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        মোবাইল নম্বর
                      </label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Gmail / Email
                      </label>
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">জেলা</label>
                      <input
                        type="text"
                        value={profileDistrict}
                        onChange={(e) => setProfileDistrict(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ডেলিভারি ঠিকানা
                    </label>
                    <textarea
                      rows={2}
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 outline-none"
                    />
                  </div>

                  {profileMessage && (
                    <p className="font-bold text-[#2563EB]">{profileMessage}</p>
                  )}

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer"
                  >
                    Save Account Info
                  </button>
                </form>
              )}

              {activeTab === 'orders' && !isAdmin && (
                <div className="space-y-3">
                  {customerOrders.length === 0 ? (
                    <p className="text-center py-8 text-xs text-slate-500">
                      আপনার অ্যাকাউন্টে এখনো কোনো অর্ডার নেই।
                    </p>
                  ) : (
                    customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-mono font-black text-[#2563EB] text-sm">
                            {ord.id}
                          </span>
                          <p className="text-slate-600 mt-0.5">
                            {ord.date} · {ord.items.length} টি গ্যাজেট ·{' '}
                            <strong className="tabular-nums">৳{ord.total}</strong> ·{' '}
                            <span>{ord.paymentMethod}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {ord.customerAddress}, {ord.district}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-[#1D4ED8] font-bold">
                            {ord.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onTrackOrder(ord.id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#0B1120] text-white font-bold cursor-pointer"
                          >
                            Track
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'admin_orders' && isAdmin && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 block">
                        Total Orders
                      </span>
                      <span className="text-xl font-black text-[#0F172A] tabular-nums">
                        {orders.length}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                      <span className="text-[11px] font-bold text-amber-700 block">
                        Pending Action
                      </span>
                      <span className="text-xl font-black text-amber-800 tabular-nums">
                        {pendingCount}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                      <span className="text-[11px] font-bold text-[#1D4ED8] block">
                        Delivered
                      </span>
                      <span className="text-xl font-black text-[#2563EB] tabular-nums">
                        {deliveredCount}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#0B1120] text-white">
                      <span className="text-[11px] font-bold text-slate-300 block">
                        Active Revenue
                      </span>
                      <span className="text-xl font-black text-[#38BDF8] tabular-nums">
                        ৳{totalRevenue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="অর্ডার আইডি, কাস্টমার নাম, ফোন, Gmail বা TrxID খুঁজুন..."
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl pl-9 pr-3 py-2 outline-none"
                      />
                    </div>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-[#F8FAFC] border border-slate-300 rounded-xl px-3 py-2 font-bold outline-none"
                    >
                      {[
                        'All',
                        'Pending',
                        'Confirmed',
                        'Packaging',
                        'Shipped',
                        'Out for Delivery',
                        'Delivered',
                        'Cancelled',
                      ].map((st) => (
                        <option key={st} value={st}>
                          Filter: {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    {filteredAdminOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-200">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-black text-sm text-[#2563EB]">
                                {ord.id}
                              </span>
                              <span className="text-slate-500">{ord.date}</span>
                              {ord.userId && (
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-[#1D4ED8] font-bold text-[10px]">
                                  Registered Account
                                </span>
                              )}
                            </div>
                            <p className="font-extrabold text-slate-900 text-sm">
                              {ord.customerName}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-slate-600">
                              <span className="inline-flex items-center gap-1 font-mono">
                                <Phone className="w-3.5 h-3.5 text-[#2563EB]" />
                                {ord.customerPhone}
                              </span>
                              {ord.customerEmail && (
                                <span className="inline-flex items-center gap-1">
                                  <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                                  {ord.customerEmail}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 flex items-start gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span>
                                {ord.customerAddress}, {ord.district}
                                {ord.division ? ` (${ord.division})` : ''}
                              </span>
                            </p>
                          </div>

                          <div className="text-right space-y-1">
                            <span className="text-lg font-black text-[#0F172A] tabular-nums block">
                              ৳{ord.total}
                            </span>
                            <span className="text-[11px] font-bold text-slate-600 block">
                              {ord.paymentMethod} ·{' '}
                              <span className="text-[#2563EB]">{ord.paymentStatus}</span>
                            </span>
                            {ord.transactionId && (
                              <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                                From: {ord.senderNumber} · TrxID: {ord.transactionId}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200/80">
                          {ord.items.map((it, idx) => (
                            <div
                              key={`${it.productId}-${idx}`}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-slate-700 font-medium">
                                • {it.name} ({it.weight}) × {it.quantity}
                              </span>
                              <span className="font-bold text-slate-900 tabular-nums shrink-0">
                                ৳{it.price * it.quantity}
                              </span>
                            </div>
                          ))}
                          {ord.notes && (
                            <p className="text-[11px] text-amber-700 pt-1 border-t border-slate-100">
                              নোট: {ord.notes}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-1">
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              Order Status
                            </label>
                            <select
                              value={ord.status}
                              onChange={(e) =>
                                handleOrderPatch(ord.id, {
                                  status: e.target.value as OrderStatus,
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-bold outline-none"
                            >
                              {[
                                'Pending',
                                'Confirmed',
                                'Packaging',
                                'Shipped',
                                'Out for Delivery',
                                'Delivered',
                                'Cancelled',
                              ].map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              Payment Status
                            </label>
                            <select
                              value={ord.paymentStatus}
                              onChange={(e) =>
                                handleOrderPatch(ord.id, {
                                  paymentStatus: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-bold outline-none"
                            >
                              <option value="Unpaid (Cash on Delivery)">Unpaid (COD)</option>
                              <option value={`Pending Verification (${ord.paymentMethod})`}>
                                Pending Verification
                              </option>
                              <option value="Verified & Paid">Verified & Paid</option>
                              <option value="Paid">Paid</option>
                              <option value="Refunded">Refunded</option>
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              Courier Partner
                            </label>
                            <select
                              value={ord.courierPartner}
                              onChange={(e) =>
                                handleOrderPatch(ord.id, {
                                  courierPartner: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-bold outline-none"
                            >
                              {[
                                'Pathao Courier',
                                'Steadfast',
                                'REDX',
                                'eCourier',
                                'Paperfly',
                              ].map((cp) => (
                                <option key={cp} value={cp}>
                                  {cp}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              Tracking Code
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={trackingEdits[ord.id] ?? ord.trackingCode}
                                onChange={(e) =>
                                  setTrackingEdits((prev) => ({
                                    ...prev,
                                    [ord.id]: e.target.value,
                                  }))
                                }
                                onBlur={() => {
                                  const nextCode = trackingEdits[ord.id];
                                  if (nextCode && nextCode !== ord.trackingCode) {
                                    handleOrderPatch(ord.id, { trackingCode: nextCode });
                                  }
                                }}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-[11px] outline-none"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-4">
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'order',
                                  id: ord.id,
                                  title: `${ord.id} (${ord.customerName})`,
                                })
                              }
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                              aria-label="Delete order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'admin_users' && isAdmin && (
                <div className="space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-[#0F172A]">
                      Registered Accounts ({usersList.length})
                    </h3>
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="নাম, ফোন বা Gmail খুঁজুন..."
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 outline-none"
                      />
                    </div>
                  </div>

                  {editingUser && (
                    <form
                      onSubmit={handleSaveEditedUser}
                      className="p-4 rounded-2xl bg-[#EFF6FF] border border-blue-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[#0F172A]">
                          Edit Account: {editingUser.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="text-slate-500 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          value={editUserName}
                          onChange={(e) => setEditUserName(e.target.value)}
                          placeholder="Full Name"
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                        />
                        <input
                          type="tel"
                          value={editUserPhone}
                          onChange={(e) => setEditUserPhone(e.target.value)}
                          placeholder="Phone"
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono outline-none"
                        />
                        <input
                          type="email"
                          value={editUserEmail}
                          onChange={(e) => setEditUserEmail(e.target.value)}
                          placeholder="Gmail / Email"
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                        />
                        <select
                          value={editUserRole}
                          onChange={(e) =>
                            setEditUserRole(e.target.value as 'admin' | 'customer')
                          }
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none font-bold"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <input
                          type="text"
                          value={editUserDistrict}
                          onChange={(e) => setEditUserDistrict(e.target.value)}
                          placeholder="District"
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                        />
                        <input
                          type="text"
                          value={editUserAddress}
                          onChange={(e) => setEditUserAddress(e.target.value)}
                          placeholder="Address"
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-bold cursor-pointer"
                      >
                        Save User Changes
                      </button>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                u.role === 'admin'
                                  ? 'bg-[#0B1120] text-[#38BDF8]'
                                  : 'bg-[#EFF6FF] text-[#2563EB]'
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <p className="text-slate-600">
                            {u.phone && <span className="font-mono mr-3">{u.phone}</span>}
                            {u.email && <span>{u.email}</span>}
                          </p>
                          {u.address && (
                            <p className="text-[11px] text-slate-500">
                              {u.address}, {u.district}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-bold text-[#0F172A] block tabular-nums">
                              {u.ordersCount ?? 0} Orders
                            </span>
                            <span className="text-[11px] font-bold text-[#2563EB] tabular-nums">
                              ৳{(u.totalSpent ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setEditUserName(u.name);
                              setEditUserPhone(u.phone || '');
                              setEditUserEmail(u.email || '');
                              setEditUserAddress(u.address || '');
                              setEditUserDistrict(u.district || 'Dhaka');
                              setEditUserRole(u.role);
                            }}
                            className="p-1.5 text-[#2563EB] hover:bg-blue-50 rounded-lg cursor-pointer"
                            aria-label="Edit user"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {u.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'user',
                                  id: u.id,
                                  title: u.name,
                                })
                              }
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                              aria-label="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'admin_inventory' && isAdmin && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#0F172A]">
                      Gadget Inventory ({products.length})
                    </h3>
                    <button
                      type="button"
                      onClick={openNewProductForm}
                      className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>নতুন গ্যাজেট যোগ করুন</span>
                    </button>
                  </div>

                  {showProductForm && (
                    <form
                      onSubmit={handleSaveProduct}
                      className="p-4 rounded-2xl bg-[#EFF6FF] border border-blue-200 space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[#0F172A]">
                          {editingProdId ? 'গ্যাজেট আপডেট করুন' : 'নতুন গ্যাজেট যোগ করুন'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowProductForm(false)}
                          className="text-slate-500 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          placeholder="গ্যাজেটের নাম *"
                          className="bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                        />
                        <select
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          required
                          value={prodPrice}
                          onChange={(e) => setProdPrice(Number(e.target.value))}
                          placeholder="বিক্রয় মূল্য"
                          className="bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                        />
                        <input
                          type="number"
                          required
                          value={prodOriginalPrice}
                          onChange={(e) => setProdOriginalPrice(Number(e.target.value))}
                          placeholder="রেগুলার মূল্য"
                          className="bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                        />
                        <input
                          type="number"
                          required
                          value={prodStock}
                          onChange={(e) => setProdStock(Number(e.target.value))}
                          placeholder="স্টক সংখ্যা"
                          className="bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                        />
                        <input
                          type="text"
                          value={prodWeights}
                          onChange={(e) => setProdWeights(e.target.value)}
                          placeholder="ভ্যারিয়েন্ট / এডিশন (কমা দিয়ে)"
                          className="bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={prodImage}
                          onChange={(e) => setProdImage(e.target.value)}
                          placeholder="Image URL"
                          className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                        />
                        <label className="px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold cursor-pointer flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFile(e, setProdImage)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <textarea
                        rows={2}
                        value={prodShortDesc}
                        onChange={(e) => setProdShortDesc(e.target.value)}
                        placeholder="সংক্ষিপ্ত বিবরণ"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                      />
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prodCodAvailable}
                            onChange={(e) => setProdCodAvailable(e.target.checked)}
                          />
                          <span>COD Available</span>
                        </label>
                        <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prodFlashSale}
                            onChange={(e) => setProdFlashSale(e.target.checked)}
                          />
                          <span>Include in Flash Deals</span>
                        </label>
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#2563EB] text-white font-bold cursor-pointer"
                      >
                        গ্যাজেট সংরক্ষণ করুন
                      </button>
                    </form>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {products.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center gap-3 text-xs"
                      >
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{prod.name}</p>
                          <p className="text-slate-500 tabular-nums">
                            ৳{prod.price} · Stock: {prod.stockQuantity}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditProductForm(prod)}
                          className="p-1.5 text-[#2563EB] hover:bg-blue-50 rounded-lg cursor-pointer"
                          aria-label="Edit product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              type: 'product',
                              id: prod.id,
                              title: prod.name,
                            })
                          }
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          aria-label="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'admin_content' && isAdmin && (
                <div className="space-y-6 text-xs">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-[#0F172A]">
                        Hero Banner Slides ({storeSettings.heroSlides.length})
                      </h3>
                      <button
                        type="button"
                        onClick={addHeroSlide}
                        className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Slide</span>
                      </button>
                    </div>
                    {storeSettings.heroSlides.map((slide, idx) => (
                      <div
                        key={slide.id}
                        className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#2563EB]">Slide #{idx + 1}</span>
                          {storeSettings.heroSlides.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeHeroSlide(idx)}
                              className="text-red-600 font-bold cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => updateHeroSlide(idx, 'title', e.target.value)}
                            placeholder="Title"
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                          />
                          <input
                            type="text"
                            value={slide.badge}
                            onChange={(e) => updateHeroSlide(idx, 'badge', e.target.value)}
                            placeholder="Badge"
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                          />
                          <input
                            type="text"
                            value={slide.cta}
                            onChange={(e) => updateHeroSlide(idx, 'cta', e.target.value)}
                            placeholder="CTA Button Text"
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                          />
                          <input
                            type="text"
                            value={slide.image}
                            onChange={(e) => updateHeroSlide(idx, 'image', e.target.value)}
                            placeholder="Image Path"
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                          />
                          <input
                            type="text"
                            value={slide.subtitle}
                            onChange={(e) => updateHeroSlide(idx, 'subtitle', e.target.value)}
                            placeholder="Subtitle"
                            className="sm:col-span-2 bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-[#0F172A]">
                        Categories ({categories.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowCategoryForm(!showCategoryForm)}
                        className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Add Category</span>
                      </button>
                    </div>
                    {showCategoryForm && (
                      <form
                        onSubmit={handleSaveCategory}
                        className="p-3 rounded-xl bg-[#EFF6FF] flex flex-wrap gap-2"
                      >
                        <input
                          type="text"
                          required
                          value={catName}
                          onChange={(e) => setCatName(e.target.value)}
                          placeholder="Category Name"
                          className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                        />
                        <input
                          type="text"
                          value={catImage}
                          onChange={(e) => setCatImage(e.target.value)}
                          placeholder="Image URL"
                          className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#2563EB] text-white rounded-lg font-bold cursor-pointer"
                        >
                          Save
                        </button>
                      </form>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {categories.map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between gap-2"
                        >
                          <span className="font-bold truncate">{c.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'category',
                                id: c.id,
                                title: c.name,
                              })
                            }
                            className="text-red-500 cursor-pointer"
                            aria-label="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'admin_coupons' && isAdmin && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#0F172A]">
                      Active Coupons ({coupons.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCouponForm(!showCouponForm)}
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Coupon</span>
                    </button>
                  </div>
                  {showCouponForm && (
                    <form
                      onSubmit={handleSaveCoupon}
                      className="p-4 rounded-2xl bg-[#EFF6FF] grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      <input
                        type="text"
                        required
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="CODE (e.g. SAVE200)"
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 uppercase font-mono outline-none"
                      />
                      <select
                        value={couponType}
                        onChange={(e) =>
                          setCouponType(e.target.value as 'fixed' | 'percentage')
                        }
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                      >
                        <option value="fixed">Fixed Amount (৳)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                      <input
                        type="number"
                        required
                        value={couponValue}
                        onChange={(e) => setCouponValue(Number(e.target.value))}
                        placeholder="Discount Value"
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                      />
                      <input
                        type="number"
                        required
                        value={couponMinAmount}
                        onChange={(e) => setCouponMinAmount(Number(e.target.value))}
                        placeholder="Min Order Amount"
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                      />
                      <input
                        type="text"
                        value={couponDesc}
                        onChange={(e) => setCouponDesc(e.target.value)}
                        placeholder="Description"
                        className="sm:col-span-2 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-bold cursor-pointer"
                      >
                        Save Coupon
                      </button>
                    </form>
                  )}
                  <div className="space-y-2">
                    {coupons.map((cpn) => (
                      <div
                        key={cpn.id}
                        className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono font-black text-[#2563EB] text-sm">
                            {cpn.code}
                          </span>
                          <p className="text-slate-600">{cpn.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              type: 'coupon',
                              id: cpn.id,
                              title: cpn.code,
                            })
                          }
                          className="p-1.5 text-red-500 cursor-pointer"
                          aria-label="Delete coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'admin_reviews' && isAdmin && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#0F172A]">
                      Customer Reviews ({adminReviews.length})
                    </h3>
                    <button
                      type="button"
                      onClick={openNewReviewForm}
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Review</span>
                    </button>
                  </div>
                  {showReviewForm && (
                    <form
                      onSubmit={handleSaveReview}
                      className="p-4 rounded-2xl bg-[#EFF6FF] space-y-2.5"
                    >
                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          value={revName}
                          onChange={(e) => setRevName(e.target.value)}
                          placeholder="Customer Name"
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                        />
                        <input
                          type="text"
                          value={revLocation}
                          onChange={(e) => setRevLocation(e.target.value)}
                          placeholder="Location"
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                        />
                      </div>
                      <textarea
                        rows={2}
                        required
                        value={revComment}
                        onChange={(e) => setRevComment(e.target.value)}
                        placeholder="Review comment..."
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-bold cursor-pointer"
                      >
                        Save Review
                      </button>
                    </form>
                  )}
                  <div className="space-y-2">
                    {adminReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">
                            {rev.userName} · {rev.rating}★
                          </p>
                          <p className="text-slate-600 line-clamp-1">{rev.comment}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditReviewForm(rev)}
                            className="p-1.5 text-[#2563EB] cursor-pointer"
                            aria-label="Edit review"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'review',
                                id: rev.id,
                                title: rev.userName,
                              })
                            }
                            className="p-1.5 text-red-500 cursor-pointer"
                            aria-label="Delete review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'admin_settings' && isAdmin && (
                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Store Name</label>
                      <input
                        type="text"
                        value={storeSettings.storeName}
                        onChange={(e) =>
                          setStoreSettings({ ...storeSettings, storeName: e.target.value })
                        }
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg px-3 py-2 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hotline</label>
                      <input
                        type="text"
                        value={storeSettings.hotline}
                        onChange={(e) =>
                          setStoreSettings({ ...storeSettings, hotline: e.target.value })
                        }
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg px-3 py-2 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">WhatsApp</label>
                      <input
                        type="text"
                        value={storeSettings.whatsapp}
                        onChange={(e) =>
                          setStoreSettings({ ...storeSettings, whatsapp: e.target.value })
                        }
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg px-3 py-2 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        bKash Merchant
                      </label>
                      <input
                        type="text"
                        value={storeSettings.bkashMerchant}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            bkashMerchant: e.target.value,
                          })
                        }
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg px-3 py-2 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nagad Merchant
                      </label>
                      <input
                        type="text"
                        value={storeSettings.nagadMerchant}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            nagadMerchant: e.target.value,
                          })
                        }
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg px-3 py-2 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Support Email
                      </label>
                      <input
                        type="email"
                        value={storeSettings.email}
                        onChange={(e) =>
                          setStoreSettings({ ...storeSettings, email: e.target.value })
                        }
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg px-3 py-2 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Inside Dhaka Fee (৳)
                      </label>
                      <input
                        type="number"
                        value={storeSettings.insideDhakaFee}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            insideDhakaFee: Number(e.target.value),
                          })
                        }
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg px-3 py-2 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Sub-Dhaka Fee (৳)
                      </label>
                      <input
                        type="number"
                        value={storeSettings.subDhakaFee}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            subDhakaFee: Number(e.target.value),
                          })
                        }
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg px-3 py-2 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Outside Dhaka Fee (৳)
                      </label>
                      <input
                        type="number"
                        value={storeSettings.outsideDhakaFee}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            outsideDhakaFee: Number(e.target.value),
                          })
                        }
                        className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg px-3 py-2 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Store Address
                    </label>
                    <input
                      type="text"
                      value={storeSettings.address}
                      onChange={(e) =>
                        setStoreSettings({ ...storeSettings, address: e.target.value })
                      }
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg px-3 py-2 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Top Announcement Banner
                    </label>
                    <input
                      type="text"
                      value={storeSettings.announcement}
                      onChange={(e) =>
                        setStoreSettings({ ...storeSettings, announcement: e.target.value })
                      }
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-lg px-3 py-2 outline-none"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-blue-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-[#2563EB]" />
                        <span>Welcome Popup Notice Settings</span>
                      </span>
                      <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={storeSettings.popupNotice.enabled}
                          onChange={(e) =>
                            setStoreSettings({
                              ...storeSettings,
                              popupNotice: {
                                ...storeSettings.popupNotice,
                                enabled: e.target.checked,
                              },
                            })
                          }
                        />
                        <span>Enabled</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={storeSettings.popupNotice.title}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          popupNotice: {
                            ...storeSettings.popupNotice,
                            title: e.target.value,
                          },
                        })
                      }
                      placeholder="Popup Title"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                    />
                    <textarea
                      rows={2}
                      value={storeSettings.popupNotice.message}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          popupNotice: {
                            ...storeSettings.popupNotice,
                            message: e.target.value,
                          },
                        })
                      }
                      placeholder="Popup Message"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 outline-none"
                    />
                    <input
                      type="text"
                      value={storeSettings.popupNotice.couponCode || ''}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          popupNotice: {
                            ...storeSettings.popupNotice,
                            couponCode: e.target.value,
                          },
                        })
                      }
                      placeholder="Coupon Code"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono uppercase outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer"
                  >
                    Save Store Settings
                  </button>
                </form>
              )}

              {activeTab === 'admin_backup' && isAdmin && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3">
                    <h3 className="text-sm font-extrabold text-[#0F172A]">
                      Store Data Backup & Restore
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="px-4 py-2.5 rounded-xl bg-[#0B1120] text-white font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export JSON Backup</span>
                      </button>

                      <label className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Import JSON Backup</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleImportJson}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={async () => {
                          await storage.resetDefaults();
                          onRefreshData();
                          setStoreSettings(storage.getSettings());
                          setCoupons(storage.getCoupons());
                          setAdminReviews(storage.getReviews());
                          setBackupMessage('স্টোর ডিফল্ট ডাটা রিস্টোর হয়েছে!');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset to Defaults</span>
                      </button>
                    </div>
                    {backupMessage && (
                      <p className="font-bold text-[#2563EB]">{backupMessage}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
