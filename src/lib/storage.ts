import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getIdTokenResult,
  signOut,
} from 'firebase/auth';

import { db, auth } from './firebase';
import {
  BarberShop,
  Service,
  Barber,
  Booking,
  BookingStats,
  User,
  BookingStatus,
  PaymentRecord,
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentMethodType,
  Product,
} from '../types';

export const APP_CONFIG = {
  name: 'IBarbear',
  fullName: 'IBarbear',
  tagline: 'Barbearia inteligente',
  demoSlug: 'navalha',
  plan: {
    name: 'Plano Pro',
    priceMonthly: 89,
    currency: 'BRL',
    priceLabel: 'R$ 89',
    period: '/mês',
  },
  supportEmail: 'ibarbear@gmail.com',
};

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Initial Seed Data
export const DEFAULT_SHOPS: BarberShop[] = [
  {
    id: 'shop-navalha-01',
    name: 'Barbearia Navalha',
    slug: 'navalha',
    tagline: 'Cortes clássicos, barba com toalha quente e atendimento premium',
    phone: '(11) 98765-4321',
    whatsapp: '(11) 98765-4321',
    email: 'contato@barbearianavalha.com.br',
    address: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
    instagram: '@barbearianavalha',
    hours: [
      { day: 'Segunda a Sexta', time: '09:00 - 20:00' },
      { day: 'Sábado', time: '08:30 - 19:00' },
      { day: 'Domingo', time: '09:00 - 14:00' },
    ],
    showProductsOnBookingPage: true,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_SERVICES: Service[] = [
  {
    id: 'srv-01',
    shopSlug: 'navalha',
    name: 'Corte Tradicional / Fade',
    price: 5000,
    durationMinutes: 40,
    description: 'Corte clássico na tesoura ou máquina com degradê perfeito, lavagem e finalização com pomada.',
    active: true,
  },
  {
    id: 'srv-02',
    shopSlug: 'navalha',
    name: 'Barba Terapia com Toalha Quente',
    price: 4500,
    durationMinutes: 35,
    description: 'Desenho de barba com navalhete descartável, toalha aquecida, óleo pré-barba e balm hidratante.',
    active: true,
  },
  {
    id: 'srv-03',
    shopSlug: 'navalha',
    name: 'Combo Cabelo + Barba Completa',
    price: 8500,
    durationMinutes: 65,
    description: 'O pacote completo com corte estilizado, barba completa com toalha quente e massagem facial relaxante.',
    active: true,
  },
  {
    id: 'srv-04',
    shopSlug: 'navalha',
    name: 'Acabamento & Pezinho',
    price: 2500,
    durationMinutes: 20,
    description: 'Alinhamento dos contornos do cabelo e nuca com navalha e hidratação rápida.',
    active: true,
  },
  {
    id: 'srv-05',
    shopSlug: 'navalha',
    name: 'Pigmentação de Barba & Cabelo',
    price: 4000,
    durationMinutes: 30,
    description: 'Camuflagem de fios brancos e realce do contorno com tintura específica de alta durabilidade.',
    active: true,
  },
  {
    id: 'srv-06',
    shopSlug: 'navalha',
    name: 'Hidratação Capilar Profunda',
    price: 3500,
    durationMinutes: 25,
    description: 'Tratamento nutritivo anti-frizz e restauração com máscara premium para couro cabeludo.',
    active: true,
  },
];

export const DEFAULT_BARBERS: Barber[] = [
  {
    id: 'barb-01',
    shopSlug: 'navalha',
    name: 'Lucas "Navalha" Silva',
    specialty: 'Mestre Barbeiro & Especialista em Degradê',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    workingHours: '09:00 - 18:00',
    phone: '(11) 98765-4321',
    active: true,
  },
  {
    id: 'barb-02',
    shopSlug: 'navalha',
    name: 'Carlos Eduardo "Du"',
    specialty: 'Especialista em Barboterapia & Cortes Clássicos',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    workingHours: '10:00 - 19:00',
    phone: '(11) 98765-4322',
    active: true,
  },
  {
    id: 'barb-03',
    shopSlug: 'navalha',
    name: 'Matheus Costa',
    specialty: 'Cortes Modernos, Freestyle & Texturização',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    workingHours: '11:00 - 20:00',
    phone: '(11) 98765-4323',
    active: true,
  },
];

function getTodayString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 'BK-78901',
    shopSlug: 'navalha',
    serviceId: 'srv-01',
    serviceName: 'Corte Tradicional / Fade',
    servicePrice: 5000,
    barberId: 'barb-01',
    barberName: 'Lucas "Navalha" Silva',
    customerName: 'Gabriel Medeiros',
    customerPhone: '(11) 99123-4567',
    customerEmail: 'gabriel.medeiros@exemplo.com',
    date: getTodayString(0),
    time: '14:30',
    notes: 'Degradê na zero navalhada nas laterais',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'BK-78902',
    shopSlug: 'navalha',
    serviceId: 'srv-03',
    serviceName: 'Combo Cabelo + Barba Completa',
    servicePrice: 8500,
    barberId: 'barb-02',
    barberName: 'Carlos Eduardo "Du"',
    customerName: 'Rodrigo Santoro',
    customerPhone: '(11) 98888-7777',
    customerEmail: 'rodrigo.s@exemplo.com',
    date: getTodayString(0),
    time: '16:00',
    notes: 'Toalha quente extra se possível',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'BK-78903',
    shopSlug: 'navalha',
    serviceId: 'srv-02',
    serviceName: 'Barba Terapia com Toalha Quente',
    servicePrice: 4500,
    barberId: 'barb-01',
    barberName: 'Lucas "Navalha" Silva',
    customerName: 'Bruno Alcantara',
    customerPhone: '(11) 97777-6666',
    date: getTodayString(0),
    time: '10:00',
    notes: '',
    status: 'done',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    shopSlug: 'navalha',
    name: 'Pomada Modeladora Matte Hold 120g',
    price: 4990,
    category: 'Pomadas & Ceras',
    description: 'Fixação forte com acabamento fosco e natural. Ideal para penteados texturizados, topetes e cortes degradê.',
    imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80',
    stockQuantity: 18,
    minStockAlert: 5,
    active: true,
    showInCatalog: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-02',
    shopSlug: 'navalha',
    name: 'Óleo para Barba Wood & Amber 30ml',
    price: 3990,
    category: 'Barba & Bigode',
    description: 'Fórmula nutritiva com óleos de argan, jojoba e semente de uva. Hidrata fios rebeldes e elimina o frizz.',
    imageUrl: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=500&auto=format&fit=crop&q=80',
    stockQuantity: 12,
    minStockAlert: 4,
    active: true,
    showInCatalog: true,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_USER: User = {
  id: 'usr-demo-01',
  name: 'Lucas Silva',
  email: 'lucas@barbearianavalha.com.br',
  shopSlug: 'navalha',
  subscriptionStatus: 'active',
  subscriptionPlan: 'monthly',
  subscriptionExpiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
};

export const DEFAULT_PAYMENTS: PaymentRecord[] = [];
// IBARBEAR_ETAPA40: pagamento aprovado demonstrativo removido da inicialização.

// Storage Keys for Cache
const KEYS = {
  SHOPS: 'navalha_shops',
  SERVICES: 'navalha_services',
  BARBERS: 'navalha_barbers',
  BOOKINGS: 'navalha_bookings',
  PRODUCTS: 'navalha_products',
  CURRENT_USER: 'navalha_current_user',
  REGISTERED_USERS: 'navalha_registered_users',
  PAYMENTS: 'navalha_payments',
};

// Local cache initializers
function initStorage() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(KEYS.SHOPS)) {
    localStorage.setItem(KEYS.SHOPS, JSON.stringify(DEFAULT_SHOPS));
  }
  if (!localStorage.getItem(KEYS.SERVICES)) {
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
  }
  if (!localStorage.getItem(KEYS.BARBERS)) {
    localStorage.setItem(KEYS.BARBERS, JSON.stringify(DEFAULT_BARBERS));
  }
  if (!localStorage.getItem(KEYS.BOOKINGS)) {
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(DEFAULT_BOOKINGS));
  }
  if (!localStorage.getItem(KEYS.PRODUCTS)) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
  }
  if (!localStorage.getItem(KEYS.REGISTERED_USERS)) {
    localStorage.setItem(KEYS.REGISTERED_USERS, JSON.stringify([DEFAULT_USER]));
  }
  // IBARBEAR_ETAPA40: não popular histórico financeiro com pagamentos de demonstração.
}

try {
  initStorage();
} catch {
  // Safe
}

export function sanitizeForFirestore<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeForFirestore(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// -------------------------------------------------------------
// FIRESTORE SEEDING & SYNC
// -------------------------------------------------------------
let isSeeding = false;
export async function ensureFirestoreSeeded(shopSlug = 'navalha') {
    // IBARBEAR_ETAPA40: seed só pode ser invocado explicitamente no modo emulator.
  if (!import.meta.env.DEV || import.meta.env.MODE !== 'emulator') return;
if (isSeeding) return;
  isSeeding = true;
  try {
    const shopRef = doc(db, 'shops', shopSlug);
    const shopSnap = await getDoc(shopRef);
    if (!shopSnap.exists()) {
      const shopData = DEFAULT_SHOPS.find((s) => s.slug === shopSlug) || DEFAULT_SHOPS[0];
      await setDoc(shopRef, sanitizeForFirestore({ ...shopData, slug: shopSlug }));

      for (const srv of DEFAULT_SERVICES) {
        await setDoc(doc(db, 'services', srv.id), sanitizeForFirestore(srv));
      }

      for (const barb of DEFAULT_BARBERS) {
        await setDoc(doc(db, 'barbers', barb.id), sanitizeForFirestore(barb));
      }

      for (const prod of DEFAULT_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), sanitizeForFirestore(prod));
      }

      for (const bk of DEFAULT_BOOKINGS) {
        await setDoc(doc(db, 'bookings', bk.id), sanitizeForFirestore(bk));
      }

      await setDoc(doc(db, 'users', DEFAULT_USER.id), sanitizeForFirestore(DEFAULT_USER));
    }
  } catch (err) {
    console.warn('Firestore seeding check:', err);
  } finally {
    isSeeding = false;
  }
}

// IBARBEAR_ETAPA40: inicialização automática do seed removida. Dados demo somente em fluxo explicitamente de teste.

// -------------------------------------------------------------
// REAL-TIME FIRESTORE SUBSCRIPTIONS
// -------------------------------------------------------------
export function subscribeToShop(slug: string, callback: (shop: BarberShop | null) => void) {
  const shopRef = doc(db, 'shops', slug);
  return onSnapshot(
    shopRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as BarberShop;
        saveShopLocal(data);
        callback(data);
      } else {
        callback(getShop(slug));
      }
    },
    (err) => {
      console.warn('subscribeToShop fallback to local:', err);
      callback(getShop(slug));
    }
  );
}

export function subscribeToServices(shopSlug: string, callback: (services: Service[]) => void) {
  const q = query(collection(db, 'services'), where('shopSlug', '==', shopSlug));
  return onSnapshot(
    q,
    (snap) => {
      const items: Service[] = [];
      snap.forEach((doc) => items.push(doc.data() as Service));
      if (items.length > 0) {
        setServicesLocal(items, shopSlug);
        callback(items);
      } else {
        callback(getServices(shopSlug));
      }
    },
    (err) => {
      console.warn('subscribeToServices fallback to local:', err);
      callback(getServices(shopSlug));
    }
  );
}

export function subscribeToBarbers(shopSlug: string, callback: (barbers: Barber[]) => void) {
  const q = query(collection(db, 'barbers'), where('shopSlug', '==', shopSlug));
  return onSnapshot(
    q,
    (snap) => {
      const items: Barber[] = [];
      snap.forEach((doc) => items.push(doc.data() as Barber));
      if (items.length > 0) {
        setBarbersLocal(items, shopSlug);
        callback(items);
      } else {
        callback(getBarbers(shopSlug));
      }
    },
    (err) => {
      console.warn('subscribeToBarbers fallback to local:', err);
      callback(getBarbers(shopSlug));
    }
  );
}

export function subscribeToProducts(shopSlug: string, callback: (products: Product[]) => void) {
  const q = query(collection(db, 'products'), where('shopSlug', '==', shopSlug));
  return onSnapshot(
    q,
    (snap) => {
      const items: Product[] = [];
      snap.forEach((doc) => items.push(doc.data() as Product));
      if (items.length > 0) {
        setProductsLocal(items, shopSlug);
        callback(items);
      } else {
        callback(getProducts(shopSlug));
      }
    },
    (err) => {
      console.warn('subscribeToProducts fallback to local:', err);
      callback(getProducts(shopSlug));
    }
  );
}

export function subscribeToBookings(
  shopSlug: string,
  callback: (bookings: Booking[], stats: BookingStats) => void
) {
  const q = query(collection(db, 'bookings'), where('shopSlug', '==', shopSlug));

  return onSnapshot(
    q,
    (snap) => {
      const items: Booking[] = [];
      snap.forEach((doc) => items.push(doc.data() as Booking));

      const stats: BookingStats = {
        total: items.length,
        pending: items.filter((b) => b.status === 'pending').length,
        confirmed: items.filter((b) => b.status === 'confirmed').length,
        done: items.filter((b) => b.status === 'done').length,
        canceled: items.filter((b) => b.status === 'canceled').length,
        totalRevenue: items
          .filter((b) => b.status === 'done' || b.status === 'confirmed')
          .reduce((sum, b) => sum + (b.servicePrice || 0), 0),
      };

      items.sort((a, b) => {
        const dtA = `${a.date} ${a.time}`;
        const dtB = `${b.date} ${b.time}`;
        return dtB.localeCompare(dtA);
      });

      setBookingsLocal(items, shopSlug);
      callback(items, stats);
    },
    (err) => {
      console.warn('subscribeToBookings fallback to local:', err);
      const res = getBookings(shopSlug);
      callback(res.bookings, res.stats);
    }
  );
}

// -------------------------------------------------------------
// LOCAL CACHE HELPERS
// -------------------------------------------------------------
function saveShopLocal(shop: BarberShop) {
  try {
    const shops: BarberShop[] = JSON.parse(localStorage.getItem(KEYS.SHOPS) || '[]');
    const idx = shops.findIndex((s) => s.id === shop.id || s.slug === shop.slug);
    if (idx >= 0) {
      shops[idx] = { ...shops[idx], ...shop };
    } else {
      shops.push(shop);
    }
    localStorage.setItem(KEYS.SHOPS, JSON.stringify(shops));
  } catch {}
}

function setServicesLocal(newServices: Service[], shopSlug: string) {
  try {
    const existing: Service[] = JSON.parse(localStorage.getItem(KEYS.SERVICES) || '[]');
    const others = existing.filter((s) => s.shopSlug !== shopSlug);
    localStorage.setItem(KEYS.SERVICES, JSON.stringify([...others, ...newServices]));
  } catch {}
}

function setBarbersLocal(newBarbers: Barber[], shopSlug: string) {
  try {
    const existing: Barber[] = JSON.parse(localStorage.getItem(KEYS.BARBERS) || '[]');
    const others = existing.filter((b) => b.shopSlug !== shopSlug);
    localStorage.setItem(KEYS.BARBERS, JSON.stringify([...others, ...newBarbers]));
  } catch {}
}

function setBookingsLocal(newBookings: Booking[], shopSlug: string) {
  try {
    const existing: Booking[] = JSON.parse(localStorage.getItem(KEYS.BOOKINGS) || '[]');
    const others = existing.filter((b) => b.shopSlug !== shopSlug);
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify([...others, ...newBookings]));
  } catch {}
}

function setProductsLocal(newProducts: Product[], shopSlug: string) {
  try {
    const existing: Product[] = JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]');
    const others = existing.filter((p) => p.shopSlug !== shopSlug);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify([...others, ...newProducts]));
  } catch {}
}

// -------------------------------------------------------------
// ASYNC & FIRESTORE DIRECT ACTIONS
// -------------------------------------------------------------
export async function getShopAsync(slug: string): Promise<BarberShop | null> {
  try {
    const snap = await getDoc(doc(db, 'shops', slug));
    if (snap.exists()) {
      const data = snap.data() as BarberShop;
      saveShopLocal(data);
      return data;
    }
  } catch (err) {
    console.warn('getShopAsync Firestore error:', err);
  }
  return getShop(slug);
}

export async function saveShopAsync(shop: BarberShop): Promise<BarberShop> {
  saveShop(shop);
  try {
    await setDoc(doc(db, 'shops', shop.slug), sanitizeForFirestore(shop), { merge: true });
  } catch (err) {
    console.error('saveShopAsync error:', err);
  }
  return shop;
}

export async function getServicesAsync(shopSlug: string): Promise<Service[]> {
  try {
    const q = query(collection(db, 'services'), where('shopSlug', '==', shopSlug));
    const snap = await getDocs(q);
    const items: Service[] = [];
    snap.forEach((d) => items.push(d.data() as Service));
    if (items.length > 0) {
      setServicesLocal(items, shopSlug);
      return items;
    }
  } catch (err) {
    console.warn('getServicesAsync error:', err);
  }
  return getServices(shopSlug);
}

export async function saveServiceAsync(service: Service): Promise<Service> {
  saveService(service);
  try {
    await setDoc(doc(db, 'services', service.id), sanitizeForFirestore(service), { merge: true });
  } catch (err) {
    console.error('saveServiceAsync error:', err);
  }
  return service;
}

export async function deleteServiceAsync(serviceId: string, shopSlug: string): Promise<void> {
  deleteService(serviceId);
  try {
    await deleteDoc(doc(db, 'services', serviceId));
  } catch (err) {
    console.error('deleteServiceAsync error:', err);
  }
}

export async function getBarbersAsync(shopSlug: string): Promise<Barber[]> {
  try {
    const q = query(collection(db, 'barbers'), where('shopSlug', '==', shopSlug));
    const snap = await getDocs(q);
    const items: Barber[] = [];
    snap.forEach((d) => items.push(d.data() as Barber));
    if (items.length > 0) {
      setBarbersLocal(items, shopSlug);
      return items;
    }
  } catch (err) {
    console.warn('getBarbersAsync error:', err);
  }
  return getBarbers(shopSlug);
}

export async function saveBarberAsync(barber: Barber): Promise<Barber> {
  saveBarber(barber);
  try {
    await setDoc(doc(db, 'barbers', barber.id), sanitizeForFirestore(barber), { merge: true });
  } catch (err) {
    console.error('saveBarberAsync error:', err);
  }
  return barber;
}

export async function deleteBarberAsync(barberId: string, shopSlug: string): Promise<void> {
  deleteBarber(barberId);
  try {
    await deleteDoc(doc(db, 'barbers', barberId));
  } catch (err) {
    console.error('deleteBarberAsync error:', err);
  }
}

export async function getProductsAsync(shopSlug: string): Promise<Product[]> {
  try {
    const q = query(collection(db, 'products'), where('shopSlug', '==', shopSlug));
    const snap = await getDocs(q);
    const items: Product[] = [];
    snap.forEach((d) => items.push(d.data() as Product));
    if (items.length > 0) {
      setProductsLocal(items, shopSlug);
      return items;
    }
  } catch (err) {
    console.warn('getProductsAsync error:', err);
  }
  return getProducts(shopSlug);
}

export async function saveProductAsync(product: Product): Promise<Product> {
  saveProduct(product);
  try {
    await setDoc(doc(db, 'products', product.id), sanitizeForFirestore(product), { merge: true });
  } catch (err) {
    console.error('saveProductAsync error:', err);
  }
  return product;
}

export async function deleteProductAsync(productId: string, shopSlug: string): Promise<void> {
  deleteProduct(productId);
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    console.error('deleteProductAsync error:', err);
  }
}

export async function createBookingAsync(
  shopSlug: string,
  data: Omit<Booking, 'id' | 'shopSlug' | 'createdAt' | 'status'>
): Promise<Booking> {
  const id = `BK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const newBooking: Booking = {
    customerEmail: data.customerEmail || '',
    notes: data.notes || '',
    ...data,
    id,
    shopSlug,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  createBookingLocal(newBooking);

  try {
    await setDoc(doc(db, 'bookings', id), sanitizeForFirestore(newBooking));
  } catch (err) {
    console.error('createBookingAsync error:', err);
  }
  return newBooking;
}

export async function updateBookingStatusAsync(
  shopSlug: string,
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  updateBookingStatus(shopSlug, bookingId, status);
  try {
    await updateDoc(doc(db, 'bookings', bookingId), { status });
  } catch (err) {
    console.error('updateBookingStatusAsync error:', err);
  }
}

export async function deleteBookingAsync(shopSlug: string, bookingId: string): Promise<void> {
  deleteBooking(shopSlug, bookingId);
  try {
    await deleteDoc(doc(db, 'bookings', bookingId));
  } catch (err) {
    console.error('deleteBookingAsync error:', err);
  }
}

// -------------------------------------------------------------
// SYNCHRONOUS METHODS (FOR ZERO-LATENCY RENDERING)
// -------------------------------------------------------------
export function getShop(slug: string): BarberShop | null {
  initStorage();
  const shops: BarberShop[] = JSON.parse(localStorage.getItem(KEYS.SHOPS) || '[]');
  return shops.find((s) => s.slug === slug) || null;
}

export function saveShop(shop: BarberShop): BarberShop {
  initStorage();
  saveShopLocal(shop);
  setDoc(doc(db, 'shops', shop.slug), sanitizeForFirestore(shop), { merge: true }).catch(console.warn);
  return shop;
}

export function getServices(shopSlug: string): Service[] {
  initStorage();
  const services: Service[] = JSON.parse(localStorage.getItem(KEYS.SERVICES) || '[]');
  return services.filter((s) => s.shopSlug === shopSlug);
}

export function saveService(service: Service): Service {
  initStorage();
  const services: Service[] = JSON.parse(localStorage.getItem(KEYS.SERVICES) || '[]');
  const idx = services.findIndex((s) => s.id === service.id);
  if (idx >= 0) {
    services[idx] = service;
  } else {
    services.push(service);
  }
  localStorage.setItem(KEYS.SERVICES, JSON.stringify(services));
  setDoc(doc(db, 'services', service.id), sanitizeForFirestore(service), { merge: true }).catch(console.warn);
  return service;
}

export function deleteService(serviceId: string): void {
  initStorage();
  const services: Service[] = JSON.parse(localStorage.getItem(KEYS.SERVICES) || '[]');
  const updated = services.filter((s) => s.id !== serviceId);
  localStorage.setItem(KEYS.SERVICES, JSON.stringify(updated));
  deleteDoc(doc(db, 'services', serviceId)).catch(console.warn);
}

export function getBarbers(shopSlug: string): Barber[] {
  initStorage();
  const barbers: Barber[] = JSON.parse(localStorage.getItem(KEYS.BARBERS) || '[]');
  return barbers.filter((b) => b.shopSlug === shopSlug);
}

export function saveBarber(barber: Barber): Barber {
  initStorage();
  const barbers: Barber[] = JSON.parse(localStorage.getItem(KEYS.BARBERS) || '[]');
  const idx = barbers.findIndex((b) => b.id === barber.id);
  if (idx >= 0) {
    barbers[idx] = barber;
  } else {
    barbers.push(barber);
  }
  localStorage.setItem(KEYS.BARBERS, JSON.stringify(barbers));
  setDoc(doc(db, 'barbers', barber.id), sanitizeForFirestore(barber), { merge: true }).catch(console.warn);
  return barber;
}

export function deleteBarber(barberId: string): void {
  initStorage();
  const barbers: Barber[] = JSON.parse(localStorage.getItem(KEYS.BARBERS) || '[]');
  const updated = barbers.filter((b) => b.id !== barberId);
  localStorage.setItem(KEYS.BARBERS, JSON.stringify(updated));
  deleteDoc(doc(db, 'barbers', barberId)).catch(console.warn);
}

export function getProducts(shopSlug: string): Product[] {
  initStorage();
  const products: Product[] = JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]');
  return products.filter((p) => p.shopSlug === shopSlug);
}

export function saveProduct(product: Product): Product {
  initStorage();
  const products: Product[] = JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]');
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    products[idx] = { ...products[idx], ...product, updatedAt: new Date().toISOString() };
  } else {
    products.push(product);
  }
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  setDoc(doc(db, 'products', product.id), sanitizeForFirestore(product), { merge: true }).catch(console.warn);
  return product;
}

export function updateProductStock(productId: string, newQuantity: number): void {
  initStorage();
  const products: Product[] = JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]');
  const idx = products.findIndex((p) => p.id === productId);
  if (idx >= 0) {
    const updated = {
      ...products[idx],
      stockQuantity: Math.max(0, newQuantity),
      updatedAt: new Date().toISOString(),
    };
    products[idx] = updated;
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    updateDoc(doc(db, 'products', productId), {
      stockQuantity: Math.max(0, newQuantity),
      updatedAt: new Date().toISOString(),
    }).catch(console.warn);
  }
}

export function deleteProduct(productId: string): void {
  initStorage();
  const products: Product[] = JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]');
  const updated = products.filter((p) => p.id !== productId);
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(updated));
  deleteDoc(doc(db, 'products', productId)).catch(console.warn);
}

export function getBookings(
  shopSlug: string,
  filter?: { status?: string; date?: string }
): { bookings: Booking[]; stats: BookingStats } {
  initStorage();
  let bookings: Booking[] = JSON.parse(localStorage.getItem(KEYS.BOOKINGS) || '[]');
  bookings = bookings.filter((b) => b.shopSlug === shopSlug);

  const stats: BookingStats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    done: bookings.filter((b) => b.status === 'done').length,
    canceled: bookings.filter((b) => b.status === 'canceled').length,
    totalRevenue: bookings
      .filter((b) => b.status === 'done' || b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.servicePrice || 0), 0),
  };

  if (filter?.status && filter.status !== 'all') {
    bookings = bookings.filter((b) => b.status === filter.status);
  }
  if (filter?.date) {
    bookings = bookings.filter((b) => b.date === filter.date);
  }

  bookings.sort((a, b) => {
    const dtA = `${a.date} ${a.time}`;
    const dtB = `${b.date} ${b.time}`;
    return dtB.localeCompare(dtA);
  });

  return { bookings, stats };
}

function createBookingLocal(newBooking: Booking) {
  initStorage();
  const bookings: Booking[] = JSON.parse(localStorage.getItem(KEYS.BOOKINGS) || '[]');
  bookings.unshift(newBooking);
  localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
}

export function createBooking(
  shopSlug: string,
  data: Omit<Booking, 'id' | 'shopSlug' | 'createdAt' | 'status'>
): Booking {
  initStorage();
  const bookings: Booking[] = JSON.parse(localStorage.getItem(KEYS.BOOKINGS) || '[]');

  const conflict = bookings.find(
    (b) =>
      b.shopSlug === shopSlug &&
      b.barberId === data.barberId &&
      b.date === data.date &&
      b.time === data.time &&
      b.status !== 'canceled'
  );

  if (conflict) {
    throw new Error('Este horário já foi reservado. Por favor, selecione outro horário.');
  }

  const id = `BK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const newBooking: Booking = {
    customerEmail: data.customerEmail || '',
    notes: data.notes || '',
    ...data,
    id,
    shopSlug,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  bookings.unshift(newBooking);
  localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
  setDoc(doc(db, 'bookings', id), sanitizeForFirestore(newBooking)).catch(console.warn);

  return newBooking;
}

export function updateBookingStatus(
  shopSlug: string,
  bookingId: string,
  status: BookingStatus
): void {
  initStorage();
  const bookings: Booking[] = JSON.parse(localStorage.getItem(KEYS.BOOKINGS) || '[]');
  const idx = bookings.findIndex((b) => b.id === bookingId && b.shopSlug === shopSlug);
  if (idx >= 0) {
    bookings[idx].status = status;
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
  }
  updateDoc(doc(db, 'bookings', bookingId), { status }).catch(console.warn);
}

export function deleteBooking(shopSlug: string, bookingId: string): void {
  initStorage();
  const bookings: Booking[] = JSON.parse(localStorage.getItem(KEYS.BOOKINGS) || '[]');
  const updated = bookings.filter((b) => !(b.id === bookingId && b.shopSlug === shopSlug));
  localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(updated));
  deleteDoc(doc(db, 'bookings', bookingId)).catch(console.warn);
}

export function getAvailableSlots(
  shopSlug: string,
  barberId: string,
  date: string
): string[] {
  initStorage();
  const allSlots = [
    '09:00', '09:40', '10:20', '11:00', '11:40', '13:00',
    '13:40', '14:20', '15:00', '15:40', '16:20', '17:00',
    '17:40', '18:20', '19:00', '19:40'
  ];

  const bookings: Booking[] = JSON.parse(localStorage.getItem(KEYS.BOOKINGS) || '[]');
  const busyTimes = new Set(
    bookings
      .filter(
        (b) =>
          b.shopSlug === shopSlug &&
          (barberId === 'any' || b.barberId === barberId) &&
          b.date === date &&
          b.status !== 'canceled'
      )
      .map((b) => b.time)
  );

  return allSlots.filter((slot) => !busyTimes.has(slot));
}

// -------------------------------------------------------------
// AUTHENTICATION & USER MANAGEMENT
// -------------------------------------------------------------
export async function hashPassword(password: string): Promise<string> {
  const clean = password.trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(clean + '_ibarbear_security_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${hash}`;
}

export function getRegisteredUsers(): User[] {
  initStorage();
  const raw = localStorage.getItem(KEYS.REGISTERED_USERS);
  return raw ? JSON.parse(raw) : [DEFAULT_USER];
}

export function getCurrentUser(): User | null {
  initStorage();
  const raw = localStorage.getItem(KEYS.CURRENT_USER);
  return raw ? JSON.parse(raw) : null;
}

export function setCurrentUser(user: User | null): void {
  initStorage();
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
}

export async function loginUser(email: string, password?: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new Error('Informe seu e-mail e sua senha.');
  }

  await auth.authStateReady();

  if (auth.currentUser) {
    await signOut(auth);
  }

  setCurrentUser(null);

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

    const firebaseUser = credential.user;

    const [userSnapshot, tokenResult] = await Promise.all([
      getDoc(doc(db, 'users', firebaseUser.uid)),
      getIdTokenResult(firebaseUser)
    ]);

    const isSuperAdmin = tokenResult.claims.superadmin === true;

    let authenticatedUser: User;

    if (userSnapshot.exists()) {
      const profile = userSnapshot.data() as User;

      authenticatedUser = {
        ...profile,
        id: firebaseUser.uid,
        email: firebaseUser.email || cleanEmail
      };

    } else if (isSuperAdmin) {
      authenticatedUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Administrador',
        email: firebaseUser.email || cleanEmail,
        shopSlug: ''
      };

    } else {
      throw new Error(
        'Conta autenticada, mas o perfil nao foi encontrado. ' +
        'Entre em contato com o suporte.'
      );
    }

    delete authenticatedUser.passwordHash;

    setCurrentUser(authenticatedUser);

    return authenticatedUser;

  } catch (error: any) {
    setCurrentUser(null);

    await signOut(auth).catch(console.warn);

    const code = error?.code || '';

    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      throw new Error('E-mail ou senha incorretos.');
    }

    if (code === 'auth/invalid-email') {
      throw new Error('Informe um e-mail valido.');
    }

    if (code === 'auth/too-many-requests') {
      throw new Error(
        'Muitas tentativas de acesso. Tente novamente mais tarde.'
      );
    }

    if (code === 'auth/user-disabled') {
      throw new Error('Esta conta foi desativada.');
    }

    if (error instanceof Error && !code) {
      throw error;
    }

    throw new Error(
      'Nao foi possivel autenticar sua conta. Tente novamente.'
    );
  }
}

export async function registerUser(
  name: string,
  email: string,
  shopName: string,
  password?: string
): Promise<{ user: User; shop: BarberShop }> {
  initStorage();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanPassword || cleanPassword.length < 6) {
    throw new Error('A senha deve ter no mínimo 6 caracteres.');
  }

  // A senha é validada pelo Firebase Authentication.
  // Não salvar hash de senha no documento de usuário.

  const existingLocal = getRegisteredUsers().find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingLocal && cleanEmail !== 'lucas@barbearianavalha.com.br') {
    throw new Error('Este e-mail já está cadastrado. Acesse a aba "Entrar" para fazer login com sua senha.');
  }

  const slug = slugify(shopName) || `barbearia-${Math.floor(Math.random() * 1000)}`;
  const existingShop = getShop(slug);
  const finalSlug = existingShop ? `${slug}-${Math.floor(Math.random() * 100)}` : slug;

  let userId = `usr-${Date.now()}`;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    userId = userCred.user.uid;
  } catch (authErr: any) {
    console.error('Firebase Auth registration error:', authErr);
    const code = authErr?.code || '';

    if (code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está cadastrado. Acesse a aba "Entrar" para fazer login com sua senha.');
    }
    if (code === 'auth/weak-password') {
      throw new Error('A senha informada é muito fraca. Utilize pelo menos 6 caracteres.');
    }
    if (code === 'auth/invalid-email') {
      throw new Error('O formato do e-mail informado é inválido.');
    }

    throw new Error('Não foi possível criar sua conta. Verifique os dados informados e tente novamente.');
  }

  const newShop: BarberShop = {
    id: `shop-${Date.now()}`,
    name: shopName,
    slug: finalSlug,
    ownerUid: userId, // vínculo com o UID REAL do Firebase Authentication
    tagline: 'Barbearia moderna com agendamento online',
    phone: '(11) 99999-9999',
    whatsapp: '(11) 99999-9999',
    email: cleanEmail,
    address: 'Seu endereço aqui',
    instagram: `@${finalSlug}`,
    hours: [
      { day: 'Segunda a Sábado', time: '09:00 - 19:00' },
      { day: 'Domingo', time: 'Fechado' },
    ],
    createdAt: new Date().toISOString(),
  };

  saveShop(newShop);
  await setDoc(doc(db, 'shops', finalSlug), sanitizeForFirestore(newShop));

  // IBARBEAR_ETAPA42: cadastro unpaid cria somente shop e perfil.
  // Servicos e barbeiros serao configurados pelo proprietario apos ativacao
  // financeira validada no backend (nao criar via SDK durante signup).

  const newUser: User = {
    id: userId,
    name,
    email: cleanEmail,
    shopSlug: finalSlug,
    subscriptionStatus: 'unpaid',
    subscriptionPlan: 'monthly',
  };

  const registered = getRegisteredUsers();
  localStorage.setItem(KEYS.REGISTERED_USERS, JSON.stringify([...registered, newUser]));
  setCurrentUser(newUser);

  await setDoc(doc(db, 'users', userId), sanitizeForFirestore(newUser));

  return { user: newUser, shop: newShop };
}

export function logoutUser(): void {
  setCurrentUser(null);
  signOut(auth).catch(console.warn);
}

// -------------------------------------------------------------
// PAYMENTS & SUBSCRIPTION LIFECYCLE MANAGEMENT
// -------------------------------------------------------------

export const OFFICIAL_PIX_KEY = '9fd37bb2-4f3e-4de7-ba58-331d3374fa0e';

export const PLAN_PRICING = {
  monthly: {
    id: 'monthly',
    name: 'Plano Pro Mensal',
    priceCents: 8900,
    priceLabel: 'R$ 89,00',
    period: 'por mês',
    days: 30,
    discountBadge: null,
  },
  yearly: {
    id: 'yearly',
    name: 'Plano Pro Anual',
    priceCents: 89000,
    priceLabel: 'R$ 890,00',
    period: 'por ano (R$ 74/mês)',
    days: 365,
    discountBadge: 'Economize 20%',
  },
} as const;

export function generatePixPayload(params: {
  key?: string;
  name?: string;
  city?: string;
  amount: number;
  txId?: string;
}): string {
  const formatField = (id: string, value: string): string => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const cleanName = (params.name || 'IBARBEAR')
    .slice(0, 25)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  const cleanCity = (params.city || 'SAO PAULO')
    .slice(0, 15)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  const cleanKey = (params.key || OFFICIAL_PIX_KEY).trim();
  const cleanTxId = (params.txId || `IB${Date.now()}`).slice(0, 25).replace(/[^a-zA-Z0-9]/g, '');

  const merchantAccountInfo =
    formatField('00', 'BR.GOV.BCB.PIX') +
    formatField('01', cleanKey);

  const additionalDataField =
    formatField('05', cleanTxId);

  const payloadWithoutCrc =
    formatField('00', '01') +
    formatField('26', merchantAccountInfo) +
    formatField('52', '0000') +
    formatField('53', '986') +
    formatField('54', params.amount.toFixed(2)) +
    formatField('58', 'BR') +
    formatField('59', cleanName) +
    formatField('60', cleanCity) +
    formatField('62', additionalDataField) +
    '6304';

  let crc = 0xffff;
  for (let i = 0; i < payloadWithoutCrc.length; i++) {
    crc ^= payloadWithoutCrc.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }

  const crcHex = (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return payloadWithoutCrc + crcHex;
}

export function getLocalPayments(): PaymentRecord[] {
  // IBARBEAR_ETAPA40: nunca usar dados financeiros do navegador como fonte.
  return [];
}

export function saveLocalPayment(_payment: PaymentRecord): void {
  // IBARBEAR_ETAPA40: histórico financeiro precisa ser gravado pelo backend.
  throw new Error('Registro local de pagamentos desativado.');
}

export function getSubscriptionInfo(user: User | null): {
  status: SubscriptionStatus;
  isLocked: boolean;
  isExpiringSoon: boolean;
  isExpired: boolean;
  daysRemaining: number;
  expiresAt: Date | null;
  plan: SubscriptionPlan;
  formattedExpiresAt: string;
} {
  if (!user) {
    return {
      status: 'unpaid',
      isLocked: true,
      isExpiringSoon: false,
      isExpired: true,
      daysRemaining: 0,
      expiresAt: null,
      plan: 'monthly',
      formattedExpiresAt: 'Pendente',
    };
  }

  // IBARBEAR_ETAPA41: status nao autorizado ou data invalida nunca liberam painel.
  if (
    (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'expiring') ||
    !user.subscriptionExpiresAt ||
    !Number.isFinite(new Date(user.subscriptionExpiresAt).getTime())
  ) {
    return {
      status: 'unpaid',
      isLocked: true,
      isExpiringSoon: false,
      isExpired: true,
      daysRemaining: 0,
      expiresAt: null,
      plan: user.subscriptionPlan || 'monthly',
      formattedExpiresAt: 'Pagamento pendente',
    };
  }

  const expiresDate = new Date(user.subscriptionExpiresAt);
  const now = new Date();
  const diffMs = expiresDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formattedExpiresAt = expiresDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (diffMs <= 0 || daysRemaining <= 0) {
    return {
      status: 'expired',
      isLocked: true,
      isExpiringSoon: false,
      isExpired: true,
      daysRemaining: 0,
      expiresAt: expiresDate,
      plan: user.subscriptionPlan || 'monthly',
      formattedExpiresAt,
    };
  }

  if (daysRemaining <= 3) {
    return {
      status: 'expiring',
      isLocked: false,
      isExpiringSoon: true,
      isExpired: false,
      daysRemaining,
      expiresAt: expiresDate,
      plan: user.subscriptionPlan || 'monthly',
      formattedExpiresAt,
    };
  }

  return {
    status: 'active',
    isLocked: false,
    isExpiringSoon: false,
    isExpired: false,
    daysRemaining,
    expiresAt: expiresDate,
    plan: user.subscriptionPlan || 'monthly',
    formattedExpiresAt,
  };
}

export async function createPixPayment(
  _user: User,
  _plan: SubscriptionPlan = 'monthly'
): Promise<PaymentRecord> {
  throw new Error(
    'Pix legado desativado. Utilize o checkout oficial do IBARBEAR.'
  );
}
export async function confirmPixPayment(
  _paymentId: string,
  _extraDetails?: {
    e2eId?: string;
    bankName?: string;
    receiptUrl?: string;
    verificationMethod?: PaymentRecord['verificationMethod'];
  }
): Promise<{ payment: PaymentRecord; user: User }> {
  throw new Error(
    'Pagamento pendente de validacao. ' +
    'Somente o servidor pode confirmar o pagamento ' +
    'apos verificar a transacao com o provedor.'
  );
}

export async function createSubscriptionPayment(
  _user: User,
  _plan: SubscriptionPlan = 'monthly',
  _method: PaymentMethodType = 'pix'
): Promise<PaymentRecord> {
  throw new Error(
    'Pagamento legado desativado. Utilize o checkout oficial do IBARBEAR.'
  );
}
export async function processCardPayment(
  _paymentId: string,
  _cardData: {
    number: string;
    holderName: string;
    expiry: string;
    cvv: string;
    installments: number;
    cpf?: string;
  },
  _plan: SubscriptionPlan,
  _user: User
): Promise<{
  success: boolean;
  message: string;
  payment?: PaymentRecord;
  user?: User;
}> {
  throw new Error(
    'Pagamento com cartao temporariamente indisponivel. ' +
    'Aguarde a integracao com o checkout seguro.'
  );
}

export async function getUserPayments(userId: string): Promise<PaymentRecord[]> {
  // IBARBEAR_ETAPA40: somente usuário Firebase autenticado pode consultar o próprio histórico.
  await auth.authStateReady();
  if (!auth.currentUser || auth.currentUser.uid !== userId) return [];

  try {
    const q = query(
      collection(db, 'payments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as PaymentRecord);
  } catch (err) {
    // Falhar fechado: nunca usar localStorage no lugar de registros do servidor.
    console.warn('Historico financeiro indisponivel:', err);
    return [];
  }
}

// -------------------------------------------------------------
// SUPER ADMIN: CONSULTA CONSOLIDADA DE BARBEARIAS
// -------------------------------------------------------------
// Colar no FINAL de src/lib/storage.ts.
// Adicionar getCountFromServer ao import de 'firebase/firestore'.

export interface ShopAdminView {
  id: string;
  shopName: string;
  shopSlug: string;
  plan: 'free_trial' | 'monthly' | 'annual';
  subscriptionStatus: 'active' | 'unpaid' | 'canceled' | 'trialing' | 'expiring' | 'expired';
  registeredAt: string;
  totalBookingsCount?: number;
}

function getAdminSubscriptionStatus(user: User | undefined): ShopAdminView['subscriptionStatus'] {
  if (!user) return 'unpaid';

  // O método getSubscriptionInfo() já calcula vencimento e proximidade da expiração.
  const originalStatus = String(user.subscriptionStatus || '');
  if (originalStatus === 'canceled') return 'canceled';
  if (originalStatus === 'trialing') return 'trialing';

  const calculated = getSubscriptionInfo(user).status;
  if (calculated === 'active') return 'active';
  if (calculated === 'expiring') return 'expiring';
  if (calculated === 'expired') return 'expired';
  return 'unpaid';
}

export async function getAdminShopsAsync(): Promise<ShopAdminView[]> {
  // A consulta às coleções completas requer regras do Firestore que autorizem
  // apenas um Super Admin ver os dados globais da plataforma.
  const [shopsSnapshot, usersSnapshot] = await Promise.all([
    getDocs(collection(db, 'shops')),
    getDocs(collection(db, 'users')),
  ]);

  const users = usersSnapshot.docs.map((item) => item.data() as User);

  const shops = await Promise.all(
    shopsSnapshot.docs.map(async (item): Promise<ShopAdminView> => {
      const shop = item.data() as BarberShop;
      const slug = shop.slug || item.id;

      // O cadastro usa o e-mail da barbearia para identificar seu titular.
      const owner =
        users.find(
          (user) =>
            user.shopSlug === slug &&
            user.email?.toLowerCase() === shop.email?.toLowerCase()
        ) ??
        users.find((user) => user.shopSlug === slug && !!user.subscriptionPlan) ??
        users.find((user) => user.shopSlug === slug);

      const originalPlan = owner?.subscriptionPlan;
      const plan: ShopAdminView['plan'] =
        originalPlan === 'yearly' ? 'annual' : 'monthly';

      let totalBookingsCount: number | undefined;
      try {
        // Lê apenas a contagem agregada, sem carregar dados pessoais dos agendamentos.
        const countSnapshot = await getCountFromServer(
          query(collection(db, 'bookings'), where('shopSlug', '==', slug))
        );
        totalBookingsCount = countSnapshot.data().count;
      } catch (error) {
        // Se a permissão de agregação estiver ausente, a lista ainda será exibida.
        console.warn(`Não foi possível contar agendamentos de ${slug}:`, error);
      }

      return {
        id: shop.id || item.id,
        shopName: shop.name || 'Barbearia sem nome',
        shopSlug: slug,
        plan,
        subscriptionStatus: getAdminSubscriptionStatus(owner),
        registeredAt: shop.createdAt || '',
        totalBookingsCount,
      };
    })
  );

  // Lista os cadastros mais recentes primeiro.
  return shops.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
}
