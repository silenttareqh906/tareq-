export type DeliveryArea = 'inside_dhaka' | 'sub_dhaka' | 'outside_dhaka';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packaging'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'COD' | 'bKash' | 'Nagad';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  isBestSelling: boolean;
  isFlashSale?: boolean;
  inStock: boolean;
  stockQuantity: number;
  image: string;
  gallery?: string[];
  weights: string[];
  weightPriceMultipliers?: Record<string, number>;
  rating: number;
  reviewsCount: number;
  unit: string;
  shortDesc: string;
  description: string;
  keyBenefits?: string[];
  ingredients?: string;
  isCodAvailable?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  itemCount: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  weight: string;
  image: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  weight: string;
  image: string;
}

export interface OrderTimelineStep {
  status: OrderStatus | string;
  title: string;
  time: string;
  done: boolean;
  description: string;
}

export interface Order {
  id: string;
  date: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  district: string;
  division?: string;
  deliveryArea: DeliveryArea;
  deliveryFee: number;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  couponCode?: string;
  total: number;
  paymentMethod: PaymentMethod | string;
  paymentStatus: string;
  transactionId?: string;
  senderNumber?: string;
  status: OrderStatus | string;
  courierPartner: string;
  trackingCode: string;
  notes?: string;
  timeline: OrderTimelineStep[];
}

export interface Review {
  id: string;
  productId?: string;
  userName: string;
  userLocation: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  avatar?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderAmount: number;
  description: string;
  isActive: boolean;
}

export interface HeroSlide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  image: string;
  category?: string;
  accent?: string;
  badgeColor?: string;
}

export interface PopupNotice {
  enabled: boolean;
  badge: string;
  title: string;
  message: string;
  highlightNote?: string;
  couponCode?: string;
  ctaText: string;
  ctaCategory?: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  whatsapp?: string;
}

export interface StoreSettings {
  storeName: string;
  hotline: string;
  whatsapp: string;
  email: string;
  address: string;
  insideDhakaFee: number;
  subDhakaFee: number;
  outsideDhakaFee: number;
  bkashMerchant: string;
  nagadMerchant: string;
  rocketMerchant?: string;
  announcement: string;
  popupNotice: PopupNotice;
  theme?: 'light' | 'dark';
  logoUrl: string;
  socialLinks: SocialLinks;
  heroSlides: HeroSlide[];
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: 'admin' | 'customer';
  address?: string;
  district?: string;
  thana?: string;
  createdAt: string;
}

export interface DistrictItem {
  id: string;
  nameBn: string;
  nameEn: string;
  label: string;
  defaultArea: DeliveryArea;
}

export interface DivisionItem {
  id: string;
  nameBn: string;
  nameEn: string;
  label: string;
  districts: DistrictItem[];
}
