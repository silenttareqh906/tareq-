import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_COUPONS,
  DEFAULT_ORDERS,
  DEFAULT_PRODUCTS,
  DEFAULT_REVIEWS,
  DEFAULT_SETTINGS,
} from './src/data/seedData.ts';
import type {
  Category,
  Coupon,
  Order,
  OrderStatus,
  Product,
  Review,
  StoreSettings,
  User,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 3000;

function hasUnsafeKeys(value: unknown, depth = 0): boolean {
  if (depth > 12 || !value || typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    return value.some((item) => hasUnsafeKeys(item, depth + 1));
  }
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    if (hasUnsafeKeys(obj[key], depth + 1)) {
      return true;
    }
  }
  return false;
}

// Security headers against MIME-sniffing, clickjacking on APIs, referrer leaks & XSS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'"
    );
  }
  next();
});

app.use(express.json({ limit: '4mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body && hasUnsafeKeys(req.body)) {
    res.status(400).json({ error: 'অননুমোদিত পেলোড প্রত্যাখ্যাত হয়েছে।' });
    return;
  }
  next();
});

// Rate limiter & brute-force protection helpers (in-memory)
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function createRateLimiter(maxRequests: number, windowMs: number, message: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (bucket.count >= maxRequests) {
      const retrySecs = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retrySecs));
      res.status(429).json({ error: message });
      return;
    }
    bucket.count += 1;
    next();
  };
}

const loginFailures = new Map<string, { count: number; lockedUntil: number }>();
const MAX_LOGIN_FAILS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function checkLoginLockout(req: Request, identifier: string): number {
  const ip = getClientIp(req);
  const now = Date.now();
  for (const key of [`ip:${ip}`, `id:${ip}:${identifier.toLowerCase()}`]) {
    const entry = loginFailures.get(key);
    if (entry && entry.lockedUntil > now) {
      return Math.ceil((entry.lockedUntil - now) / 1000);
    }
  }
  return 0;
}

function recordLoginFailure(req: Request, identifier: string): void {
  const ip = getClientIp(req);
  const now = Date.now();
  for (const key of [`ip:${ip}`, `id:${ip}:${identifier.toLowerCase()}`]) {
    const entry = loginFailures.get(key);
    if (!entry || (entry.lockedUntil > 0 && entry.lockedUntil <= now)) {
      loginFailures.set(key, { count: 1, lockedUntil: 0 });
    } else {
      const nextCount = entry.count + 1;
      loginFailures.set(key, {
        count: nextCount,
        lockedUntil: nextCount >= MAX_LOGIN_FAILS ? now + LOGIN_LOCK_MS : 0,
      });
    }
  }
}

function clearLoginFailures(req: Request, identifier: string): void {
  const ip = getClientIp(req);
  loginFailures.delete(`ip:${ip}`);
  loginFailures.delete(`id:${ip}:${identifier.toLowerCase()}`);
}

const SAFE_DATA_IMG_RE = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i;
function sanitizeImageUrl(raw: unknown, fallback = '/assets/aistudio/hero.jpg'): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2_500_000) return fallback;
  if (SAFE_DATA_IMG_RE.test(trimmed)) return trimmed;
  if (
    (trimmed.startsWith('/assets/') ||
      trimmed.startsWith('/src/assets/') ||
      trimmed.startsWith('/images/')) &&
    !trimmed.includes('..') &&
    !trimmed.includes('\\')
  ) {
    return trimmed;
  }
  try {
    const u = new URL(trimmed);
    if (u.protocol === 'https:' || u.protocol === 'http:') return u.toString();
  } catch {
    return fallback;
  }
  return fallback;
}

function sanitizeExternalUrl(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  try {
    const u = new URL(trimmed);
    if (u.protocol === 'https:' || u.protocol === 'http:') return u.toString();
  } catch {
    return fallback;
  }
  return fallback;
}

function sanitizePlainText(raw: unknown, maxLen = 500): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

// Ephemeral fallback ensures local dev works without polluting .env.example; set SESSION_SECRET in production.
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

interface StoredUser extends User {
  passwordHash: string;
}

interface StoreDatabase {
  edition: string;
  users: StoredUser[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  settings: StoreSettings;
}

const CURRENT_EDITION = 'gadgets-v1';

function createInitialDb(): StoreDatabase {
  return {
    edition: CURRENT_EDITION,
    users: [],
    products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)) as Product[],
    categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)) as Category[],
    orders: JSON.parse(JSON.stringify(DEFAULT_ORDERS)) as Order[],
    reviews: JSON.parse(JSON.stringify(DEFAULT_REVIEWS)) as Review[],
    coupons: JSON.parse(JSON.stringify(DEFAULT_COUPONS)) as Coupon[],
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as StoreSettings,
  };
}

function loadDb(): StoreDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initial = createInitialDb();
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreDatabase>;
    if (parsed.edition !== CURRENT_EDITION) {
      const fresh = createInitialDb();
      if (Array.isArray(parsed.users)) {
        fresh.users = parsed.users;
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(fresh, null, 2), 'utf8');
      return fresh;
    }
    const loadedUsers = Array.isArray(parsed.users) ? parsed.users : [];
    let migrated = false;
    const updatedUsers = loadedUsers.map((u) => {
      if (
        u.role === 'admin' &&
        u.email &&
        u.email.trim().toLowerCase() === 'sabik8078b@gmail.com'
      ) {
        migrated = true;
        return { ...u, email: 'sakib8078b@gmail.com' };
      }
      return u;
    });
    const resultDb: StoreDatabase = {
      edition: CURRENT_EDITION,
      users: updatedUsers,
      products: Array.isArray(parsed.products) ? parsed.products : DEFAULT_PRODUCTS,
      categories: Array.isArray(parsed.categories)
        ? parsed.categories
        : DEFAULT_CATEGORIES,
      orders: Array.isArray(parsed.orders) ? parsed.orders : DEFAULT_ORDERS,
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : DEFAULT_REVIEWS,
      coupons: Array.isArray(parsed.coupons) ? parsed.coupons : DEFAULT_COUPONS,
      settings: parsed.settings || DEFAULT_SETTINGS,
    };
    if (migrated) {
      saveDb(resultDb);
    }
    return resultDb;
  } catch (err) {
    console.error('Failed to read store.json, initializing fresh database:', err);
    const initial = createInitialDb();
    saveDb(initial);
    return initial;
  }
}

function saveDb(db: StoreDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${STORE_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, STORE_FILE);
}

let db: StoreDatabase = loadDb();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPasswordHash(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  try {
    const keyBuf = Buffer.from(keyHex, 'hex');
    const derivedBuf = crypto.scryptSync(password, salt, 64);
    if (keyBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
  } catch {
    return false;
  }
}

function safeEqualStrings(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function normalizePhone(phone: string): string {
  return phone.trim().replace(/[\s-]/g, '').replace(/^(\+88)/, '');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  const cleaned = normalizePhone(phone);
  return /^01[3-9]\d{8}$/.test(cleaned) || /^\d{8,15}$/.test(cleaned);
}

function sanitizeUser(u: StoredUser): User {
  const { passwordHash: _ignored, ...safe } = u;
  return safe;
}

interface SessionPayload {
  userId: string;
  role: 'admin' | 'customer';
  email?: string;
  jti: string;
  exp: number;
}

const revokedTokenIds = new Map<string, number>();

function revokeToken(token: string): void {
  const payload = verifySessionToken(token);
  if (payload?.jti) {
    revokedTokenIds.set(payload.jti, payload.exp);
  }
  const now = Date.now();
  for (const [id, exp] of revokedTokenIds.entries()) {
    if (exp <= now) revokedTokenIds.delete(id);
  }
}

function signSessionToken(user: StoredUser): string {
  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    email: user.email ? normalizeEmail(user.email) : undefined,
    jti: crypto.randomBytes(16).toString('hex'),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  if (!safeEqualStrings(sig, expectedSig)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as SessionPayload;
    if (!payload.userId || !payload.jti || !payload.exp || payload.exp < Date.now()) {
      return null;
    }
    if (revokedTokenIds.has(payload.jti)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function getEnvAdminCredentials(): { email: string; password: string } | null {
  let email = normalizeEmail(process.env.ADMIN_EMAIL || '');
  if (email === 'sabik8078b@gmail.com') {
    email = 'sakib8078b@gmail.com';
  }
  const password = (process.env.ADMIN_PASSWORD || '').trim();
  if (!email || !password) return null;
  return { email, password };
}

function hasClaimedAdmin(): boolean {
  return db.users.some((u) => u.role === 'admin' && Boolean(u.passwordHash));
}

function getAuthUserFromRequest(req: Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const payload = verifySessionToken(token);
  if (!payload) return null;
  const user = db.users.find((u) => u.id === payload.userId) || null;
  if (!user) return null;
  if (payload.role !== user.role) return null;
  if (payload.email && user.email && normalizeEmail(user.email) !== payload.email) {
    return null;
  }
  return user;
}

interface AuthedRequest extends Request {
  authUser?: StoredUser;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = getAuthUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'অনুগ্রহ করে আগে সাইন ইন করুন।' });
    return;
  }
  req.authUser = user;
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = getAuthUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'অ্যাডমিন প্যানেলে প্রবেশের জন্য সাইন ইন করুন।' });
    return;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'শুধুমাত্র অ্যাডমিন এই অ্যাকশনটি পরিচালনা করতে পারবেন।' });
    return;
  }
  const envAdmin = getEnvAdminCredentials();
  if (envAdmin && normalizeEmail(user.email || '') !== envAdmin.email) {
    res.status(403).json({ error: 'অননুমোদিত অ্যাডমিন অ্যাকাউন্ট প্রত্যাখ্যাত হয়েছে।' });
    return;
  }
  req.authUser = user;
  next();
}

const authLimiter = createRateLimiter(
  25,
  15 * 60 * 1000,
  'অতিরিক্ত অনুরোধ করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।'
);
const trackLimiter = createRateLimiter(
  30,
  5 * 60 * 1000,
  'অনুগ্রহ করে কিছুক্ষণ পর আবার অর্ডার ট্র্যাক করুন।'
);
const writeLimiter = createRateLimiter(
  25,
  15 * 60 * 1000,
  'অতিরিক্ত অনুরোধ করা হয়েছে। কিছুক্ষণ অপেক্ষা করে চেষ্টা করুন।'
);

// ============================================================================
// AUTHENTICATION ROUTES (Phone or Gmail/Email + Admin Claim / Login)
// ============================================================================

app.get('/api/auth/admin-status', (_req: Request, res: Response) => {
  const envAdmin = Boolean(getEnvAdminCredentials());
  const claimed = hasClaimedAdmin();
  res.json({
    adminConfigured: envAdmin || claimed,
    canClaimAdmin: !envAdmin && !claimed,
  });
});

app.post('/api/auth/claim-admin', authLimiter, (req: Request, res: Response) => {
  if (getEnvAdminCredentials() || hasClaimedAdmin()) {
    res.status(403).json({
      error: 'অ্যাডমিন অ্যাকাউন্ট ইতিমধ্যেই সেটআপ করা হয়েছে। সরাসরি সাইন ইন করুন।',
    });
    return;
  }

  const rawEmail = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
  const rawPhone = typeof req.body?.phone === 'string' ? normalizePhone(req.body.phone) : '';
  const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : 'KYNZO Admin';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!rawEmail || !isValidEmail(rawEmail)) {
    res.status(400).json({ error: 'সঠিক Gmail / Email লিখুন।' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'অ্যাডমিন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।' });
    return;
  }
  if (rawPhone && !isValidPhone(rawPhone)) {
    res.status(400).json({ error: 'সঠিক মোবাইল নম্বর দিন অথবা খালি রাখুন।' });
    return;
  }

  const existing = db.users.find(
    (u) =>
      (u.email && normalizeEmail(u.email) === rawEmail) ||
      (rawPhone && u.phone && normalizePhone(u.phone) === rawPhone)
  );

  const passwordHash = hashPassword(password);
  let adminUser: StoredUser;

  if (existing) {
    existing.role = 'admin';
    existing.email = rawEmail;
    if (rawPhone) existing.phone = rawPhone;
    if (rawName) existing.name = rawName;
    existing.passwordHash = passwordHash;
    adminUser = existing;
  } else {
    adminUser = {
      id: `usr-admin-${Date.now()}`,
      name: rawName || 'KYNZO Store Admin',
      email: rawEmail,
      phone: rawPhone,
      role: 'admin',
      address: db.settings.address,
      district: 'Dhaka',
      createdAt: new Date().toISOString().substring(0, 10),
      passwordHash,
    };
    db.users.push(adminUser);
  }

  saveDb(db);
  const token = signSessionToken(adminUser);
  res.status(201).json({ token, user: sanitizeUser(adminUser) });
});

app.post('/api/auth/register', authLimiter, (req: Request, res: Response) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const rawPhone = typeof req.body?.phone === 'string' ? normalizePhone(req.body.phone) : '';
  const rawEmail = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';
  const district = typeof req.body?.district === 'string' ? req.body.district.trim() : 'Dhaka';

  if (name.length < 2) {
    res.status(400).json({ error: 'আপনার পূর্ণ নাম লিখুন।' });
    return;
  }
  if (!rawPhone && !rawEmail) {
    res.status(400).json({ error: 'অন্তত মোবাইল নম্বর অথবা Gmail লিখুন।' });
    return;
  }
  if (rawPhone && !isValidPhone(rawPhone)) {
    res.status(400).json({ error: 'সঠিক মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)।' });
    return;
  }
  if (rawEmail && !isValidEmail(rawEmail)) {
    res.status(400).json({ error: 'সঠিক Gmail / Email ঠিকানা দিন।' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
    return;
  }

  if (rawPhone && db.users.some((u) => u.phone && normalizePhone(u.phone) === rawPhone)) {
    res.status(409).json({ error: 'এই মোবাইল নম্বরে ইতিমধ্যে অ্যাকাউন্ট রয়েছে। সাইন ইন করুন।' });
    return;
  }
  if (rawEmail && db.users.some((u) => u.email && normalizeEmail(u.email) === rawEmail)) {
    res.status(409).json({ error: 'এই Gmail/Email দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে। সাইন ইন করুন।' });
    return;
  }

  const envAdmin = getEnvAdminCredentials();
  if (
    (envAdmin && rawEmail === envAdmin.email) ||
    rawEmail === 'sakib8078b@gmail.com' ||
    rawEmail === 'sabik8078b@gmail.com'
  ) {
    res.status(409).json({ error: 'এই ইমেইলটি সংরক্ষিত। সরাসরি সাইন ইন করুন।' });
    return;
  }

  const newUser: StoredUser = {
    id: `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    name,
    phone: rawPhone,
    email: rawEmail || undefined,
    role: 'customer',
    address,
    district: district || 'Dhaka',
    createdAt: new Date().toISOString().substring(0, 10),
    passwordHash: hashPassword(password),
  };

  db.users.push(newUser);
  saveDb(db);

  const token = signSessionToken(newUser);
  res.status(201).json({ token, user: sanitizeUser(newUser) });
});

app.post('/api/auth/login', authLimiter, (req: Request, res: Response) => {
  const identifierRaw =
    typeof req.body?.identifier === 'string'
      ? req.body.identifier.trim()
      : typeof req.body?.phone === 'string'
      ? req.body.phone.trim()
      : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!identifierRaw || !password) {
    res.status(400).json({ error: 'মোবাইল নম্বর / Gmail এবং পাসওয়ার্ড দিন।' });
    return;
  }

  const lockSecs = checkLoginLockout(req, identifierRaw);
  if (lockSecs > 0) {
    res.setHeader('Retry-After', String(lockSecs));
    res.status(429).json({
      error: `অতিরিক্ত ভুল লগইন চেষ্টার কারণে ${Math.ceil(
        lockSecs / 60
      )} মিনিট পর আবার চেষ্টা করুন।`,
    });
    return;
  }

  const isEmailInput = identifierRaw.includes('@');
  const normEmail = isEmailInput ? normalizeEmail(identifierRaw) : '';
  const normPhone = !isEmailInput ? normalizePhone(identifierRaw) : '';

  // Environment-configured admin always takes precedence
  const envAdmin = getEnvAdminCredentials();
  if (envAdmin && isEmailInput && normEmail === envAdmin.email) {
    if (!safeEqualStrings(password, envAdmin.password)) {
      recordLoginFailure(req, identifierRaw);
      res.status(401).json({ error: 'ভুল ইমেইল অথবা পাসওয়ার্ড।' });
      return;
    }

    clearLoginFailures(req, identifierRaw);
    let adminUser = db.users.find(
      (u) =>
        (u.email && normalizeEmail(u.email) === envAdmin.email) ||
        u.id === 'usr-admin-env'
    );
    if (!adminUser) {
      adminUser = {
        id: `usr-admin-env`,
        name: 'KYNZO Store Admin',
        email: envAdmin.email,
        phone: '',
        role: 'admin',
        address: db.settings.address,
        district: 'Dhaka',
        createdAt: new Date().toISOString().substring(0, 10),
        passwordHash: '',
      };
      db.users.push(adminUser);
    } else {
      adminUser.email = envAdmin.email;
      adminUser.role = 'admin';
    }
    saveDb(db);
    const token = signSessionToken(adminUser);
    res.json({ token, user: sanitizeUser(adminUser) });
    return;
  }

  const user = db.users.find((u) => {
    if (isEmailInput) {
      return Boolean(u.email && normalizeEmail(u.email) === normEmail);
    }
    return Boolean(u.phone && normalizePhone(u.phone) === normPhone);
  });

  if (
    !user ||
    (envAdmin && user.role === 'admin' && normalizeEmail(user.email || '') !== envAdmin.email) ||
    !user.passwordHash ||
    !verifyPasswordHash(password, user.passwordHash)
  ) {
    recordLoginFailure(req, identifierRaw);
    res.status(401).json({
      error: 'ভুল মোবাইল নম্বর / Gmail অথবা পাসওয়ার্ড।',
    });
    return;
  }

  clearLoginFailures(req, identifierRaw);
  const token = signSessionToken(user);
  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    revokeToken(authHeader.slice(7).trim());
  }
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
  res.json({ user: sanitizeUser(req.authUser!) });
});

app.patch('/api/auth/profile', requireAuth, (req: AuthedRequest, res: Response) => {
  const user = req.authUser!;
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : user.name;
  const nextPhone =
    typeof req.body?.phone === 'string' ? normalizePhone(req.body.phone) : user.phone;
  const nextEmail =
    typeof req.body?.email === 'string'
      ? normalizeEmail(req.body.email)
      : user.email || '';
  const address =
    typeof req.body?.address === 'string' ? req.body.address.trim() : user.address || '';
  const district =
    typeof req.body?.district === 'string' ? req.body.district.trim() : user.district || 'Dhaka';

  if (name.length < 2) {
    res.status(400).json({ error: 'সঠিক নাম লিখুন।' });
    return;
  }
  if (!nextPhone && !nextEmail) {
    res.status(400).json({ error: 'মোবাইল নম্বর অথবা Gmail অন্তত একটি থাকতে হবে।' });
    return;
  }
  if (nextPhone && !isValidPhone(nextPhone)) {
    res.status(400).json({ error: 'সঠিক মোবাইল নম্বর দিন।' });
    return;
  }
  if (nextEmail && !isValidEmail(nextEmail)) {
    res.status(400).json({ error: 'সঠিক Gmail / Email দিন।' });
    return;
  }
  if (
    nextPhone &&
    db.users.some((u) => u.id !== user.id && u.phone && normalizePhone(u.phone) === nextPhone)
  ) {
    res.status(409).json({ error: 'এই মোবাইল নম্বর অন্য অ্যাকাউন্টে ব্যবহৃত হচ্ছে।' });
    return;
  }
  if (
    nextEmail &&
    db.users.some((u) => u.id !== user.id && u.email && normalizeEmail(u.email) === nextEmail)
  ) {
    res.status(409).json({ error: 'এই Gmail অন্য অ্যাকাউন্টে ব্যবহৃত হচ্ছে।' });
    return;
  }

  user.name = name;
  user.phone = nextPhone;
  user.email = nextEmail || undefined;
  user.address = address;
  user.district = district;

  saveDb(db);
  res.json({ user: sanitizeUser(user) });
});

// ============================================================================
// PUBLIC STOREFRONT & ORDER ROUTES
// ============================================================================

app.get('/api/store', (_req: Request, res: Response) => {
  const envAdmin = Boolean(getEnvAdminCredentials());
  const claimed = hasClaimedAdmin();
  res.json({
    products: db.products,
    categories: db.categories,
    reviews: db.reviews,
    coupons: db.coupons.filter((c) => c.isActive),
    settings: db.settings,
    adminConfigured: envAdmin || claimed,
    canClaimAdmin: !envAdmin && !claimed,
  });
});

function sanitizePublicOrder(o: Order): Order {
  const maskPhone = (p: string) =>
    p.length >= 6 ? `${p.slice(0, 3)}****${p.slice(-4)}` : '****';
  const maskName = (n: string) =>
    n
      .split(/\s+/)
      .map((part) => (part.length > 1 ? `${part[0]}***` : part))
      .join(' ');
  return {
    ...o,
    customerName: maskName(o.customerName),
    customerPhone: maskPhone(o.customerPhone),
    customerEmail: undefined,
    customerAddress: o.district ? `${o.district} (Privacy Protected)` : 'Privacy Protected',
    senderNumber: undefined,
    transactionId: undefined,
    notes: undefined,
  };
}

app.get('/api/orders/track', trackLimiter, (req: Request, res: Response) => {
  const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
  if (!rawQuery) {
    res.json({ order: null });
    return;
  }
  const cleanPhoneQ = normalizePhone(rawQuery);
  const found = db.orders.find(
    (o) =>
      o.id.toLowerCase() === rawQuery ||
      o.trackingCode.toLowerCase() === rawQuery ||
      (cleanPhoneQ.length >= 8 && normalizePhone(o.customerPhone) === cleanPhoneQ)
  );
  if (!found) {
    res.json({ order: null });
    return;
  }
  const authUser = getAuthUserFromRequest(req);
  const isOwnerOrAdmin =
    Boolean(authUser) &&
    (authUser!.role === 'admin' ||
      (found.userId && found.userId === authUser!.id) ||
      (authUser!.phone && normalizePhone(authUser!.phone) === normalizePhone(found.customerPhone)));
  res.json({ order: isOwnerOrAdmin ? found : sanitizePublicOrder(found) });
});

app.get('/api/my-orders', requireAuth, (req: AuthedRequest, res: Response) => {
  const user = req.authUser!;
  const cleanUserPhone = user.phone ? normalizePhone(user.phone) : '';
  const cleanUserEmail = user.email ? normalizeEmail(user.email) : '';

  const matched = db.orders.filter(
    (o) =>
      o.userId === user.id ||
      (cleanUserPhone && normalizePhone(o.customerPhone) === cleanUserPhone) ||
      (cleanUserEmail && o.customerEmail && normalizeEmail(o.customerEmail) === cleanUserEmail)
  );
  res.json({ orders: matched });
});

app.post('/api/orders', writeLimiter, (req: Request, res: Response) => {
  const authUser = getAuthUserFromRequest(req);
  const body = req.body || {};

  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const customerPhone =
    typeof body.customerPhone === 'string' ? normalizePhone(body.customerPhone) : '';
  const customerEmail =
    typeof body.customerEmail === 'string'
      ? normalizeEmail(body.customerEmail)
      : authUser?.email || '';
  const customerAddress =
    typeof body.customerAddress === 'string' ? body.customerAddress.trim() : '';
  const district = typeof body.district === 'string' ? body.district.trim() : 'Dhaka';
  const division = typeof body.division === 'string' ? body.division.trim() : '';
  const deliveryArea =
    body.deliveryArea === 'inside_dhaka' ||
    body.deliveryArea === 'sub_dhaka' ||
    body.deliveryArea === 'outside_dhaka'
      ? body.deliveryArea
      : 'inside_dhaka';
  const paymentMethod =
    body.paymentMethod === 'COD' || body.paymentMethod === 'bKash' || body.paymentMethod === 'Nagad'
      ? body.paymentMethod
      : 'COD';
  const senderNumber = typeof body.senderNumber === 'string' ? body.senderNumber.trim() : undefined;
  const transactionId =
    typeof body.transactionId === 'string' ? body.transactionId.trim().toUpperCase() : undefined;
  const couponCode =
    typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : undefined;
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (!customerName || !customerPhone || !customerAddress || rawItems.length === 0) {
    res.status(400).json({ error: 'নাম, মোবাইল নম্বর, ঠিকানা এবং অন্তত ১টি গ্যাজেট প্রয়োজন।' });
    return;
  }

  if (paymentMethod !== 'COD' && (!senderNumber || !transactionId)) {
    res.status(400).json({
      error: `${paymentMethod} সেন্ডার নম্বর এবং TrxID প্রদান করুন।`,
    });
    return;
  }

  const verifiedItems: Order['items'] = [];
  let subtotal = 0;
  let codBlocked = false;

  for (const item of rawItems) {
    const prod = db.products.find((p) => p.id === item?.productId);
    const qty = Math.max(1, Math.min(50, Math.floor(Number(item?.quantity) || 1)));
    const weight =
      typeof item?.weight === 'string' && item.weight.trim()
        ? item.weight.trim()
        : prod?.weights[0] || 'Standard';

    if (!prod) {
      res.status(400).json({ error: 'একটি নির্বাচিত গ্যাজেট পাওয়া যায়নি।' });
      return;
    }
    if (!prod.inStock || prod.stockQuantity < qty) {
      res.status(400).json({ error: `"${prod.name}" পর্যাপ্ত স্টকে নেই।` });
      return;
    }
    if (prod.isCodAvailable === false) {
      codBlocked = true;
    }
    const mult = prod.weightPriceMultipliers?.[weight] ?? 1;
    const unitPrice = Math.round(prod.price * mult);
    subtotal += unitPrice * qty;

    verifiedItems.push({
      productId: prod.id,
      name: prod.name,
      price: unitPrice,
      quantity: qty,
      weight,
      image: prod.image,
    });
  }

  if (codBlocked && paymentMethod === 'COD') {
    res.status(400).json({
      error: 'আপনার কার্টে প্রিমিয়াম গ্যাজেট থাকায় bKash বা Nagad ব্যবহার করুন।',
    });
    return;
  }

  const deliveryFee =
    deliveryArea === 'inside_dhaka'
      ? db.settings.insideDhakaFee || 70
      : deliveryArea === 'sub_dhaka'
      ? db.settings.subDhakaFee || 100
      : db.settings.outsideDhakaFee || 130;

  let discount = 0;
  let appliedCouponCode: string | undefined;
  if (couponCode) {
    const cpn = db.coupons.find((c) => c.code.toUpperCase() === couponCode && c.isActive);
    if (cpn && subtotal >= cpn.minOrderAmount) {
      discount =
        cpn.discountType === 'percentage'
          ? Math.round((subtotal * cpn.discountValue) / 100)
          : cpn.discountValue;
      appliedCouponCode = cpn.code;
    }
  }

  const total = Math.max(0, subtotal + deliveryFee - discount);
  const id = `KYN-${Math.floor(10000 + Math.random() * 90000)}`;
  const trackingCode = `PT-${Math.floor(1000000 + Math.random() * 9000000)}`;
  const now = new Date();
  const date = now.toISOString().replace('T', ' ').substring(0, 16);
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newOrder: Order = {
    id,
    date,
    userId: authUser?.id,
    customerName,
    customerPhone,
    customerEmail: customerEmail || undefined,
    customerAddress,
    district,
    division: division || undefined,
    deliveryArea,
    deliveryFee,
    items: verifiedItems,
    subtotal,
    discount,
    couponCode: appliedCouponCode,
    total,
    paymentMethod,
    paymentStatus:
      paymentMethod === 'COD'
        ? 'Unpaid (Cash on Delivery)'
        : `Pending Verification (${paymentMethod})`,
    senderNumber,
    transactionId,
    status: 'Pending',
    courierPartner: 'Pathao Courier',
    trackingCode,
    notes,
    timeline: [
      {
        status: 'Pending',
        title: 'Order Placed',
        time: timeStr,
        done: true,
        description: `Order placed via ${paymentMethod}`,
      },
      {
        status: 'Confirmed',
        title: 'Order Confirmation',
        time: 'Pending',
        done: false,
        description: 'Our support team will verify your items',
      },
      {
        status: 'Packaging',
        title: 'Packaging & Quality Check',
        time: 'Pending',
        done: false,
        description: 'QC tested & sealed with shockproof bubble wrap',
      },
      {
        status: 'Shipped',
        title: 'Dispatched via Courier',
        time: 'Pending',
        done: false,
        description: `Assigned tracking code: ${trackingCode}`,
      },
      {
        status: 'Out for Delivery',
        title: 'Out for Delivery',
        time: 'Pending',
        done: false,
        description: 'Rider is on the way to your doorstep',
      },
      {
        status: 'Delivered',
        title: 'Delivered',
        time: 'Pending',
        done: false,
        description: 'Customer accepted delivery',
      },
    ],
  };

  // Decrement stock cleanly
  for (const item of verifiedItems) {
    const prod = db.products.find((p) => p.id === item.productId);
    if (prod) {
      prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
      if (prod.stockQuantity === 0) {
        prod.inStock = false;
      }
    }
  }

  db.orders.unshift(newOrder);
  saveDb(db);

  res.status(201).json({ order: newOrder, products: db.products });
});

app.post('/api/reviews', writeLimiter, (req: Request, res: Response) => {
  const userName = sanitizePlainText(req.body?.userName, 80);
  const userLocation = sanitizePlainText(req.body?.userLocation, 80) || 'ঢাকা';
  const comment = sanitizePlainText(req.body?.comment, 1000);
  const rating = Math.min(5, Math.max(1, Number(req.body?.rating) || 5));
  const productId =
    typeof req.body?.productId === 'string'
      ? sanitizePlainText(req.body.productId, 80) || undefined
      : undefined;

  if (!userName || !comment) {
    res.status(400).json({ error: 'নাম এবং রিভিউ মন্তব্য লিখুন।' });
    return;
  }

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId,
    userName,
    userLocation: userLocation || 'ঢাকা',
    rating,
    comment,
    date: 'আজকে',
    verified: true,
  };

  db.reviews.unshift(newReview);
  saveDb(db);
  res.status(201).json({ review: newReview, reviews: db.reviews });
});

// ============================================================================
// ADMIN A-TO-Z MANAGEMENT ROUTES
// ============================================================================

app.get('/api/admin/dashboard', requireAdmin, (_req: AuthedRequest, res: Response) => {
  const usersWithStats = db.users.map((u) => {
    const safe = sanitizeUser(u);
    const cleanP = u.phone ? normalizePhone(u.phone) : '';
    const cleanE = u.email ? normalizeEmail(u.email) : '';
    const userOrders = db.orders.filter(
      (o) =>
        o.userId === u.id ||
        (cleanP && normalizePhone(o.customerPhone) === cleanP) ||
        (cleanE && o.customerEmail && normalizeEmail(o.customerEmail) === cleanE)
    );
    const totalSpent = userOrders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      ...safe,
      ordersCount: userOrders.length,
      totalSpent,
    };
  });

  res.json({
    orders: db.orders,
    users: usersWithStats,
    products: db.products,
    categories: db.categories,
    coupons: db.coupons,
    reviews: db.reviews,
    settings: db.settings,
  });
});

app.patch('/api/admin/orders/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  const orderId = req.params.id;
  const idx = db.orders.findIndex((o) => o.id === orderId);
  if (idx === -1) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const order = { ...db.orders[idx] };
  const body = req.body || {};

  if (typeof body.status === 'string') {
    order.status = body.status as OrderStatus;
    const sequence: string[] = [
      'Pending',
      'Confirmed',
      'Packaging',
      'Shipped',
      'Out for Delivery',
      'Delivered',
    ];
    const targetIdx = sequence.indexOf(body.status);
    order.timeline = order.timeline.map((step) => {
      const stepIdx = sequence.indexOf(step.status);
      if (stepIdx <= targetIdx && stepIdx !== -1) {
        return {
          ...step,
          done: true,
          time: step.done
            ? step.time
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return { ...step, done: false };
    });

    if (body.status === 'Delivered' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'Paid';
    }
  }

  if (typeof body.paymentStatus === 'string' && body.paymentStatus.trim()) {
    order.paymentStatus = body.paymentStatus.trim();
  }
  if (typeof body.courierPartner === 'string' && body.courierPartner.trim()) {
    order.courierPartner = body.courierPartner.trim();
  }
  if (typeof body.trackingCode === 'string' && body.trackingCode.trim()) {
    order.trackingCode = body.trackingCode.trim();
  }
  if (typeof body.notes === 'string') {
    order.notes = body.notes.trim();
  }
  if (typeof body.customerAddress === 'string' && body.customerAddress.trim()) {
    order.customerAddress = body.customerAddress.trim();
  }
  if (typeof body.district === 'string' && body.district.trim()) {
    order.district = body.district.trim();
  }

  db.orders[idx] = order;
  saveDb(db);
  res.json({ order, orders: db.orders });
});

app.delete('/api/admin/orders/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  db.orders = db.orders.filter((o) => o.id !== req.params.id);
  saveDb(db);
  res.json({ ok: true, orders: db.orders });
});

app.patch('/api/admin/users/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  const userIdx = db.users.findIndex((u) => u.id === req.params.id);
  if (userIdx === -1) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  const target = db.users[userIdx];
  const body = req.body || {};

  if (typeof body.name === 'string' && body.name.trim().length >= 2) {
    target.name = body.name.trim();
  }
  if (typeof body.phone === 'string') {
    target.phone = normalizePhone(body.phone);
  }
  if (typeof body.email === 'string') {
    target.email = body.email.trim() ? normalizeEmail(body.email) : undefined;
  }
  if (typeof body.address === 'string') {
    target.address = body.address.trim();
  }
  if (typeof body.district === 'string') {
    target.district = body.district.trim();
  }
  if (body.role === 'admin' || body.role === 'customer') {
    const envAdmin = getEnvAdminCredentials();
    if (body.role === 'admin' && envAdmin && normalizeEmail(target.email || '') !== envAdmin.email) {
      res.status(403).json({ error: 'শুধুমাত্র নির্ধারিত অ্যাডমিন Gmail-ই অ্যাডমিন থাকতে পারবেন।' });
      return;
    }
    if (target.id === req.authUser!.id && body.role !== 'admin') {
      res.status(400).json({ error: 'নিজের অ্যাডমিন রোল রিমুভ করা যাবে না।' });
      return;
    }
    target.role = body.role;
  }
  if (typeof body.newPassword === 'string' && body.newPassword.length >= 6) {
    target.passwordHash = hashPassword(body.newPassword);
  }

  saveDb(db);
  res.json({ user: sanitizeUser(target) });
});

app.delete('/api/admin/users/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  if (req.params.id === req.authUser!.id) {
    res.status(400).json({ error: 'নিজের অ্যাডমিন অ্যাকাউন্ট মুছা যাবে না।' });
    return;
  }
  db.users = db.users.filter((u) => u.id !== req.params.id);
  saveDb(db);
  res.json({ ok: true });
});

function sanitizeProductInput(raw: Record<string, unknown>): Product | null {
  const id = sanitizePlainText(raw.id, 80);
  const name = sanitizePlainText(raw.name, 160);
  if (!id || !name) return null;
  const price = Math.max(0, Number(raw.price) || 0);
  const originalPrice = Math.max(price, Number(raw.originalPrice) || price);
  const stockQuantity = Math.max(0, Math.floor(Number(raw.stockQuantity) || 0));
  const safeImage = sanitizeImageUrl(raw.image);
  const rawGallery = Array.isArray(raw.gallery) ? raw.gallery : [safeImage];
  const gallery = rawGallery
    .map((g) => sanitizeImageUrl(g, safeImage))
    .slice(0, 8);
  const weights = Array.isArray(raw.weights)
    ? raw.weights.map((w) => sanitizePlainText(w, 60)).filter(Boolean).slice(0, 12)
    : ['Standard'];
  return {
    id,
    name,
    category: sanitizePlainText(raw.category, 80) || 'Smartwatches',
    price,
    originalPrice,
    discountPercent: Math.max(0, Math.min(99, Number(raw.discountPercent) || 0)),
    isBestSelling: Boolean(raw.isBestSelling),
    isFlashSale: Boolean(raw.isFlashSale),
    inStock: stockQuantity > 0 && raw.inStock !== false,
    stockQuantity,
    image: safeImage,
    gallery: gallery.length > 0 ? gallery : [safeImage],
    weights: weights.length > 0 ? weights : ['Standard'],
    weightPriceMultipliers:
      raw.weightPriceMultipliers && typeof raw.weightPriceMultipliers === 'object'
        ? Object.fromEntries(
            Object.entries(raw.weightPriceMultipliers as Record<string, unknown>)
              .slice(0, 12)
              .map(([k, v]) => [sanitizePlainText(k, 60), Math.max(0.1, Number(v) || 1)])
          )
        : undefined,
    rating: Math.min(5, Math.max(1, Number(raw.rating) || 4.9)),
    reviewsCount: Math.max(0, Math.floor(Number(raw.reviewsCount) || 0)),
    unit: sanitizePlainText(raw.unit, 30) || 'Unit',
    shortDesc: sanitizePlainText(raw.shortDesc, 300) || name,
    description: sanitizePlainText(raw.description, 2000) || name,
    isCodAvailable: raw.isCodAvailable !== false,
  };
}

app.post('/api/admin/products', requireAdmin, (req: AuthedRequest, res: Response) => {
  const product = sanitizeProductInput((req.body || {}) as Record<string, unknown>);
  if (!product) {
    res.status(400).json({ error: 'Product ID and name are required.' });
    return;
  }
  const idx = db.products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    db.products[idx] = product;
  } else {
    db.products.unshift(product);
  }
  saveDb(db);
  res.json({ product, products: db.products });
});

app.delete('/api/admin/products/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  db.products = db.products.filter((p) => p.id !== req.params.id);
  saveDb(db);
  res.json({ ok: true, products: db.products });
});

app.post('/api/admin/categories', requireAdmin, (req: AuthedRequest, res: Response) => {
  const body = (req.body || {}) as Record<string, unknown>;
  const id = sanitizePlainText(body.id, 80);
  const name = sanitizePlainText(body.name, 80);
  if (!id || !name) {
    res.status(400).json({ error: 'Category ID and name are required.' });
    return;
  }
  const category: Category = {
    id,
    name,
    slug: sanitizePlainText(body.slug, 80) || name.toLowerCase().replace(/\s+/g, '-'),
    image: sanitizeImageUrl(body.image),
    itemCount: Math.max(0, Math.floor(Number(body.itemCount) || 0)),
  };
  const idx = db.categories.findIndex((c) => c.id === category.id);
  if (idx >= 0) {
    db.categories[idx] = category;
  } else {
    db.categories.push(category);
  }
  saveDb(db);
  res.json({ category, categories: db.categories });
});

app.delete('/api/admin/categories/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  db.categories = db.categories.filter((c) => c.id !== req.params.id);
  saveDb(db);
  res.json({ ok: true, categories: db.categories });
});

app.post('/api/admin/coupons', requireAdmin, (req: AuthedRequest, res: Response) => {
  const body = (req.body || {}) as Record<string, unknown>;
  const id = sanitizePlainText(body.id, 80);
  const code = sanitizePlainText(body.code, 40).toUpperCase();
  if (!id || !code) {
    res.status(400).json({ error: 'Coupon ID and code are required.' });
    return;
  }
  const coupon: Coupon = {
    id,
    code,
    discountType: body.discountType === 'percentage' ? 'percentage' : 'fixed',
    discountValue: Math.max(0, Number(body.discountValue) || 0),
    minOrderAmount: Math.max(0, Number(body.minOrderAmount) || 0),
    description: sanitizePlainText(body.description, 200),
    isActive: body.isActive !== false,
  };
  const idx = db.coupons.findIndex((c) => c.id === coupon.id);
  if (idx >= 0) {
    db.coupons[idx] = coupon;
  } else {
    db.coupons.unshift(coupon);
  }
  saveDb(db);
  res.json({ coupon, coupons: db.coupons });
});

app.delete('/api/admin/coupons/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  db.coupons = db.coupons.filter((c) => c.id !== req.params.id);
  saveDb(db);
  res.json({ ok: true, coupons: db.coupons });
});

app.post('/api/admin/reviews', requireAdmin, (req: AuthedRequest, res: Response) => {
  const body = req.body || {};
  const rev: Review = {
    id: `rev-${Date.now()}`,
    userName: sanitizePlainText(body.userName, 80),
    userLocation: sanitizePlainText(body.userLocation, 80) || 'ঢাকা',
    rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
    comment: sanitizePlainText(body.comment, 1000),
    date: sanitizePlainText(body.date, 40) || 'আজকে',
    verified: body.verified !== false,
    productId: typeof body.productId === 'string' ? sanitizePlainText(body.productId, 80) || undefined : undefined,
  };
  if (!rev.userName || !rev.comment) {
    res.status(400).json({ error: 'Review name and comment required.' });
    return;
  }
  db.reviews.unshift(rev);
  saveDb(db);
  res.status(201).json({ review: rev, reviews: db.reviews });
});

app.patch('/api/admin/reviews/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  const idx = db.reviews.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Review not found.' });
    return;
  }
  const existing = db.reviews[idx];
  const body = (req.body || {}) as Record<string, unknown>;
  db.reviews[idx] = {
    ...existing,
    userName: typeof body.userName === 'string' ? sanitizePlainText(body.userName, 80) || existing.userName : existing.userName,
    userLocation: typeof body.userLocation === 'string' ? sanitizePlainText(body.userLocation, 80) || existing.userLocation : existing.userLocation,
    rating: body.rating !== undefined ? Math.min(5, Math.max(1, Number(body.rating) || existing.rating)) : existing.rating,
    comment: typeof body.comment === 'string' ? sanitizePlainText(body.comment, 1000) || existing.comment : existing.comment,
    date: typeof body.date === 'string' ? sanitizePlainText(body.date, 40) || existing.date : existing.date,
    verified: typeof body.verified === 'boolean' ? body.verified : existing.verified,
    productId: typeof body.productId === 'string' ? sanitizePlainText(body.productId, 80) || undefined : existing.productId,
  };
  saveDb(db);
  res.json({ review: db.reviews[idx], reviews: db.reviews });
});

app.delete('/api/admin/reviews/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  db.reviews = db.reviews.filter((r) => r.id !== req.params.id);
  saveDb(db);
  res.json({ ok: true, reviews: db.reviews });
});

function sanitizeSettingsInput(raw: Record<string, unknown>, base: StoreSettings): StoreSettings {
  const slidesRaw = Array.isArray(raw.heroSlides) ? raw.heroSlides : base.heroSlides;
  const heroSlides = (slidesRaw || []).slice(0, 10).map((s, idx) => {
    const slide = (s || {}) as Record<string, unknown>;
    return {
      id: Number(slide.id) || idx + 1,
      badge: sanitizePlainText(slide.badge, 60) || 'FLAGSHIP',
      title: sanitizePlainText(slide.title, 160) || 'KYNZO Smart Tech',
      subtitle: sanitizePlainText(slide.subtitle, 300) || '',
      cta: sanitizePlainText(slide.cta, 40) || 'Shop Now',
      image: sanitizeImageUrl(slide.image, base.heroSlides[0]?.image || '/assets/aistudio/hero.jpg'),
      category: sanitizePlainText(slide.category, 80) || 'Smartwatches',
      badgeColor: sanitizePlainText(slide.badgeColor, 40) || 'bg-blue-500',
    };
  });
  const socialRaw = (raw.socialLinks && typeof raw.socialLinks === 'object' ? raw.socialLinks : {}) as Record<string, unknown>;
  const noticeRaw = (raw.popupNotice && typeof raw.popupNotice === 'object' ? raw.popupNotice : {}) as Record<string, unknown>;

  return {
    ...base,
    storeName: typeof raw.storeName === 'string' ? sanitizePlainText(raw.storeName, 80) || base.storeName : base.storeName,
    announcement: typeof raw.announcement === 'string' ? sanitizePlainText(raw.announcement, 240) : base.announcement,
    hotline: typeof raw.hotline === 'string' ? sanitizePlainText(raw.hotline, 30) : base.hotline,
    whatsapp: typeof raw.whatsapp === 'string' ? sanitizePlainText(raw.whatsapp, 30) : base.whatsapp,
    email: typeof raw.email === 'string' ? sanitizePlainText(raw.email, 120) : base.email,
    address: typeof raw.address === 'string' ? sanitizePlainText(raw.address, 240) : base.address,
    bkashMerchant: typeof raw.bkashMerchant === 'string' ? sanitizePlainText(raw.bkashMerchant, 30) : base.bkashMerchant,
    nagadMerchant: typeof raw.nagadMerchant === 'string' ? sanitizePlainText(raw.nagadMerchant, 30) : base.nagadMerchant,
    rocketMerchant: typeof raw.rocketMerchant === 'string' ? sanitizePlainText(raw.rocketMerchant, 30) : base.rocketMerchant,
    logoUrl: typeof raw.logoUrl === 'string' ? sanitizeImageUrl(raw.logoUrl, base.logoUrl) : base.logoUrl,
    insideDhakaFee: raw.insideDhakaFee !== undefined ? Math.max(0, Number(raw.insideDhakaFee) || 0) : base.insideDhakaFee,
    subDhakaFee: raw.subDhakaFee !== undefined ? Math.max(0, Number(raw.subDhakaFee) || 0) : base.subDhakaFee,
    outsideDhakaFee: raw.outsideDhakaFee !== undefined ? Math.max(0, Number(raw.outsideDhakaFee) || 0) : base.outsideDhakaFee,
    heroSlides,
    socialLinks: {
      facebook: sanitizeExternalUrl(socialRaw.facebook, base.socialLinks?.facebook || 'https://facebook.com'),
      instagram: sanitizeExternalUrl(socialRaw.instagram, base.socialLinks?.instagram || 'https://instagram.com'),
      youtube: sanitizeExternalUrl(socialRaw.youtube, base.socialLinks?.youtube || 'https://youtube.com'),
      twitter: sanitizeExternalUrl(socialRaw.twitter, base.socialLinks?.twitter || 'https://x.com'),
      whatsapp: typeof socialRaw.whatsapp === 'string' ? sanitizeExternalUrl(socialRaw.whatsapp, base.socialLinks?.whatsapp || 'https://wa.me') : base.socialLinks?.whatsapp,
    },
    popupNotice: {
      enabled: typeof noticeRaw.enabled === 'boolean' ? noticeRaw.enabled : base.popupNotice.enabled,
      badge: typeof noticeRaw.badge === 'string' ? sanitizePlainText(noticeRaw.badge, 60) : base.popupNotice.badge,
      title: typeof noticeRaw.title === 'string' ? sanitizePlainText(noticeRaw.title, 120) : base.popupNotice.title,
      message: typeof noticeRaw.message === 'string' ? sanitizePlainText(noticeRaw.message, 500) : base.popupNotice.message,
      highlightNote: typeof noticeRaw.highlightNote === 'string' ? sanitizePlainText(noticeRaw.highlightNote, 200) : base.popupNotice.highlightNote,
      couponCode: typeof noticeRaw.couponCode === 'string' ? sanitizePlainText(noticeRaw.couponCode, 40) : base.popupNotice.couponCode,
      ctaText: typeof noticeRaw.ctaText === 'string' ? sanitizePlainText(noticeRaw.ctaText, 40) : base.popupNotice.ctaText,
      ctaCategory: typeof noticeRaw.ctaCategory === 'string' ? sanitizePlainText(noticeRaw.ctaCategory, 80) : base.popupNotice.ctaCategory,
    },
  };
}

app.put('/api/admin/settings', requireAdmin, (req: AuthedRequest, res: Response) => {
  const nextSettings = req.body as Record<string, unknown>;
  if (!nextSettings || typeof nextSettings !== 'object') {
    res.status(400).json({ error: 'Invalid settings object.' });
    return;
  }
  db.settings = sanitizeSettingsInput(nextSettings, db.settings);
  saveDb(db);
  res.json({ settings: db.settings });
});

app.post('/api/admin/import-backup', requireAdmin, (req: AuthedRequest, res: Response) => {
  const data = (req.body || {}) as Record<string, unknown>;
  if (Array.isArray(data.products)) {
    db.products = data.products
      .map((p) => sanitizeProductInput((p || {}) as Record<string, unknown>))
      .filter((p): p is Product => Boolean(p));
  }
  if (Array.isArray(data.categories)) {
    db.categories = data.categories
      .map((c) => {
        const cat = (c || {}) as Record<string, unknown>;
        const id = sanitizePlainText(cat.id, 80);
        const name = sanitizePlainText(cat.name, 80);
        if (!id || !name) return null;
        return {
          id,
          name,
          slug: sanitizePlainText(cat.slug, 80) || name.toLowerCase().replace(/\s+/g, '-'),
          image: sanitizeImageUrl(cat.image),
          itemCount: Math.max(0, Math.floor(Number(cat.itemCount) || 0)),
        } as Category;
      })
      .filter((c): c is Category => Boolean(c));
  }
  if (Array.isArray(data.coupons)) {
    db.coupons = data.coupons
      .map((c) => {
        const cp = (c || {}) as Record<string, unknown>;
        const id = sanitizePlainText(cp.id, 80);
        const code = sanitizePlainText(cp.code, 40).toUpperCase();
        if (!id || !code) return null;
        return {
          id,
          code,
          discountType: cp.discountType === 'percentage' ? 'percentage' : 'fixed',
          discountValue: Math.max(0, Number(cp.discountValue) || 0),
          minOrderAmount: Math.max(0, Number(cp.minOrderAmount) || 0),
          description: sanitizePlainText(cp.description, 200),
          isActive: cp.isActive !== false,
        } as Coupon;
      })
      .filter((c): c is Coupon => Boolean(c));
  }
  if (data.settings && typeof data.settings === 'object') {
    db.settings = sanitizeSettingsInput(data.settings as Record<string, unknown>, db.settings);
  }
  saveDb(db);
  res.json({ ok: true });
});

app.post('/api/admin/reset-defaults', requireAdmin, (_req: AuthedRequest, res: Response) => {
  const preservedUsers = db.users;
  db = createInitialDb();
  db.users = preservedUsers;
  saveDb(db);
  res.json({ ok: true });
});

// ============================================================================
// AI SUPPORT CHATBOT ROUTE
// ============================================================================

const KYNZO_SYSTEM_INSTRUCTION = `You are KYNZO Support, the helpful bilingual (Bengali + English) e-commerce assistant for KYNZO — Bangladesh's trusted online smart gadgets & tech store.
Store details:
- Categories & Products:
  * Smartwatches: Ultra Titanium AMOLED Smartwatch (৳2,950 — Note: Advance delivery verification applies, not COD).
  * Audio & Earbuds: SonicPro 48dB ANC Wireless Earbuds (৳1,890), AeroPulse Hybrid ANC Over-Ear Headphones (৳4,250).
  * Power & Charging: VoltCore 20000mAh PD + 65W GaN Charger Kit (৳2,450).
  * PC & Gaming Gear: KeyForge 75% Aluminum Wireless Mechanical Keyboard (৳4,850), Precision Pro 26K Wireless Ergonomic Mouse (৳1,650).
  * Camera & Creators: SteadyAxis 3-Axis AI Smartphone Gimbal (৳5,450), ApexCam 4K 120fps Dual-Screen Action Camera (৳6,850 — Note: Advance delivery verification applies, not COD).
  * Smart Home & Setup: AuraBass 360° Wireless Bluetooth Smart Speaker (৳2,650), LumiBar Anodized Smart Desk & Monitor Lamp (৳1,750).
- Warranty: 1 Year official replacement/service warranty on flagship smart tech & QC shockproof packaging.
- Delivery Fees: Inside Dhaka City ৳70 (24-48h), Sub-Dhaka (Gazipur, Narayanganj) ৳100, Outside Dhaka (61 districts across Bangladesh) ৳130 (2-3 days via Pathao, Steadfast, REDX, eCourier, Paperfly).
- Active Coupons: KYNZO100 (৳100 off min ৳1,000), TECH10 (10% off min ৳1,500), FREESHIP (৳70 off min ৳2,500).
- Payment Methods: Cash on Delivery (COD), bKash Merchant (01994618066), Nagad Merchant (01994618066).
- Order Tracking: Customers can click TRACK ORDER and search using their Order ID (e.g., KYN-98421) or phone number.
- Customer Care: Hotline 01994618066, Email support@kynzo.com.bd, Level-4, Tech Hub Complex, Dhanmondi-1209, Dhaka.

Reply concisely, warmly, and naturally in the user's language (Bengali if the user asks in Bengali, or English if in English). Keep answers accurate to the gadget catalog and policies above.`;

app.post('/api/ai-chat', writeLimiter, async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server.',
    });
    return;
  }

  const rawMessage = req.body?.message;
  const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';
  if (!message) {
    res.status(400).json({ error: 'Message is required.' });
    return;
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    let response;
    let lastError: unknown;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: message.slice(0, 2000),
          config: {
            systemInstruction: KYNZO_SYSTEM_INSTRUCTION,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
        break;
      } catch (attemptErr: unknown) {
        lastError = attemptErr;
        const errObj = attemptErr as { status?: number; message?: string };
        const errStatus = typeof errObj?.status === 'number' ? errObj.status : 0;
        const isTransient =
          errStatus === 500 || errStatus === 503 || errObj?.message?.includes('UNAVAILABLE');
        if (!isTransient || attempt === maxAttempts) {
          throw attemptErr;
        }
        await sleep(500 * Math.pow(2, attempt - 1));
      }
    }

    if (!response) {
      throw lastError ?? new Error('No response returned from Gemini API.');
    }

    const reply = response.text?.trim();
    if (!reply) {
      res.status(502).json({ error: 'Empty response from AI model. Please try again.' });
      return;
    }

    res.json({ reply });
  } catch (err: unknown) {
    const errObj = err as { status?: number; message?: string };
    const status = typeof errObj?.status === 'number' ? errObj.status : 502;
    const rawMsg = errObj?.message || String(err);
    console.error('Gemini API /api/ai-chat error:', status, rawMsg);

    if (
      status === 400 ||
      status === 403 ||
      rawMsg.includes('API_KEY_INVALID') ||
      rawMsg.includes('PERMISSION_DENIED')
    ) {
      res.status(status).json({
        error:
          'Gemini API authentication error. Please verify GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    if (status === 429 || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      res.status(429).json({
        error: 'AI Assistant is temporarily busy (rate limit). Please try again in a moment.',
      });
      return;
    }

    if (status === 503 || rawMsg.includes('UNAVAILABLE')) {
      res.status(503).json({
        error:
          'AI Assistant is experiencing high demand right now. Please try again in a few seconds or call 01994618066.',
      });
      return;
    }

    res.status(status >= 400 && status < 600 ? status : 502).json({
      error:
        'AI Assistant could not respond right now. Please try again or contact KYNZO hotline (01994618066).',
    });
  }
});

app.get('/api/single-html', (_req: Request, res: Response) => {
  const builtIndex = path.resolve(__dirname, 'dist', 'index.html');
  if (fs.existsSync(builtIndex)) {
    res.setHeader('Content-Disposition', 'attachment; filename="index.html"');
    res.sendFile(builtIndex);
    return;
  }
  res.status(404).json({
    error: 'Built index.html is not available yet. Run npm run build first.',
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'kynzo-store' });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KYNZO server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
