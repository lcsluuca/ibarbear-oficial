export interface OpeningHour {
  day: string;
  time: string;
}

export interface BarberShop {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  hours: OpeningHour[];
  bannerUrl?: string;
  logoUrl?: string;
  showProductsOnBookingPage?: boolean; // Controls whether products showcase is visible on public booking page
  createdAt: string;
}

export interface Product {
  id: string;
  shopSlug: string;
  name: string;
  price: number; // in cents (e.g. 4500 = R$ 45,00)
  category: string; // e.g. 'Pomadas & Ceras', 'Barba & Bigode', 'Tratamento & Cuidados', 'Acessórios'
  description: string;
  imageUrl?: string;
  stockQuantity: number;
  minStockAlert?: number;
  active: boolean; // Is active for sale
  showInCatalog: boolean; // Visible in public shop catalog
  createdAt: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  shopSlug: string;
  name: string;
  price: number; // in cents (e.g. 4500 = R$ 45,00)
  durationMinutes: number;
  description: string;
  active: boolean;
}

export interface Barber {
  id: string;
  shopSlug: string;
  name: string;
  specialty: string;
  avatar: string;
  workingHours: string;
  phone?: string;
  active: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'done' | 'canceled';

export interface Booking {
  id: string;
  shopSlug: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  barberId: string;
  barberName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes?: string;
  status: BookingStatus;
  createdAt: string;
}

export type SubscriptionPlan = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'unpaid' | 'expiring' | 'expired';
export type PaymentMethodType = 'pix' | 'credit_card';

export interface PaymentRecord {
  id: string;
  userId: string;
  shopSlug: string;
  userEmail: string;
  userName: string;
  amount: number; // in cents (e.g. 8900 = R$ 89,00)
  plan: SubscriptionPlan;
  status: 'pending' | 'approved' | 'expired';
  paymentMethod?: PaymentMethodType;
  gateway?: 'pix_direct' | 'card_gateway' | 'gateway';
  pixCode?: string;
  pixQrCodeUrl?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardInstallments?: number;
  createdAt: string;
  paidAt?: string;
  expiresAt: string; // Subscription expiration date granted by this payment
  e2eId?: string; // End-to-end ID from central bank/receipt (e.g. E004169682026...)
  bankName?: string; // Originating bank
  receiptUrl?: string; // Receipt attachment data URL
  verificationMethod?: 'webhook' | 'receipt_auth' | 'manual' | 'radar_sync' | 'card_checkout';
}

export interface User {
  id: string;
  name: string;
  email: string;
  shopSlug: string;
  passwordHash?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionExpiresAt?: string; // ISO date
  lastPaymentId?: string;
}

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  done: number;
  canceled: number;
  totalRevenue: number;
}
