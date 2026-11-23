import {
  DEFAULT_CATEGORIES,
  DEFAULT_COUPONS,
  DEFAULT_PRODUCTS,
  DEFAULT_REVIEWS,
  DEFAULT_SETTINGS,
} from '../data/seedData';
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

export interface AdminUserRow extends User {
  ordersCount?: number;
  totalSpent?: number;
}

// Held exclusively in JS memory (never written to localStorage/sessionStorage)
let authToken: string | null = null;
let inMemoryUser: User | null = null;

// In-memory store state hydrated from server `/api/store` & `/api/admin/dashboard`
let cache = {
  products: [...DEFAULT_PRODUCTS] as Product[],
  categories: [...DEFAULT_CATEGORIES] as Category[],
  orders: [] as Order[],
  users: [] as AdminUserRow[],
  reviews: [...DEFAULT_REVIEWS] as Review[],
  coupons: [...DEFAULT_COUPONS] as Coupon[],
  settings: { ...DEFAULT_SETTINGS } as StoreSettings,
  adminConfigured: false,
  canClaimAdmin: false,
};

async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const storage = {
  init(): void {
    // Scrub any legacy client-side auth/password storage keys
    try {
      localStorage.removeItem('kynzo_current_user_v2');
      localStorage.removeItem('kynzo_passwords_v1');
      localStorage.removeItem('kynzo_users_v2');
    } catch {
      // Ignore storage access restrictions
    }
  },

  async fetchStore(): Promise<{
    products: Product[];
    categories: Category[];
    reviews: Review[];
    coupons: Coupon[];
    settings: StoreSettings;
    adminConfigured: boolean;
    canClaimAdmin: boolean;
  }> {
    const data = await apiFetch<{
      products: Product[];
      categories: Category[];
      reviews: Review[];
      coupons: Coupon[];
      settings: StoreSettings;
      adminConfigured: boolean;
      canClaimAdmin: boolean;
    }>('/api/store');

    cache.products = data.products;
    cache.categories = data.categories;
    cache.reviews = data.reviews;
    cache.coupons = data.coupons;
    cache.settings = data.settings;
    cache.adminConfigured = data.adminConfigured;
    cache.canClaimAdmin = data.canClaimAdmin;
    return data;
  },

  getAdminSetupState(): { adminConfigured: boolean; canClaimAdmin: boolean } {
    return {
      adminConfigured: cache.adminConfigured,
      canClaimAdmin: cache.canClaimAdmin,
    };
  },

  getProducts(): Product[] {
    return cache.products;
  },

  getCategories(): Category[] {
    return cache.categories;
  },

  getOrders(): Order[] {
    return cache.orders;
  },

  getReviews(): Review[] {
    return cache.reviews;
  },

  getCoupons(): Coupon[] {
    return cache.coupons;
  },

  getSettings(): StoreSettings {
    return cache.settings;
  },

  getUsers(): AdminUserRow[] {
    return cache.users;
  },

  getCurrentUser(): User | null {
    return inMemoryUser;
  },

  isAuthenticated(): boolean {
    return Boolean(authToken && inMemoryUser);
  },

  validateCoupon(
    code: string,
    subtotal: number
  ): { valid: boolean; coupon?: Coupon; discount: number; message: string } {
    const normalized = code.trim().toUpperCase();
    const coupon = cache.coupons.find(
      (c) => c.code.toUpperCase() === normalized && c.isActive
    );
    if (!coupon) {
      return {
        valid: false,
        discount: 0,
        message: 'কুপন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।',
      };
    }
    if (subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        discount: 0,
        message: `এই কুপন ব্যবহারের জন্য সর্বনিম্ন ৳${coupon.minOrderAmount} টাকার গ্যাজেট প্রয়োজন।`,
      };
    }
    const discount =
      coupon.discountType === 'percentage'
        ? Math.round((subtotal * coupon.discountValue) / 100)
        : coupon.discountValue;

    return {
      valid: true,
      coupon,
      discount,
      message: `কুপন কোড ${coupon.code} সফলভাবে প্রয়োগ হয়েছে! ৳${discount} ছাড় পেয়েছেন।`,
    };
  },

  // =========================================================================
  // AUTH ACTIONS (Phone or Gmail/Email + Server Persistence)
  // =========================================================================

  async login(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const res = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      authToken = res.token;
      inMemoryUser = res.user;
      if (res.user.role === 'admin') {
        await this.fetchAdminDashboard();
      } else {
        await this.fetchMyOrders();
      }
      return { success: true, user: res.user };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'লগইন ব্যর্থ হয়েছে।',
      };
    }
  },

  async register(input: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    address?: string;
    district?: string;
  }): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const res = await apiFetch<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      authToken = res.token;
      inMemoryUser = res.user;
      await this.fetchMyOrders();
      return { success: true, user: res.user };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'অ্যাকাউন্ট তৈরি ব্যর্থ হয়েছে।',
      };
    }
  },

  async claimAdmin(input: {
    name?: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const res = await apiFetch<{ token: string; user: User }>(
        '/api/auth/claim-admin',
        {
          method: 'POST',
          body: JSON.stringify(input),
        }
      );
      authToken = res.token;
      inMemoryUser = res.user;
      cache.adminConfigured = true;
      cache.canClaimAdmin = false;
      await this.fetchAdminDashboard();
      return { success: true, user: res.user };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'অ্যাডমিন সেটআপ ব্যর্থ হয়েছে।',
      };
    }
  },

  async updateProfile(patch: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    district?: string;
  }): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const res = await apiFetch<{ user: User }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      inMemoryUser = res.user;
      return { success: true, user: res.user };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'প্রোফাইল আপডেট ব্যর্থ হয়েছে।',
      };
    }
  },

  logout(): void {
    const tokenToRevoke = authToken;
    authToken = null;
    inMemoryUser = null;
    cache.orders = [];
    cache.users = [];
    if (tokenToRevoke) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenToRevoke}` },
      }).catch(() => {});
    }
  },

  // =========================================================================
  // ORDERS & REVIEWS
  // =========================================================================

  async createOrder(
    orderInput: Omit<
      Order,
      'id' | 'date' | 'status' | 'courierPartner' | 'trackingCode' | 'timeline'
    >
  ): Promise<Order> {
    const res = await apiFetch<{ order: Order; products: Product[] }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderInput),
    });
    cache.products = res.products;
    cache.orders = [res.order, ...cache.orders];
    return res.order;
  },

  async fetchMyOrders(): Promise<Order[]> {
    if (!authToken) return [];
    const res = await apiFetch<{ orders: Order[] }>('/api/my-orders');
    cache.orders = res.orders;
    return res.orders;
  },

  async trackOrder(query: string): Promise<Order | null> {
    const q = query.trim();
    if (!q) return null;
    const localMatch = cache.orders.find(
      (o) =>
        o.id.toLowerCase() === q.toLowerCase() ||
        o.trackingCode.toLowerCase() === q.toLowerCase()
    );
    if (localMatch) return localMatch;
    const res = await apiFetch<{ order: Order | null }>(
      `/api/orders/track?q=${encodeURIComponent(q)}`
    );
    return res.order;
  },

  async addReview(reviewInput: Omit<Review, 'id' | 'date'>): Promise<Review> {
    const res = await apiFetch<{ review: Review; reviews: Review[] }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewInput),
    });
    cache.reviews = res.reviews;
    return res.review;
  },

  // =========================================================================
  // ADMIN A-TO-Z CONTROLS
  // =========================================================================

  async fetchAdminDashboard(): Promise<void> {
    if (!authToken || inMemoryUser?.role !== 'admin') return;
    const data = await apiFetch<{
      orders: Order[];
      users: AdminUserRow[];
      products: Product[];
      categories: Category[];
      coupons: Coupon[];
      reviews: Review[];
      settings: StoreSettings;
    }>('/api/admin/dashboard');

    cache.orders = data.orders;
    cache.users = data.users;
    cache.products = data.products;
    cache.categories = data.categories;
    cache.coupons = data.coupons;
    cache.reviews = data.reviews;
    cache.settings = data.settings;
  },

  async updateOrderStatus(
    orderId: string,
    patch: {
      status?: OrderStatus;
      paymentStatus?: string;
      courierPartner?: string;
      trackingCode?: string;
      notes?: string;
      customerAddress?: string;
      district?: string;
    }
  ): Promise<Order | null> {
    const res = await apiFetch<{ order: Order; orders: Order[] }>(
      `/api/admin/orders/${encodeURIComponent(orderId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    );
    cache.orders = res.orders;
    return res.order;
  },

  async deleteOrder(orderId: string): Promise<void> {
    const res = await apiFetch<{ ok: boolean; orders: Order[] }>(
      `/api/admin/orders/${encodeURIComponent(orderId)}`,
      { method: 'DELETE' }
    );
    cache.orders = res.orders;
  },

  async adminUpdateUser(
    userId: string,
    patch: Partial<User> & { newPassword?: string }
  ): Promise<void> {
    await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    await this.fetchAdminDashboard();
  },

  async adminDeleteUser(userId: string): Promise<void> {
    await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    await this.fetchAdminDashboard();
  },

  async saveProduct(product: Product): Promise<void> {
    const res = await apiFetch<{ product: Product; products: Product[] }>(
      '/api/admin/products',
      {
        method: 'POST',
        body: JSON.stringify(product),
      }
    );
    cache.products = res.products;
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await apiFetch<{ ok: boolean; products: Product[] }>(
      `/api/admin/products/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
    cache.products = res.products;
  },

  async saveCategory(category: Category): Promise<void> {
    const res = await apiFetch<{ category: Category; categories: Category[] }>(
      '/api/admin/categories',
      {
        method: 'POST',
        body: JSON.stringify(category),
      }
    );
    cache.categories = res.categories;
  },

  async deleteCategory(id: string): Promise<void> {
    const res = await apiFetch<{ ok: boolean; categories: Category[] }>(
      `/api/admin/categories/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
    cache.categories = res.categories;
  },

  async saveCoupon(coupon: Coupon): Promise<void> {
    const res = await apiFetch<{ coupon: Coupon; coupons: Coupon[] }>(
      '/api/admin/coupons',
      {
        method: 'POST',
        body: JSON.stringify(coupon),
      }
    );
    cache.coupons = res.coupons;
  },

  async deleteCoupon(couponId: string): Promise<void> {
    const res = await apiFetch<{ ok: boolean; coupons: Coupon[] }>(
      `/api/admin/coupons/${encodeURIComponent(couponId)}`,
      { method: 'DELETE' }
    );
    cache.coupons = res.coupons;
  },

  async adminAddReview(reviewInput: Omit<Review, 'id' | 'date'>): Promise<void> {
    const res = await apiFetch<{ review: Review; reviews: Review[] }>(
      '/api/admin/reviews',
      {
        method: 'POST',
        body: JSON.stringify(reviewInput),
      }
    );
    cache.reviews = res.reviews;
  },

  async updateReview(reviewId: string, patch: Partial<Review>): Promise<void> {
    const res = await apiFetch<{ review: Review; reviews: Review[] }>(
      `/api/admin/reviews/${encodeURIComponent(reviewId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    );
    cache.reviews = res.reviews;
  },

  async deleteReview(reviewId: string): Promise<void> {
    const res = await apiFetch<{ ok: boolean; reviews: Review[] }>(
      `/api/admin/reviews/${encodeURIComponent(reviewId)}`,
      { method: 'DELETE' }
    );
    cache.reviews = res.reviews;
  },

  async updateSettings(settings: StoreSettings): Promise<void> {
    const res = await apiFetch<{ settings: StoreSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    cache.settings = res.settings;
  },

  exportBackup(): string {
    const payload = {
      timestamp: new Date().toISOString(),
      store: 'KYNZO Tech Store',
      products: cache.products,
      categories: cache.categories,
      orders: cache.orders,
      reviews: cache.reviews,
      settings: cache.settings,
      coupons: cache.coupons,
      users: cache.users,
    };
    return JSON.stringify(payload, null, 2);
  },

  async importBackup(rawJson: string): Promise<boolean> {
    try {
      const data = JSON.parse(rawJson) as Record<string, unknown>;
      await apiFetch('/api/admin/import-backup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await this.fetchAdminDashboard();
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  },

  async resetDefaults(): Promise<void> {
    await apiFetch('/api/admin/reset-defaults', { method: 'POST' });
    await this.fetchAdminDashboard();
  },
};
